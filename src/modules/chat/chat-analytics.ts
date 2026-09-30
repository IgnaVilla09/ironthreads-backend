import { prisma } from '../../config/database';
import { analyticsService } from '../analytics/analytics.service';
import { z } from 'zod';

export type SalesMetricType = 'by_size' | 'by_color' | 'best_selling_sizes' | 'general';

export async function consultLowStock(
  threshold: number,
  pointOfSaleId?: string,
  db: Pick<typeof prisma, 'pointOfSale' | 'productVariant'> = prisma
) {
  const pointOfSale = pointOfSaleId
    ? await (z.string().uuid().safeParse(pointOfSaleId).success
      ? db.pointOfSale.findUnique({ where: { id: pointOfSaleId } })
      : db.pointOfSale.findFirst({ where: {
          OR: [
            { name: { equals: pointOfSaleId, mode: 'insensitive' } },
            { label: { equals: pointOfSaleId, mode: 'insensitive' } },
          ],
        } }))
    : null;

  if (pointOfSaleId && !pointOfSale) {
    return { error: 'Punto de venta no encontrado', pointOfSaleId, threshold, variants: [] };
  }

  // Include variants without inventory rows: they have zero stock at this location.
  const variants = await db.productVariant.findMany({
    select: {
      id: true,
      sku: true,
      product: { select: { id: true, name: true } },
      color: { select: { label: true } },
      size: { select: { label: true } },
      inventory: {
        where: pointOfSale ? { pointOfSaleId: pointOfSale.id } : undefined,
        select: { stock: true },
      },
    },
  });

  const lowStock = variants.map((variant) => ({
    productId: variant.product.id,
    productName: variant.product.name,
    variantId: variant.id,
    sku: variant.sku,
    color: variant.color.label,
    size: variant.size.label,
    stock: variant.inventory.reduce((sum, item) => sum + item.stock, 0),
  })).filter((variant) => variant.stock <= threshold)
    .sort((a, b) => a.stock - b.stock || a.productName.localeCompare(b.productName));

  return {
    threshold,
    pointOfSale: pointOfSale ? { id: pointOfSale.id, name: pointOfSale.label } : null,
    total: lowStock.length,
    variants: lowStock.slice(0, 40),
    truncated: lowStock.length > 40,
  };
}

export async function consultSalesMetrics(type: SalesMetricType) {
  switch (type) {
    case 'by_size':
      return { type, meaning: 'stock actual agrupado por talle, no ventas', data: await analyticsService.getBySize() };
    case 'by_color':
      return { type, meaning: 'stock actual agrupado por color, no ventas', data: await analyticsService.getByColor() };
    case 'best_selling_sizes':
      return { type, meaning: 'talles más vendidos por unidades, no productos más vendidos', data: await analyticsService.getBestSellingSizes() };
    case 'general':
      return { type, meaning: 'resumen general de productos y stock, no facturación', data: await analyticsService.getGeneralStats() };
  }
}
