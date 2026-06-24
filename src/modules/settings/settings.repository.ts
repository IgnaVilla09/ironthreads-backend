import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const settingsRepository = {
  // ── Categories ──────────────────────────────────

  async findAllCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  },

  async findCategoryById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },

  async findCategoryByName(name: string) {
    return prisma.category.findUnique({ where: { name } });
  },

  async createCategory(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },

  async updateCategory(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  async deleteCategory(id: string) {
    return prisma.category.delete({ where: { id } });
  },

  // ── Colors ──────────────────────────────────────

  async findAllColors() {
    return prisma.color.findMany({ orderBy: { name: 'asc' } });
  },

  async findColorById(id: string) {
    return prisma.color.findUnique({ where: { id } });
  },

  async findColorByName(name: string) {
    return prisma.color.findUnique({ where: { name } });
  },

  async createColor(data: Prisma.ColorCreateInput) {
    return prisma.color.create({ data });
  },

  async updateColor(id: string, data: Prisma.ColorUpdateInput) {
    return prisma.color.update({ where: { id }, data });
  },

  async deleteColor(id: string) {
    return prisma.color.delete({ where: { id } });
  },

  // ── Points of Sale ──────────────────────────────

  async findAllPointsOfSale() {
    return prisma.pointOfSale.findMany({ orderBy: { name: 'asc' } });
  },

  async findPointOfSaleById(id: string) {
    return prisma.pointOfSale.findUnique({ where: { id } });
  },

  async findPointOfSaleByName(name: string) {
    return prisma.pointOfSale.findUnique({ where: { name } });
  },

  async findPointOfSaleByIdentifier(identifier: string) {
    const normalizedIdentifier = identifier.trim();
    return prisma.pointOfSale.findFirst({
      where: {
        OR: [
          ...(isUuid(normalizedIdentifier) ? [{ id: normalizedIdentifier }] : []),
          { name: normalizedIdentifier.toUpperCase() },
          { label: { equals: normalizedIdentifier, mode: 'insensitive' } },
        ],
      },
    });
  },

  async createPointOfSale(data: Prisma.PointOfSaleCreateInput) {
    return prisma.pointOfSale.create({ data });
  },

  async updatePointOfSale(id: string, data: Prisma.PointOfSaleUpdateInput) {
    return prisma.pointOfSale.update({ where: { id }, data });
  },

  async deletePointOfSale(id: string) {
    return prisma.pointOfSale.delete({ where: { id } });
  },

  // ── Depositos ────────────────────────────────────

  async findAllDepositosByPointOfSale(pointOfSaleId: string) {
    return prisma.deposito.findMany({
      where: { pointOfSaleId },
      orderBy: { name: 'asc' },
    });
  },

  async findDepositoById(id: string) {
    return prisma.deposito.findUnique({ where: { id } });
  },

  async findDepositoByNameAndPointOfSale(name: string, pointOfSaleId: string) {
    return prisma.deposito.findUnique({
      where: { name_pointOfSaleId: { name, pointOfSaleId } },
    });
  },

  async createDeposito(data: Prisma.DepositoCreateInput) {
    return prisma.deposito.create({ data });
  },

  async updateDeposito(id: string, data: Prisma.DepositoUpdateInput) {
    return prisma.deposito.update({ where: { id }, data });
  },

  async deleteDeposito(id: string) {
    return prisma.deposito.delete({ where: { id } });
  },

  // ── Sizes ───────────────────────────────────────

  async findAllSizes() {
    return prisma.size.findMany({ orderBy: { name: 'asc' } });
  },

  async findSizeById(id: string) {
    return prisma.size.findUnique({ where: { id } });
  },

  async findSizeByName(name: string) {
    return prisma.size.findUnique({ where: { name } });
  },

  async createSize(data: Prisma.SizeCreateInput) {
    return prisma.size.create({ data });
  },

  async updateSize(id: string, data: Prisma.SizeUpdateInput) {
    return prisma.size.update({ where: { id }, data });
  },

  async deleteSize(id: string) {
    return prisma.size.delete({ where: { id } });
  },
};
