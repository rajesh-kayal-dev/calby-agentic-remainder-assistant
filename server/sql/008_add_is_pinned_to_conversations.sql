ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversations_user_pinned ON conversations(auth_user_id, is_pinned DESC, last_message_at DESC);
