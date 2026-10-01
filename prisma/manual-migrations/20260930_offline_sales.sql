ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "client_request_id" UUID;
CREATE UNIQUE INDEX IF NOT EXISTS "sales_client_request_id_key" ON "sales"("client_request_id");
