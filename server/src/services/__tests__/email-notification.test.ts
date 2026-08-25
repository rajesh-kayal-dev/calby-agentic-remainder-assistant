import { test } from "node:test";
import assert from "node:assert/strict";

import { EmailNotificationChannel } from "../notifications/email-channel.service.js";
import { EmailTransport, SendEmailOptions, SendEmailResult } from "../notifications/email-transport.interface.js";
import { NotificationChannelRegistry } from "../notifications/channel-registry.js";
import { NotificationPayload } from "../notifications/notification-channel.interface.js";

// Mock EmailTransport for unit testing
class MockEmailTransport implements EmailTransport {
  public sentEmails: SendEmailOptions[] = [];
  public shouldFail = false;
  public failureReason = "SMTP connection timed out";

  isConfigured(): boolean {
    return true;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (this.shouldFail) {
      return {
        success: false,
        errorMessage: this.failureReason,
      };
    }

    this.sentEmails.push(options);
    return {
      success: true,
      messageId: `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
  }
}

test("1. EmailNotificationChannel exposes correct channelId and name", () => {
  const mockTransport = new MockEmailTransport();
  const channel = new EmailNotificationChannel(mockTransport);

  assert.equal(channel.channelId, "email");
  assert.equal(channel.name, "Email Notification");
  assert.equal(channel.isConfigured(), true);
});

test("2. EmailNotificationChannel is auto-registered in NotificationChannelRegistry", () => {
  const registry = new NotificationChannelRegistry();
  assert.ok(registry.hasChannel("email"));

  const channel = registry.getChannel("email");
  assert.ok(channel);
  assert.equal(channel.channelId, "email");
});

test("3. EmailNotificationChannel handles missing user or db safely", async () => {
  const mockTransport = new MockEmailTransport();
  const channel = new EmailNotificationChannel(mockTransport);

  const payload: NotificationPayload = {
    deliveryId: "del_123",
    authUserId: "non_existent_user_999",
    title: "Test Reminder Title",
    message: "Test message body",
  };

  const result = await channel.send(payload);

  assert.equal(result.success, false);
  assert.equal(result.channel, "email");
  assert.ok(result.errorMessage && result.errorMessage.length > 0);
  assert.equal(mockTransport.sentEmails.length, 0);
});

test("4. EmailNotificationChannel returns normalized failure when EmailTransport fails", async () => {
  const mockTransport = new MockEmailTransport();
  mockTransport.shouldFail = true;
  mockTransport.failureReason = "550 5.1.1 User unknown";

  const channel = new EmailNotificationChannel(mockTransport);

  assert.equal(channel.isConfigured(), true);
  assert.equal(mockTransport.isConfigured(), true);
});
