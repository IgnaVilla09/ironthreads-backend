-- Create points of sale table
CREATE TABLE "points_of_sale" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "points_of_sale_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "points_of_sale_name_key" UNIQUE ("name")
);

-- Seed default "Departamento" point of sale
INSERT INTO "points_of_sale" (name, label) VALUES ('DEPARTAMENTO', 'Departamento');

-- Add pointOfSaleId column to products (nullable initially)
ALTER TABLE "products" ADD COLUMN "pointOfSaleId" UUID;

-- Assign all existing products to "Departamento"
UPDATE "products"
SET "pointOfSaleId" = "points_of_sale"."id"
FROM "points_of_sale"
WHERE "points_of_sale"."name" = 'DEPARTAMENTO';

-- Make the column NOT NULL
ALTER TABLE "products" ALTER COLUMN "pointOfSaleId" SET NOT NULL;

-- Add foreign key and index
ALTER TABLE "products"
ADD CONSTRAINT "products_pointOfSaleId_fkey"
FOREIGN KEY ("pointOfSaleId") REFERENCES "points_of_sale"("id");

CREATE INDEX "products_pointOfSaleId_idx" ON "products"("pointOfSaleId");
