-- Migration 018: Google OAuth and Gmail Notification Channel

CREATE TABLE IF NOT EXISTS google_oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    google_sub TEXT,
    encrypted_refresh_token TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_google_oauth_user UNIQUE (auth_user_id)
);

CREATE INDEX IF NOT EXISTS idx_google_oauth_user ON google_oauth_connections(auth_user_id);
