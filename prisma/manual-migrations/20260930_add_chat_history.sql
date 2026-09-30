-- Migración aditiva para bases existentes que gestionan cambios de esquema manualmente.
CREATE TABLE "chat_conversations" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "client_id" VARCHAR(128) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
  "id" UUID NOT NULL,
  "sequence" BIGSERIAL NOT NULL,
  "conversation_id" UUID NOT NULL,
  "turn_id" UUID NOT NULL,
  "role" VARCHAR(16) NOT NULL,
  "content" TEXT NOT NULL,
  "tool_context" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_conversations_user_id_client_id_key" ON "chat_conversations"("user_id", "client_id");
CREATE UNIQUE INDEX "chat_messages_sequence_key" ON "chat_messages"("sequence");
CREATE INDEX "chat_messages_conversation_id_sequence_idx" ON "chat_messages"("conversation_id", "sequence");

ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
