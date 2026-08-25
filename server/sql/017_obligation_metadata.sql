-- Migration 017: Smart Obligations and Structured Metadata Support

-- 1. Add obligation_type and obligation_metadata columns to reminders table
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS obligation_type TEXT NOT NULL DEFAULT 'custom';
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS obligation_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Index for filtering and searching obligations by user & type
CREATE INDEX IF NOT EXISTS idx_reminders_obligation ON reminders(auth_user_id, obligation_type, due_at ASC);
