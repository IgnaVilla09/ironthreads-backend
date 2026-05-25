import { z } from 'zod';

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
