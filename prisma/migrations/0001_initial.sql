-- ============================================================
-- IRON STOCK — Initial Schema Migration
-- Target: Supabase PostgreSQL
-- ============================================================

-- Enums
CREATE TYPE "Category" AS ENUM (
  'REMERA', 'PANTALON', 'BUZO', 'CAMPERA', 'CAMISA',
  'MUSCULOSA', 'SHORT', 'BERMUDA', 'ACCESORIO'
);

CREATE TYPE "Color" AS ENUM (
  'NEGRO', 'BLANCO', 'GRIS', 'AZUL', 'ROJO', 'VERDE',
  'AMARILLO', 'ROSA', 'VIOLETA', 'NARANJA', 'MARRON'
);

CREATE TYPE "Size" AS ENUM (
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'
);

-- ============================================================
-- Table: products
-- ============================================================
CREATE TABLE "products" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "name"        TEXT        NOT NULL,
  "description" TEXT,
  "category"    "Category"  NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "products_name_idx"       ON "products" ("name");
CREATE INDEX "products_category_idx"   ON "products" ("category");

-- ============================================================
-- Table: product_variants
-- ============================================================
CREATE TABLE "product_variants" (
  "id"        UUID        NOT NULL DEFAULT gen_random_uuid(),
  "productId" UUID        NOT NULL,
  "color"     "Color"     NOT NULL,
  "size"      "Size"      NOT NULL,
  "sku"       TEXT        NOT NULL,
  "stock"     INTEGER     NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "product_variants_pkey"  PRIMARY KEY ("id"),
  CONSTRAINT "product_variants_sku_key" UNIQUE ("sku"),
  CONSTRAINT "product_variants_productId_fkey"
    FOREIGN KEY ("productId")
    REFERENCES "products" ("id")
    ON DELETE CASCADE
);

CREATE INDEX "product_variants_productId_idx" ON "product_variants" ("productId");
CREATE INDEX "product_variants_color_idx"     ON "product_variants" ("color");
CREATE INDEX "product_variants_size_idx"      ON "product_variants" ("size");
CREATE INDEX "product_variants_sku_idx"       ON "product_variants" ("sku");
CREATE INDEX "product_variants_stock_idx"     ON "product_variants" ("stock");

-- ============================================================
-- Trigger: auto-update updatedAt
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "products_updated_at"
  BEFORE UPDATE ON "products"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "product_variants_updated_at"
  BEFORE UPDATE ON "product_variants"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
