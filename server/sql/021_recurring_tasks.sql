-- Migration 021: Recurring Tasks Support

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT DEFAULT 'none' CHECK (recurrence_rule IN ('none', 'daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS next_occurrence_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_user_recurrence ON tasks(auth_user_id, next_occurrence_at) WHERE recurrence_rule != 'none';
