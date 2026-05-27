import { inventoryRepository } from './inventory.repository';
import { productRepository } from '../products/product.repository';
import { settingsRepository } from '../settings/settings.repository';
import { AppError } from '../../shared/errors/app-error';
import { CreateTransferInput } from './inventory.types';
import { getPaginationMeta, getPaginationParams } from '../../shared/utils/pagination';
import { logger } from '../../shared/utils/logger';

export const inventoryService = {
  async listInventory(rawQuery: Record<string, unknown>) {
    const filters = {
      variantId: rawQuery.variantId as string | undefined,
      pointOfSaleId: rawQuery.pointOfSaleId as string | undefined,
      depositoId: rawQuery.depositoId as string | undefined,
      minStock: rawQuery.minStock ? Number(rawQuery.minStock) : undefined,
      maxStock: rawQuery.maxStock ? Number(rawQuery.maxStock) : undefined,
    };

    return inventoryRepository.findInventory(filters);
  },

  async getInventoryByVariant(variantId: string) {
    return inventoryRepository.findInventoryByVariant(variantId);
  },

  async transferStock(input: CreateTransferInput) {
    const variant = await productRepository.findVariantById(input.variantId);
    if (!variant) {
      throw AppError.notFound(`Variante con ID ${input.variantId} no encontrada`);
    }

    const fromPos = await settingsRepository.findPointOfSaleById(input.fromPointOfSaleId);
    if (!fromPos) {
      throw AppError.notFound(`Punto de venta origen con ID ${input.fromPointOfSaleId} no encontrado`);
    }

    const toPos = await settingsRepository.findPointOfSaleById(input.toPointOfSaleId);
    if (!toPos) {
      throw AppError.notFound(`Punto de venta destino con ID ${input.toPointOfSaleId} no encontrado`);
    }

    if (input.fromPointOfSaleId === input.toPointOfSaleId &&
        input.fromDepositoId === input.toDepositoId) {
      throw AppError.badRequest('El origen y destino deben ser diferentes');
    }

    logger.info('Transferring stock', {
      variantId: input.variantId,
      from: input.fromPointOfSaleId,
      to: input.toPointOfSaleId,
      quantity: input.quantity,
    });

    try {
      return await inventoryRepository.createTransfer({
        variantId: input.variantId,
        fromPointOfSaleId: input.fromPointOfSaleId,
        fromDepositoId: input.fromDepositoId ?? null,
        toPointOfSaleId: input.toPointOfSaleId,
        toDepositoId: input.toDepositoId ?? null,
        quantity: input.quantity,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Stock insuficiente')) {
        throw AppError.badRequest(error.message);
      }
      throw error;
    }
  },

  async listTransfers(rawQuery: Record<string, unknown>) {
    const pagination = getPaginationParams(rawQuery as { page?: string; limit?: string });

    const filters = {
      variantId: rawQuery.variantId as string | undefined,
      fromPointOfSaleId: rawQuery.fromPointOfSaleId as string | undefined,
      toPointOfSaleId: rawQuery.toPointOfSaleId as string | undefined,
    };

    const { transfers, total } = await inventoryRepository.findTransfers(filters, pagination);
    const meta = getPaginationMeta(total, pagination);

    return { transfers, meta };
  },

  async setVariantInventory(variantId: string, items: { pointOfSaleId: string; depositoId: string | null; stock: number }[]) {
    const variant = await productRepository.findVariantById(variantId);
    if (!variant) {
      throw AppError.notFound(`Variante con ID ${variantId} no encontrada`);
    }

    logger.info('Setting variant inventory', { variantId, items: items.length });

    return inventoryRepository.setVariantInventory(variantId, items);
  },
};
