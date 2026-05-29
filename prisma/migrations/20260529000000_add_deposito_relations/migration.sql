-- Add foreign key constraints for stock_transfers deposito references
ALTER TABLE "stock_transfers"
ADD CONSTRAINT "stock_transfers_fromDepositoId_fkey"
FOREIGN KEY ("fromDepositoId") REFERENCES "depositos"("id");

ALTER TABLE "stock_transfers"
ADD CONSTRAINT "stock_transfers_toDepositoId_fkey"
FOREIGN KEY ("toDepositoId") REFERENCES "depositos"("id");

-- Add indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS "stock_transfers_fromDepositoId_idx" ON "stock_transfers"("fromDepositoId");
CREATE INDEX IF NOT EXISTS "stock_transfers_toDepositoId_idx" ON "stock_transfers"("toDepositoId");
