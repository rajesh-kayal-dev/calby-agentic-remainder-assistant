-- Migration 010: Durable Chat & Native Tool Call Persistence Enhancements

-- 1. Update role constraint to support 'tool' role
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_role_check;
ALTER TABLE messages ADD CONSTRAINT messages_role_check CHECK (role IN ('user', 'assistant', 'system', 'tool'));

-- 2. Add native tool call and tool result fields
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_call_id TEXT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_name TEXT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_calls JSONB NULL;

-- 3. Add structured pending confirmation state to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS pending_confirmation JSONB NULL;

-- 4. Add index for tool call lookup
CREATE INDEX IF NOT EXISTS idx_messages_tool_call_id ON messages(tool_call_id) WHERE tool_call_id IS NOT NULL;
