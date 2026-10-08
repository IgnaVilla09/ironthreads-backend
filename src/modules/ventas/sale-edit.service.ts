import { createHash } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { calculateEdit } from './sale-edit.calculations';
import { editSaleSchema, EditSaleInput } from './sale-edit.validators';

type Actor = { userId: string; username: string };
const snapshot = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

export async function editSale(db: PrismaClient, saleId: string, rawInput: EditSaleInput, actor: Actor) {
  const input = editSaleSchema.parse(rawInput);
  const hash = createHash('sha256').update(JSON.stringify({ saleId, actorId: actor.userId, input })).digest('hex');
  const findRetry = async () => {
    const previous = await db.saleEdit.findUnique({ where: { requestId: input.requestId } });
    if (previous && previous.requestHash !== hash) throw AppError.conflict('El identificador de operación ya se utilizó con otros datos');
    return previous;
  };
  const previous = await findRetry();
  if (previous) return previous;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const sale = await tx.sale.findUnique({ where: { id: saleId }, include: { items: true } });
        if (!sale) throw AppError.notFound('Venta no encontrada');
        if (!sale.pointOfSaleId) throw AppError.badRequest('La venta no tiene un punto de venta identificado');
        if (sale.revision !== input.revision) throw AppError.conflict('La venta fue modificada. Recargá los datos antes de editar');
        const values = calculateEdit(sale.items, input);
        if (sale.total !== values.beforeTotal) throw AppError.conflict('El total histórico no coincide con los artículos. Requiere revisión');
        const claimed = await tx.sale.updateMany({
          where: { id: saleId, revision: input.revision },
          data: { revision: { increment: 1 }, editedAt: new Date(), total: values.total },
        });
        if (claimed.count !== 1) throw AppError.conflict('La venta fue modificada por otro usuario');

        const movements: Array<Record<string, string | number | null>> = [];
        for (const row of input.returns) {
          const item = sale.items.find((entry) => entry.id === row.saleItemId)!;
          if (!item.variantId) throw AppError.badRequest(`La variante de ${item.productName} fue eliminada; resolvé el artículo antes de devolverlo`);
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant) throw AppError.badRequest('La variante devuelta ya no existe');
          const deposito = row.depositoId ? await tx.deposito.findUnique({ where: { id: row.depositoId } }) : null;
          if (row.depositoId && (!deposito || deposito.pointOfSaleId !== sale.pointOfSaleId)) {
            throw AppError.badRequest('El depósito de devolución debe pertenecer al punto de venta original');
          }
          const location = { variantId: item.variantId, pointOfSaleId: sale.pointOfSaleId, depositoId: row.depositoId };
          const existing = await tx.inventoryItem.findFirst({ where: location, orderBy: { id: 'asc' } });
          const inventory = existing
            ? await tx.inventoryItem.update({ where: { id: existing.id }, data: { stock: { increment: row.quantity } } })
            : await tx.inventoryItem.create({ data: { ...location, stock: row.quantity } });
          movements.push({ direction: 'RETURN', inventoryItemId: inventory.id, variantId: item.variantId,
            productName: item.productName, colorName: item.colorName, sizeName: item.sizeName,
            depositoId: row.depositoId, depositoLabel: deposito?.label ?? 'Sin depósito',
            quantity: row.quantity, unitPrice: row.originalUnitPrice ?? item.unitPrice });
          if (row.quantity === item.quantity) {
            await tx.saleItem.delete({ where: { id: item.id } });
          } else {
            await tx.saleItem.update({ where: { id: item.id }, data: {
              quantity: item.quantity - row.quantity, unitPrice: row.originalUnitPrice ?? item.unitPrice,
            } });
          }
        }

        for (const row of input.deliveries) {
          const inventory = await tx.inventoryItem.findUnique({ where: { id: row.inventoryItemId }, include: {
            deposito: true, variant: { include: { product: true, color: true, size: true } },
          } });
          if (!inventory || inventory.pointOfSaleId !== sale.pointOfSaleId ||
              (inventory.deposito && inventory.deposito.pointOfSaleId !== sale.pointOfSaleId)) {
            throw AppError.badRequest('La entrega debe salir del punto de venta original');
          }
          const consumed = await tx.inventoryItem.updateMany({
            where: { id: inventory.id, stock: { gte: row.quantity } }, data: { stock: { decrement: row.quantity } },
          });
          if (consumed.count !== 1) throw AppError.conflict('Stock insuficiente para completar el cambio');
          const variant = inventory.variant;
          await tx.saleItem.create({ data: {
            saleId, variantId: variant.id, inventoryItemId: inventory.id,
            productName: variant.product.name, colorName: variant.color.label, sizeName: variant.size.label,
            quantity: row.quantity, unitPrice: row.unitPrice,
          } });
          movements.push({ direction: 'DELIVERY', inventoryItemId: inventory.id, variantId: variant.id,
            productName: variant.product.name, colorName: variant.color.label, sizeName: variant.size.label,
            depositoId: inventory.depositoId, depositoLabel: inventory.deposito?.label ?? 'Sin depósito',
            quantity: row.quantity, unitPrice: row.unitPrice });
        }
        const after = await tx.sale.findUniqueOrThrow({ where: { id: saleId }, include: { items: true } });
        return tx.saleEdit.create({ data: {
          saleId, requestId: input.requestId, requestHash: hash, revision: input.revision + 1,
          actorId: actor.userId, actorName: actor.username, reason: input.reason,
          before: snapshot(sale), after: snapshot(after), movements: snapshot(movements),
          regularization: values.regularization, difference: values.difference,
          paymentMethod: values.difference === 0 ? null : input.paymentMethod,
        } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 15000 });
    } catch (error) {
      // A second submission may finish while this transaction waits or rolls back.
      const retry = await findRetry();
      if (retry) return retry;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        if (attempt < 2) continue;
        throw AppError.conflict('El inventario cambió durante la operación. Volvé a intentar');
      }
      throw error;
    }
  }
  throw AppError.conflict('No se pudo completar el cambio');
}
