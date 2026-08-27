import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

import { closePool, getPool } from "../../db/pool.js";
import { ensureUser } from "../../repositories/user.repository.js";
import { createTaskList, createTask, getTask, updateTask, listTasks, calculateNextOccurrence } from "../task.service.js";
import { getReminderByTaskId, createReminder } from "../reminder.service.js";
import { executeTool } from "../../tools/tool-router.js";

const TEST_USER_A = "test_intel_user_a";
const TEST_USER_B = "test_intel_user_b";

let sharedTaskListId = "";

async function cleanTasks() {
  const client = await getPool().connect();
  try {
    await client.query("DELETE FROM reminders WHERE task_id IN (SELECT id FROM tasks WHERE auth_user_id = $1)", [TEST_USER_A]);
    await client.query("DELETE FROM tasks WHERE auth_user_id = $1", [TEST_USER_A]);
  } finally {
    client.release();
  }
}

before(async () => {
  await ensureUser({ authUserId: TEST_USER_A, email: "user_a_intel@test.com" });
  await ensureUser({ authUserId: TEST_USER_B, email: "user_b_intel@test.com" });

  const list = await createTaskList(TEST_USER_A, "Intel List", "Test List");
  sharedTaskListId = list.id;
});

after(async () => {
  await cleanTasks();
  await closePool();
});

// ==========================================
// 1. TIMEZONE & RECURRENCE MATH TESTS
// ==========================================

test("1. calculateNextOccurrence daily, weekly, monthly math", () => {
  const start = new Date("2026-08-25T10:00:00.000Z"); // Tuesday

  // Daily
  const nextDaily = calculateNextOccurrence(start, "daily", "Asia/Kolkata");
  assert.equal(nextDaily.toISOString(), "2026-08-26T10:00:00.000Z");

  // Weekly
  const nextWeekly = calculateNextOccurrence(start, "weekly", "Asia/Kolkata");
  assert.equal(nextWeekly.toISOString(), "2026-09-01T10:00:00.000Z"); // Next Tuesday

  // Monthly
  const nextMonthly = calculateNextOccurrence(start, "monthly", "Asia/Kolkata");
  assert.equal(nextMonthly.toISOString(), "2026-09-25T10:00:00.000Z"); // Same day next month
});

test("2. calculateNextOccurrence handles DST transitions gracefully", () => {
  // DST start in US Eastern timezone (March 8, 2026: clocks jump from 02:00 to 03:00)
  const start = new Date("2026-03-02T14:00:00.000Z"); // Monday, local time 09:00 EST (UTC-5)
  
  const nextWeekly = calculateNextOccurrence(start, "weekly", "America/New_York");
  // Next weekly due is Monday, March 9 at 09:00 EDT (UTC-4) -> 13:00 UTC
  assert.equal(nextWeekly.toISOString(), "2026-03-09T13:00:00.000Z");
});

// ==========================================
// 2. TASK RESOLUTION & AMBIGUITY HANDLING TESTS
// ==========================================

test("3. task.complete handles duplicate matches by returning AMBIGUOUS_TASK", async () => {
  await cleanTasks();

  // Create two tasks with the same title "Netflix subscription"
  const task1 = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "Netflix subscription",
  });
  const task2 = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "Netflix subscription",
  });

  const res = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "task.complete",
    input: {
      title: "Netflix subscription",
    },
  });

  assert.ok(res.success);
  assert.equal(res.data.status, "AMBIGUOUS_TASK");
  assert.ok(Array.isArray(res.data.matches));
  assert.equal(res.data.matches.length, 2);
});

test("4. task.complete completes successfully when single match is found", async () => {
  await cleanTasks();

  const task = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "Unique Netflix Title",
  });

  const res = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "task.complete",
    input: {
      title: "Unique Netflix Title",
    },
  });

  assert.ok(res.success);
  assert.ok(res.data.completed);
  assert.equal(res.data.id, task.id);
});

// ==========================================
// 3. TASK FILTERING & OVERDUE ENGINE TESTS
// ==========================================

test("5. advanced task filtering and overdue calculations", async () => {
  await cleanTasks();

  const now = new Date();
  const past = new Date(now.getTime() - 3600000); // 1 hour ago
  const future = new Date(now.getTime() + 3600000); // 1 hour future

  const task1 = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "Urgent Payment Task",
    priority: "urgent",
    dueAt: future,
  });

  const task2 = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "Overdue Library Book",
    priority: "medium",
    dueAt: past, // Overdue!
  });

  // Filter 1: Priority
  const urgentTasks = await listTasks(TEST_USER_A, { priority: "urgent" });
  assert.ok(urgentTasks.some(t => t.id === task1.id));
  assert.ok(!urgentTasks.some(t => t.id === task2.id));

  // Filter 2: Overdue
  const overdueTasks = await listTasks(TEST_USER_A, { overdue: true });
  assert.ok(overdueTasks.some(t => t.id === task2.id));
  assert.ok(!overdueTasks.some(t => t.id === task1.id));

  // Filter 3: Search text
  const searchTasks = await listTasks(TEST_USER_A, { search: "Library" });
  assert.ok(searchTasks.some(t => t.id === task2.id));
  assert.ok(!searchTasks.some(t => t.id === task1.id));
});

// ==========================================
// 4. TASK UPDATE AUTHORIZATION TESTS
// ==========================================

test("6. task update rejects requests for tasks not owned by the user", async () => {
  await cleanTasks();

  const task = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "User A Private Task",
  });

  // User B tries to update User A's task
  await assert.rejects(async () => {
    await updateTask(TEST_USER_B, task.id, { title: "Hacked!" });
  }, /not found/i);
});

// ==========================================
// 5. RECURRING TASK FOUNDATION & PROPAGATION
// ==========================================

test("7. daily recurrence rules generate the next pending occurrence with copied metadata", async () => {
  await cleanTasks();

  const start = new Date("2026-08-25T10:00:00.000Z");

  const task = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "Daily Standup Meeting",
    description: "Brief team status sync",
    priority: "high",
    dueAt: start,
    recurrenceRule: "daily",
    recurrenceTimezone: "Asia/Kolkata",
  });

  // Schedule a reminder for task 1 to verify reminder clone
  const reminder = await createReminder({
    authUserId: TEST_USER_A,
    title: "Daily Standup Reminder",
    dueAt: new Date(start.getTime() - 600000), // 10 minutes before
    channel: "in_app",
    taskId: task.id,
  });

  // Complete the recurring task
  const completedTask = await updateTask(TEST_USER_A, task.id, { status: "completed" });

  assert.equal(completedTask.status, "completed");
  assert.ok(completedTask.completed_at);

  // Verify next occurrence is created
  const activeTasks = await listTasks(TEST_USER_A, { status: "pending" });
  const nextOccur = activeTasks.find(t => t.title === "Daily Standup Meeting");
  assert.ok(nextOccur);
  assert.notEqual(nextOccur.id, task.id);
  assert.equal(nextOccur.recurrence_rule, "daily");
  assert.equal(nextOccur.priority, "high");
  assert.equal(nextOccur.description, "Brief team status sync");
  assert.equal(nextOccur.due_at?.toISOString(), "2026-08-26T10:00:00.000Z");
  assert.equal(nextOccur.next_occurrence_at?.toISOString(), "2026-08-27T10:00:00.000Z");

  // Verify reminder has also propagated with correct relative offset
  const nextReminder = await getReminderByTaskId(TEST_USER_A, nextOccur.id);
  assert.ok(nextReminder);
  assert.equal(nextReminder.due_at.toISOString(), "2026-08-26T09:50:00.000Z"); // 10 mins before 10:00 UTC
});

// ==========================================
// 6. WORKER CONCURRENCY LOCK TESTS
// ==========================================

test("8. concurrent completion requests do not create duplicate next occurrences", async () => {
  await cleanTasks();

  const start = new Date("2026-08-25T10:00:00.000Z");

  const task = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "Weekly Status Report",
    dueAt: start,
    recurrenceRule: "weekly",
    recurrenceTimezone: "Asia/Kolkata",
  });

  // Call updateTask concurrently to simulate two workers executing completion at the same instant
  const results = await Promise.allSettled([
    updateTask(TEST_USER_A, task.id, { status: "completed" }),
    updateTask(TEST_USER_A, task.id, { status: "completed" }),
  ]);

  // Ensure both succeeded (due to idempotency check returning the locked record)
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].status, "fulfilled");

  // Verify only exactly ONE next task is created
  const pendingTasks = await listTasks(TEST_USER_A, { status: "pending" });
  const nextOccurrences = pendingTasks.filter(t => t.title === "Weekly Status Report");
  assert.equal(nextOccurrences.length, 1);
});

// ==========================================
// 7. OVERDUE REMINDER BATCH PREVIEWS
// ==========================================

test("9. task.schedule_overdue_reminders requires confirmation for multiple reminders", async () => {
  await cleanTasks();

  const past = new Date(Date.now() - 3600000);

  const t1 = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "Overdue Task 1",
    dueAt: past,
  });
  const t2 = await createTask(TEST_USER_A, sharedTaskListId, {
    title: "Overdue Task 2",
    dueAt: past,
  });

  const reminderTime = new Date(Date.now() + 86400000).toISOString(); // tomorrow

  // Request preview
  const res1 = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "task.schedule_overdue_reminders",
    input: {
      reminderTimeIso: reminderTime,
      channel: "in_app",
      confirmed: false,
    },
  });

  assert.ok(res1.success);
  assert.equal(res1.data.status, "REQUIRES_CONFIRMATION");
  assert.ok(res1.data.preview);
  assert.equal(res1.data.preview.count, 2);

  // Confirm schedule
  const res2 = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "task.schedule_overdue_reminders",
    input: {
      reminderTimeIso: reminderTime,
      channel: "in_app",
      confirmed: true,
    },
  });

  assert.ok(res2.success);
  assert.equal(res2.data.status, "SUCCESS");
  assert.equal(res2.data.count, 2);
  assert.ok(Array.isArray(res2.data.reminders));
  assert.equal(res2.data.reminders.length, 2);
});
