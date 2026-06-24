-- CreateEnum
CREATE TYPE "catalog_order_status" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_REPORTED', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'OUT_OF_STOCK');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "image_url" TEXT,
ADD COLUMN "price" INTEGER;

-- CreateTable
CREATE TABLE "catalog_orders" (
    "id" UUID NOT NULL,
    "point_of_sale_id" UUID NOT NULL,
    "sale_id" UUID,
    "status" "catalog_order_status" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "customer_first_name" TEXT NOT NULL,
    "customer_last_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "total" INTEGER NOT NULL,
    "notes" TEXT,
    "whatsapp_proof_sent" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "color_name_snapshot" TEXT NOT NULL,
    "size_name_snapshot" TEXT NOT NULL,
    "unit_price_snapshot" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_orders_sale_id_key" ON "catalog_orders"("sale_id");

-- CreateIndex
CREATE INDEX "catalog_orders_status_idx" ON "catalog_orders"("status");

-- CreateIndex
CREATE INDEX "catalog_orders_point_of_sale_id_idx" ON "catalog_orders"("point_of_sale_id");

-- CreateIndex
CREATE INDEX "catalog_orders_created_at_idx" ON "catalog_orders"("created_at");

-- CreateIndex
CREATE INDEX "catalog_orders_status_created_at_idx" ON "catalog_orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "catalog_order_items_order_id_idx" ON "catalog_order_items"("order_id");

-- CreateIndex
CREATE INDEX "catalog_order_items_product_id_idx" ON "catalog_order_items"("product_id");

-- CreateIndex
CREATE INDEX "catalog_order_items_variant_id_idx" ON "catalog_order_items"("variant_id");

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_fromDepositoId_fkey" FOREIGN KEY ("fromDepositoId") REFERENCES "depositos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_toDepositoId_fkey" FOREIGN KEY ("toDepositoId") REFERENCES "depositos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_orders" ADD CONSTRAINT "catalog_orders_point_of_sale_id_fkey" FOREIGN KEY ("point_of_sale_id") REFERENCES "points_of_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_orders" ADD CONSTRAINT "catalog_orders_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_order_items" ADD CONSTRAINT "catalog_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "catalog_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_order_items" ADD CONSTRAINT "catalog_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_order_items" ADD CONSTRAINT "catalog_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
