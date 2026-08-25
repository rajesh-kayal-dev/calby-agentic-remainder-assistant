-- Migration 012: Scheduler Enhancements (Durable Idempotency & Claim Locks)

-- 1. Add locking, retry, and attempt count tracking fields
ALTER TABLE notification_deliveries ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0;
ALTER TABLE notification_deliveries ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ NULL;
ALTER TABLE notification_deliveries ADD COLUMN IF NOT EXISTS lock_token TEXT NULL;
ALTER TABLE notification_deliveries ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ NULL;

-- 2. Add database-level uniqueness constraint for occurrence idempotency (reminder_id + scheduled_at)
ALTER TABLE notification_deliveries DROP CONSTRAINT IF EXISTS unq_reminder_occurrence;
ALTER TABLE notification_deliveries ADD CONSTRAINT unq_reminder_occurrence UNIQUE (reminder_id, scheduled_at);

-- 3. Add scheduler claim and stale recovery indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_claim ON notification_deliveries(status, scheduled_at, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_stale ON notification_deliveries(status, locked_at) WHERE status = 'processing';
