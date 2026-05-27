import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .transform((v) => v.toUpperCase().trim()),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid('Categoría inválida'),
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .transform((v) => v.toUpperCase().trim())
    .optional(),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid('Categoría inválida').optional(),
});

export const inventoryAllocationSchema = z.object({
  pointOfSaleId: z.string().uuid('Punto de venta inválido'),
  depositoId: z.string().uuid('Depósito inválido').optional(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
});

export const createVariantSchema = z.object({
  colorId: z.string().uuid('Color inválido'),
  sizeId: z.string().uuid('Talle inválido'),
  inventory: z.array(inventoryAllocationSchema).optional(),
});

export const updateVariantSchema = z.object({
  colorId: z.string().uuid('Color inválido').optional(),
  sizeId: z.string().uuid('Talle inválido').optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
});
