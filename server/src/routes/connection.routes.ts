import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import {
  createCalendarConnectUrl,
  getCalendarConnection,
  refreshCalendarConnection,
} from "../services/connection.service.js";
import {
  createTelegramConnectionToken,
  getUserTelegramConnection,
  disconnectUserTelegram,
  processTelegramWebhookStart,
} from "../services/notifications/telegram-connection.service.js";
import {
  saveWhatsAppConfiguration,
  getWhatsAppConnectionStatus,
  disconnectWhatsApp,
} from "../services/notifications/whatsapp-connection.service.js";
import {
  processTelegramWebhook,
  verifyWhatsAppWebhook,
  processWhatsAppWebhook,
} from "../services/webhook.service.js";
import { getPool } from "../db/pool.js";
import {
  getGoogleOAuthAuthUrl,
  exchangeOAuthCodeAndSave,
  getGoogleConnectionStatus,
  disconnectGoogleOAuth,
  validateGoogleOAuthState,
  getCalendarConnectionStatus,
  getGmailConnectionStatus,
} from "../services/google-oauth.service.js";

export const connectionRouter = Router();

// Legacy Webhook Endpoints (forwarded to centralized webhook service)
connectionRouter.post("/telegram/webhook", async (req, res) => {
  try {
    await processTelegramWebhook(req.headers as Record<string, string>, req.body);
    res.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    res.json({ ok: true });
  }
});

connectionRouter.get("/whatsapp/webhook", (req, res) => {
  const result = verifyWhatsAppWebhook(req.query);
  if (result.valid && result.challenge) {
    res.status(200).send(result.challenge);
    return;
  }
  res.status(403).send("Forbidden");
});

connectionRouter.post("/whatsapp/webhook", async (req, res) => {
  try {
    await processWhatsAppWebhook(req.body);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    res.status(200).json({ ok: true });
  }
});

// Public Google OAuth Callback (authenticated via state token HMAC)
connectionRouter.get("/google/callback", async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";

    const stateValidation = validateGoogleOAuthState(state);
    if (!stateValidation.valid || !stateValidation.authUserId) {
      res.status(400).send("Invalid or expired OAuth state parameter");
      return;
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/connections/google/callback`;

    await exchangeOAuthCodeAndSave({
      authUserId: stateValidation.authUserId,
      code,
      redirectUri,
    });

    res.send(`
      <html>
        <body>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage("google-connected", "*");
              }
            } catch (e) {}
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    res.status(500).send(`Google OAuth authorization failed: ${error?.message || "Unknown error"}`);
  }
});

// Session Protected Routes
connectionRouter.use(requireSession);

import { getIntegrationStatus } from "../services/integrations/integration.service.js";

connectionRouter.get("/", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const googleStatus = await getCalendarConnectionStatus(authUserId);

    res.json({
      connection: {
        label: "Google Calendar",
        status: googleStatus.connected ? "connected" : "disconnected",
        email: googleStatus.email,
        requiresUpgrade: googleStatus.requiresUpgrade,
      },
    });
  } catch {
    res.status(500).json({ error: "Could not load connection status" });
  }
});

connectionRouter.post("/connect", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/connections/google/callback`;
    const url = getGoogleOAuthAuthUrl({
      authUserId,
      redirectUri,
    });
    res.json({ url });
  } catch {
    res.status(500).json({ error: "Could not start Google OAuth connection" });
  }
});

connectionRouter.post("/refresh-status", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const googleStatus = await getCalendarConnectionStatus(authUserId);

    res.json({
      connection: {
        label: "Google Calendar",
        status: googleStatus.connected ? "connected" : "disconnected",
        email: googleStatus.email,
        requiresUpgrade: googleStatus.requiresUpgrade,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to refresh connection status" });
  }
});

connectionRouter.post("/telegram/intent", async (req, res) => {
  try {
    const result = await createTelegramConnectionToken(req.authContext!.authUserId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to generate Telegram connection intent" });
  }
});

connectionRouter.get("/telegram/status", async (req, res) => {
  try {
    const status = await getUserTelegramConnection(req.authContext!.authUserId);
    res.json({ connection: status });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to get Telegram connection status" });
  }
});

connectionRouter.post("/telegram/disconnect", async (req, res) => {
  try {
    const success = await disconnectUserTelegram(req.authContext!.authUserId);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to disconnect Telegram" });
  }
});

connectionRouter.post("/whatsapp/configure", async (req, res) => {
  try {
    const phoneNumberId = typeof req.body?.phoneNumberId === "string" ? req.body.phoneNumberId : "";
    const accessToken = typeof req.body?.accessToken === "string" ? req.body.accessToken : "";
    const businessAccountId =
      typeof req.body?.businessAccountId === "string" ? req.body.businessAccountId : undefined;
    const displayPhoneNumber =
      typeof req.body?.displayPhoneNumber === "string" ? req.body.displayPhoneNumber : undefined;

    if (!phoneNumberId || !accessToken) {
      res.status(400).json({ error: "Phone Number ID and Permanent Access Token are required" });
      return;
    }

    const status = await saveWhatsAppConfiguration({
      authUserId: req.authContext!.authUserId,
      phoneNumberId,
      accessToken,
      businessAccountId,
      displayPhoneNumber,
    });

    res.json({ success: true, connection: status });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to configure WhatsApp Business" });
  }
});

connectionRouter.get("/whatsapp/status", async (req, res) => {
  try {
    const status = await getWhatsAppConnectionStatus(req.authContext!.authUserId);
    res.json({ connection: status });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to get WhatsApp connection status" });
  }
});

connectionRouter.get("/google/auth-url", async (req, res) => {
  try {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/connections/google/callback`;
    const url = getGoogleOAuthAuthUrl({
      authUserId: req.authContext!.authUserId,
      redirectUri,
    });
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to generate Google OAuth URL" });
  }
});

connectionRouter.get("/gmail/status", async (req, res) => {
  try {
    const status = await getGoogleConnectionStatus(req.authContext!.authUserId);
    res.json({ connection: status });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to get Gmail connection status" });
  }
});

connectionRouter.delete("/gmail/disconnect", async (req, res) => {
  try {
    const success = await disconnectGoogleOAuth(req.authContext!.authUserId);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to disconnect Gmail" });
  }
});

