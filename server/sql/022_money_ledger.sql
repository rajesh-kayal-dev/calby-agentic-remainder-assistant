-- Migration 022: Money Ledger & Payments

CREATE TABLE IF NOT EXISTS ledger_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('receivable', 'payable')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'cancelled')),
    original_amount NUMERIC(12, 2) NOT NULL CHECK (original_amount > 0),
    remaining_amount NUMERIC(12, 2) NOT NULL CHECK (remaining_amount >= 0),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    reminder_id UUID REFERENCES reminders(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ NULL,
    paid_at TIMESTAMPTZ NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_remaining_amount CHECK (remaining_amount <= original_amount)
);

CREATE TABLE IF NOT EXISTS ledger_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    ledger_item_id UUID NOT NULL REFERENCES ledger_items(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL,
    notes TEXT NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_items_user_contact ON ledger_items(auth_user_id, contact_id, status);
CREATE INDEX IF NOT EXISTS idx_ledger_items_user_direction ON ledger_items(auth_user_id, direction, status);
CREATE INDEX IF NOT EXISTS idx_ledger_payments_item ON ledger_payments(ledger_item_id);
