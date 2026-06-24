import { CatalogOrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/app-error';
import { getPaginationMeta, getPaginationParams } from '../../shared/utils/pagination';
import { logger } from '../../shared/utils/logger';
import { catalogRepository } from './catalog.repository';
import { CatalogOrderFilters, CreateCatalogOrderInput, PublicCatalogFilters } from './catalog.types';
import { settingsRepository } from '../settings/settings.repository';

const BLOCKED_PUBLIC_POINT_OF_SALE_ID = '2c79251e-df67-46eb-a313-15830f762750';

async function resolvePointOfSaleId(pointOfSaleIdentifier?: string) {
  if (!pointOfSaleIdentifier) {
    throw AppError.badRequest('El punto de venta es obligatorio');
  }

  const pointOfSale = await settingsRepository.findPointOfSaleByIdentifier(pointOfSaleIdentifier);
  if (!pointOfSale) {
    throw AppError.notFound(`Punto de venta ${pointOfSaleIdentifier} no encontrado`);
  }

  if (pointOfSale.id === BLOCKED_PUBLIC_POINT_OF_SALE_ID) {
    throw AppError.notFound(`Punto de venta ${pointOfSaleIdentifier} no encontrado`);
  }

  return pointOfSale.id;
}

function buildCatalogProduct(product: Awaited<ReturnType<typeof catalogRepository.findPublicProducts>>['products'][number], stockMap: Map<string, number>) {
  const variants = product.variants
    .map((variant) => ({
      ...variant,
      stock: stockMap.get(variant.id) ?? 0,
    }))
    .filter((variant) => variant.stock > 0);

  return {
    ...product,
    variants,
  };
}

async function buildProductsWithStock(products: Array<Awaited<ReturnType<typeof catalogRepository.findPublicProducts>>['products'][number]>, pointOfSaleId: string) {
  const variantIds = products.flatMap((product) => product.variants.map((variant) => variant.id));
  const stockMap = variantIds.length > 0
    ? await catalogRepository.getVariantStockMap(variantIds, pointOfSaleId)
    : new Map<string, number>();

  return products
    .map((product) => buildCatalogProduct(product, stockMap))
    .filter((product) => product.variants.length > 0);
}

async function consumePointOfSaleStock(
  tx: Prisma.TransactionClient,
  variantId: string,
  pointOfSaleId: string,
  quantity: number
) {
  const inventoryItems = await tx.inventoryItem.findMany({
    where: {
      variantId,
      pointOfSaleId,
      stock: { gt: 0 },
    },
    orderBy: [{ stock: 'desc' }, { id: 'asc' }],
  });

  const available = inventoryItems.reduce((sum, item) => sum + item.stock, 0);
  if (available < quantity) {
    throw AppError.badRequest('Stock insuficiente para confirmar el pedido');
  }

  let remaining = quantity;
  for (const item of inventoryItems) {
    if (remaining === 0) break;
    const decrement = Math.min(item.stock, remaining);
    await tx.inventoryItem.update({
      where: { id: item.id },
      data: { stock: { decrement } },
    });
    remaining -= decrement;
  }
}

export const catalogService = {
  async listPublicProducts(rawQuery: Record<string, unknown>) {
    const pagination = getPaginationParams(rawQuery as { page?: string; limit?: string });
    const filters: PublicCatalogFilters = {
      pointOfSaleId: await resolvePointOfSaleId(rawQuery.pointOfSaleId as string | undefined),
      categoryId: rawQuery.categoryId as string | undefined,
      search: rawQuery.search as string | undefined,
    };

    const { products, total } = await catalogRepository.findPublicProducts(filters, pagination);
    const enriched = await buildProductsWithStock(products, filters.pointOfSaleId);

    return {
      products: enriched,
      meta: getPaginationMeta(total, pagination),
    };
  },

  async getPublicProductById(id: string, pointOfSaleId?: string) {
    const resolvedPointOfSaleId = await resolvePointOfSaleId(pointOfSaleId);

    const product = await catalogRepository.findProductForCatalogById(id, resolvedPointOfSaleId);
    if (!product) {
      throw AppError.notFound(`Producto con ID ${id} no encontrado`);
    }

    const [enriched] = await buildProductsWithStock([product], resolvedPointOfSaleId);
    return enriched;
  },

  async createCatalogOrder(input: CreateCatalogOrderInput) {
    const pointOfSaleId = await resolvePointOfSaleId(input.pointOfSaleId);

    logger.info('Creating catalog order', {
      pointOfSaleId,
      items: input.items.length,
    });

    const itemsData: Array<{
      productId: string;
      variantId: string;
      productNameSnapshot: string;
      colorNameSnapshot: string;
      sizeNameSnapshot: string;
      unitPriceSnapshot: number;
      quantity: number;
    }> = [];

    for (const item of input.items) {
      const variant = await catalogRepository.findVariantWithProduct(item.variantId);
      if (!variant || variant.product.id !== item.productId) {
        throw AppError.badRequest('Uno de los productos del pedido es inválido');
      }
      if (variant.product.price == null) {
        throw AppError.badRequest(`El producto ${variant.product.name} no tiene precio configurado`);
      }

      const available = await catalogRepository.getTotalVariantStockInPointOfSale(item.variantId, pointOfSaleId);
      if (available < item.quantity) {
        throw AppError.badRequest(
          `Stock insuficiente para ${variant.product.name} - ${variant.color.label} / ${variant.size.label}. Disponible: ${available}`
        );
      }

      itemsData.push({
        productId: variant.product.id,
        variantId: variant.id,
        productNameSnapshot: variant.product.name,
        colorNameSnapshot: variant.color.label,
        sizeNameSnapshot: variant.size.label,
        unitPriceSnapshot: variant.product.price,
        quantity: item.quantity,
      });
    }

    return catalogRepository.createCatalogOrder({ ...input, pointOfSaleId }, itemsData);
  },

  async getPublicOrderById(id: string) {
    const order = await catalogRepository.findOrderById(id);
    if (!order) {
      throw AppError.notFound(`Pedido con ID ${id} no encontrado`);
    }
    return order;
  },

  async listOrders(rawQuery: Record<string, unknown>) {
    const pagination = getPaginationParams(rawQuery as { page?: string; limit?: string });
    const filters: CatalogOrderFilters = {
      status: rawQuery.status as string | undefined,
      pointOfSaleId: rawQuery.pointOfSaleId as string | undefined,
    };

    const { orders, total } = await catalogRepository.findOrders(filters, pagination);
    return {
      orders,
      meta: getPaginationMeta(total, pagination),
    };
  },

  async getOrderById(id: string) {
    const order = await catalogRepository.findOrderById(id);
    if (!order) {
      throw AppError.notFound(`Pedido con ID ${id} no encontrado`);
    }
    return order;
  },

  async markPaymentReported(id: string) {
    const order = await this.getOrderById(id);
    if (order.status !== CatalogOrderStatus.PENDING_PAYMENT) {
      throw AppError.badRequest('Solo se puede marcar como comprobante recibido un pedido pendiente');
    }

    return prisma.catalogOrder.update({
      where: { id },
      data: {
        status: CatalogOrderStatus.PAYMENT_REPORTED,
        whatsAppProofSent: true,
      },
      include: {
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async cancelOrder(id: string) {
    const order = await this.getOrderById(id);
    if (order.status === CatalogOrderStatus.CONFIRMED) {
      throw AppError.badRequest('No se puede cancelar un pedido ya confirmado');
    }

    return prisma.catalogOrder.update({
      where: { id },
      data: {
        status: CatalogOrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: { pointOfSale: { select: { id: true, name: true, label: true } }, items: true, sale: true },
    });
  },

  async rejectOrder(id: string) {
    const order = await this.getOrderById(id);
    if (order.status === CatalogOrderStatus.CONFIRMED) {
      throw AppError.badRequest('No se puede rechazar un pedido ya confirmado');
    }

    return prisma.catalogOrder.update({
      where: { id },
      data: { status: CatalogOrderStatus.REJECTED },
      include: { pointOfSale: { select: { id: true, name: true, label: true } }, items: true, sale: true },
    });
  },

  async confirmOrder(id: string) {
    const confirmedOrderId = await prisma.$transaction(async (tx) => {
      const order = await tx.catalogOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) {
        throw AppError.notFound(`Pedido con ID ${id} no encontrado`);
      }
      if (order.status === CatalogOrderStatus.CONFIRMED || order.saleId) {
        throw AppError.badRequest('El pedido ya fue confirmado');
      }
      if (order.status === CatalogOrderStatus.CANCELLED || order.status === CatalogOrderStatus.REJECTED) {
        throw AppError.badRequest('El pedido no se puede confirmar en su estado actual');
      }

      for (const item of order.items) {
        const available = await tx.inventoryItem.aggregate({
          where: { variantId: item.variantId, pointOfSaleId: order.pointOfSaleId },
          _sum: { stock: true },
        });

        if ((available._sum.stock ?? 0) < item.quantity) {
          await tx.catalogOrder.update({
            where: { id: order.id },
            data: { status: CatalogOrderStatus.OUT_OF_STOCK },
          });
          throw AppError.badRequest(
            `Stock insuficiente para confirmar ${item.productNameSnapshot} - ${item.colorNameSnapshot} / ${item.sizeNameSnapshot}`
          );
        }
      }

      for (const item of order.items) {
        await consumePointOfSaleStock(tx, item.variantId, order.pointOfSaleId, item.quantity);
      }

      const sale = await tx.sale.create({
        data: {
          pointOfSaleId: order.pointOfSaleId,
          paymentMethod: PaymentMethod.MERCADO_PAGO,
          total: order.total,
          observaciones: [
            `Pedido catalogo ${order.id}`,
            `${order.customerFirstName} ${order.customerLastName}`,
            `Tel: ${order.customerPhone}`,
            order.notes,
          ].filter(Boolean).join(' | '),
          items: {
            createMany: {
              data: order.items.map((item) => ({
                variantId: item.variantId,
                inventoryItemId: null,
                productName: item.productNameSnapshot,
                colorName: item.colorNameSnapshot,
                sizeName: item.sizeNameSnapshot,
                quantity: item.quantity,
                unitPrice: item.unitPriceSnapshot,
              })),
            },
          },
        },
      });

      await tx.catalogOrder.update({
        where: { id: order.id },
        data: {
          status: CatalogOrderStatus.CONFIRMED,
          confirmedAt: new Date(),
          saleId: sale.id,
        },
      });

      logger.info('Catalog order confirmed', { orderId: order.id, saleId: sale.id });
      return order.id;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 15_000,
    });

    return this.getOrderById(confirmedOrderId);
  },
};
