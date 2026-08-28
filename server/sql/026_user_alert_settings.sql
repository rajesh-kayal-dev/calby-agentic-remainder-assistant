-- 026_user_alert_settings.sql
-- Add Alert & Notification Settings columns to user_preferences

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS alerts_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_calendar BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_tasks BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_followups BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_reminder_minutes INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS alert_sound VARCHAR(50) DEFAULT 'calby_bell',
  ADD COLUMN IF NOT EXISTS alert_volume INTEGER DEFAULT 70,
  ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_hours_start VARCHAR(10) DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS quiet_hours_end VARCHAR(10) DEFAULT '07:00';
