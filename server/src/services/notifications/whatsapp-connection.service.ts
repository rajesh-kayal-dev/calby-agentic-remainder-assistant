import { getPool } from "../../db/pool.js";
import { encryptCredentials, decryptCredentials } from "../encryption.service.js";

export interface WhatsAppConnectionStatus {
  connected: boolean;
  status: "connected" | "disconnected" | "error";
  phoneNumberId?: string | null;
  displayPhoneNumber?: string | null;
  businessAccountId?: string | null;
}

export interface ConfigureWhatsAppInput {
  authUserId: string;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  displayPhoneNumber?: string;
}

export async function saveWhatsAppConfiguration(
  input: ConfigureWhatsAppInput,
): Promise<WhatsAppConnectionStatus> {
  if (!input.phoneNumberId || input.phoneNumberId.trim().length === 0) {
    throw new Error("WhatsApp Phone Number ID is required");
  }
  if (!input.accessToken || input.accessToken.trim().length === 0) {
    throw new Error("WhatsApp Permanent Access Token is required");
  }

  // Encrypt secrets at rest using AES-256-GCM
  const encryptedAccessToken = encryptCredentials({ accessToken: input.accessToken.trim() });

  const result = await getPool().query<{
    status: "connected" | "disconnected" | "error";
    phone_number_id: string;
    display_phone_number: string | null;
    business_account_id: string | null;
  }>(
    `
    INSERT INTO whatsapp_connections (
      auth_user_id,
      phone_number_id,
      business_account_id,
      display_phone_number,
      encrypted_access_token,
      status,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, 'connected', NOW())
    ON CONFLICT (auth_user_id)
    DO UPDATE SET
      phone_number_id = EXCLUDED.phone_number_id,
      business_account_id = EXCLUDED.business_account_id,
      display_phone_number = EXCLUDED.display_phone_number,
      encrypted_access_token = EXCLUDED.encrypted_access_token,
      status = 'connected',
      updated_at = NOW()
    RETURNING status, phone_number_id, display_phone_number, business_account_id
    `,
    [
      input.authUserId,
      input.phoneNumberId.trim(),
      input.businessAccountId?.trim() || null,
      input.displayPhoneNumber?.trim() || null,
      encryptedAccessToken,
    ],
  );

  const row = result.rows[0];

  return {
    connected: row.status === "connected",
    status: row.status,
    phoneNumberId: row.phone_number_id,
    displayPhoneNumber: row.display_phone_number,
    businessAccountId: row.business_account_id,
  };
}

export async function getWhatsAppConnectionStatus(
  authUserId: string,
): Promise<WhatsAppConnectionStatus> {
  try {
    const res = await getPool().query<{
      status: "connected" | "disconnected" | "error";
      phone_number_id: string;
      display_phone_number: string | null;
      business_account_id: string | null;
    }>(
      `
      SELECT status, phone_number_id, display_phone_number, business_account_id
      FROM whatsapp_connections
      WHERE auth_user_id = $1
      `,
      [authUserId],
    );

    if (res.rows.length === 0) {
      return { connected: false, status: "disconnected" };
    }

    const row = res.rows[0];
    return {
      connected: row.status === "connected",
      status: row.status,
      phoneNumberId: row.phone_number_id,
      displayPhoneNumber: row.display_phone_number,
      businessAccountId: row.business_account_id,
    };
  } catch {
    return { connected: false, status: "disconnected" };
  }
}

export async function getDecryptedWhatsAppCredentials(
  authUserId: string,
): Promise<{ phoneNumberId: string; accessToken: string; businessAccountId?: string } | null> {
  try {
    const res = await getPool().query<{
      phone_number_id: string;
      encrypted_access_token: string;
      business_account_id: string | null;
      status: string;
    }>(
      `
      SELECT phone_number_id, encrypted_access_token, business_account_id, status
      FROM whatsapp_connections
      WHERE auth_user_id = $1 AND status = 'connected'
      `,
      [authUserId],
    );

    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];
    const creds = decryptCredentials(row.encrypted_access_token);

    if (!creds.accessToken) {
      return null;
    }

    return {
      phoneNumberId: row.phone_number_id,
      accessToken: creds.accessToken,
      businessAccountId: row.business_account_id || undefined,
    };
  } catch {
    return null;
  }
}

export async function disconnectWhatsApp(authUserId: string): Promise<boolean> {
  try {
    const res = await getPool().query(
      `
      UPDATE whatsapp_connections
      SET status = 'disconnected', updated_at = NOW()
      WHERE auth_user_id = $1
      `,
      [authUserId],
    );

    return (res.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}
