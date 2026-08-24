CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    workspace_id TEXT DEFAULT 'default',
    title TEXT NOT NULL DEFAULT 'New Chat',
    provider_id TEXT,
    model TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    auth_user_id TEXT NOT NULL REFERENCES users(auth_user_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    provider_id TEXT,
    model TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    sequence INT NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_last_msg ON conversations(auth_user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_seq ON messages(conversation_id, sequence ASC, created_at ASC);
