CREATE TABLE "email_suppressions" (
  "id" UUID PRIMARY KEY,
  "email" TEXT NOT NULL,
  "reason" TEXT,
  "created_by_id" UUID NOT NULL REFERENCES "app_users"("id") ON DELETE RESTRICT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "email_suppressions_email_key" UNIQUE ("email")
);

CREATE INDEX "email_suppressions_email_idx" ON "email_suppressions"("email");
