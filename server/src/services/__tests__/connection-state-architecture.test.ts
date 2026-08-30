import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeProviderName,
  getIntegrationStatus,
} from "../integrations/integration.service.js";

test("1. normalizeProviderName canonicalizes provider aliases correctly", () => {
  assert.equal(normalizeProviderName("google_calendar"), "google-calendar");
  assert.equal(normalizeProviderName("calendar"), "google-calendar");
  assert.equal(normalizeProviderName("Google-Calendar"), "google-calendar");

  assert.equal(normalizeProviderName("gmail"), "gmail");
  assert.equal(normalizeProviderName("google-mail"), "gmail");
  assert.equal(normalizeProviderName("mail"), "gmail");

  assert.equal(normalizeProviderName("google_drive"), "google-drive");
  assert.equal(normalizeProviderName("drive"), "google-drive");

  assert.equal(normalizeProviderName("google_docs"), "google-docs");
  assert.equal(normalizeProviderName("docs"), "google-docs");

  assert.equal(normalizeProviderName("teams"), "microsoft-teams");
  assert.equal(normalizeProviderName("microsoft_teams"), "microsoft-teams");

  assert.equal(normalizeProviderName("whatsapp-business"), "whatsapp");
  assert.equal(normalizeProviderName("WhatsApp"), "whatsapp");
});

test("2. getIntegrationStatus returns structured disconnected status for unconnected user", async () => {
  const dummyUserId = "test-user-unconnected-12345";
  const providers = [
    "gmail",
    "google-calendar",
    "google-drive",
    "notion",
    "slack",
    "microsoft-teams",
    "telegram",
    "whatsapp",
  ];

  for (const provider of providers) {
    const status = await getIntegrationStatus(dummyUserId, provider);
    assert.equal(status.status, "disconnected");
    assert.equal(typeof status.label, "string");
    assert.ok(Array.isArray(status.capabilities));
  }
});
