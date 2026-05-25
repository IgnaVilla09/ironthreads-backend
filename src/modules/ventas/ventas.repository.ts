import { prisma } from '../../config/database';
import { PaymentMethod } from '@prisma/client';

export const ventasRepository = {
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

  async createSaleWithItems(
    paymentMethod: string,
    items: Array<{
      variantId: string;
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
          total,
          observaciones,
          items: {
            createMany: {
              data: items.map((item) => ({
                variantId: item.variantId,
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
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return sale;
    });
  },

  async findAllSales(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        skip,
        take: limit,
        include: {
          items: {
            select: {
              id: true,
              variantId: true,
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
        items: {
          select: {
            id: true,
            variantId: true,
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
