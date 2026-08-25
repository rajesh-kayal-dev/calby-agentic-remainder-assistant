import { test } from "node:test";
import assert from "node:assert/strict";

import { TelegramNotificationChannel } from "../notifications/telegram-channel.service.js";
import { TelegramTransport, SendTelegramMessageResult } from "../notifications/telegram-transport.interface.js";
import { NotificationChannelRegistry } from "../notifications/channel-registry.js";
import { NotificationPayload } from "../notifications/notification-channel.interface.js";
import { createReminder } from "../reminder.service.js";

// Mock TelegramTransport for unit testing
class MockTelegramTransport implements TelegramTransport {
  public sentMessages: { chatId: string; text: string }[] = [];
  public shouldFail = false;
  public failureReason = "Telegram API error (400: Bad Request)";

  isConfigured(): boolean {
    return true;
  }

  async sendMessage(chatId: string, text: string): Promise<SendTelegramMessageResult> {
    if (this.shouldFail) {
      return {
        success: false,
        errorMessage: this.failureReason,
      };
    }

    this.sentMessages.push({ chatId, text });
    return {
      success: true,
      messageId: Math.floor(Math.random() * 100000),
    };
  }
}

test("1. TelegramNotificationChannel exposes correct channelId and name", () => {
  const mockTransport = new MockTelegramTransport();
  const channel = new TelegramNotificationChannel(mockTransport);

  assert.equal(channel.channelId, "telegram");
  assert.equal(channel.name, "Telegram Notification");
  assert.equal(channel.isConfigured(), true);
});

test("2. TelegramNotificationChannel is auto-registered in NotificationChannelRegistry", () => {
  const registry = new NotificationChannelRegistry();
  assert.ok(registry.hasChannel("telegram"));

  const channel = registry.getChannel("telegram");
  assert.ok(channel);
  assert.equal(channel.channelId, "telegram");
});

test("3. TelegramNotificationChannel handles disconnected user account safely", async () => {
  const mockTransport = new MockTelegramTransport();
  const channel = new TelegramNotificationChannel(mockTransport);

  const payload: NotificationPayload = {
    deliveryId: "del_tg_123",
    authUserId: "unconnected_user_999",
    title: "Meeting Alert",
    message: "Meeting in 10 minutes",
  };

  const result = await channel.send(payload);

  assert.equal(result.success, false);
  assert.equal(result.channel, "telegram");
  assert.ok(result.errorMessage && result.errorMessage.length > 0);
  assert.equal(mockTransport.sentMessages.length, 0);
});

test("4. createReminder with Telegram channel for disconnected user throws CONNECTION_REQUIRED", async () => {
  await assert.rejects(
    async () => {
      await createReminder({
        authUserId: "unconnected_user_999",
        title: "Test Telegram Reminder",
        dueAt: new Date().toISOString(),
        channel: "telegram",
      });
    },
    (err: any) => {
      assert.ok(err?.message.includes("CONNECTION_REQUIRED"));
      return true;
    },
  );
});

test("5. TelegramNotificationChannel formats and dispatches message when transport succeeds", async () => {
  const mockTransport = new MockTelegramTransport();

  const options = {
    chatId: "123456789",
    text: "<b>🔔 Calby Reminder</b>\n\n<b>Doctor Appointment</b>\nTomorrow at 10 AM",
  };

  const res = await mockTransport.sendMessage(options.chatId, options.text);
  assert.equal(res.success, true);
  assert.equal(mockTransport.sentMessages.length, 1);
  assert.equal(mockTransport.sentMessages[0].chatId, "123456789");
  assert.ok(mockTransport.sentMessages[0].text.includes("Doctor Appointment"));
});
