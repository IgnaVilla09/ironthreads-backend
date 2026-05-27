import { prisma } from '../../config/database';
import { InventoryFilters } from './inventory.types';
import { getPrismaPagination, PaginationParams } from '../../shared/utils/pagination';

const inventoryInclude = {
  variant: {
    include: {
      product: { select: { id: true, name: true } },
      color: { select: { id: true, name: true, label: true, hex: true } },
      size: { select: { id: true, name: true, label: true } },
    },
  },
  pointOfSale: { select: { id: true, name: true, label: true } },
  deposito: { select: { id: true, name: true, label: true } },
};

export const inventoryRepository = {
  async findInventory(filters: InventoryFilters) {
    const where: Record<string, unknown> = {};

    if (filters.variantId) where.variantId = filters.variantId;
    if (filters.pointOfSaleId) where.pointOfSaleId = filters.pointOfSaleId;
    if (filters.depositoId) where.depositoId = filters.depositoId;
    if (filters.minStock !== undefined || filters.maxStock !== undefined) {
      where.stock = {};
      if (filters.minStock !== undefined) (where.stock as Record<string, unknown>).gte = filters.minStock;
      if (filters.maxStock !== undefined) (where.stock as Record<string, unknown>).lte = filters.maxStock;
    }

    return prisma.inventoryItem.findMany({
      where,
      include: inventoryInclude,
      orderBy: { stock: 'asc' },
    });
  },

  async findInventoryByVariant(variantId: string) {
    return prisma.inventoryItem.findMany({
      where: { variantId },
      include: {
        pointOfSale: { select: { id: true, name: true, label: true } },
        deposito: { select: { id: true, name: true, label: true } },
      },
    });
  },

  async findInventoryItem(variantId: string, pointOfSaleId: string, depositoId: string | null) {
    return prisma.inventoryItem.findFirst({
      where: {
        variantId,
        pointOfSaleId,
        depositoId: depositoId ?? null,
      },
      include: inventoryInclude,
    });
  },

  async upsertInventoryItem(variantId: string, pointOfSaleId: string, depositoId: string | null, stock: number) {
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        variantId,
        pointOfSaleId,
        depositoId: depositoId ?? null,
      },
    });

    if (existing) {
      return prisma.inventoryItem.update({
        where: { id: existing.id },
        data: { stock: existing.stock + stock },
        include: inventoryInclude,
      });
    }

    return prisma.inventoryItem.create({
      data: {
        variantId,
        pointOfSaleId,
        depositoId,
        stock,
      },
      include: inventoryInclude,
    });
  },

  async updateStock(id: string, stock: number) {
    return prisma.inventoryItem.update({
      where: { id },
      data: { stock },
      include: inventoryInclude,
    });
  },

  async setVariantInventory(variantId: string, items: { pointOfSaleId: string; depositoId: string | null; stock: number }[]) {
    return prisma.$transaction(async (tx) => {
      // Delete existing inventory for this variant at these POS
      await tx.inventoryItem.deleteMany({
        where: { variantId },
      });

      // Create new inventory records
      if (items.length > 0) {
        await tx.inventoryItem.createMany({
          data: items.map((item) => ({
            variantId,
            pointOfSaleId: item.pointOfSaleId,
            depositoId: item.depositoId,
            stock: item.stock,
          })),
        });
      }

      // Return updated inventory
      return tx.inventoryItem.findMany({
        where: { variantId },
        include: {
          pointOfSale: { select: { id: true, name: true, label: true } },
          deposito: { select: { id: true, name: true, label: true } },
        },
      });
    });
  },

  async createTransfer(data: {
    variantId: string;
    fromPointOfSaleId: string;
    fromDepositoId: string | null;
    toPointOfSaleId: string;
    toDepositoId: string | null;
    quantity: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const fromItem = await tx.inventoryItem.findFirst({
        where: {
          variantId: data.variantId,
          pointOfSaleId: data.fromPointOfSaleId,
          depositoId: data.fromDepositoId ?? null,
        },
      });

      if (!fromItem || fromItem.stock < data.quantity) {
        throw new Error(`Stock insuficiente en origen. Disponible: ${fromItem?.stock ?? 0}, solicitado: ${data.quantity}`);
      }

      await tx.inventoryItem.update({
        where: { id: fromItem.id },
        data: { stock: { decrement: data.quantity } },
      });

      const toItem = await tx.inventoryItem.findFirst({
        where: {
          variantId: data.variantId,
          pointOfSaleId: data.toPointOfSaleId,
          depositoId: data.toDepositoId ?? null,
        },
      });

      if (toItem) {
        await tx.inventoryItem.update({
          where: { id: toItem.id },
          data: { stock: { increment: data.quantity } },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            variantId: data.variantId,
            pointOfSaleId: data.toPointOfSaleId,
            depositoId: data.toDepositoId,
            stock: data.quantity,
          },
        });
      }

      const transfer = await tx.stockTransfer.create({
        data: {
          variantId: data.variantId,
          fromPointOfSaleId: data.fromPointOfSaleId,
          fromDepositoId: data.fromDepositoId,
          toPointOfSaleId: data.toPointOfSaleId,
          toDepositoId: data.toDepositoId,
          quantity: data.quantity,
        },
      });

      return transfer;
    });
  },

  async findTransfers(filters: { variantId?: string; fromPointOfSaleId?: string; toPointOfSaleId?: string }, pagination: PaginationParams) {
    const where: Record<string, unknown> = {};
    if (filters.variantId) where.variantId = filters.variantId;
    if (filters.fromPointOfSaleId) where.fromPointOfSaleId = filters.fromPointOfSaleId;
    if (filters.toPointOfSaleId) where.toPointOfSaleId = filters.toPointOfSaleId;

    const { skip, take } = getPrismaPagination(pagination);

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        skip,
        take,
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true } },
              color: { select: { id: true, name: true, label: true, hex: true } },
              size: { select: { id: true, name: true, label: true } },
            },
          },
          fromPointOfSale: { select: { id: true, name: true, label: true } },
          toPointOfSale: { select: { id: true, name: true, label: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockTransfer.count({ where }),
    ]);

    return { transfers, total };
  },

  async getTotalStockForVariant(variantId: string) {
    const result = await prisma.inventoryItem.aggregate({
      where: { variantId },
      _sum: { stock: true },
    });
    return result._sum.stock ?? 0;
  },

  async getTotalStockForProduct(productId: string) {
    const result = await prisma.inventoryItem.aggregate({
      where: { variant: { productId } },
      _sum: { stock: true },
    });
    return result._sum.stock ?? 0;
  },
};
