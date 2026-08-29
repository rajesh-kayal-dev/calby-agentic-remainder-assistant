-- Migration 027: Nango-backed generic user integrations model
--
-- Stores the mapping between a Calby user and their Nango OAuth connections.
-- For OAuth providers (Google, Notion, Slack, Teams), tokens live in Nango.
-- For API-key providers (WhatsApp, Telegram), existing tables remain authoritative.

CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    nango_connection_id TEXT,
    nango_integration_id TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected'
        CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
    metadata JSONB DEFAULT '{}'::jsonb,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_user_integration UNIQUE (auth_user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user ON user_integrations(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(auth_user_id, provider);
