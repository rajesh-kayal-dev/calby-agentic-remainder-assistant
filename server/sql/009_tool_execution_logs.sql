CREATE TABLE IF NOT EXISTS tool_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    conversation_id UUID,
    tool_id TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INT NOT NULL DEFAULT 0,
    error_code TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_logs_user_date ON tool_execution_logs(auth_user_id, created_at DESC);
