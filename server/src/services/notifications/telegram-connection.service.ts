import crypto from "crypto";
import { getPool } from "../../db/pool.js";

export interface TelegramConnectionInfo {
  connected: boolean;
  status: "connected" | "disconnected" | "pending";
  chatId?: string | null;
  username?: string | null;
}

export async function createTelegramConnectionToken(
  authUserId: string,
  ttlMinutes = 10,
): Promise<{ token: string; botUrl: string; expiresAt: Date }> {
  const token = `tg_${crypto.randomBytes(12).toString("hex")}`;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await getPool().query(
    `
    INSERT INTO telegram_connection_tokens (token, auth_user_id, expires_at)
    VALUES ($1, $2, $3)
    `,
    [token, authUserId, expiresAt],
  );

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "CalbyAssistantBot";
  const botUrl = `https://t.me/${botUsername}?start=${token}`;

  return { token, botUrl, expiresAt };
}

export async function processTelegramWebhookStart(input: {
  chatId: string;
  startToken: string;
  username?: string | null;
}): Promise<{ success: boolean; authUserId?: string; errorMessage?: string }> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Validate token
    const tokenRes = await client.query<{ auth_user_id: string; used: boolean }>(
      `
      SELECT auth_user_id, used FROM telegram_connection_tokens
      WHERE token = $1 AND expires_at > NOW()
      FOR UPDATE
      `,
      [input.startToken],
    );

    if (tokenRes.rows.length === 0 || tokenRes.rows[0].used) {
      await client.query("ROLLBACK");
      return { success: false, errorMessage: "Invalid, used, or expired Telegram connection token" };
    }

    const authUserId = tokenRes.rows[0].auth_user_id;

    // 2. Mark token used
    await client.query(
      `UPDATE telegram_connection_tokens SET used = true WHERE token = $1`,
      [input.startToken],
    );

    // 3. Resolve database internal user_id UUID from users table
    const userRes = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE auth_user_id = $1`,
      [authUserId],
    );

    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, errorMessage: "User record not found" };
    }

    const userId = userRes.rows[0].id;

    // 4. Upsert connection record in PostgreSQL
    await client.query(
      `
      INSERT INTO connections (user_id, provider, status, provider_user_id, metadata, updated_at)
      VALUES ($1, 'telegram', 'connected', $2, $3, NOW())
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        status = 'connected',
        provider_user_id = EXCLUDED.provider_user_id,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      `,
      [
        userId,
        input.chatId,
        JSON.stringify({ username: input.username || null, connectedAt: new Date().toISOString() }),
      ],
    );

    const { upsertIntegration } = await import("../integrations/integration.service.js");
    await upsertIntegration({
      authUserId,
      provider: "telegram",
      nangoConnectionId: authUserId,
      nangoIntegrationId: "telegram",
      status: "connected",
      metadata: { chatId: input.chatId, username: input.username || null },
    });

    await client.query("COMMIT");
    return { success: true, authUserId };
  } catch (err: any) {
    await client.query("ROLLBACK");
    return { success: false, errorMessage: err?.message || "Failed to associate Telegram chat ID" };
  } finally {
    client.release();
  }
}

export async function getUserTelegramConnection(
  authUserId: string,
): Promise<TelegramConnectionInfo> {
  try {
    const res = await getPool().query<{
      status: "connected" | "disconnected" | "pending";
      provider_user_id: string | null;
      metadata: { username?: string } | null;
    }>(
      `
      SELECT c.status, c.provider_user_id, c.metadata
      FROM connections c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_user_id = $1 AND c.provider = 'telegram'
      `,
      [authUserId],
    );

    if (res.rows.length === 0) {
      return { connected: false, status: "disconnected" };
    }

    const row = res.rows[0];
    const isConnected = row.status === "connected" && Boolean(row.provider_user_id);

    return {
      connected: isConnected,
      status: row.status,
      chatId: row.provider_user_id,
      username: row.metadata?.username || null,
    };
  } catch {
    return { connected: false, status: "disconnected" };
  }
}

export async function disconnectUserTelegram(authUserId: string): Promise<boolean> {
  const res = await getPool().query(
    `
    UPDATE connections
    SET status = 'disconnected', updated_at = NOW()
    FROM users u
    WHERE connections.user_id = u.id
      AND u.auth_user_id = $1
      AND connections.provider = 'telegram'
    `,
    [authUserId],
  );

  return (res.rowCount ?? 0) > 0;
}
