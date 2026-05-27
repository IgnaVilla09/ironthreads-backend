-- Create PaymentMethod enum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'MERCADO_PAGO', 'OTRO');

-- Create inventory_items table
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variantId" UUID NOT NULL,
    "pointOfSaleId" UUID NOT NULL,
    "depositoId" UUID,
    "stock" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_items_variantId_pointOfSaleId_depositoId_key" UNIQUE ("variantId", "pointOfSaleId", "depositoId")
);

-- Create stock_transfers table
CREATE TABLE "stock_transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variantId" UUID NOT NULL,
    "fromPointOfSaleId" UUID NOT NULL,
    "fromDepositoId" UUID,
    "toPointOfSaleId" UUID NOT NULL,
    "toDepositoId" UUID,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- Create sales table
CREATE TABLE "sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pointOfSaleId" UUID,
    "depositoId" UUID,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "total" INTEGER NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- Create sale_items table
CREATE TABLE "sale_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "saleId" UUID NOT NULL,
    "variantId" UUID,
    "inventoryItemId" UUID,
    "productName" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "sizeName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys for inventory_items
ALTER TABLE "inventory_items"
ADD CONSTRAINT "inventory_items_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;

ALTER TABLE "inventory_items"
ADD CONSTRAINT "inventory_items_pointOfSaleId_fkey"
FOREIGN KEY ("pointOfSaleId") REFERENCES "points_of_sale"("id");

ALTER TABLE "inventory_items"
ADD CONSTRAINT "inventory_items_depositoId_fkey"
FOREIGN KEY ("depositoId") REFERENCES "depositos"("id");

-- Add foreign keys for stock_transfers
ALTER TABLE "stock_transfers"
ADD CONSTRAINT "stock_transfers_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "product_variants"("id");

ALTER TABLE "stock_transfers"
ADD CONSTRAINT "stock_transfers_fromPointOfSaleId_fkey"
FOREIGN KEY ("fromPointOfSaleId") REFERENCES "points_of_sale"("id");

ALTER TABLE "stock_transfers"
ADD CONSTRAINT "stock_transfers_toPointOfSaleId_fkey"
FOREIGN KEY ("toPointOfSaleId") REFERENCES "points_of_sale"("id");

-- Add foreign keys for sales
ALTER TABLE "sales"
ADD CONSTRAINT "sales_pointOfSaleId_fkey"
FOREIGN KEY ("pointOfSaleId") REFERENCES "points_of_sale"("id");

ALTER TABLE "sales"
ADD CONSTRAINT "sales_depositoId_fkey"
FOREIGN KEY ("depositoId") REFERENCES "depositos"("id");

-- Add foreign keys for sale_items
ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_saleId_fkey"
FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE;

ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "product_variants"("id");

ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_inventoryItemId_fkey"
FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id");

-- Create indexes for inventory_items
CREATE INDEX "inventory_items_variantId_idx" ON "inventory_items"("variantId");
CREATE INDEX "inventory_items_pointOfSaleId_idx" ON "inventory_items"("pointOfSaleId");
CREATE INDEX "inventory_items_depositoId_idx" ON "inventory_items"("depositoId");
CREATE INDEX "inventory_items_stock_idx" ON "inventory_items"("stock");

-- Create indexes for stock_transfers
CREATE INDEX "stock_transfers_createdAt_idx" ON "stock_transfers"("createdAt");
CREATE INDEX "stock_transfers_variantId_idx" ON "stock_transfers"("variantId");

-- Create indexes for sales
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");
CREATE INDEX "sales_pointOfSaleId_idx" ON "sales"("pointOfSaleId");
CREATE INDEX "sales_depositoId_idx" ON "sales"("depositoId");

-- Create indexes for sale_items
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");
CREATE INDEX "sale_items_variantId_idx" ON "sale_items"("variantId");
CREATE INDEX "sale_items_inventoryItemId_idx" ON "sale_items"("inventoryItemId");

-- ════════════════════════════════════════════════════════════════
-- DATA MIGRATION: Convert existing product stock to inventory_items
-- ════════════════════════════════════════════════════════════════

INSERT INTO "inventory_items" ("variantId", "pointOfSaleId", "depositoId", "stock")
SELECT
    pv."id",
    p."pointOfSaleId",
    p."depositoId",
    pv."stock"
FROM "product_variants" pv
INNER JOIN "products" p ON p."id" = pv."productId";

-- ════════════════════════════════════════════════════════════════
-- SCHEMA CLEANUP: Remove old location fields from products
-- ════════════════════════════════════════════════════════════════

-- Drop foreign key constraints
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_pointOfSaleId_fkey";
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_depositoId_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "products_pointOfSaleId_idx";
DROP INDEX IF EXISTS "products_depositoId_idx";

-- Drop columns
ALTER TABLE "products" DROP COLUMN "pointOfSaleId";
ALTER TABLE "products" DROP COLUMN "depositoId";

-- Remove stock from product_variants
DROP INDEX IF EXISTS "product_variants_stock_idx";
ALTER TABLE "product_variants" DROP COLUMN "stock";
