import crypto from "node:crypto";
import { encryptCredentials, decryptCredentials } from "./encryption.service.js";
import {
  upsertGoogleOAuthConnection,
  getGoogleOAuthConnectionByAuthId,
  updateGoogleOAuthStatus,
  GoogleOAuthConnectionRow,
} from "../repositories/google-oauth.repository.js";

const DEFAULT_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
];

const STATE_SECRET = process.env.ENCRYPTION_KEY || "google-oauth-state-secret-key-32bytes!";

export interface GoogleOAuthStatusResult {
  connected: boolean;
  email?: string;
  scopes?: string[];
  requiresUpgrade?: boolean;
  status?: "connected" | "disconnected" | "error";
  errorMessage?: string;
}

export function hasCalendarScope(scopes?: string[]): boolean {
  if (!scopes || !Array.isArray(scopes)) return false;
  return scopes.some(
    (s) =>
      s === "https://www.googleapis.com/auth/calendar" ||
      s === "https://www.googleapis.com/auth/calendar.events",
  );
}

export function hasGmailScope(scopes?: string[]): boolean {
  if (!scopes || !Array.isArray(scopes)) return false;
  return scopes.some((s) => s === "https://www.googleapis.com/auth/gmail.send");
}

export function hasDocsScope(scopes?: string[]): boolean {
  if (!scopes || !Array.isArray(scopes)) return false;
  return scopes.some((s) => s === "https://www.googleapis.com/auth/documents");
}

export function hasSheetsScope(scopes?: string[]): boolean {
  if (!scopes || !Array.isArray(scopes)) return false;
  return scopes.some((s) => s === "https://www.googleapis.com/auth/spreadsheets");
}

export function generateGoogleOAuthState(authUserId: string): string {
  const timestamp = Date.now();
  const payload = `${authUserId}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

export function validateGoogleOAuthState(stateToken: string, expectedAuthUserId?: string): {
  valid: boolean;
  authUserId?: string;
} {
  try {
    const decoded = Buffer.from(stateToken, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return { valid: false };

    const [authUserId, timestampStr, hmac] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // 15 minutes state expiration to prevent replay & CSRF attacks
    if (isNaN(timestamp) || Date.now() - timestamp > 15 * 60 * 1000) {
      return { valid: false };
    }

    const payload = `${authUserId}:${timestampStr}`;
    const expectedHmac = crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("hex");

    if (hmac !== expectedHmac) {
      return { valid: false };
    }

    if (expectedAuthUserId && authUserId !== expectedAuthUserId) {
      return { valid: false };
    }

    return { valid: true, authUserId };
  } catch {
    return { valid: false };
  }
}

export function getGoogleOAuthAuthUrl(input: {
  authUserId: string;
  redirectUri: string;
}): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "mock-google-client-id";
  const state = generateGoogleOAuthState(input.authUserId);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: DEFAULT_SCOPES.join(" "),
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeOAuthCodeAndSave(input: {
  authUserId: string;
  code: string;
  redirectUri: string;
}): Promise<GoogleOAuthConnectionRow> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "mock-google-client-id";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret";

  let accessToken = "mock_access_token";
  let refreshToken = "mock_refresh_token";
  let email = `${input.authUserId}@gmail.com`;
  let googleSub = "mock_sub_123";
  let newScopes = DEFAULT_SCOPES;

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: input.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: input.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Google OAuth token exchange failed: ${errText}`);
    }

    const tokenData = (await tokenRes.json()) as any;
    accessToken = tokenData.access_token;
    refreshToken = tokenData.refresh_token || "";
    if (tokenData.scope) {
      newScopes = tokenData.scope.split(" ");
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (userRes.ok) {
      const userData = (await userRes.json()) as any;
      email = userData.email || email;
      googleSub = userData.id || googleSub;
    }
  }

  // Account Consistency Check: Prevent accidental account swapping
  const existingConn = await getGoogleOAuthConnectionByAuthId(input.authUserId);
  if (existingConn && existingConn.status === "connected") {
    if (
      existingConn.email &&
      existingConn.email.toLowerCase() !== email.toLowerCase()
    ) {
      throw new Error(
        `ACCOUNT_MISMATCH: Connection belongs to ${existingConn.email}. Disconnect before linking ${email}.`,
      );
    }
  }

  // Preserve existing refresh token if re-consenting without a new refresh token
  let finalRefreshToken = refreshToken;
  if (!finalRefreshToken && existingConn?.encrypted_refresh_token) {
    const decrypted = decryptCredentials(existingConn.encrypted_refresh_token);
    finalRefreshToken = decrypted?.refreshToken || "";
  }

  // Merge scopes incrementally
  const mergedScopes = Array.from(
    new Set([...(existingConn?.scopes || []), ...newScopes]),
  );

  const encryptedRefreshToken = encryptCredentials({
    refreshToken: finalRefreshToken || "mock_refresh_token",
  });

  return upsertGoogleOAuthConnection({
    authUserId: input.authUserId,
    email,
    googleSub,
    encryptedRefreshToken,
    scopes: mergedScopes,
    status: "connected",
  });
}

export async function getValidGoogleAccessToken(authUserId: string): Promise<{
  accessToken: string;
  senderEmail: string;
}> {
  const conn = await getGoogleOAuthConnectionByAuthId(authUserId);
  if (!conn || conn.status !== "connected") {
    throw new Error(
      "CONNECTION_REQUIRED: Google account is not connected. Please connect Google account in Calby Settings.",
    );
  }

  const decrypted = decryptCredentials(conn.encrypted_refresh_token);
  const refreshToken = decrypted?.refreshToken || "";
  if (!refreshToken) {
    await updateGoogleOAuthStatus(authUserId, "error");
    throw new Error("CONNECTION_REQUIRED: Failed to decrypt stored Google refresh token. Please reconnect.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "mock-google-client-id";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret";

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      // Revoked or invalid refresh token error normalization
      if (res.status === 400 || res.status === 401 || errText.includes("invalid_grant")) {
        await updateGoogleOAuthStatus(authUserId, "error");
        throw new Error(
          "CONNECTION_REQUIRED: Google account authorization has expired or been revoked. Please reconnect in Settings.",
        );
      }
      throw new Error(`Google token refresh failed: ${errText}`);
    }

    const data = (await res.json()) as any;
    return {
      accessToken: data.access_token,
      senderEmail: conn.email,
    };
  }

  // Fallback for mocked test execution
  return {
    accessToken: "mock_fresh_access_token",
    senderEmail: conn.email,
  };
}

export async function getGoogleConnectionStatus(
  authUserId: string,
): Promise<GoogleOAuthStatusResult> {
  const conn = await getGoogleOAuthConnectionByAuthId(authUserId);
  if (!conn || conn.status !== "connected") {
    return { connected: false, status: conn?.status || "disconnected" };
  }

  return {
    connected: true,
    email: conn.email,
    scopes: conn.scopes,
    status: "connected",
  };
}

export async function getGmailConnectionStatus(
  authUserId: string,
): Promise<GoogleOAuthStatusResult> {
  const conn = await getGoogleOAuthConnectionByAuthId(authUserId);
  if (!conn || conn.status !== "connected") {
    return { connected: false, status: conn?.status || "disconnected" };
  }

  const gmailAllowed = hasGmailScope(conn.scopes);
  if (!gmailAllowed) {
    return { connected: false, email: conn.email, requiresUpgrade: true, status: "connected" };
  }

  return {
    connected: true,
    email: conn.email,
    scopes: conn.scopes,
    status: "connected",
  };
}

export async function getCalendarConnectionStatus(
  authUserId: string,
): Promise<GoogleOAuthStatusResult> {
  const conn = await getGoogleOAuthConnectionByAuthId(authUserId);
  if (!conn || conn.status !== "connected") {
    return { connected: false, status: conn?.status || "disconnected" };
  }

  const calendarAllowed = hasCalendarScope(conn.scopes);
  if (!calendarAllowed) {
    return { connected: false, email: conn.email, requiresUpgrade: true, status: "connected" };
  }

  return {
    connected: true,
    email: conn.email,
    scopes: conn.scopes,
    status: "connected",
  };
}

export async function getDocsConnectionStatus(
  authUserId: string,
): Promise<GoogleOAuthStatusResult> {
  const conn = await getGoogleOAuthConnectionByAuthId(authUserId);
  if (!conn || conn.status !== "connected") {
    return { connected: false, status: conn?.status || "disconnected" };
  }

  const docsAllowed = hasDocsScope(conn.scopes);
  if (!docsAllowed) {
    return { connected: false, email: conn.email, requiresUpgrade: true, status: "connected" };
  }

  return {
    connected: true,
    email: conn.email,
    scopes: conn.scopes,
    status: "connected",
  };
}

export async function getSheetsConnectionStatus(
  authUserId: string,
): Promise<GoogleOAuthStatusResult> {
  const conn = await getGoogleOAuthConnectionByAuthId(authUserId);
  if (!conn || conn.status !== "connected") {
    return { connected: false, status: conn?.status || "disconnected" };
  }

  const sheetsAllowed = hasSheetsScope(conn.scopes);
  if (!sheetsAllowed) {
    return { connected: false, email: conn.email, requiresUpgrade: true, status: "connected" };
  }

  return {
    connected: true,
    email: conn.email,
    scopes: conn.scopes,
    status: "connected",
  };
}

export async function disconnectGoogleOAuth(authUserId: string): Promise<boolean> {
  const conn = await getGoogleOAuthConnectionByAuthId(authUserId);
  if (!conn) return false;

  if (conn.encrypted_refresh_token && process.env.GOOGLE_CLIENT_ID) {
    try {
      const decrypted = decryptCredentials(conn.encrypted_refresh_token);
      const refreshToken = decrypted?.refreshToken || "";
      if (refreshToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
          method: "POST",
        });
      }
    } catch {}
  }

  return updateGoogleOAuthStatus(authUserId, "disconnected");
}
