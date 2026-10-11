CREATE TABLE "email_send_logs" (
  "id" UUID PRIMARY KEY,
  "type" VARCHAR(16) NOT NULL,
  "recipient" TEXT,
  "recipient_count" INTEGER NOT NULL,
  "suppressed_count" INTEGER NOT NULL DEFAULT 0,
  "subject" TEXT NOT NULL,
  "provider_id" TEXT,
  "sent_by_id" UUID NOT NULL REFERENCES "app_users"("id") ON DELETE RESTRICT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "email_send_logs_created_at_idx" ON "email_send_logs"("created_at" DESC);
