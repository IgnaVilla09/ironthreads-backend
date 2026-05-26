CREATE TABLE IF NOT EXISTS "depositos" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pointOfSaleId" UUID NOT NULL REFERENCES "points_of_sale"("id") ON DELETE CASCADE,
    CONSTRAINT "depositos_name_pointOfSaleId_key" UNIQUE ("name", "pointOfSaleId")
);

CREATE INDEX IF NOT EXISTS "depositos_pointOfSaleId_idx" ON "depositos"("pointOfSaleId");
CREATE INDEX IF NOT EXISTS "depositos_name_idx" ON "depositos"("name");

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "depositoId" UUID REFERENCES "depositos"("id");
CREATE INDEX IF NOT EXISTS "products_depositoId_idx" ON "products"("depositoId");
