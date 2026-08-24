CREATE TABLE IF NOT EXISTS user_llm_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL,
    encrypted_credentials TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    selected_model TEXT,
    status TEXT NOT NULL DEFAULT 'untested',
    is_default BOOLEAN NOT NULL DEFAULT false,
    last_tested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_conn_user ON user_llm_connections(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_llm_conn_user_provider ON user_llm_connections(auth_user_id, provider_id);
