ALTER TYPE "payment_method" ADD VALUE IF NOT EXISTS 'MOBBEX';

ALTER TABLE "sales"
  ADD COLUMN IF NOT EXISTS "payment_status" TEXT NOT NULL DEFAULT 'PAID',
  ADD COLUMN IF NOT EXISTS "customer_name" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_email" TEXT;

CREATE TABLE IF NOT EXISTS "sale_payments" (
  "id" UUID NOT NULL,
  "sale_id" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "reference" TEXT NOT NULL,
  "external_payment_id" TEXT,
  "qr_payload" JSONB,
  "provider_payload" JSONB,
  "expires_at" TIMESTAMP(3),
  "paid_at" TIMESTAMP(3),
  "receipt_status" TEXT NOT NULL DEFAULT 'PENDING',
  "receipt_provider_id" TEXT,
  "receipt_sent_at" TIMESTAMP(3),
  "receipt_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "sale_payments_reference_key" ON "sale_payments"("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "sale_payments_external_payment_id_key" ON "sale_payments"("external_payment_id");
CREATE INDEX IF NOT EXISTS "sales_payment_status_idx" ON "sales"("payment_status");
CREATE INDEX IF NOT EXISTS "sale_payments_sale_id_idx" ON "sale_payments"("sale_id");
CREATE INDEX IF NOT EXISTS "sale_payments_status_idx" ON "sale_payments"("status");
