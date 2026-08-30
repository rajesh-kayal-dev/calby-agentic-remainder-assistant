/**
 * Generic integration orchestrator.
 *
 * Provides a unified interface for checking, connecting, and disconnecting
 * provider integrations. For OAuth providers, delegates to Nango.
 * For API-key providers (WhatsApp, Telegram), delegates to existing services.
 */

import { getPool } from "../../db/pool.js";
import * as nangoClient from "../nango/nango.client.js";
import {
  PROVIDER_TO_NANGO_INTEGRATION,
  NANGO_OAUTH_PROVIDERS,
  type NangoIntegrationId,
} from "../nango/nango.types.js";
import {
  getCalendarConnectionStatus,
  getGmailConnectionStatus,
  disconnectGoogleOAuth,
} from "../google-oauth.service.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntegrationStatus {
  provider: string;
  status: "connected" | "disconnected" | "error" | "pending";
  label: string;
  capabilities: string[];
  connectedAt?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

interface UserIntegrationRow {
  id: string;
  auth_user_id: string;
  provider: string;
  nango_connection_id: string | null;
  nango_integration_id: string | null;
  status: string;
  metadata: Record<string, unknown>;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Provider metadata
// ---------------------------------------------------------------------------

const PROVIDER_LABELS: Record<string, string> = {
  "google-calendar": "Google Calendar",
  "gmail": "Gmail",
  "google-drive": "Google Drive",
  "google-docs": "Google Docs",
  "google-meet": "Google Meet",
  "notion": "Notion",
  "slack": "Slack",
  "microsoft-teams": "Microsoft Teams",
  "telegram": "Telegram",
  "whatsapp": "WhatsApp",
};

const PROVIDER_CAPABILITIES: Record<string, string[]> = {
  "google-calendar": ["View events", "Create events", "Update events", "Delete events", "Find free slots"],
  "gmail": ["Search emails", "Read emails", "Send emails"],
  "google-drive": ["Search files", "View file details"],
  "google-docs": ["Search documents", "Read documents"],
  "google-meet": ["Create meetings"],
  "notion": ["Search pages", "Read pages", "Create pages"],
  "slack": ["Send messages", "Search messages"],
  "microsoft-teams": ["Create meetings", "Send messages"],
  "telegram": ["Send messages", "Receive messages"],
  "whatsapp": ["Send messages", "Receive messages"],
};

/** All supported providers. */
export const ALL_PROVIDERS = Object.keys(PROVIDER_LABELS);

// ---------------------------------------------------------------------------
// Repository helpers
// ---------------------------------------------------------------------------

export async function getIntegrationRow(
  authUserId: string,
  provider: string,
): Promise<UserIntegrationRow | null> {
  const res = await getPool().query<UserIntegrationRow>(
    `SELECT * FROM user_integrations WHERE auth_user_id = $1 AND provider = $2`,
    [authUserId, provider],
  );
  return res.rows[0] || null;
}

export async function upsertIntegration(params: {
  authUserId: string;
  provider: string;
  nangoConnectionId?: string;
  nangoIntegrationId?: string;
  status: string;
  metadata?: Record<string, unknown>;
}): Promise<UserIntegrationRow> {
  const res = await getPool().query<UserIntegrationRow>(
    `INSERT INTO user_integrations (
       auth_user_id, provider, nango_connection_id, nango_integration_id,
       status, metadata, connected_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6,
       CASE WHEN $5 = 'connected' THEN NOW() ELSE NULL END,
       NOW()
     )
     ON CONFLICT (auth_user_id, provider)
     DO UPDATE SET
       nango_connection_id = COALESCE(EXCLUDED.nango_connection_id, user_integrations.nango_connection_id),
       nango_integration_id = COALESCE(EXCLUDED.nango_integration_id, user_integrations.nango_integration_id),
       status = EXCLUDED.status,
       metadata = EXCLUDED.metadata,
       connected_at = CASE
         WHEN EXCLUDED.status = 'connected' AND user_integrations.status != 'connected' THEN NOW()
         ELSE user_integrations.connected_at
       END,
       updated_at = NOW()
     RETURNING *`,
    [
      params.authUserId,
      params.provider,
      params.nangoConnectionId || null,
      params.nangoIntegrationId || null,
      params.status,
      JSON.stringify(params.metadata || {}),
    ],
  );
  return res.rows[0];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verify that Nango's Telegram integration is configured with the expected bot username (@CalbyAssistantBot).
 */
export async function verifyTelegramBotIdentity(
  authUserId: string,
): Promise<{ valid: boolean; username?: string; error?: string }> {
  const EXPECTED_BOT = "CalbyAssistantBot";
  try {
    const res = await nangoClient.proxyRequest<{
      ok: boolean;
      result?: { id: number; is_bot: boolean; username: string; first_name: string };
    }>({
      integrationId: "telegram",
      connectionId: authUserId,
      method: "GET",
      endpoint: "/getMe",
    });

    const botUsername = res?.result?.username || "";
    if (botUsername.toLowerCase() !== EXPECTED_BOT.toLowerCase()) {
      return {
        valid: false,
        username: botUsername,
        error: `Nango Telegram integration is configured with bot '@${botUsername}', but Calby strictly requires '@${EXPECTED_BOT}'. Please update your Nango Telegram Bot Token.`,
      };
    }

    return {
      valid: true,
      username: botUsername,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Could not verify Telegram bot identity via Nango: ${err?.message || "Check Nango Telegram configuration"}`,
    };
  }
}

/**
 * Sync active Nango connections with Calby database.
 */
export async function syncNangoConnectionsForUser(authUserId: string): Promise<void> {
  if (!process.env.NANGO_SECRET_KEY) return;

  try {
    for (const provider of ALL_PROVIDERS) {
      if (!NANGO_OAUTH_PROVIDERS.has(provider)) continue;

      const nangoIntId = PROVIDER_TO_NANGO_INTEGRATION[provider];
      if (!nangoIntId) continue;

      const row = await getIntegrationRow(authUserId, provider);
      const nangoConnId = row?.nango_connection_id || authUserId;

      try {
        const isActive = await nangoClient.isConnectionActive(nangoIntId, nangoConnId);
        if (isActive) {
          if (!row || row.status !== "connected") {
            await upsertIntegration({
              authUserId,
              provider,
              nangoConnectionId: nangoConnId,
              nangoIntegrationId: nangoIntId,
              status: "connected",
            });
          }
        } else {
          if (row && row.status === "connected") {
            await upsertIntegration({
              authUserId,
              provider,
              nangoConnectionId: nangoConnId,
              nangoIntegrationId: nangoIntId,
              status: "disconnected",
            });
          }
        }
      } catch {
        // Suppress single provider connection check failure
      }
    }
  } catch (err: any) {
    console.warn("[Integrations] Nango auto-sync skipped:", err?.message);
  }
}

/**
 * Normalize provider alias strings to canonical internal provider names.
 */
export function normalizeProviderName(provider: string): string {
  const p = (provider || "").toLowerCase().trim();
  if (p === "google_calendar" || p === "calendar" || p === "google-calendar") return "google-calendar";
  if (p === "gmail" || p === "google-mail" || p === "mail") return "gmail";
  if (p === "google_drive" || p === "drive" || p === "google-drive") return "google-drive";
  if (p === "google_docs" || p === "docs" || p === "google-docs") return "google-docs";
  if (p === "google_meet" || p === "meet" || p === "google-meet") return "google-meet";
  if (p === "notion") return "notion";
  if (p === "slack") return "slack";
  if (p === "microsoft-teams" || p === "teams" || p === "microsoft_teams") return "microsoft-teams";
  if (p === "telegram") return "telegram";
  if (p === "whatsapp" || p === "whatsapp-business") return "whatsapp";
  return p;
}

/**
 * Get the status of a single integration for a user.
 */
export async function getIntegrationStatus(
  authUserId: string,
  rawProvider: string,
): Promise<IntegrationStatus> {
  const provider = normalizeProviderName(rawProvider);
  const label = PROVIDER_LABELS[provider] || provider;
  const capabilities = PROVIDER_CAPABILITIES[provider] || [];

  try {
    if (provider === "google-calendar") {
      const status = await getCalendarConnectionStatus(authUserId);
      return {
        provider,
        status: status.connected ? "connected" : "disconnected",
        label,
        capabilities,
        email: status.email,
        metadata: status.scopes ? { scopes: status.scopes } : undefined,
      };
    }

    if (provider === "gmail") {
      // 1. Check Nango-managed 'gmail' integration first
      try {
        const row = await getIntegrationRow(authUserId, "gmail");
        if (row && row.status === "connected") {
          return {
            provider: "gmail",
            status: "connected",
            label,
            capabilities,
            connectedAt: row.connected_at || undefined,
            metadata: row.metadata,
          };
        }
      } catch {}

      // 2. Check legacy Google OAuth connection fallback (verifying Gmail scope)
      try {
        const gmailStatus = await getGmailConnectionStatus(authUserId);
        if (gmailStatus.connected) {
          return {
            provider: "gmail",
            status: "connected",
            label,
            capabilities,
            email: gmailStatus.email,
          };
        }
      } catch {}

      return { provider: "gmail", status: "disconnected", label, capabilities };
    }

    // For Nango OAuth/managed providers
    if (NANGO_OAUTH_PROVIDERS.has(provider)) {
      const row = await getIntegrationRow(authUserId, provider);

      if (!row || row.status !== "connected") {
        return { provider, status: "disconnected", label, capabilities };
      }

      return {
        provider,
        status: "connected",
        label,
        capabilities,
        connectedAt: row.connected_at || undefined,
        metadata: row.metadata,
      };
    }

    // For non-Nango providers (WhatsApp) — check existing table
    if (provider === "whatsapp") {
      const res = await getPool().query(
        `SELECT status FROM whatsapp_connections WHERE auth_user_id = $1`,
        [authUserId],
      );
      const status = res.rows[0]?.status === "connected" ? "connected" : "disconnected";
      return { provider, status, label, capabilities };
    }

    // Telegram non-Nango fallback check
    if (provider === "telegram") {
      const res = await getPool().query(
        `SELECT status FROM connections WHERE user_id = (
           SELECT id FROM users WHERE auth_user_id = $1
         ) AND provider = 'telegram' AND status = 'connected'`,
        [authUserId],
      );
      const status = res.rows.length > 0 ? "connected" : "disconnected";
      return { provider, status, label, capabilities };
    }
  } catch (err: any) {
    console.warn(`[Integrations] Failed to resolve status for ${provider}:`, err?.message);
  }

  return { provider, status: "disconnected", label, capabilities };
}

/**
 * Get statuses for all supported integrations.
 * Syncs with Nango once before querying local cache.
 */
export async function getAllIntegrationStatuses(
  authUserId: string,
): Promise<IntegrationStatus[]> {
  await syncNangoConnectionsForUser(authUserId);

  const statuses = await Promise.all(
    ALL_PROVIDERS.map((provider) => getIntegrationStatus(authUserId, provider)),
  );
  return statuses;
}

/**
 * Record that a user has connected an OAuth provider through Nango.
 * Called after the Nango OAuth callback completes successfully.
 * Verifies that the connection is active in Nango before marking connected.
 */
export async function markIntegrationConnected(
  authUserId: string,
  provider: string,
  nangoConnectionId?: string,
): Promise<IntegrationStatus> {
  const nangoIntId = PROVIDER_TO_NANGO_INTEGRATION[provider];
  const connId = nangoConnectionId || authUserId;

  if (NANGO_OAUTH_PROVIDERS.has(provider) && nangoIntId && process.env.NANGO_SECRET_KEY) {
    const isActive = await nangoClient.isConnectionActive(nangoIntId, connId);
    if (!isActive) {
      console.warn(`[Integrations] ${provider} connection for ${authUserId} is not active in Nango. Marking disconnected.`);
      await upsertIntegration({
        authUserId,
        provider,
        nangoConnectionId: connId,
        nangoIntegrationId: nangoIntId,
        status: "disconnected",
      });
      return getIntegrationStatus(authUserId, provider);
    }
  }

  await upsertIntegration({
    authUserId,
    provider,
    nangoConnectionId: connId,
    nangoIntegrationId: nangoIntId,
    status: "connected",
  });

  return getIntegrationStatus(authUserId, provider);
}

/**
 * Disconnect a user's integration.
 * For Nango providers, also deletes the connection in Nango.
 */
export async function disconnectIntegration(
  authUserId: string,
  provider: string,
): Promise<IntegrationStatus> {
  if (provider === "google-calendar") {
    await disconnectGoogleOAuth(authUserId);
    return getIntegrationStatus(authUserId, provider);
  }

  if (NANGO_OAUTH_PROVIDERS.has(provider)) {
    const row = await getIntegrationRow(authUserId, provider);
    const nangoIntId = (row?.nango_integration_id ||
      PROVIDER_TO_NANGO_INTEGRATION[provider]) as NangoIntegrationId;
    const nangoConnId = row?.nango_connection_id || authUserId;

    try {
      await nangoClient.deleteConnection(nangoIntId, nangoConnId);
    } catch {
      // Connection may already be gone — proceed with local cleanup
    }
  }

  // Purge legacy google_oauth_connections if provider is google-calendar
  if (provider === "google-calendar") {
    try {
      const { disconnectGoogleOAuth } = await import("../google-oauth.service.js");
      await disconnectGoogleOAuth(authUserId);
    } catch {
      // Non-blocking legacy cleanup
    }
  }

  await upsertIntegration({
    authUserId,
    provider,
    status: "disconnected",
  });

  return getIntegrationStatus(authUserId, provider);
}

/**
 * Get a fresh access token for a Nango-managed provider.
 * This is the primary way services should obtain tokens.
 */
export async function getProviderAccessToken(
  authUserId: string,
  provider: string,
): Promise<string> {
  const nangoIntId = PROVIDER_TO_NANGO_INTEGRATION[provider];
  if (!nangoIntId) {
    throw new Error(`Provider '${provider}' is not a Nango-managed integration`);
  }

  const row = await getIntegrationRow(authUserId, provider);
  const nangoConnId = row?.nango_connection_id || authUserId;

  const tokenRes = await nangoClient.getToken(
    nangoIntId as NangoIntegrationId,
    nangoConnId,
  );

  return tokenRes.access_token;
}
