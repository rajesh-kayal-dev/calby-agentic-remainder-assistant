/**
 * Integration management API routes.
 *
 * GET  /api/integrations                    → all statuses
 * GET  /api/integrations/:provider/status   → single status
 * POST /api/integrations/:provider/connect  → initiate or record connection
 * POST /api/integrations/:provider/callback → Nango OAuth callback
 * POST /api/integrations/:provider/disconnect → disconnect
 */

import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import {
  getAllIntegrationStatuses,
  getIntegrationStatus,
  markIntegrationConnected,
  disconnectIntegration,
} from "../services/integrations/integration.service.js";
import {
  NANGO_OAUTH_PROVIDERS,
  PROVIDER_TO_NANGO_INTEGRATION,
} from "../services/nango/nango.types.js";

export const integrationRouter = Router();

// All integration routes require authentication
integrationRouter.use(requireSession);

/**
 * GET /api/integrations
 * Returns connection statuses for all supported integrations.
 */
integrationRouter.get("/", async (req, res) => {
  try {
    const statuses = await getAllIntegrationStatuses(req.authContext!.authUserId);
    res.json({ integrations: statuses });
  } catch (error: any) {
    console.error("[Integrations] Failed to get all statuses:", error?.message);
    res.status(500).json({ error: "Could not load integration statuses" });
  }
});

/**
 * GET /api/integrations/:provider/status
 * Returns connection status for a single provider.
 */
integrationRouter.get("/:provider/status", async (req, res) => {
  try {
    const { provider } = req.params;
    const status = await getIntegrationStatus(req.authContext!.authUserId, provider);
    res.json({ integration: status });
  } catch (error: any) {
    console.error("[Integrations] Status check failed:", error?.message);
    res.status(500).json({ error: "Could not check integration status" });
  }
});

/**
 * POST /api/integrations/:provider/connect
 *
 * For Nango OAuth providers:
 *   Returns the Nango-hosted OAuth URL for the frontend to redirect to.
 *   The frontend should use `@nangohq/frontend` or redirect to this URL.
 *
 * For non-OAuth providers (WhatsApp, Telegram):
 *   Returns instructions or delegates to existing connection endpoints.
 */
integrationRouter.post("/:provider/connect", async (req, res) => {
  try {
    const { provider } = req.params;
    const authUserId = req.authContext!.authUserId;

    if (provider === "google-calendar") {
      const { getGoogleOAuthAuthUrl } = await import("../services/google-oauth.service.js");
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/connections/google/callback`;
      const url = getGoogleOAuthAuthUrl({
        authUserId,
        redirectUri,
      });
      res.json({
        method: "google_oauth",
        provider,
        url,
      });
      return;
    }

    if (NANGO_OAUTH_PROVIDERS.has(provider)) {
      const nangoIntId = PROVIDER_TO_NANGO_INTEGRATION[provider];
      if (!nangoIntId) {
        res.status(400).json({ error: `Unsupported OAuth provider: ${provider}` });
        return;
      }

      try {
        const { createConnectSession } = await import("../services/nango/nango.client.js");
        const session = await createConnectSession({
          integrationId: nangoIntId,
          connectionId: authUserId,
        });

        res.json({
          method: "nango_oauth",
          provider,
          url: session.connectUrl,
          nangoConnectionId: authUserId,
        });
        return;
      } catch (nangoErr: any) {
        console.error(`[Integrations] Nango connect session failed for ${provider}:`, nangoErr?.message);
        res.status(500).json({
          error: `Could not start ${provider} authorization via Nango: ${nangoErr?.message || "Check Nango configuration"}`,
        });
        return;
      }
    }

    // Non-OAuth providers have their own connection flows
    if (provider === "telegram") {
      res.json({
        method: "bot_link",
        provider,
        message: "Use the Telegram connection endpoint: POST /api/connections/telegram/intent",
      });
      return;
    }

    if (provider === "whatsapp") {
      res.json({
        method: "api_key",
        provider,
        message: "Use the WhatsApp configuration endpoint: POST /api/connections/whatsapp/configure",
      });
      return;
    }

    res.status(400).json({ error: `Unknown provider: ${provider}` });
  } catch (error: any) {
    console.error("[Integrations] Connect failed:", error?.message);
    res.status(500).json({ error: "Could not initiate connection" });
  }
});

/**
 * POST /api/integrations/:provider/callback
 *
 * Called after Nango OAuth completes successfully.
 * The server strictly enforces nango_connection_id = authUserId (from session),
 * preventing any IDOR manipulation.
 */
integrationRouter.post("/:provider/callback", async (req, res) => {
  try {
    const { provider } = req.params;
    const authUserId = req.authContext!.authUserId;

    if (provider === "google-calendar") {
      const status = await getIntegrationStatus(authUserId, "google-calendar");
      res.json({ success: status.status === "connected", integration: status });
      return;
    }

    if (!NANGO_OAUTH_PROVIDERS.has(provider)) {
      res.status(400).json({ error: `Provider '${provider}' does not use OAuth callback` });
      return;
    }

    if (provider === "telegram") {
      const { verifyTelegramBotIdentity } = await import("../services/integrations/integration.service.js");
      const verification = await verifyTelegramBotIdentity(authUserId);
      if (!verification.valid) {
        res.status(400).json({ error: verification.error });
        return;
      }
    }

    // Security: always enforce authUserId as connection ID
    const status = await markIntegrationConnected(
      authUserId,
      provider,
      authUserId,
    );

    const isConnected = status.status === "connected";
    res.json({ success: isConnected, integration: status });
  } catch (error: any) {
    console.error("[Integrations] Callback failed:", error?.message);
    res.status(500).json({ error: "Could not complete integration connection" });
  }
});

/**
 * POST /api/integrations/:provider/disconnect
 * Disconnects the user's integration and revokes Nango connection.
 */
integrationRouter.post("/:provider/disconnect", async (req, res) => {
  try {
    const { provider } = req.params;
    const status = await disconnectIntegration(req.authContext!.authUserId, provider);
    res.json({ success: true, integration: status });
  } catch (error: any) {
    console.error("[Integrations] Disconnect failed:", error?.message);
    res.status(500).json({ error: "Could not disconnect integration" });
  }
});
