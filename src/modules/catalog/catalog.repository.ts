import { Prisma, CatalogOrderStatus, PaymentMethod } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPrismaPagination, PaginationParams } from '../../shared/utils/pagination';
import { PublicCatalogFilters, CatalogOrderFilters, CreateCatalogOrderInput } from './catalog.types';

const publicProductInclude = {
  category: { select: { id: true, name: true, label: true } },
  variants: {
    include: {
      color: { select: { id: true, name: true, label: true, hex: true } },
      size: { select: { id: true, name: true, label: true } },
    },
    orderBy: [{ colorId: 'asc' as const }, { sizeId: 'asc' as const }],
  },
};

function buildPublicProductWhere(filters: PublicCatalogFilters): Prisma.ProductWhereInput {
  return {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? { name: { contains: filters.search, mode: 'insensitive' as const } }
      : {}),
    price: { not: null },
    variants: {
      some: {
        inventory: {
          some: {
            pointOfSaleId: filters.pointOfSaleId,
            stock: { gt: 0 },
          },
        },
      },
    },
  };
}

const orderInclude = {
  pointOfSale: { select: { id: true, name: true, label: true } },
  sale: { select: { id: true, total: true, createdAt: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, imageUrl: true, price: true } },
      variant: {
        include: {
          color: { select: { id: true, name: true, label: true, hex: true } },
          size: { select: { id: true, name: true, label: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

export const catalogRepository = {
  async findPublicProducts(filters: PublicCatalogFilters, pagination: PaginationParams) {
    const where = buildPublicProductWhere(filters);
    const { skip, take } = getPrismaPagination(pagination);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: publicProductInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  },

  async findProductForCatalogById(id: string, pointOfSaleId: string) {
    return prisma.product.findFirst({
      where: {
        ...buildPublicProductWhere({ pointOfSaleId }),
        id,
      },
      include: publicProductInclude,
    });
  },

  async getVariantStockMap(variantIds: string[], pointOfSaleId: string) {
    const rows = await prisma.inventoryItem.groupBy({
      by: ['variantId'],
      where: {
        variantId: { in: variantIds },
        pointOfSaleId,
      },
      _sum: { stock: true },
    });

    return new Map(rows.map((row) => [row.variantId, row._sum.stock ?? 0]));
  },

  async findVariantWithProduct(variantId: string) {
    return prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: { select: { id: true, name: true, price: true, imageUrl: true } },
        color: { select: { id: true, name: true, label: true, hex: true } },
        size: { select: { id: true, name: true, label: true } },
      },
    });
  },

  async getTotalVariantStockInPointOfSale(variantId: string, pointOfSaleId: string) {
    const result = await prisma.inventoryItem.aggregate({
      where: { variantId, pointOfSaleId },
      _sum: { stock: true },
    });
    return result._sum.stock ?? 0;
  },

  async createCatalogOrder(input: CreateCatalogOrderInput, items: Array<{
    productId: string;
    variantId: string;
    productNameSnapshot: string;
    colorNameSnapshot: string;
    sizeNameSnapshot: string;
    unitPriceSnapshot: number;
    quantity: number;
  }>) {
    const total = items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0);

    return prisma.catalogOrder.create({
      data: {
        pointOfSaleId: input.pointOfSaleId,
        status: CatalogOrderStatus.PENDING_PAYMENT,
        customerFirstName: input.customerFirstName,
        customerLastName: input.customerLastName,
        customerPhone: input.customerPhone,
        paymentMethod: PaymentMethod.MERCADO_PAGO,
        total,
        notes: input.notes?.trim() || null,
        items: {
          createMany: {
            data: items,
          },
        },
      },
      include: orderInclude,
    });
  },

  async findOrderById(id: string) {
    return prisma.catalogOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
  },

  async findOrders(filters: CatalogOrderFilters, pagination: PaginationParams) {
    const where: Prisma.CatalogOrderWhereInput = {
      ...(filters.status ? { status: filters.status as CatalogOrderStatus } : {}),
      ...(filters.pointOfSaleId ? { pointOfSaleId: filters.pointOfSaleId } : {}),
    };
    const { skip, take } = getPrismaPagination(pagination);

    const [orders, total] = await Promise.all([
      prisma.catalogOrder.findMany({
        where,
        skip,
        take,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.catalogOrder.count({ where }),
    ]);

    return { orders, total };
  },
};
