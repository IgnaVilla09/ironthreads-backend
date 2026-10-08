-- Apply once, before starting backend 2.2.0. Does not change historical prices.
BEGIN;
ALTER TABLE "sales" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "sales" ADD COLUMN "edited_at" TIMESTAMP(3);
CREATE TABLE "sale_edits" (
  "id" UUID NOT NULL PRIMARY KEY,
  "sale_id" UUID NOT NULL REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "request_id" UUID NOT NULL UNIQUE,
  "request_hash" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "actor_id" UUID NOT NULL,
  "actor_name" TEXT NOT NULL,
  "reason" TEXT NOT NULL CHECK (length(btrim("reason")) > 0),
  "before" JSONB NOT NULL,
  "after" JSONB NOT NULL,
  "movements" JSONB NOT NULL,
  "regularization" INTEGER NOT NULL,
  "difference" INTEGER NOT NULL,
  "payment_method" "payment_method",
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sale_edits_settlement_check" CHECK (("difference" = 0 AND "payment_method" IS NULL) OR ("difference" <> 0 AND "payment_method" IS NOT NULL))
);
CREATE UNIQUE INDEX "sale_edits_sale_id_revision_key" ON "sale_edits"("sale_id", "revision");
CREATE INDEX "sale_edits_created_at_idx" ON "sale_edits"("created_at");
COMMIT;
