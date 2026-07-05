import { prisma } from '../../config/database';
import { calculatePercentage } from '../../shared/utils/percentage';

async function getProductStockTotals() {
  const products = await prisma.product.findMany({
    include: {
      category: { select: { id: true, name: true, label: true } },
      variants: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const variantIds = products.flatMap((product) => product.variants.map((variant) => variant.id));
  const variantStockMap = new Map<string, number>();

  if (variantIds.length > 0) {
    const inventoryTotals = await prisma.inventoryItem.groupBy({
      by: ['variantId'],
      where: { variantId: { in: variantIds } },
      _sum: { stock: true },
    });

    for (const item of inventoryTotals) {
      variantStockMap.set(item.variantId, item._sum.stock ?? 0);
    }
  }

  return products.map((product) => {
    const totalStock = product.variants.reduce(
      (sum, variant) => sum + (variantStockMap.get(variant.id) ?? 0),
      0
    );

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      category: product.category,
      variantsCount: product.variants.length,
      totalStock,
    };
  });
}

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
    const products = await getProductStockTotals();

    return products
      .filter((product) => product.totalStock <= threshold)
      .sort((a, b) => a.totalStock - b.totalStock || a.name.localeCompare(b.name));
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
    const [totalProducts, totalStock, categoryCount, productStockTotals] = await Promise.all([
      prisma.product.count(),
      prisma.inventoryItem.aggregate({ _sum: { stock: true } }),
      prisma.product.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
      }),
      getProductStockTotals(),
    ]);

    const lowStockProducts = productStockTotals.filter((product) => product.totalStock <= 5);
    const lowStockCount = lowStockProducts.length;
    const lowStockSumValue = lowStockProducts.reduce((sum, product) => sum + product.totalStock, 0);

    const totalStockValue = totalStock._sum.stock ?? 0;

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
