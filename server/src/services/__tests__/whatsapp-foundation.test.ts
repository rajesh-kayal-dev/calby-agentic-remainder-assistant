import { test } from "node:test";
import assert from "node:assert/strict";

import { WhatsAppNotificationChannel } from "../notifications/whatsapp-channel.service.js";
import { NotificationChannelRegistry } from "../notifications/channel-registry.js";
import {
  saveWhatsAppConfiguration,
  getWhatsAppConnectionStatus,
  disconnectWhatsApp,
  getDecryptedWhatsAppCredentials,
} from "../notifications/whatsapp-connection.service.js";
import { NotificationPayload } from "../notifications/notification-channel.interface.js";

test("1. WhatsAppNotificationChannel exposes channelId = 'whatsapp' and name", () => {
  const channel = new WhatsAppNotificationChannel();
  assert.equal(channel.channelId, "whatsapp");
  assert.equal(channel.name, "WhatsApp Notification");
  assert.equal(channel.isConfigured(), true);
});

test("2. WhatsAppNotificationChannel is auto-registered in NotificationChannelRegistry", () => {
  const registry = new NotificationChannelRegistry();
  assert.ok(registry.hasChannel("whatsapp"));

  const channel = registry.getChannel("whatsapp");
  assert.ok(channel);
  assert.equal(channel.channelId, "whatsapp");
});

test("3. saveWhatsAppConfiguration throws error for missing required fields", async () => {
  await assert.rejects(
    async () => {
      await saveWhatsAppConfiguration({
        authUserId: "test_user_wa",
        phoneNumberId: "",
        accessToken: "EAAG_test_token_123",
      });
    },
    { message: "WhatsApp Phone Number ID is required" },
  );

  await assert.rejects(
    async () => {
      await saveWhatsAppConfiguration({
        authUserId: "test_user_wa",
        phoneNumberId: "109283746",
        accessToken: "",
      });
    },
    { message: "WhatsApp Permanent Access Token is required" },
  );
});

test("4. getWhatsAppConnectionStatus returns disconnected state on DB lookup failure or empty record", async () => {
  const status = await getWhatsAppConnectionStatus("non_existent_user_xyz");
  assert.equal(status.connected, false);
  assert.equal(status.status, "disconnected");
  assert.equal((status as any).accessToken, undefined);
  assert.equal((status as any).encryptedAccessToken, undefined);
});

test("5. getDecryptedWhatsAppCredentials returns null when no active connection exists", async () => {
  const creds = await getDecryptedWhatsAppCredentials("non_existent_user_xyz");
  assert.equal(creds, null);
});

test("6. WhatsAppNotificationChannel.send() returns structured foundation error in Step 15A", async () => {
  const channel = new WhatsAppNotificationChannel();
  const payload: NotificationPayload = {
    deliveryId: "del_wa_123",
    authUserId: "test_user_wa",
    title: "Test Reminder",
    message: "Test Message",
  };

  const result = await channel.send(payload);
  assert.equal(result.success, false);
  assert.equal(result.channel, "whatsapp");
  assert.ok(result.errorMessage && result.errorMessage.length > 0);
});

test("7. disconnectWhatsApp handles disconnected state cleanly", async () => {
  const res = await disconnectWhatsApp("test_user_wa");
  assert.equal(typeof res, "boolean");
});
