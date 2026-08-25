-- Migration 013: Telegram Connection & One-Time Tokens

-- 1. Extend connections table to support 'telegram' provider and metadata/chat_id
ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_provider_check;
ALTER TABLE connections ADD CONSTRAINT connections_provider_check CHECK (provider IN ('calendar', 'telegram', 'gmail', 'whatsapp'));

ALTER TABLE connections ADD COLUMN IF NOT EXISTS provider_user_id TEXT NULL;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add uniqueness constraint to prevent chat_id hijacking across accounts
CREATE UNIQUE INDEX IF NOT EXISTS unq_connections_provider_user ON connections(provider, provider_user_id) WHERE provider_user_id IS NOT NULL;

-- 3. One-time Telegram connection tokens for secure bot authorization
CREATE TABLE IF NOT EXISTS telegram_connection_tokens (
    token TEXT PRIMARY KEY,
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tg_tokens_user ON telegram_connection_tokens(auth_user_id);
