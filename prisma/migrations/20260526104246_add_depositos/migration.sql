-- Create depositos table
CREATE TABLE "depositos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pointOfSaleId" UUID NOT NULL,
    CONSTRAINT "depositos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "depositos_name_pointOfSaleId_key" UNIQUE ("name", "pointOfSaleId")
);

-- Add foreign key and indexes for depositos
ALTER TABLE "depositos"
ADD CONSTRAINT "depositos_pointOfSaleId_fkey"
FOREIGN KEY ("pointOfSaleId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE;

CREATE INDEX "depositos_pointOfSaleId_idx" ON "depositos"("pointOfSaleId");
CREATE INDEX "depositos_name_idx" ON "depositos"("name");

-- Add depositoId column to products (nullable)
ALTER TABLE "products" ADD COLUMN "depositoId" UUID;

-- Add foreign key and index
ALTER TABLE "products"
ADD CONSTRAINT "products_depositoId_fkey"
FOREIGN KEY ("depositoId") REFERENCES "depositos"("id");

CREATE INDEX "products_depositoId_idx" ON "products"("depositoId");
