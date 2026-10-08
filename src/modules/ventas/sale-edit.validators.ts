import { z } from 'zod';

export const moneySchema = z.number().int().min(0).max(2147483647);
export const editSaleSchema = z.object({
  requestId: z.string().uuid(),
  revision: z.number().int().min(0),
  reason: z.string().trim().min(1, 'El motivo es obligatorio').max(1000),
  settled: z.literal(true),
  paymentMethod: z.enum(['EFECTIVO', 'MERCADO_PAGO', 'OTRO']).nullable(),
  returns: z.array(z.object({
    saleItemId: z.string().uuid(),
    quantity: z.number().int().min(1).max(2147483647),
    depositoId: z.string().uuid().nullable(),
    // Explicit confirmation of zero or correction of an unrecorded historical price.
    originalUnitPrice: moneySchema.optional(),
  }).strict()).min(1).max(50),
  deliveries: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().int().min(1).max(2147483647),
    unitPrice: moneySchema,
  }).strict()).min(1).max(50),
}).strict().refine((value) => new Set(value.returns.map((row) => row.saleItemId)).size === value.returns.length, {
  message: 'No se puede devolver el mismo artículo dos veces en una edición', path: ['returns'],
});

export type EditSaleInput = z.infer<typeof editSaleSchema>;
