-- Migration 016: Contacts & Reminder Recipient Support

-- 1. Create Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NULL,
    phone_number TEXT NULL,
    telegram_id TEXT NULL,
    notes TEXT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(auth_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_name_search ON contacts(auth_user_id, LOWER(name));

-- 2. Add recipient_id to reminders table
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS recipient_id UUID NULL REFERENCES contacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_recipient ON reminders(recipient_id) WHERE recipient_id IS NOT NULL;
