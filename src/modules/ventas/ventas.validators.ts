import { z } from 'zod';

export const saleItemSchema = z.object({
  variantId: z.string().uuid('Variante inválida'),
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  unitPrice: z.coerce.number().int().min(0, 'El precio no puede ser negativo').default(0),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Debe haber al menos un item'),
  paymentMethod: z.enum(['EFECTIVO', 'MERCADO_PAGO', 'OTRO'], {
    errorMap: () => ({ message: 'Método de pago inválido. Use EFECTIVO, MERCADO_PAGO u OTRO' }),
  }),
  observaciones: z.string().max(500, 'Las observaciones no pueden superar los 500 caracteres').optional(),
});
