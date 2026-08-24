CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT UNIQUE NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark',
    default_calendar_id TEXT NOT NULL DEFAULT 'primary',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    time_format TEXT NOT NULL DEFAULT '24h',
    daily_briefing BOOLEAN NOT NULL DEFAULT true,
    event_reminder BOOLEAN NOT NULL DEFAULT true,
    reminder_minutes INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
