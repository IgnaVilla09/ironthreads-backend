import { z } from 'zod';

export const createSaleSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().uuid('Variante inválida'),
    quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
    unitPrice: z.coerce.number().int().min(0).default(0),
  })).min(1, 'Debe haber al menos un item'),
  paymentMethod: z.enum(['EFECTIVO', 'MERCADO_PAGO', 'OTRO']),
  pointOfSaleId: z.string().uuid('Punto de venta inválido'),
  depositoId: z.string().uuid('Depósito inválido').nullable().optional(),
  observaciones: z.string().max(500).optional(),
});

export const verifyStockSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().uuid('Variante inválida'),
    quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  })).min(1, 'Debe haber al menos un item'),
  pointOfSaleId: z.string().uuid('Punto de venta inválido').optional(),
  depositoId: z.string().uuid('Depósito inválido').nullable().optional(),
});
