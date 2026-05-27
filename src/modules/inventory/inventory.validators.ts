import { z } from 'zod';

export const transferStockSchema = z.object({
  variantId: z.string().uuid('Variante inválida'),
  fromPointOfSaleId: z.string().uuid('Punto de venta origen inválido'),
  fromDepositoId: z.string().uuid('Depósito origen inválido').nullable().optional(),
  toPointOfSaleId: z.string().uuid('Punto de venta destino inválido'),
  toDepositoId: z.string().uuid('Depósito destino inválido').nullable().optional(),
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
});

export const inventoryQuerySchema = z.object({
  variantId: z.string().uuid().optional(),
  pointOfSaleId: z.string().uuid().optional(),
  depositoId: z.string().uuid().optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  maxStock: z.coerce.number().int().min(0).optional(),
});

export const setInventoryItemSchema = z.object({
  pointOfSaleId: z.string().uuid('Punto de venta inválido'),
  depositoId: z.string().uuid('Depósito inválido').nullable().optional(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
});

export const setInventorySchema = z.object({
  items: z.array(setInventoryItemSchema).min(1, 'Debe haber al menos un item'),
});

export const transferQuerySchema = z.object({
  variantId: z.string().uuid().optional(),
  fromPointOfSaleId: z.string().uuid().optional(),
  toPointOfSaleId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});
