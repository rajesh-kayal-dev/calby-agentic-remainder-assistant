import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calculateNextExecution,
  createReminder,
  getUserReminders,
  pauseReminder,
  resumeReminder,
  cancelReminder,
  processDueReminder,
} from "../reminder.service.js";
import { InAppNotificationChannel } from "../notifications/in-app-channel.service.js";
import { TOOLS_REGISTRY } from "../../tools/tools.registry.js";
import { executeTool } from "../../tools/tool-router.js";

test("1. calculateNextExecution handles recurrence calculations", () => {
  const baseDate = new Date("2026-09-10T10:00:00.000Z");

  const noneNext = calculateNextExecution(baseDate, "none");
  assert.equal(noneNext, null);

  const dailyNext = calculateNextExecution(baseDate, "daily");
  assert.ok(dailyNext);
  assert.equal(dailyNext.toISOString(), "2026-09-11T10:00:00.000Z");

  const weeklyNext = calculateNextExecution(baseDate, "weekly");
  assert.ok(weeklyNext);
  assert.equal(weeklyNext.toISOString(), "2026-09-17T10:00:00.000Z");

  const monthlyNext = calculateNextExecution(baseDate, "monthly");
  assert.ok(monthlyNext);
  assert.equal(monthlyNext.toISOString(), "2026-10-10T10:00:00.000Z");

  const yearlyNext = calculateNextExecution(baseDate, "yearly");
  assert.ok(yearlyNext);
  assert.equal(yearlyNext.toISOString(), "2027-09-10T10:00:00.000Z");
});

test("2. InAppNotificationChannel implements NotificationChannel interface", async () => {
  const channel = new InAppNotificationChannel();
  assert.equal(channel.channelId, "in_app");
  assert.equal(channel.name, "In-App Notification");
});

test("3. Native AI reminder tools are registered in TOOLS_REGISTRY", () => {
  assert.ok(TOOLS_REGISTRY["reminder.create"]);
  assert.ok(TOOLS_REGISTRY["reminder.list"]);
  assert.ok(TOOLS_REGISTRY["reminder.cancel"]);

  assert.equal(TOOLS_REGISTRY["reminder.create"].category, "PRODUCTIVITY");
  assert.equal(TOOLS_REGISTRY["reminder.list"].category, "PRODUCTIVITY");
  assert.equal(TOOLS_REGISTRY["reminder.cancel"].category, "PRODUCTIVITY");
});

test("4. Invalid reminder input fails Zod schema validation in Tool Router", async () => {
  const result = await executeTool({
    authUserId: "test-user-123",
    toolId: "reminder.create",
    input: {
      title: "", // empty title should fail Zod validation
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "INVALID_INPUT");
});
