import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/app-error';
import { ventasRepository } from './ventas.repository';
import { CreateSaleInput } from './ventas.types';
import { logger } from '../../shared/utils/logger';

export const ventasService = {
  async createSale(input: CreateSaleInput) {
    logger.info('Creating sale', {
      items: input.items.length,
      paymentMethod: input.paymentMethod,
      pointOfSaleId: input.pointOfSaleId,
      depositoId: input.depositoId,
    });

    const itemsData: Array<{
      variantId: string;
      inventoryItemId: string | null;
      productName: string;
      colorName: string;
      sizeName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    for (const item of input.items) {
      const variant = await ventasRepository.findVariantWithDetails(item.variantId);

      if (!variant) {
        throw AppError.notFound(`Variante con ID ${item.variantId} no encontrada`);
      }

      const inventoryItem = await ventasRepository.findInventoryItem(
        item.variantId,
        input.pointOfSaleId,
        input.depositoId ?? null
      );

      if (!inventoryItem) {
        throw AppError.badRequest(
          `No hay inventario de ${variant.product.name} - ${variant.color.label} / ${variant.size.label} en el punto de venta seleccionado`
        );
      }

      if (inventoryItem.stock < item.quantity) {
        throw AppError.badRequest(
          `Stock insuficiente para ${variant.product.name} - ${variant.color.label} / ${variant.size.label} en este punto de venta. Disponible: ${inventoryItem.stock}, solicitado: ${item.quantity}`
        );
      }

      itemsData.push({
        variantId: variant.id,
        inventoryItemId: inventoryItem.id,
        productName: variant.product.name,
        colorName: variant.color.label,
        sizeName: variant.size.label,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      });
    }

    const sale = await ventasRepository.createSaleWithItems(
      input.paymentMethod,
      input.pointOfSaleId,
      input.depositoId ?? null,
      itemsData,
      input.observaciones
    );

    logger.info('Sale created', { saleId: sale.id, total: sale.total });

    return sale;
  },

  async listSales(page: number = 1, limit: number = 20) {
    logger.info('Listing sales', { page, limit });
    return ventasRepository.findAllSales(page, limit);
  },

  async getSaleById(id: string) {
    const sale = await ventasRepository.findSaleById(id);

    if (!sale) {
      throw AppError.notFound(`Venta con ID ${id} no encontrada`);
    }

    return sale;
  },

  async verifyStock(items: Array<{ variantId: string; quantity: number }>, pointOfSaleId?: string, depositoId?: string) {
    const results: Array<{
      variantId: string;
      productName: string;
      colorName: string;
      sizeName: string;
      available: number;
      requested: number;
      sufficient: boolean;
    }> = [];

    for (const item of items) {
      const variant = await ventasRepository.findVariantWithDetails(item.variantId);

      if (!variant) {
        throw AppError.notFound(`Variante con ID ${item.variantId} no encontrada`);
      }

      let available = 0;

      if (pointOfSaleId) {
        const inventoryItem = await ventasRepository.findInventoryItem(
          item.variantId,
          pointOfSaleId,
          depositoId ?? null
        );
        available = inventoryItem?.stock ?? 0;
      } else {
        const items = await prisma.inventoryItem.aggregate({
          where: { variantId: item.variantId },
          _sum: { stock: true },
        });
        available = items._sum.stock ?? 0;
      }

      results.push({
        variantId: variant.id,
        productName: variant.product.name,
        colorName: variant.color.label,
        sizeName: variant.size.label,
        available,
        requested: item.quantity,
        sufficient: available >= item.quantity,
      });
    }

    return results;
  },

  async exportSalesToExcel(from?: Date, to?: Date) {
    logger.info('Exporting sales to Excel', { from, to });
    const result = await ventasRepository.findSalesByDateRange(
      from ?? new Date(0),
      to ?? new Date()
    );
    return result;
  },
};


