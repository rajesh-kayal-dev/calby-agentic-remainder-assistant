-- Migration 024: Production-ready Calby Calendar Events & Reminders

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    category TEXT NOT NULL DEFAULT 'work' CHECK (category IN ('work', 'meeting', 'personal', 'focus', 'other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT false,
    recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
    remind_minutes_before INTEGER DEFAULT 15,
    attendees JSONB DEFAULT '[]'::jsonb,
    google_event_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_range ON calendar_events(auth_user_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_category ON calendar_events(auth_user_id, category);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON calendar_events(auth_user_id, google_event_id) WHERE google_event_id IS NOT NULL;
