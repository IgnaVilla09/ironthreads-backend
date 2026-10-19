import { z } from 'zod';

export const createSaleSchema = z.object({
  clientRequestId: z.string().uuid().optional(),
  items: z.array(z.object({
    variantId: z.string().uuid('Variante inválida'),
    quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1').max(2147483647),
    unitPrice: z.coerce.number().int().min(0).max(2147483647).default(0),
  })).min(1, 'Debe haber al menos un item'),
  paymentMethod: z.enum(['EFECTIVO', 'MERCADO_PAGO', 'MOBBEX', 'OTRO']),
  customerName: z.string().trim().min(1).max(160).optional(),
  customerEmail: z.string().trim().email().max(320).optional(),
  pointOfSaleId: z.string().uuid('Punto de venta inválido'),
  depositoId: z.string().uuid('Depósito inválido').nullable().optional(),
  observaciones: z.string().max(500).optional(),
}).superRefine((value, context) => {
  if (value.paymentMethod === 'MOBBEX' && !value.customerEmail) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['customerEmail'], message: 'El email es obligatorio para enviar el comprobante de Mobbex' });
  }
});

export const verifyStockSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().uuid('Variante inválida'),
    quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  })).min(1, 'Debe haber al menos un item'),
  pointOfSaleId: z.string().uuid('Punto de venta inválido').optional(),
  depositoId: z.string().uuid('Depósito inválido').nullable().optional(),
});
