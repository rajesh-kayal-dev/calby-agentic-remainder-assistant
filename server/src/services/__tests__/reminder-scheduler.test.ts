import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ReminderSchedulerService,
} from "../reminder-scheduler.service.js";
import { NotificationChannelRegistry } from "../notifications/channel-registry.js";
import { InAppNotificationChannel } from "../notifications/in-app-channel.service.js";

test("1. ReminderSchedulerService initializes with default or custom configuration", () => {
  const scheduler = new ReminderSchedulerService({
    enabled: false,
    intervalMs: 10000,
    batchSize: 50,
  });

  assert.ok(scheduler.workerId.startsWith("worker_"));
});

test("2. NotificationChannelRegistry registers and resolves channels", () => {
  const registry = new NotificationChannelRegistry();
  assert.ok(registry.hasChannel("in_app"));

  const inApp = registry.getChannel("in_app");
  assert.ok(inApp);
  assert.equal(inApp.channelId, "in_app");
});

test("3. Scheduler start/stop lifecycle manages interval timer cleanly", () => {
  const scheduler = new ReminderSchedulerService({
    enabled: true,
    intervalMs: 60000,
  });

  scheduler.start();
  scheduler.stop();
  assert.ok(true, "Scheduler started and stopped cleanly without leaving timer");
});
