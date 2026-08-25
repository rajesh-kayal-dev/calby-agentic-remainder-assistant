import { test } from "node:test";
import assert from "node:assert/strict";

import {
  InlineNotificationDispatcher,
  BullMQNotificationDispatcher,
  createNotificationDispatcher,
} from "../notifications/notification-queue.service.js";

test("1. createNotificationDispatcher returns InlineNotificationDispatcher when REDIS_URL is unconfigured", () => {
  delete process.env.REDIS_URL;
  const dispatcher = createNotificationDispatcher();
  assert.equal(dispatcher.isRedisEnabled(), false);
  assert.equal(dispatcher instanceof InlineNotificationDispatcher, true);
});

test("2. InlineNotificationDispatcher processes delivery job gracefully without Redis", async () => {
  const dispatcher = new InlineNotificationDispatcher();
  await dispatcher.start();

  // Test dispatching a delivery job with mock IDs
  await dispatcher.dispatchDelivery({
    deliveryId: "del_inline_test_123",
    reminderId: "rem_inline_test_123",
    authUserId: "user_test_123",
    channel: "in_app",
    scheduledAt: new Date().toISOString(),
  });

  await dispatcher.stop();
  assert.equal(dispatcher.isRedisEnabled(), false);
});

test("3. BullMQNotificationDispatcher reports isRedisEnabled true when REDIS_URL is provided", () => {
  const dispatcher = new BullMQNotificationDispatcher("redis://localhost:6379");
  assert.equal(dispatcher.isRedisEnabled(), true);
});
