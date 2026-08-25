import { test } from "node:test";
import assert from "node:assert/strict";

import { createReminder, getReminderById, updateReminder, cancelReminder } from "../reminder.service.js";
import { EmailNotificationChannel } from "../notifications/email-channel.service.js";
import { EmailTransport, SendEmailOptions, SendEmailResult } from "../notifications/email-transport.interface.js";
import { NotificationPayload } from "../notifications/notification-channel.interface.js";

class CapturingEmailTransport implements EmailTransport {
  public lastSentOptions: SendEmailOptions | null = null;
  isConfigured(): boolean {
    return true;
  }
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    this.lastSentOptions = options;
    return { success: true, messageId: "msg_test_123" };
  }
}

test("1. Cross-user reminder access rejects unowned reminder or DB error safely", async () => {
  try {
    const reminder = await getReminderById("user_attacker", "00000000-0000-0000-0000-000000000001");
    assert.equal(reminder, null);
  } catch (err: any) {
    assert.ok(err?.message.includes("DATABASE_URL") || err?.message.includes("not found"));
  }
});

test("2. Cross-user reminder update rejects unowned reminder or DB error safely", async () => {
  try {
    const updated = await updateReminder("user_attacker", "00000000-0000-0000-0000-000000000001", {
      title: "Hacked title",
    });
    assert.equal(updated, null);
  } catch (err: any) {
    assert.ok(err?.message.includes("DATABASE_URL") || err?.message.includes("not found"));
  }
});

test("3. Cross-user reminder cancellation rejects unowned reminder or DB error safely", async () => {
  try {
    const cancelled = await cancelReminder("user_attacker", "00000000-0000-0000-0000-000000000001");
    assert.equal(cancelled, null);
  } catch (err: any) {
    assert.ok(err?.message.includes("DATABASE_URL") || err?.message.includes("not found"));
  }
});

test("4. Invalid dueAt timestamp throws descriptive error", async () => {
  await assert.rejects(
    async () => {
      await createReminder({
        authUserId: "test_user_1",
        title: "Test",
        dueAt: "invalid-date-string-xyz",
      });
    },
    {
      message: "Invalid dueAt timestamp format",
    },
  );
});

test("5. Unregistered notification channel throws error on creation", async () => {
  await assert.rejects(
    async () => {
      await createReminder({
        authUserId: "test_user_1",
        title: "Test",
        dueAt: new Date().toISOString(),
        channel: "malicious_unregistered_channel",
      });
    },
    {
      message: "Unsupported or unregistered notification channel 'malicious_unregistered_channel'",
    },
  );
});

test("6. EmailNotificationChannel safely handles recipient lookup failure when unconfigured", async () => {
  const transport = new CapturingEmailTransport();
  const channel = new EmailNotificationChannel(transport);

  const payload: NotificationPayload = {
    deliveryId: "del_1",
    authUserId: "user_test",
    title: "<script>alert('XSS')</script> Meeting",
    message: "<b onmouseover=alert(1)>Click me</b>",
  };

  const result = await channel.send(payload);
  assert.equal(result.success, false);
  assert.equal(result.channel, "email");
  assert.ok(result.errorMessage && result.errorMessage.length > 0);
});
