-- Create lookup tables
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categories_name_key" UNIQUE ("name")
);

CREATE TABLE "colors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "hex" TEXT,
    CONSTRAINT "colors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "colors_name_key" UNIQUE ("name")
);

CREATE TABLE "sizes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "sizes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sizes_name_key" UNIQUE ("name")
);

-- Seed lookup tables from enum values
INSERT INTO "categories" (name, label) VALUES
    ('REMERA', 'Remera'),
    ('PANTALON', 'Pantalón'),
    ('BUZO', 'Buzo'),
    ('CAMPERA', 'Campera'),
    ('CAMISA', 'Camisa'),
    ('MUSCULOSA', 'Musculosa'),
    ('SHORT', 'Short'),
    ('BERMUDA', 'Bermuda'),
    ('ACCESORIO', 'Accesorio');

INSERT INTO "colors" (name, label, hex) VALUES
    ('NEGRO', 'Negro', '#000000'),
    ('BLANCO', 'Blanco', '#FFFFFF'),
    ('GRIS', 'Gris', '#808080'),
    ('AZUL', 'Azul', '#0066CC'),
    ('ROJO', 'Rojo', '#CC0000'),
    ('VERDE', 'Verde', '#009933'),
    ('AMARILLO', 'Amarillo', '#FFCC00'),
    ('ROSA', 'Rosa', '#FF66B2'),
    ('VIOLETA', 'Violeta', '#6600CC'),
    ('NARANJA', 'Naranja', '#FF6600'),
    ('MARRON', 'Marrón', '#663300');

INSERT INTO "sizes" (name, label) VALUES
    ('XS', 'XS'),
    ('S', 'S'),
    ('M', 'M'),
    ('L', 'L'),
    ('XL', 'XL'),
    ('XXL', 'XXL'),
    ('XXXL', 'XXXL');

-- Add FK columns (nullable first, then fill, then make NOT NULL)
ALTER TABLE "products" ADD COLUMN "categoryId" UUID;

UPDATE "products"
SET "categoryId" = "categories"."id"
FROM "categories"
WHERE "categories"."name" = "products"."category"::text;

ALTER TABLE "products" ALTER COLUMN "categoryId" SET NOT NULL;

ALTER TABLE "product_variants" ADD COLUMN "colorId" UUID;
ALTER TABLE "product_variants" ADD COLUMN "sizeId" UUID;

UPDATE "product_variants"
SET "colorId" = "colors"."id"
FROM "colors"
WHERE "colors"."name" = "product_variants"."color"::text;

UPDATE "product_variants"
SET "sizeId" = "sizes"."id"
FROM "sizes"
WHERE "sizes"."name" = "product_variants"."size"::text;

ALTER TABLE "product_variants" ALTER COLUMN "colorId" SET NOT NULL;
ALTER TABLE "product_variants" ALTER COLUMN "sizeId" SET NOT NULL;

-- Add foreign keys
ALTER TABLE "products"
ADD CONSTRAINT "products_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "categories"("id");

ALTER TABLE "product_variants"
ADD CONSTRAINT "product_variants_colorId_fkey"
FOREIGN KEY ("colorId") REFERENCES "colors"("id");

ALTER TABLE "product_variants"
ADD CONSTRAINT "product_variants_sizeId_fkey"
FOREIGN KEY ("sizeId") REFERENCES "sizes"("id");

-- Drop old enum columns
ALTER TABLE "products" DROP COLUMN "category";
ALTER TABLE "product_variants" DROP COLUMN "color";
ALTER TABLE "product_variants" DROP COLUMN "size";

-- Drop enum types
DROP TYPE IF EXISTS "Category";
DROP TYPE IF EXISTS "Color";
DROP TYPE IF EXISTS "Size";

-- Create indexes
CREATE INDEX "categories_name_idx" ON "categories"("name");
CREATE INDEX "colors_name_idx" ON "colors"("name");
CREATE INDEX "sizes_name_idx" ON "sizes"("name");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "product_variants_colorId_idx" ON "product_variants"("colorId");
CREATE INDEX "product_variants_sizeId_idx" ON "product_variants"("sizeId");
