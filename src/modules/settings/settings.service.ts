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
} from './settings.types';
import { logger } from '../../shared/utils/logger';

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
};
