import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ProductFilters, VariantFilters } from './product.types';
import { getPrismaPagination, PaginationParams } from '../../shared/utils/pagination';
import { calculatePercentage } from '../../shared/utils/percentage';

function buildProductWhereClause(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.pointOfSaleId) {
    where.pointOfSaleId = filters.pointOfSaleId;
  }

  if (filters.depositoId) {
    where.depositoId = filters.depositoId;
  }

  if (filters.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }

  return where;
}

function buildVariantWhereClause(
  productId: string,
  filters: VariantFilters
): Prisma.ProductVariantWhereInput {
  const where: Prisma.ProductVariantWhereInput = { productId };

  if (filters.colorId) {
    where.colorId = filters.colorId;
  }

  if (filters.sizeId) {
    where.sizeId = filters.sizeId;
  }

  if (filters.minStock !== undefined || filters.maxStock !== undefined) {
    where.stock = {};

    if (filters.minStock !== undefined) {
      where.stock.gte = filters.minStock;
    }

    if (filters.maxStock !== undefined) {
      where.stock.lte = filters.maxStock;
    }
  }

  return where;
}

const productInclude = {
  category: { select: { id: true, name: true, label: true } },
  pointOfSale: { select: { id: true, name: true, label: true } },
  deposito: { select: { id: true, name: true, label: true } },
  variants: {
    include: {
      color: { select: { id: true, name: true, label: true, hex: true } },
      size: { select: { id: true, name: true, label: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
};

const variantInclude = {
  product: {
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true, label: true } },
    },
  },
  color: { select: { id: true, name: true, label: true, hex: true } },
  size: { select: { id: true, name: true, label: true } },
};

export const productRepository = {
  // ── Products ──────────────────────────────────────

  async findAllProducts(filters: ProductFilters, pagination: PaginationParams) {
    const where = buildProductWhereClause(filters);
    const { skip, take } = getPrismaPagination(pagination);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  },

  async findProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
  },

  async createProduct(data: Prisma.ProductCreateInput) {
    return prisma.product.create({
      data,
      include: productInclude,
    });
  },

  async updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: productInclude,
    });
  },

  async deleteProduct(id: string) {
    return prisma.product.delete({ where: { id } });
  },

  // ── Variants ──────────────────────────────────────

  async findVariants(productId: string, filters: VariantFilters) {
    const where = buildVariantWhereClause(productId, filters);
    return prisma.productVariant.findMany({
      where,
      include: {
        color: { select: { id: true, name: true, label: true, hex: true } },
        size: { select: { id: true, name: true, label: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findVariantById(id: string) {
    return prisma.productVariant.findUnique({
      where: { id },
      include: variantInclude,
    });
  },

  async findVariantByProductColorSize(productId: string, colorId: string, sizeId: string) {
    return prisma.productVariant.findFirst({
      where: { productId, colorId, sizeId },
      include: {
        color: { select: { id: true, name: true, label: true, hex: true } },
        size: { select: { id: true, name: true, label: true } },
      },
    });
  },

  async findVariantBySku(sku: string) {
    return prisma.productVariant.findUnique({
      where: { sku },
      include: {
        color: { select: { id: true, name: true, label: true, hex: true } },
        size: { select: { id: true, name: true, label: true } },
      },
    });
  },

  async createVariant(data: Prisma.ProductVariantCreateInput) {
    return prisma.productVariant.create({
      data,
      include: variantInclude,
    });
  },

  async updateVariant(id: string, data: Prisma.ProductVariantUpdateInput) {
    return prisma.productVariant.update({
      where: { id },
      data,
      include: variantInclude,
    });
  },

  async deleteVariant(id: string) {
    return prisma.productVariant.delete({ where: { id } });
  },

  // ── Analytics ─────────────────────────────────────

  async countBySize() {
    const result = await prisma.productVariant.groupBy({
      by: ['sizeId'],
      _sum: { stock: true },
      _count: { sizeId: true },
    });

    const sizes = await prisma.size.findMany();
    const sizeMap = new Map(sizes.map((s) => [s.id, s.name]));

    return result.map((r) => ({
      sizeId: r.sizeId,
      sizeName: sizeMap.get(r.sizeId) ?? '?',
      totalStock: r._sum.stock ?? 0,
      productCount: r._count.sizeId,
    }));
  },

  async countByColor() {
    const result = await prisma.productVariant.groupBy({
      by: ['colorId'],
      _sum: { stock: true },
      _count: { colorId: true },
    });

    const colors = await prisma.color.findMany();
    const colorMap = new Map(colors.map((c) => [c.id, c.name]));

    return result.map((r) => ({
      colorId: r.colorId,
      colorName: colorMap.get(r.colorId) ?? '?',
      totalStock: r._sum.stock ?? 0,
      productCount: r._count.colorId,
    }));
  },

  async findLowStockVariants(threshold: number = 3) {
    return prisma.productVariant.findMany({
      where: { stock: { lt: threshold } },
      include: variantInclude,
      orderBy: { stock: 'asc' },
    });
  },

  async findBestSellingSizes(limit: number = 10) {
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

  async getStats() {
    const [totalProducts, totalStock, categoryCount, lowStockVariants, lowStockSum] =
      await Promise.all([
        prisma.product.count(),
        prisma.productVariant.aggregate({ _sum: { stock: true } }),
        prisma.product.groupBy({
          by: ['categoryId'],
          _count: { categoryId: true },
        }),
        prisma.productVariant.count({ where: { stock: { lt: 3 } } }),
        prisma.productVariant.aggregate({
          where: { stock: { lt: 3 } },
          _sum: { stock: true },
        }),
      ]);

    const totalStockValue = totalStock._sum.stock ?? 0;
    const lowStockSumValue = lowStockSum._sum.stock ?? 0;

    return {
      totalProducts,
      totalStock: totalStockValue,
      categoriesCount: categoryCount.length,
      lowStockCount: lowStockVariants,
      lowStockSum: lowStockSumValue,
      lowStockPercentage: calculatePercentage(lowStockSumValue, totalStockValue),
    };
  },
};
