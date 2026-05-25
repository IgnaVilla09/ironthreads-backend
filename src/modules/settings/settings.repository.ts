import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

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

  async createPointOfSale(data: Prisma.PointOfSaleCreateInput) {
    return prisma.pointOfSale.create({ data });
  },

  async updatePointOfSale(id: string, data: Prisma.PointOfSaleUpdateInput) {
    return prisma.pointOfSale.update({ where: { id }, data });
  },

  async deletePointOfSale(id: string) {
    return prisma.pointOfSale.delete({ where: { id } });
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
