import { prisma } from '../../config/database';
import { PaymentMethod } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error';

export const ventasRepository = {
  async createSaleWithItems(
    paymentMethod: string,
    pointOfSaleId: string | null,
    depositoId: string | null,
    items: Array<{
      variantId: string;
      inventoryItemId: string | null;
      productName: string;
      colorName: string;
      sizeName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>,
    observaciones?: string,
    clientRequestId?: string
  ) {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const create = () => prisma.$transaction(async (tx) => {
      // Recheck inside the transaction: the earlier UI/service verification is only advisory.
      const required = new Map<string, number>();
      for (const item of items) {
        if (!item.inventoryItemId) throw AppError.badRequest('Ubicación de stock inválida');
        required.set(item.inventoryItemId, (required.get(item.inventoryItemId) ?? 0) + item.quantity);
      }
      for (const [id, quantity] of required) {
        const updated = await tx.inventoryItem.updateMany({
          where: { id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (updated.count !== 1) throw AppError.badRequest('Stock insuficiente al confirmar la venta');
      }
      const sale = await tx.sale.create({
        data: {
          clientRequestId,
          paymentMethod: paymentMethod as PaymentMethod,
          pointOfSaleId,
          depositoId,
          total,
          observaciones,
          items: {
            createMany: {
              data: items.map((item) => ({
                variantId: item.variantId,
                inventoryItemId: item.inventoryItemId,
                productName: item.productName,
                colorName: item.colorName,
                sizeName: item.sizeName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            },
          },
        },
        include: {
          items: {
            select: {
              id: true,
              variantId: true,
              inventoryItemId: true,
              productName: true,
              colorName: true,
              sizeName: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
      });

      return sale;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (clientRequestId) {
      const existing = await prisma.sale.findUnique({ where: { clientRequestId }, include: { items: true } });
      if (existing) return existing;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await create();
      } catch (error) {
        if (clientRequestId && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const existing = await prisma.sale.findUnique({ where: { clientRequestId }, include: { items: true } });
          if (existing) return existing;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue;
        throw error;
      }
    }
    throw AppError.badRequest('No se pudo registrar la venta');
  },

  async findInventoryItem(variantId: string, pointOfSaleId: string, depositoId?: string | null) {
    const where: any = { variantId, pointOfSaleId };
    if (depositoId !== undefined) {
      where.depositoId = depositoId;
    }
    return prisma.inventoryItem.findFirst({
      where,
      select: { id: true, stock: true, depositoId: true },
      orderBy: { stock: 'desc' },
    });
  },

  async findVariantWithDetails(variantId: string) {
    return prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: { select: { name: true } },
        color: { select: { name: true, label: true } },
        size: { select: { name: true, label: true } },
      },
    });
  },

  async findAllSales(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        skip,
        take: limit,
        include: {
          pointOfSale: { select: { id: true, name: true, label: true } },
          deposito: { select: { id: true, name: true, label: true } },
          items: {
            select: {
              id: true,
              variantId: true,
              inventoryItemId: true,
              productName: true,
              colorName: true,
              sizeName: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count(),
    ]);

    return { sales, total };
  },

  async findSaleById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        pointOfSale: { select: { id: true, name: true, label: true } },
        deposito: { select: { id: true, name: true, label: true } },
        items: {
          select: {
            id: true,
            variantId: true,
            inventoryItemId: true,
            productName: true,
            colorName: true,
            sizeName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });
  },

  async findSalesByDateRange(from: Date, to: Date) {
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            colorName: true,
            sizeName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sizeTotals = new Map<string, number>();
    let totalSold = 0;

    for (const sale of sales) {
      for (const item of sale.items) {
        totalSold += item.quantity;
        sizeTotals.set(
          item.sizeName,
          (sizeTotals.get(item.sizeName) ?? 0) + item.quantity
        );
      }
    }

    const sizesSorted = Array.from(sizeTotals.entries())
      .map(([sizeName, quantity]) => ({ sizeName, quantity }))
      .sort((a, b) => b.quantity - a.quantity);

    return { sales, sizes: sizesSorted, totalSold };
  },
};
