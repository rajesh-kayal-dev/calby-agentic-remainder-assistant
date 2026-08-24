import { getPool } from "../db/pool.js";

export type ConversationRow = {
  id: string;
  auth_user_id: string;
  workspace_id: string;
  title: string;
  provider_id: string | null;
  model: string | null;
  status: string;
  is_pinned: boolean;
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
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  auth_user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider_id: string | null;
  model: string | null;
  status: string;
  sequence: number;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type MessageDTO = {
  id: string;
  conversationId: string;
  authUserId: string;
  role: "user" | "assistant" | "system";
  content: string;
  providerId: string | null;
  model: string | null;
  status: string;
  sequence: number;
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
    content: row.content,
    providerId: row.provider_id,
    model: row.model,
    status: row.status,
    sequence: row.sequence,
    metadata: row.metadata || {},
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
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
    lastMessageAt?: Date;
    isPinned?: boolean;
  },
): Promise<ConversationDTO | null> {
  const result = await getPool().query<ConversationRow>(
    `
    UPDATE conversations
    SET
      title = COALESCE($1, title),
      provider_id = COALESCE($2, provider_id),
      model = COALESCE($3, model),
      last_message_at = COALESCE($4, last_message_at),
      is_pinned = COALESCE($5, is_pinned),
      updated_at = NOW()
    WHERE id = $6 AND auth_user_id = $7
    RETURNING *
    `,
    [
      updates.title ?? null,
      updates.providerId ?? null,
      updates.model ?? null,
      updates.lastMessageAt ?? null,
      updates.isPinned !== undefined ? updates.isPinned : null,
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
  role: "user" | "assistant" | "system";
  content: string;
  providerId?: string;
  model?: string;
  status?: string;
  sequence?: number;
}): Promise<MessageDTO> {
  // Determine sequence number if not provided
  let seq = input.sequence;
  if (!seq) {
    const seqResult = await getPool().query<{ max_seq: number }>(
      `SELECT COALESCE(MAX(sequence), 0) as max_seq FROM messages WHERE conversation_id = $1`,
      [input.conversationId],
    );
    seq = (seqResult.rows[0]?.max_seq || 0) + 1;
  }

  const result = await getPool().query<MessageRow>(
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
      sequence
    )
    VALUES (
      COALESCE($1, gen_random_uuid()),
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9
    )
    RETURNING *
    `,
    [
      input.id || null,
      input.conversationId,
      input.authUserId,
      input.role,
      input.content,
      input.providerId || null,
      input.model || null,
      input.status || "completed",
      seq,
    ],
  );

  // Update conversation last_message_at
  await getPool().query(
    `UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [input.conversationId],
  );

  return sanitizeMessageRow(result.rows[0]);
}

export async function updateMessage(
  authUserId: string,
  messageId: string,
  updates: {
    content?: string;
    status?: string;
    providerId?: string;
    model?: string;
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
      updated_at = NOW()
    WHERE id = $5 AND auth_user_id = $6
    RETURNING *
    `,
    [
      updates.content ?? null,
      updates.status ?? null,
      updates.providerId ?? null,
      updates.model ?? null,
      messageId,
      authUserId,
    ],
  );

  return result.rows[0] ? sanitizeMessageRow(result.rows[0]) : null;
}
