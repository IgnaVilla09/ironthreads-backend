import { AppError } from '../../shared/errors/app-error';
import { settingsRepository } from './settings.repository';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateColorInput,
  UpdateColorInput,
  CreateSizeInput,
  UpdateSizeInput,
  CreatePointOfSaleInput,
  UpdatePointOfSaleInput,
  CreateDepositoInput,
  UpdateDepositoInput,
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
} from './settings.types';
import { logger } from '../../shared/utils/logger';
import { Prisma } from '@prisma/client';

function toCategoryResponse(cat: { id: string; name: string; label: string }) {
  return { id: cat.id, name: cat.name, label: cat.label };
}

function toColorResponse(col: { id: string; name: string; label: string; hex: string | null }) {
  return { id: col.id, name: col.name, label: col.label, hex: col.hex };
}

function toSizeResponse(sz: { id: string; name: string; label: string }) {
  return { id: sz.id, name: sz.name, label: sz.label };
}

function toPointOfSaleResponse(pos: { id: string; name: string; label: string }) {
  return { id: pos.id, name: pos.name, label: pos.label };
}

function toDepositoResponse(dep: { id: string; name: string; label: string; pointOfSaleId: string }) {
  return { id: dep.id, name: dep.name, label: dep.label, pointOfSaleId: dep.pointOfSaleId };
}

export const settingsService = {
  // ── Categories ──────────────────────────────────

  async listCategories() {
    const categories = await settingsRepository.findAllCategories();
    return categories.map(toCategoryResponse);
  },

  async getCategoryById(id: string) {
    const category = await settingsRepository.findCategoryById(id);
    if (!category) throw AppError.notFound(`Categoría con ID ${id} no encontrada`);
    return toCategoryResponse(category);
  },

  async createCategory(input: CreateCategoryInput) {
    const existing = await settingsRepository.findCategoryByName(input.name);
    if (existing) {
      throw AppError.conflict(`Ya existe una categoría con el nombre "${input.name}"`);
    }

    logger.info('Creating category', { name: input.name });
    const category = await settingsRepository.createCategory(input);
    return toCategoryResponse(category);
  },

  async updateCategory(id: string, input: UpdateCategoryInput) {
    const existing = await settingsRepository.findCategoryById(id);
    if (!existing) throw AppError.notFound(`Categoría con ID ${id} no encontrada`);

    if (input.name && input.name !== existing.name) {
      const nameExists = await settingsRepository.findCategoryByName(input.name);
      if (nameExists) {
        throw AppError.conflict(`Ya existe una categoría con el nombre "${input.name}"`);
      }
    }

    logger.info('Updating category', { id });
    const category = await settingsRepository.updateCategory(id, input);
    return toCategoryResponse(category);
  },

  async deleteCategory(id: string) {
    const existing = await settingsRepository.findCategoryById(id);
    if (!existing) throw AppError.notFound(`Categoría con ID ${id} no encontrada`);

    logger.info('Deleting category', { id });
    await settingsRepository.deleteCategory(id);
  },

  // ── Colors ──────────────────────────────────────

  async listColors() {
    const colors = await settingsRepository.findAllColors();
    return colors.map(toColorResponse);
  },

  async getColorById(id: string) {
    const color = await settingsRepository.findColorById(id);
    if (!color) throw AppError.notFound(`Color con ID ${id} no encontrado`);
    return toColorResponse(color);
  },

  async createColor(input: CreateColorInput) {
    const existing = await settingsRepository.findColorByName(input.name);
    if (existing) {
      throw AppError.conflict(`Ya existe un color con el nombre "${input.name}"`);
    }

    logger.info('Creating color', { name: input.name });
    const color = await settingsRepository.createColor(input);
    return toColorResponse(color);
  },

  async updateColor(id: string, input: UpdateColorInput) {
    const existing = await settingsRepository.findColorById(id);
    if (!existing) throw AppError.notFound(`Color con ID ${id} no encontrado`);

    if (input.name && input.name !== existing.name) {
      const nameExists = await settingsRepository.findColorByName(input.name);
      if (nameExists) {
        throw AppError.conflict(`Ya existe un color con el nombre "${input.name}"`);
      }
    }

    logger.info('Updating color', { id });
    const color = await settingsRepository.updateColor(id, input);
    return toColorResponse(color);
  },

  async deleteColor(id: string) {
    const existing = await settingsRepository.findColorById(id);
    if (!existing) throw AppError.notFound(`Color con ID ${id} no encontrado`);

    logger.info('Deleting color', { id });
    await settingsRepository.deleteColor(id);
  },

  // ── Points of Sale ──────────────────────────────

  async listPointsOfSale() {
    const points = await settingsRepository.findAllPointsOfSale();
    return points.map(toPointOfSaleResponse);
  },

  async getPointOfSaleById(id: string) {
    const point = await settingsRepository.findPointOfSaleById(id);
    if (!point) throw AppError.notFound(`Punto de venta con ID ${id} no encontrado`);
    return toPointOfSaleResponse(point);
  },

  async createPointOfSale(input: CreatePointOfSaleInput) {
    const existing = await settingsRepository.findPointOfSaleByName(input.name);
    if (existing) {
      throw AppError.conflict(`Ya existe un punto de venta con el nombre "${input.name}"`);
    }

    logger.info('Creating point of sale', { name: input.name });
    const point = await settingsRepository.createPointOfSale(input);
    return toPointOfSaleResponse(point);
  },

  async updatePointOfSale(id: string, input: UpdatePointOfSaleInput) {
    const existing = await settingsRepository.findPointOfSaleById(id);
    if (!existing) throw AppError.notFound(`Punto de venta con ID ${id} no encontrado`);

    if (input.name && input.name !== existing.name) {
      const nameExists = await settingsRepository.findPointOfSaleByName(input.name);
      if (nameExists) {
        throw AppError.conflict(`Ya existe un punto de venta con el nombre "${input.name}"`);
      }
    }

    logger.info('Updating point of sale', { id });
    const point = await settingsRepository.updatePointOfSale(id, input);
    return toPointOfSaleResponse(point);
  },

  async deletePointOfSale(id: string) {
    const existing = await settingsRepository.findPointOfSaleById(id);
    if (!existing) throw AppError.notFound(`Punto de venta con ID ${id} no encontrado`);

    logger.info('Deleting point of sale', { id });
    await settingsRepository.deletePointOfSale(id);
  },

  // ── Depositos ────────────────────────────────────

  async listDepositosByPointOfSale(pointOfSaleId: string) {
    const pos = await settingsRepository.findPointOfSaleById(pointOfSaleId);
    if (!pos) throw AppError.notFound(`Punto de venta con ID ${pointOfSaleId} no encontrado`);

    const depositos = await settingsRepository.findAllDepositosByPointOfSale(pointOfSaleId);
    return depositos.map(toDepositoResponse);
  },

  async getDepositoById(id: string) {
    const deposito = await settingsRepository.findDepositoById(id);
    if (!deposito) throw AppError.notFound(`Depósito con ID ${id} no encontrado`);
    return toDepositoResponse(deposito);
  },

  async createDeposito(pointOfSaleId: string, input: CreateDepositoInput) {
    const pos = await settingsRepository.findPointOfSaleById(pointOfSaleId);
    if (!pos) throw AppError.notFound(`Punto de venta con ID ${pointOfSaleId} no encontrado`);

    const existing = await settingsRepository.findDepositoByNameAndPointOfSale(input.name, pointOfSaleId);
    if (existing) {
      throw AppError.conflict(`Ya existe un depósito con el nombre "${input.name}" en este punto de venta`);
    }

    logger.info('Creating deposito', { name: input.name, pointOfSaleId });
    const deposito = await settingsRepository.createDeposito({
      name: input.name,
      label: input.label,
      pointOfSale: { connect: { id: pointOfSaleId } },
    });
    return toDepositoResponse(deposito);
  },

  async updateDeposito(id: string, input: UpdateDepositoInput) {
    const existing = await settingsRepository.findDepositoById(id);
    if (!existing) throw AppError.notFound(`Depósito con ID ${id} no encontrado`);

    if (input.name && input.name !== existing.name) {
      const nameExists = await settingsRepository.findDepositoByNameAndPointOfSale(input.name, existing.pointOfSaleId);
      if (nameExists) {
        throw AppError.conflict(`Ya existe un depósito con el nombre "${input.name}" en este punto de venta`);
      }
    }

    logger.info('Updating deposito', { id });
    const deposito = await settingsRepository.updateDeposito(id, input);
    return toDepositoResponse(deposito);
  },

  async deleteDeposito(id: string) {
    const existing = await settingsRepository.findDepositoById(id);
    if (!existing) throw AppError.notFound(`Depósito con ID ${id} no encontrado`);

    logger.info('Deleting deposito', { id });
    await settingsRepository.deleteDeposito(id);
  },

  // ── Sizes ───────────────────────────────────────

  async listSizes() {
    const sizes = await settingsRepository.findAllSizes();
    return sizes.map(toSizeResponse);
  },

  async getSizeById(id: string) {
    const size = await settingsRepository.findSizeById(id);
    if (!size) throw AppError.notFound(`Talle con ID ${id} no encontrado`);
    return toSizeResponse(size);
  },

  async createSize(input: CreateSizeInput) {
    const existing = await settingsRepository.findSizeByName(input.name);
    if (existing) {
      throw AppError.conflict(`Ya existe un talle con el nombre "${input.name}"`);
    }

    logger.info('Creating size', { name: input.name });
    const size = await settingsRepository.createSize(input);
    return toSizeResponse(size);
  },

  async updateSize(id: string, input: UpdateSizeInput) {
    const existing = await settingsRepository.findSizeById(id);
    if (!existing) throw AppError.notFound(`Talle con ID ${id} no encontrado`);

    if (input.name && input.name !== existing.name) {
      const nameExists = await settingsRepository.findSizeByName(input.name);
      if (nameExists) {
        throw AppError.conflict(`Ya existe un talle con el nombre "${input.name}"`);
      }
    }

    logger.info('Updating size', { id });
    const size = await settingsRepository.updateSize(id, input);
    return toSizeResponse(size);
  },

  async deleteSize(id: string) {
    const existing = await settingsRepository.findSizeById(id);
    if (!existing) throw AppError.notFound(`Talle con ID ${id} no encontrado`);

    logger.info('Deleting size', { id });
    await settingsRepository.deleteSize(id);
  },

  // ── Discount codes ────────────────────────────────────
  async listDiscountCodes() {
    return settingsRepository.findAllDiscountCodes();
  },

  async createDiscountCode(input: CreateDiscountCodeInput) {
    const existing = await settingsRepository.findDiscountCodeByCode(input.code);
    if (existing) {
      throw AppError.conflict(`Ya existe el código de descuento "${input.code}"`);
    }

    if (input.type === 'PERCENTAGE' && input.value > 100) {
      throw AppError.badRequest('Un descuento porcentual no puede superar el 100%');
    }

    return settingsRepository.createDiscountCode({
      code: input.code,
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmount ?? 0,
      maxUses: input.maxUses ?? null,
      isActive: input.isActive ?? true,
      validFrom: input.validFrom ?? new Date(),
      ...(input.validUntil ? { validUntil: input.validUntil } : {}),
    } as Prisma.DiscountCodeCreateInput);
  },

  async updateDiscountCode(id: string, input: UpdateDiscountCodeInput) {
    const existing = await settingsRepository.findDiscountCodeById(id);
    if (!existing) throw AppError.notFound(`Código de descuento con ID ${id} no encontrado`);

    if (input.code !== undefined && input.code !== existing.code) {
      const codeExists = await settingsRepository.findDiscountCodeByCode(input.code);
      if (codeExists) throw AppError.conflict(`Ya existe el código de descuento "${input.code}"`);
    }
    if ((input.type ?? existing.type) === 'PERCENTAGE' && (input.value ?? existing.value) > 100) {
      throw AppError.badRequest('Un descuento porcentual no puede superar el 100%');
    }

    return settingsRepository.updateDiscountCode(id, {
      ...input,
      validUntil: input.validUntil ?? undefined,
    });
  },

  async deleteDiscountCode(id: string) {
    const existing = await settingsRepository.findDiscountCodeById(id);
    if (!existing) throw AppError.notFound(`Código de descuento con ID ${id} no encontrado`);
    await settingsRepository.deleteDiscountCode(id);
  },
};
