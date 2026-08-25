import { Router } from "express";
import {
  processTelegramWebhook,
  verifyWhatsAppWebhook,
  processWhatsAppWebhook,
} from "../services/webhook.service.js";

export const webhookRouter = Router();

// Public Telegram Webhook Endpoint
webhookRouter.post("/telegram", async (req, res) => {
  try {
    const result = await processTelegramWebhook(req.headers as Record<string, string>, req.body);
    if (!result.success && result.code === "UNAUTHORIZED") {
      res.status(401).json({ error: result.message });
      return;
    }
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: true });
  }
});

// Public WhatsApp Webhook GET Verification Endpoint
webhookRouter.get("/whatsapp", (req, res) => {
  const result = verifyWhatsAppWebhook(req.query);
  if (result.valid && result.challenge) {
    res.status(200).send(result.challenge);
    return;
  }
  res.status(403).send("Forbidden");
});

// Public WhatsApp Webhook POST Delivery Status Update Endpoint
webhookRouter.post("/whatsapp", async (req, res) => {
  try {
    await processWhatsAppWebhook(req.body);
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: true });
  }
});
