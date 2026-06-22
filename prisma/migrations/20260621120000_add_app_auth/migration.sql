CREATE TABLE "app_users" (
  "id" UUID NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "admin_api_key_encrypted" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_sessions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_users_username_key" ON "app_users"("username");
CREATE INDEX "app_users_username_idx" ON "app_users"("username");
CREATE UNIQUE INDEX "app_sessions_token_hash_key" ON "app_sessions"("token_hash");
CREATE INDEX "app_sessions_user_id_idx" ON "app_sessions"("user_id");
CREATE INDEX "app_sessions_expires_at_idx" ON "app_sessions"("expires_at");

ALTER TABLE "app_sessions"
  ADD CONSTRAINT "app_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
