CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    recipient_id UUID NULL REFERENCES contacts(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    report_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    channel TEXT NOT NULL,
    schedule_definition JSONB NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    next_run_at TIMESTAMPTZ NOT NULL,
    last_run_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user ON scheduled_reports(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_enabled_next ON scheduled_reports(enabled, next_run_at);
