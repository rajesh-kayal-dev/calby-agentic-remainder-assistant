-- Migration 019: Task and Task List Foundation

-- 1. Create Task Lists Table
CREATE TABLE IF NOT EXISTS task_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for User + List
CREATE INDEX IF NOT EXISTS idx_task_lists_user ON task_lists(auth_user_id);

-- 2. Create Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    task_list_id UUID NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns and strict isolation
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(auth_user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_list ON tasks(auth_user_id, task_list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(auth_user_id, due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_contact ON tasks(auth_user_id, contact_id) WHERE contact_id IS NOT NULL;
