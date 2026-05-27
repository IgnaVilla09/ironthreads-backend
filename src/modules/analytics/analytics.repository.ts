import { prisma } from '../../config/database';
import { calculatePercentage } from '../../shared/utils/percentage';

export const analyticsRepository = {
  async countBySize() {
    const result = await prisma.inventoryItem.groupBy({
      by: ['variantId'],
      _sum: { stock: true },
    });

    const variants = await prisma.productVariant.findMany({
      select: {
        id: true,
        sizeId: true,
        size: { select: { id: true, name: true, label: true } },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const sizeStock = new Map<string, { sizeId: string; sizeName: string; totalStock: number; productCount: Set<string> }>();

    for (const r of result) {
      const variant = variantMap.get(r.variantId);
      if (!variant) continue;

      const existing = sizeStock.get(variant.sizeId) ?? {
        sizeId: variant.sizeId,
        sizeName: variant.size.label,
        totalStock: 0,
        productCount: new Set<string>(),
      };

      existing.totalStock += r._sum.stock ?? 0;
      existing.productCount.add(variant.id);
      sizeStock.set(variant.sizeId, existing);
    }

    return Array.from(sizeStock.values())
      .map((s) => ({
        sizeId: s.sizeId,
        sizeName: s.sizeName,
        totalStock: s.totalStock,
        productCount: s.productCount.size,
      }))
      .sort((a, b) => b.totalStock - a.totalStock);
  },

  async countByColor() {
    const result = await prisma.inventoryItem.groupBy({
      by: ['variantId'],
      _sum: { stock: true },
    });

    const variants = await prisma.productVariant.findMany({
      select: {
        id: true,
        colorId: true,
        color: { select: { id: true, name: true, label: true, hex: true } },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const colorStock = new Map<string, { colorId: string; colorName: string; totalStock: number; productCount: Set<string>; hex: string | null }>();

    for (const r of result) {
      const variant = variantMap.get(r.variantId);
      if (!variant) continue;

      const existing = colorStock.get(variant.colorId) ?? {
        colorId: variant.colorId,
        colorName: variant.color.name,
        totalStock: 0,
        productCount: new Set<string>(),
        hex: variant.color.hex,
      };

      existing.totalStock += r._sum.stock ?? 0;
      existing.productCount.add(variant.id);
      colorStock.set(variant.colorId, existing);
    }

    return Array.from(colorStock.values())
      .map((c) => ({
        colorId: c.colorId,
        colorName: c.colorName,
        totalStock: c.totalStock,
        productCount: c.productCount.size,
        hex: c.hex,
      }))
      .sort((a, b) => b.totalStock - a.totalStock);
  },

  async findLowStock(threshold: number = 3) {
    return prisma.inventoryItem.findMany({
      where: { stock: { lt: threshold } },
      include: {
        variant: {
          include: {
            product: { select: { id: true, name: true } },
            color: { select: { id: true, name: true, label: true, hex: true } },
            size: { select: { id: true, name: true, label: true } },
          },
        },
        pointOfSale: { select: { id: true, name: true, label: true } },
        deposito: { select: { id: true, name: true, label: true } },
      },
      orderBy: { stock: 'asc' },
    });
  },

  async bestSellingSizes(limit: number = 10) {
    const result = await prisma.saleItem.groupBy({
      by: ['sizeName'],
      _sum: { quantity: true },
      _count: { sizeName: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return result.map((r) => ({
      sizeName: r.sizeName,
      totalSold: r._sum.quantity ?? 0,
      saleCount: r._count.sizeName,
    }));
  },

  async getGeneralStats() {
    const [totalProducts, totalStock, categoryCount, lowStockCount, lowStockAgg] =
      await Promise.all([
        prisma.product.count(),
        prisma.inventoryItem.aggregate({ _sum: { stock: true } }),
        prisma.product.groupBy({
          by: ['categoryId'],
          _count: { categoryId: true },
        }),
        prisma.inventoryItem.count({ where: { stock: { lt: 3 } } }),
        prisma.inventoryItem.aggregate({
          where: { stock: { lt: 3 } },
          _sum: { stock: true },
        }),
      ]);

    const totalStockValue = totalStock._sum.stock ?? 0;
    const lowStockSumValue = lowStockAgg._sum.stock ?? 0;

    return {
      totalProducts,
      totalStock: totalStockValue,
      categoriesCount: categoryCount.length,
      lowStockCount,
      lowStockSum: lowStockSumValue,
      lowStockPercentage: calculatePercentage(lowStockSumValue, totalStockValue),
    };
  },
};
