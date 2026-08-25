import { getPool } from "../db/pool.js";

export type GoogleOAuthConnectionRow = {
  id: string;
  auth_user_id: string;
  email: string;
  google_sub: string | null;
  encrypted_refresh_token: string;
  scopes: string[];
  status: "connected" | "disconnected" | "error";
  created_at: Date;
  updated_at: Date;
};

export async function upsertGoogleOAuthConnection(input: {
  authUserId: string;
  email: string;
  googleSub?: string | null;
  encryptedRefreshToken: string;
  scopes?: string[];
  status?: "connected" | "disconnected" | "error";
}): Promise<GoogleOAuthConnectionRow> {
  const result = await getPool().query<GoogleOAuthConnectionRow>(
    `
    INSERT INTO google_oauth_connections (
      auth_user_id,
      email,
      google_sub,
      encrypted_refresh_token,
      scopes,
      status,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (auth_user_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      google_sub = COALESCE(EXCLUDED.google_sub, google_oauth_connections.google_sub),
      encrypted_refresh_token = CASE 
        WHEN EXCLUDED.encrypted_refresh_token IS NOT NULL AND EXCLUDED.encrypted_refresh_token <> '' 
        THEN EXCLUDED.encrypted_refresh_token 
        ELSE google_oauth_connections.encrypted_refresh_token 
      END,
      scopes = EXCLUDED.scopes,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *
    `,
    [
      input.authUserId,
      input.email,
      input.googleSub || null,
      input.encryptedRefreshToken,
      input.scopes || [],
      input.status || "connected",
    ],
  );

  return result.rows[0];
}

export async function getGoogleOAuthConnectionByAuthId(
  authUserId: string,
): Promise<GoogleOAuthConnectionRow | null> {
  try {
    const result = await getPool().query<GoogleOAuthConnectionRow>(
      `
      SELECT *
      FROM google_oauth_connections
      WHERE auth_user_id = $1
      `,
      [authUserId],
    );

    return result.rows[0] || null;
  } catch {
    return null;
  }
}

export async function updateGoogleOAuthStatus(
  authUserId: string,
  status: "connected" | "disconnected" | "error",
): Promise<boolean> {
  try {
    const result = await getPool().query(
      `
      UPDATE google_oauth_connections
      SET status = $1, updated_at = NOW()
      WHERE auth_user_id = $2
      `,
      [status, authUserId],
    );

    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}
