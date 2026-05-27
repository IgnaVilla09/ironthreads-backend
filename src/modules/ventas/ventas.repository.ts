import { prisma } from '../../config/database';
import { PaymentMethod } from '@prisma/client';

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
    observaciones?: string
  ) {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
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

      for (const item of items) {
        if (item.inventoryItemId) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return sale;
    });
  },

  async findInventoryItem(variantId: string, pointOfSaleId: string, depositoId: string | null) {
    return prisma.inventoryItem.findFirst({
      where: {
        variantId,
        pointOfSaleId,
        depositoId: depositoId ?? null,
      },
      select: { id: true, stock: true },
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
