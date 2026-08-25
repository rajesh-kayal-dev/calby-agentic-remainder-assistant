-- Migration 014: WhatsApp Business Foundation Table & Constraints

CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    phone_number_id TEXT NOT NULL,
    business_account_id TEXT NULL,
    display_phone_number TEXT NULL,
    encrypted_access_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_whatsapp_auth_user UNIQUE (auth_user_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conn_user ON whatsapp_connections(auth_user_id);
