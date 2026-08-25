import { test } from "node:test";
import assert from "node:assert/strict";

import {
  processTelegramWebhook,
  verifyWhatsAppWebhook,
  processWhatsAppWebhook,
} from "../webhook.service.js";

test("1. processTelegramWebhook enforces secret token authentication header when configured", async () => {
  process.env.TELEGRAM_WEBHOOK_SECRET = "super-secret-telegram-token";

  try {
    // Missing or invalid secret header
    const invalidRes = await processTelegramWebhook(
      { "x-telegram-bot-api-secret-token": "wrong-secret" },
      { message: { text: "hello" } },
    );

    assert.equal(invalidRes.success, false);
    assert.equal(invalidRes.code, "UNAUTHORIZED");

    // Valid secret header
    const validRes = await processTelegramWebhook(
      { "x-telegram-bot-api-secret-token": "super-secret-telegram-token" },
      { message: { text: "hello" } },
    );

    assert.equal(validRes.success, true);
    assert.equal(validRes.processed, false);
  } finally {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  }
});

test("2. processTelegramWebhook safely ignores malformed or non-start messages", async () => {
  const res = await processTelegramWebhook({}, { random: "payload" });
  assert.equal(res.success, true);
  assert.equal(res.processed, false);
});

test("3. verifyWhatsAppWebhook validates mode and verification token", () => {
  // Valid verification request
  const validRes = verifyWhatsAppWebhook({
    "hub.mode": "subscribe",
    "hub.verify_token": "calby-whatsapp-verify-token",
    "hub.challenge": "challenge_12345",
  });

  assert.equal(validRes.valid, true);
  assert.equal(validRes.challenge, "challenge_12345");

  // Invalid verify_token
  const invalidRes = verifyWhatsAppWebhook({
    "hub.mode": "subscribe",
    "hub.verify_token": "invalid-token",
    "hub.challenge": "challenge_12345",
  });

  assert.equal(invalidRes.valid, false);
});

test("4. processWhatsAppWebhook parses delivery statuses safely and handles unknown message IDs", async () => {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [
                {
                  id: "wamid.HBgLMTIzNDU2Nzg5M",
                  status: "delivered",
                  timestamp: "1700000000",
                },
                {
                  id: "wamid.HBgLOTg3NjU0MzIxM",
                  status: "failed",
                  timestamp: "1700000005",
                  errors: [{ title: "User opted out" }],
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const res = await processWhatsAppWebhook(payload);
  assert.equal(res.success, true);
  assert.equal(typeof res.processedCount, "number");
});
