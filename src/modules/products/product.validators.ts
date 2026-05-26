import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .transform((v) => v.toUpperCase().trim()),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid('Categoría inválida'),
  pointOfSaleId: z.string().uuid('Punto de venta inválido'),
  depositoId: z.string().uuid('Depósito inválido').nullable().optional(),
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
  pointOfSaleId: z.string().uuid('Punto de venta inválido').optional(),
  depositoId: z.string().uuid('Depósito inválido').nullable().optional(),
});

export const createVariantSchema = z.object({
  colorId: z.string().uuid('Color inválido'),
  sizeId: z.string().uuid('Talle inválido'),
  stock: z.coerce.number().int().min(0).default(0),
});

export const updateVariantSchema = z.object({
  colorId: z.string().uuid('Color inválido').optional(),
  sizeId: z.string().uuid('Talle inválido').optional(),
  stock: z.coerce.number().int().min(0).optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  categoryId: z.string().uuid().optional(),
  pointOfSaleId: z.string().uuid().optional(),
  depositoId: z.string().uuid().optional(),
  search: z.string().optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  maxStock: z.coerce.number().int().min(0).optional(),
});
