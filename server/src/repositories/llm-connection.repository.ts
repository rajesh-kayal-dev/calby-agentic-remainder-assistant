import { getPool } from "../db/pool.js";
import {
  encryptCredentials,
  decryptCredentials,
  maskCredentialString,
} from "../services/encryption.service.js";

export type UserLLMConnectionRow = {
  id: string;
  auth_user_id: string;
  provider_id: string;
  encrypted_credentials: string;
  config: Record<string, unknown> | null;
  selected_model: string | null;
  status: string;
  is_default: boolean;
  last_tested_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type UserLLMConnectionDTO = {
  id: string;
  authUserId: string;
  providerId: string;
  selectedModel: string | null;
  status: string;
  isDefault: boolean;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
  hasApiKey: boolean;
  maskedApiKey: string;
  config: Record<string, unknown>;
};

export function sanitizeConnectionRow(row: UserLLMConnectionRow): UserLLMConnectionDTO {
  let maskedKey = "";
  let hasKey = false;

  try {
    const creds = decryptCredentials(row.encrypted_credentials);
    const rawKey = creds.apiKey || creds.api_key || creds.token;
    if (rawKey) {
      hasKey = true;
      maskedKey = maskCredentialString(rawKey);
    }
  } catch {
    hasKey = false;
  }

  return {
    id: row.id,
    authUserId: row.auth_user_id,
    providerId: row.provider_id,
    selectedModel: row.selected_model,
    status: row.status,
    isDefault: row.is_default,
    lastTestedAt: row.last_tested_at ? row.last_tested_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    hasApiKey: hasKey,
    maskedApiKey: maskedKey,
    config: row.config || {},
  };
}

export async function getUserLLMConnections(authUserId: string): Promise<UserLLMConnectionDTO[]> {
  const result = await getPool().query<UserLLMConnectionRow>(
    `
    SELECT * FROM user_llm_connections
    WHERE auth_user_id = $1
    ORDER BY is_default DESC, created_at DESC
    `,
    [authUserId],
  );

  return result.rows.map(sanitizeConnectionRow);
}

export async function getLLMConnectionById(
  authUserId: string,
  connectionId: string,
): Promise<UserLLMConnectionRow | null> {
  const result = await getPool().query<UserLLMConnectionRow>(
    `
    SELECT * FROM user_llm_connections
    WHERE id = $1 AND auth_user_id = $2
    `,
    [connectionId, authUserId],
  );

  return result.rows[0] || null;
}

export async function createLLMConnection(input: {
  authUserId: string;
  providerId: string;
  credentials: Record<string, string>;
  selectedModel?: string;
  config?: Record<string, unknown>;
  isDefault?: boolean;
}): Promise<UserLLMConnectionDTO> {
  const encrypted = encryptCredentials(input.credentials);

  if (input.isDefault) {
    await getPool().query(
      `UPDATE user_llm_connections SET is_default = false WHERE auth_user_id = $1`,
      [input.authUserId],
    );
  }

  const result = await getPool().query<UserLLMConnectionRow>(
    `
    INSERT INTO user_llm_connections (
      auth_user_id,
      provider_id,
      encrypted_credentials,
      config,
      selected_model,
      status,
      is_default
    )
    VALUES ($1, $2, $3, $4, $5, 'untested', $6)
    RETURNING *
    `,
    [
      input.authUserId,
      input.providerId,
      encrypted,
      JSON.stringify(input.config || {}),
      input.selectedModel || null,
      input.isDefault ?? false,
    ],
  );

  return sanitizeConnectionRow(result.rows[0]);
}

export async function updateLLMConnection(
  authUserId: string,
  connectionId: string,
  updates: {
    credentials?: Record<string, string>;
    selectedModel?: string;
    config?: Record<string, unknown>;
    status?: string;
    isDefault?: boolean;
  },
): Promise<UserLLMConnectionDTO | null> {
  const existing = await getLLMConnectionById(authUserId, connectionId);
  if (!existing) return null;

  let encrypted = existing.encrypted_credentials;
  if (updates.credentials && Object.keys(updates.credentials).length > 0) {
    encrypted = encryptCredentials(updates.credentials);
  }

  if (updates.isDefault) {
    await getPool().query(
      `UPDATE user_llm_connections SET is_default = false WHERE auth_user_id = $1`,
      [authUserId],
    );
  }

  const newConfig = updates.config
    ? JSON.stringify(updates.config)
    : JSON.stringify(existing.config || {});

  const result = await getPool().query<UserLLMConnectionRow>(
    `
    UPDATE user_llm_connections
    SET
      encrypted_credentials = $1,
      selected_model = COALESCE($2, selected_model),
      config = $3,
      status = COALESCE($4, status),
      is_default = COALESCE($5, is_default),
      updated_at = NOW()
    WHERE id = $6 AND auth_user_id = $7
    RETURNING *
    `,
    [
      encrypted,
      updates.selectedModel !== undefined ? updates.selectedModel : existing.selected_model,
      newConfig,
      updates.status !== undefined ? updates.status : existing.status,
      updates.isDefault !== undefined ? updates.isDefault : existing.is_default,
      connectionId,
      authUserId,
    ],
  );

  return result.rows[0] ? sanitizeConnectionRow(result.rows[0]) : null;
}

export async function deleteLLMConnection(
  authUserId: string,
  connectionId: string,
): Promise<boolean> {
  const result = await getPool().query(
    `
    DELETE FROM user_llm_connections
    WHERE id = $1 AND auth_user_id = $2
    `,
    [connectionId, authUserId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function setDefaultLLMConnection(
  authUserId: string,
  connectionId: string,
): Promise<boolean> {
  await getPool().query(
    `UPDATE user_llm_connections SET is_default = false WHERE auth_user_id = $1`,
    [authUserId],
  );

  const result = await getPool().query(
    `
    UPDATE user_llm_connections
    SET is_default = true, updated_at = NOW()
    WHERE id = $1 AND auth_user_id = $2
    `,
    [connectionId, authUserId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function updateConnectionStatus(
  authUserId: string,
  connectionId: string,
  status: string,
  lastTestedAt?: Date,
): Promise<boolean> {
  const result = await getPool().query(
    `
    UPDATE user_llm_connections
    SET status = $1, last_tested_at = COALESCE($2, NOW()), updated_at = NOW()
    WHERE id = $3 AND auth_user_id = $4
    `,
    [status, lastTestedAt || new Date(), connectionId, authUserId],
  );

  return (result.rowCount ?? 0) > 0;
}
