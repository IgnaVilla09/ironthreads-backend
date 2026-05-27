import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ProductFilters } from './product.types';
import { getPrismaPagination, PaginationParams } from '../../shared/utils/pagination';

function buildProductWhereClause(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }

  return where;
}

const productInclude = {
  category: { select: { id: true, name: true, label: true } },
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

  async findVariants(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
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
};
