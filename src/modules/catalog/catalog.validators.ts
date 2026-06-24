import { z } from 'zod';

const catalogOrderItemSchema = z.object({
  productId: z.string().uuid('Producto inválido'),
  variantId: z.string().uuid('Variante inválida'),
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
});

export const createCatalogOrderSchema = z.object({
  pointOfSaleId: z.string().trim().min(1, 'Punto de venta inválido'),
  customerFirstName: z.string().trim().min(2, 'El nombre es obligatorio').max(80),
  customerLastName: z.string().trim().min(2, 'El apellido es obligatorio').max(80),
  customerPhone: z.string().trim().min(6, 'El teléfono es obligatorio').max(30),
  paymentMethod: z.literal('MERCADO_PAGO'),
  notes: z.string().trim().max(500).optional(),
  items: z.array(catalogOrderItemSchema).min(1, 'Debe haber al menos un item'),
});
