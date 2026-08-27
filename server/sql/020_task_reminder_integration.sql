-- Migration 020: Link Tasks and Reminders

ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id) WHERE task_id IS NOT NULL;
