import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/app-error';
import { generateSku } from '../../shared/utils/sku-generator';
import { getPaginationMeta, getPaginationParams } from '../../shared/utils/pagination';
import { productRepository } from './product.repository';
import { settingsRepository } from '../settings/settings.repository';
import {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
  ProductFilters,
} from './product.types';
import { logger } from '../../shared/utils/logger';

async function resolveSku(baseSku: string): Promise<string> {
  let sku = baseSku;
  let counter = 0;
  while (await productRepository.findVariantBySku(sku)) {
    counter++;
    sku = `${baseSku}-ALTER${counter > 1 ? counter : ''}`;
  }
  return sku;
}

export const productService = {
  async listProducts(rawQuery: Record<string, unknown>) {
    const pagination = getPaginationParams(rawQuery as { page?: string; limit?: string });

    const filters: ProductFilters = {
      categoryId: rawQuery.categoryId as string | undefined,
      search: rawQuery.search as string | undefined,
      pointOfSaleId: rawQuery.pointOfSaleId as string | undefined,
    };

    logger.info('Listing products', { filters, pagination });

    const { products, total } = await productRepository.findAllProducts(filters, pagination);

    const variantIds = products.flatMap((p) => p.variants.map((v) => v.id));
    const stockMap = new Map<string, number>();

    if (variantIds.length > 0) {
      const inventoryWhere: Record<string, unknown> = { variantId: { in: variantIds } };
      if (filters.pointOfSaleId) {
        inventoryWhere.pointOfSaleId = filters.pointOfSaleId;
      }
      const inventoryAgg = await prisma.inventoryItem.groupBy({
        by: ['variantId'],
        where: inventoryWhere as never,
        _sum: { stock: true },
      });
      for (const item of inventoryAgg) {
        stockMap.set(item.variantId, item._sum.stock ?? 0);
      }
    }

    const enrichedProducts = products.map((p) => ({
      ...p,
      variants: p.variants.map((v) => ({
        ...v,
        stock: stockMap.get(v.id) ?? 0,
      })),
    }));

    const meta = getPaginationMeta(total, pagination);

    return { products: enrichedProducts, meta };
  },

  async getProductById(id: string) {
    const product = await productRepository.findProductById(id);

    if (!product) {
      throw AppError.notFound(`Producto con ID ${id} no encontrado`);
    }

    const variantIds = product.variants.map((v) => v.id);
    const stockMap = new Map<string, number>();

    if (variantIds.length > 0) {
      const inventoryAgg = await prisma.inventoryItem.groupBy({
        by: ['variantId'],
        where: { variantId: { in: variantIds } },
        _sum: { stock: true },
      });
      for (const item of inventoryAgg) {
        stockMap.set(item.variantId, item._sum.stock ?? 0);
      }
    }

    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        stock: stockMap.get(v.id) ?? 0,
      })),
    };
  },

  async createProduct(input: CreateProductInput) {
    logger.info('Creating product', { name: input.name });

    const product = await productRepository.createProduct({
      name: input.name,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      price: input.price ?? null,
      category: { connect: { id: input.categoryId } },
    });

    return {
      ...product,
      variants: product.variants.map((v) => ({ ...v, stock: 0 })),
    };
  },

  async updateProduct(id: string, input: UpdateProductInput) {
    const existing = await productRepository.findProductById(id);
    if (!existing) {
      throw AppError.notFound(`Producto con ID ${id} no encontrado`);
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.categoryId !== undefined) updateData.category = { connect: { id: input.categoryId } };
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
    if (input.price !== undefined) updateData.price = input.price;

    logger.info('Updating product', { id });

    const updated = await productRepository.updateProduct(id, updateData as never);

    const variantIds = updated.variants.map((v) => v.id);
    const stockMap = new Map<string, number>();

    if (variantIds.length > 0) {
      const inventoryAgg = await prisma.inventoryItem.groupBy({
        by: ['variantId'],
        where: { variantId: { in: variantIds } },
        _sum: { stock: true },
      });
      for (const item of inventoryAgg) {
        stockMap.set(item.variantId, item._sum.stock ?? 0);
      }
    }

    return {
      ...updated,
      variants: updated.variants.map((v) => ({
        ...v,
        stock: stockMap.get(v.id) ?? 0,
      })),
    };
  },

  async deleteProduct(id: string) {
    const existing = await productRepository.findProductById(id);
    if (!existing) {
      throw AppError.notFound(`Producto con ID ${id} no encontrado`);
    }

    logger.info('Deleting product', { id });

    await productRepository.deleteProduct(id);
  },

  async listVariants(productId: string) {
    const product = await productRepository.findProductById(productId);
    if (!product) {
      throw AppError.notFound(`Producto con ID ${productId} no encontrado`);
    }

    return productRepository.findVariants(productId);
  },

  async getVariantById(id: string) {
    const variant = await productRepository.findVariantById(id);
    if (!variant) {
      throw AppError.notFound(`Variante con ID ${id} no encontrada`);
    }
    return variant;
  },

  async createVariant(productId: string, input: CreateVariantInput) {
    const product = await productRepository.findProductById(productId);
    if (!product) {
      throw AppError.notFound(`Producto con ID ${productId} no encontrado`);
    }

    const [color, size] = await Promise.all([
      settingsRepository.findColorById(input.colorId),
      settingsRepository.findSizeById(input.sizeId),
    ]);

    if (!color) throw AppError.notFound(`Color con ID ${input.colorId} no encontrado`);
    if (!size) throw AppError.notFound(`Talle con ID ${input.sizeId} no encontrado`);

    const existingVariant = await productRepository.findVariantByProductColorSize(
      productId,
      input.colorId,
      input.sizeId
    );

    if (existingVariant) {
      logger.info('Variant already exists', { variantId: existingVariant.id });
      return existingVariant;
    }

    const baseSku = generateSku(product.name, color.name, size.name);
    const sku = await resolveSku(baseSku);

    logger.info('Creating variant', { sku, productId });

    const variant = await productRepository.createVariant({
      sku,
      product: { connect: { id: productId } },
      color: { connect: { id: input.colorId } },
      size: { connect: { id: input.sizeId } },
    });

    if (input.inventory && input.inventory.length > 0) {
      await prisma.inventoryItem.createMany({
        data: input.inventory.map((inv) => ({
          variantId: variant.id,
          pointOfSaleId: inv.pointOfSaleId,
          depositoId: inv.depositoId ?? null,
          stock: inv.stock,
        })),
      });
    }

    const totalStock = input.inventory?.reduce((sum, inv) => sum + inv.stock, 0) ?? 0;

    return { ...variant, stock: totalStock };
  },

  async updateVariant(id: string, input: UpdateVariantInput) {
    const existing = await productRepository.findVariantById(id);
    if (!existing) {
      throw AppError.notFound(`Variante con ID ${id} no encontrada`);
    }

    const updateData: Record<string, unknown> = {};
    if (input.colorId !== undefined) updateData.color = { connect: { id: input.colorId } };
    if (input.sizeId !== undefined) updateData.size = { connect: { id: input.sizeId } };

    const colorId = input.colorId ?? existing.color.id;
    const sizeId = input.sizeId ?? existing.size.id;

    const [color, size] = await Promise.all([
      settingsRepository.findColorById(colorId),
      settingsRepository.findSizeById(sizeId),
    ]);

    if (!color) throw AppError.notFound(`Color con ID ${colorId} no encontrado`);
    if (!size) throw AppError.notFound(`Talle con ID ${sizeId} no encontrado`);

    const baseSku = generateSku(existing.product.name, color.name, size.name);

    if (baseSku !== existing.sku) {
      const sku = await resolveSku(baseSku);
      updateData.sku = sku;
    } else {
      updateData.sku = baseSku;
    }

    logger.info('Updating variant', { id, sku: updateData.sku });

    return productRepository.updateVariant(id, updateData as never);
  },

  async deleteVariant(id: string) {
    const existing = await productRepository.findVariantById(id);
    if (!existing) {
      throw AppError.notFound(`Variante con ID ${id} no encontrada`);
    }

    logger.info('Deleting variant', { id });

    await productRepository.deleteVariant(id);
  },
};
