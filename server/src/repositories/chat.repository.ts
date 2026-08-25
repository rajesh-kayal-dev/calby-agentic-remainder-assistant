import { getPool } from "../db/pool.js";
import { NormalizedToolCall, ChatMessage } from "../services/llm/llm-provider.interface.js";

export type ConversationRow = {
  id: string;
  auth_user_id: string;
  workspace_id: string;
  title: string;
  provider_id: string | null;
  model: string | null;
  status: string;
  is_pinned: boolean;
  pending_confirmation: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  last_message_at: Date;
};

export type ConversationDTO = {
  id: string;
  authUserId: string;
  workspaceId: string;
  title: string;
  providerId: string | null;
  model: string | null;
  status: string;
  isPinned: boolean;
  pendingConfirmation?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  auth_user_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  provider_id: string | null;
  model: string | null;
  status: string;
  sequence: number;
  tool_call_id: string | null;
  tool_name: string | null;
  tool_calls: NormalizedToolCall[] | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type MessageDTO = {
  id: string;
  conversationId: string;
  authUserId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  providerId: string | null;
  model: string | null;
  status: string;
  sequence: number;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: NormalizedToolCall[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export function sanitizeConversationRow(row: ConversationRow): ConversationDTO {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    workspaceId: row.workspace_id,
    title: row.title,
    providerId: row.provider_id,
    model: row.model,
    status: row.status,
    isPinned: row.is_pinned ?? false,
    pendingConfirmation: row.pending_confirmation || undefined,
    metadata: row.metadata || {},
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    lastMessageAt: row.last_message_at.toISOString(),
  };
}

export function sanitizeMessageRow(row: MessageRow): MessageDTO {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authUserId: row.auth_user_id,
    role: row.role,
    content: row.content || "",
    providerId: row.provider_id,
    model: row.model,
    status: row.status,
    sequence: row.sequence,
    toolCallId: row.tool_call_id || undefined,
    toolName: row.tool_name || undefined,
    toolCalls: row.tool_calls || undefined,
    metadata: row.metadata || {},
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function reconstructChatMessagesHistory(messages: MessageDTO[]): ChatMessage[] {
  return messages.map((m) => {
    if (m.role === "tool") {
      return {
        role: "tool",
        toolCallId: m.toolCallId,
        name: m.toolName,
        content: m.content,
      };
    }
    if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
      return {
        role: "assistant",
        content: m.content || null,
        toolCalls: m.toolCalls,
      };
    }
    return {
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    };
  });
}

export async function listUserConversations(
  authUserId: string,
  limit = 50,
  offset = 0,
): Promise<ConversationDTO[]> {
  const result = await getPool().query<ConversationRow>(
    `
    SELECT * FROM conversations
    WHERE auth_user_id = $1
    ORDER BY is_pinned DESC, last_message_at DESC
    LIMIT $2 OFFSET $3
    `,
    [authUserId, limit, offset],
  );

  return result.rows.map(sanitizeConversationRow);
}

export async function getConversationById(
  authUserId: string,
  conversationId: string,
): Promise<ConversationRow | null> {
  const result = await getPool().query<ConversationRow>(
    `
    SELECT * FROM conversations
    WHERE id = $1 AND auth_user_id = $2
    `,
    [conversationId, authUserId],
  );

  return result.rows[0] || null;
}

export async function getOrCreateConversation(input: {
  id: string;
  authUserId: string;
  title: string;
  providerId?: string;
  model?: string;
}): Promise<ConversationRow> {
  const existing = await getConversationById(input.authUserId, input.id);
  if (existing) return existing;

  const result = await getPool().query<ConversationRow>(
    `
    INSERT INTO conversations (id, auth_user_id, title, provider_id, model)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
    RETURNING *
    `,
    [
      input.id,
      input.authUserId,
      input.title || "New Chat",
      input.providerId || null,
      input.model || null,
    ],
  );

  return result.rows[0];
}

export async function updateConversation(
  authUserId: string,
  conversationId: string,
  updates: {
    title?: string;
    providerId?: string;
    model?: string;
    status?: string;
    lastMessageAt?: Date;
    isPinned?: boolean;
    pendingConfirmation?: Record<string, unknown> | null;
  },
): Promise<ConversationDTO | null> {
  const result = await getPool().query<ConversationRow>(
    `
    UPDATE conversations
    SET
      title = COALESCE($1, title),
      provider_id = COALESCE($2, provider_id),
      model = COALESCE($3, model),
      status = COALESCE($4, status),
      last_message_at = COALESCE($5, last_message_at),
      is_pinned = COALESCE($6, is_pinned),
      pending_confirmation = CASE WHEN $7::boolean THEN $8::jsonb ELSE pending_confirmation END,
      updated_at = NOW()
    WHERE id = $9 AND auth_user_id = $10
    RETURNING *
    `,
    [
      updates.title ?? null,
      updates.providerId ?? null,
      updates.model ?? null,
      updates.status ?? null,
      updates.lastMessageAt ?? null,
      updates.isPinned !== undefined ? updates.isPinned : null,
      updates.pendingConfirmation !== undefined,
      updates.pendingConfirmation ? JSON.stringify(updates.pendingConfirmation) : null,
      conversationId,
      authUserId,
    ],
  );

  return result.rows[0] ? sanitizeConversationRow(result.rows[0]) : null;
}

export async function deleteConversation(
  authUserId: string,
  conversationId: string,
): Promise<boolean> {
  const result = await getPool().query(
    `
    DELETE FROM conversations
    WHERE id = $1 AND auth_user_id = $2
    `,
    [conversationId, authUserId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getConversationMessages(
  authUserId: string,
  conversationId: string,
): Promise<MessageDTO[]> {
  const result = await getPool().query<MessageRow>(
    `
    SELECT * FROM messages
    WHERE conversation_id = $1 AND auth_user_id = $2
    ORDER BY sequence ASC, created_at ASC
    `,
    [conversationId, authUserId],
  );

  return result.rows.map(sanitizeMessageRow);
}

export async function createMessage(input: {
  id?: string;
  conversationId: string;
  authUserId: string;
  role: "user" | "assistant" | "system" | "tool";
  content?: string | null;
  providerId?: string;
  model?: string;
  status?: string;
  sequence?: number;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: NormalizedToolCall[];
  metadata?: Record<string, unknown>;
}): Promise<MessageDTO> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock conversation row for safe sequence calculation
    await client.query(
      `SELECT id FROM conversations WHERE id = $1 AND auth_user_id = $2 FOR UPDATE`,
      [input.conversationId, input.authUserId],
    );

    let seq = input.sequence;
    if (!seq) {
      const seqResult = await client.query<{ max_seq: number }>(
        `SELECT COALESCE(MAX(sequence), 0) as max_seq FROM messages WHERE conversation_id = $1`,
        [input.conversationId],
      );
      seq = (seqResult.rows[0]?.max_seq || 0) + 1;
    }

    const result = await client.query<MessageRow>(
      `
      INSERT INTO messages (
        id,
        conversation_id,
        auth_user_id,
        role,
        content,
        provider_id,
        model,
        status,
        sequence,
        tool_call_id,
        tool_name,
        tool_calls,
        metadata
      )
      VALUES (
        COALESCE($1, gen_random_uuid()),
        $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        status = EXCLUDED.status,
        tool_calls = EXCLUDED.tool_calls,
        updated_at = NOW()
      RETURNING *
      `,
      [
        input.id || null,
        input.conversationId,
        input.authUserId,
        input.role,
        input.content ?? "",
        input.providerId || null,
        input.model || null,
        input.status || "completed",
        seq,
        input.toolCallId || null,
        input.toolName || null,
        input.toolCalls ? JSON.stringify(input.toolCalls) : null,
        JSON.stringify(input.metadata || {}),
      ],
    );

    await client.query(
      `UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [input.conversationId],
    );

    await client.query("COMMIT");
    return sanitizeMessageRow(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateMessage(
  authUserId: string,
  messageId: string,
  updates: {
    content?: string;
    status?: string;
    providerId?: string;
    model?: string;
    toolCalls?: NormalizedToolCall[];
  },
): Promise<MessageDTO | null> {
  const result = await getPool().query<MessageRow>(
    `
    UPDATE messages
    SET
      content = COALESCE($1, content),
      status = COALESCE($2, status),
      provider_id = COALESCE($3, provider_id),
      model = COALESCE($4, model),
      tool_calls = CASE WHEN $5::boolean THEN $6::jsonb ELSE tool_calls END,
      updated_at = NOW()
    WHERE id = $7 AND auth_user_id = $8
    RETURNING *
    `,
    [
      updates.content ?? null,
      updates.status ?? null,
      updates.providerId ?? null,
      updates.model ?? null,
      updates.toolCalls !== undefined,
      updates.toolCalls ? JSON.stringify(updates.toolCalls) : null,
      messageId,
      authUserId,
    ],
  );

  return result.rows[0] ? sanitizeMessageRow(result.rows[0]) : null;
}

