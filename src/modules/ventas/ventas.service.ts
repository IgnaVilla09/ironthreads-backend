import { AppError } from '../../shared/errors/app-error';
import { ventasRepository } from './ventas.repository';
import { CreateSaleInput } from './ventas.types';
import { logger } from '../../shared/utils/logger';

export const ventasService = {
  async createSale(input: CreateSaleInput) {
    logger.info('Creating sale', { items: input.items.length, paymentMethod: input.paymentMethod, observaciones: input.observaciones });

    const itemsData: Array<{
      variantId: string;
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

      if (variant.stock < item.quantity) {
        throw AppError.badRequest(
          `Stock insuficiente para ${variant.product.name} - ${variant.color.label} / ${variant.size.label}. Disponible: ${variant.stock}, solicitado: ${item.quantity}`
        );
      }

      itemsData.push({
        variantId: variant.id,
        productName: variant.product.name,
        colorName: variant.color.label,
        sizeName: variant.size.label,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      });
    }

    const sale = await ventasRepository.createSaleWithItems(input.paymentMethod, itemsData, input.observaciones);

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

  async verifyStock(items: Array<{ variantId: string; quantity: number }>) {
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

      results.push({
        variantId: variant.id,
        productName: variant.product.name,
        colorName: variant.color.label,
        sizeName: variant.size.label,
        available: variant.stock,
        requested: item.quantity,
        sufficient: variant.stock >= item.quantity,
      });
    }

    return results;
  },
};
