import { test } from "node:test";
import assert from "node:assert/strict";

import {
  WhatsAppNotificationChannel,
  normalizeE164PhoneNumber,
} from "../notifications/whatsapp-channel.service.js";
import {
  WhatsAppTransport,
  SendWhatsAppMessageOptions,
  SendWhatsAppMessageResult,
} from "../notifications/whatsapp-transport.interface.js";
import { NotificationPayload } from "../notifications/notification-channel.interface.js";

class MockWhatsAppTransport implements WhatsAppTransport {
  public sentOptions: SendWhatsAppMessageOptions[] = [];
  public shouldFail = false;
  public failureReason = "Meta API error (400 Bad Request)";

  isConfigured(): boolean {
    return true;
  }

  async sendMessage(options: SendWhatsAppMessageOptions): Promise<SendWhatsAppMessageResult> {
    if (this.shouldFail) {
      return {
        success: false,
        errorMessage: this.failureReason,
        isRateLimited: this.failureReason.includes("rate limit"),
      };
    }

    this.sentOptions.push(options);
    return {
      success: true,
      messageId: `wamid.HBgL${Date.now()}`,
    };
  }
}

test("1. normalizeE164PhoneNumber normalizes phone numbers and rejects invalid input", () => {
  assert.equal(normalizeE164PhoneNumber("+1 (555) 019-2831"), "15550192831");
  assert.equal(normalizeE164PhoneNumber("15550192831"), "15550192831");
  assert.equal(normalizeE164PhoneNumber("invalid"), null);
  assert.equal(normalizeE164PhoneNumber("123"), null);
  assert.equal(normalizeE164PhoneNumber(null), null);
});

test("2. WhatsAppNotificationChannel.send() rejects missing credentials cleanly", async () => {
  const mockTransport = new MockWhatsAppTransport();
  const channel = new WhatsAppNotificationChannel(mockTransport);

  const payload: NotificationPayload = {
    deliveryId: "del_wa_test_1",
    authUserId: "user_unconfigured_wa",
    title: "Meeting Alert",
    message: "Meeting in 10 mins",
  };

  const result = await channel.send(payload);

  assert.equal(result.success, false);
  assert.equal(result.channel, "whatsapp");
  assert.ok(result.errorMessage && result.errorMessage.length > 0);
  assert.equal(mockTransport.sentOptions.length, 0);
});

test("3. MockWhatsAppTransport captures message dispatch and returns wamid provider ID", async () => {
  const mockTransport = new MockWhatsAppTransport();

  const res = await mockTransport.sendMessage({
    phoneNumberId: "109283746",
    recipientPhoneNumber: "15550192831",
    accessToken: "EAAG_mock_access_token",
    messageText: "Calby Reminder: Doctor Appointment",
  });

  assert.equal(res.success, true);
  assert.ok(res.messageId && res.messageId.startsWith("wamid."));
  assert.equal(mockTransport.sentOptions.length, 1);
  assert.equal(mockTransport.sentOptions[0].phoneNumberId, "109283746");
  assert.equal(mockTransport.sentOptions[0].recipientPhoneNumber, "15550192831");
});

test("4. MockWhatsAppTransport handles rate limit and auth failures cleanly", async () => {
  const mockTransport = new MockWhatsAppTransport();
  mockTransport.shouldFail = true;
  mockTransport.failureReason = "Meta API rate limit reached (130429)";

  const res = await mockTransport.sendMessage({
    phoneNumberId: "109283746",
    recipientPhoneNumber: "15550192831",
    accessToken: "EAAG_mock_access_token",
    messageText: "Test Message",
  });

  assert.equal(res.success, false);
  assert.equal(res.isRateLimited, true);
  assert.ok(res.errorMessage?.includes("rate limit"));
});
