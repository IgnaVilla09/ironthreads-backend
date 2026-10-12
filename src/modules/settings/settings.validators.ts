import { z } from 'zod';

const discountCodeFields = {
  code: z.string().min(1, 'El código es obligatorio').max(80),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().int().positive('El descuento debe ser mayor a cero'),
  minOrderAmount: z.coerce.number().int().min(0).optional(),
  maxUses: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().nullable().optional(),
};

export const createDiscountCodeSchema = z.object(discountCodeFields).superRefine((data, ctx) => {
  if (data.validUntil && data.validFrom && data.validUntil < data.validFrom) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['validUntil'], message: 'La vigencia final debe ser posterior al inicio' });
  }
});

export const updateDiscountCodeSchema = z.object(discountCodeFields).partial();

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(30)
    .transform((v) => v.toUpperCase().trim()),
  label: z
    .string()
    .min(1, 'La etiqueta es requerida')
    .max(30)
    .transform((v) => v.trim()),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(30)
    .transform((v) => v.toUpperCase().trim())
    .optional(),
  label: z
    .string()
    .min(1)
    .max(30)
    .transform((v) => v.trim())
    .optional(),
});

export const createColorSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(20)
    .transform((v) => v.toUpperCase().trim()),
  label: z
    .string()
    .min(1, 'La etiqueta es requerida')
    .max(20)
    .transform((v) => v.trim()),
  hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un hex válido (#RRGGBB)')
    .optional(),
});

export const updateColorSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(20)
    .transform((v) => v.toUpperCase().trim())
    .optional(),
  label: z
    .string()
    .min(1)
    .max(20)
    .transform((v) => v.trim())
    .optional(),
  hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un hex válido (#RRGGBB)')
    .optional(),
});

export const createPointOfSaleSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(30)
    .transform((v) => v.toUpperCase().trim()),
  label: z
    .string()
    .min(1, 'La etiqueta es requerida')
    .max(30)
    .transform((v) => v.trim()),
});

export const updatePointOfSaleSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(30)
    .transform((v) => v.toUpperCase().trim())
    .optional(),
  label: z
    .string()
    .min(1)
    .max(30)
    .transform((v) => v.trim())
    .optional(),
});

export const createDepositoSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(30)
    .transform((v) => v.toUpperCase().trim()),
  label: z
    .string()
    .min(1, 'La etiqueta es requerida')
    .max(30)
    .transform((v) => v.trim()),
});

export const updateDepositoSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(30)
    .transform((v) => v.toUpperCase().trim())
    .optional(),
  label: z
    .string()
    .min(1)
    .max(30)
    .transform((v) => v.trim())
    .optional(),
});

export const createSizeSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(10)
    .transform((v) => v.toUpperCase().trim()),
  label: z
    .string()
    .min(1, 'La etiqueta es requerida')
    .max(10)
    .transform((v) => v.trim()),
});

export const updateSizeSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(10)
    .transform((v) => v.toUpperCase().trim())
    .optional(),
  label: z
    .string()
    .min(1)
    .max(10)
    .transform((v) => v.trim())
    .optional(),
});
