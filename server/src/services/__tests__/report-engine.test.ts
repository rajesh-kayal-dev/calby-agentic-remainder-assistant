import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

import { closePool, getPool } from "../../db/pool.js";
import { ensureUser } from "../../repositories/user.repository.js";
import { createContact } from "../contact.service.js";
import { createLedgerItem, recordPayment } from "../money.service.js";
import { createTask, createTaskList } from "../task.service.js";
import { createReminder } from "../reminder.service.js";

import {
  generatePendingMoneyReport,
  generateTaskSummaryReport,
  generateContactReport,
  generateMonthlySummaryReport,
  generateDailySummaryReport,
  generateOverdueReport,
  generateReport,
  resolveContactByName,
} from "../reports/report-engine.service.js";
import { resolveDateRange, tryResolveDateRange } from "../reports/date-range.service.js";
import { renderReport, renderReportSummaryLine } from "../reports/report-renderer.service.js";
import type { DateRangePreset } from "../reports/report.types.js";
import { executeTool } from "../../tools/tool-router.js";

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────────────────────

const TEST_USER_A = "test_report_user_a";
const TEST_USER_B = "test_report_user_b";

let contactA1Id = ""; // Rahul Sharma
let contactA2Id = ""; // Rahul Gupta (for ambiguity tests)
let contactB1Id = ""; // Suresh (User B's contact)
let taskListAId = "";

async function cleanData() {
  const client = await getPool().connect();
  try {
    await client.query(
      "DELETE FROM ledger_payments WHERE auth_user_id IN ($1, $2)",
      [TEST_USER_A, TEST_USER_B],
    );
    await client.query(
      "DELETE FROM ledger_items WHERE auth_user_id IN ($1, $2)",
      [TEST_USER_A, TEST_USER_B],
    );
    await client.query(
      "DELETE FROM notification_deliveries WHERE auth_user_id IN ($1, $2)",
      [TEST_USER_A, TEST_USER_B],
    );
    await client.query(
      "DELETE FROM reminders WHERE auth_user_id IN ($1, $2)",
      [TEST_USER_A, TEST_USER_B],
    );
    await client.query(
      "DELETE FROM tasks WHERE auth_user_id IN ($1, $2)",
      [TEST_USER_A, TEST_USER_B],
    );
    await client.query(
      "DELETE FROM task_lists WHERE auth_user_id IN ($1, $2)",
      [TEST_USER_A, TEST_USER_B],
    );
    await client.query(
      "DELETE FROM contacts WHERE auth_user_id IN ($1, $2)",
      [TEST_USER_A, TEST_USER_B],
    );
  } finally {
    client.release();
  }
}

before(async () => {
  await ensureUser({ authUserId: TEST_USER_A, email: "report_user_a@test.com" });
  await ensureUser({ authUserId: TEST_USER_B, email: "report_user_b@test.com" });

  await cleanData();

  // Contacts
  const cA1 = await createContact(TEST_USER_A, {
    name: "Rahul Sharma",
    phoneNumber: "9876543210",
  });
  contactA1Id = cA1.id;

  const cA2 = await createContact(TEST_USER_A, {
    name: "Rahul Gupta",
    phoneNumber: "9876543211",
  });
  contactA2Id = cA2.id;

  const cB1 = await createContact(TEST_USER_B, {
    name: "Suresh Kumar",
    phoneNumber: "8765432100",
  });
  contactB1Id = cB1.id;

  // Task list
  const tl = await createTaskList(TEST_USER_A, "Main");
  taskListAId = tl.id;

  // Money for Rahul Sharma (receivable)
  await createLedgerItem(TEST_USER_A, {
    contactId: contactA1Id,
    direction: "receivable",
    amount: 500,
    title: "Books",
  });
  await createLedgerItem(TEST_USER_A, {
    contactId: contactA1Id,
    direction: "receivable",
    amount: 300,
    title: "Food",
    dueAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // overdue
  });

  // Money for Rahul Gupta (payable)
  await createLedgerItem(TEST_USER_A, {
    contactId: contactA2Id,
    direction: "payable",
    amount: 200,
    title: "Loan",
  });

  // Tasks for User A
  await createTask(TEST_USER_A, taskListAId, {
    title: "Collect money",
    contactId: contactA1Id,
    dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // overdue
  });
  await createTask(TEST_USER_A, taskListAId, {
    title: "Send invoice",
    contactId: contactA1Id,
  });

  // Reminder
  await createReminder({
    authUserId: TEST_USER_A,
    recipientId: contactA1Id,
    title: "Follow up with Rahul",
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    channel: "in_app",
  });

  // User B's contact gets money too
  await createLedgerItem(TEST_USER_B, {
    contactId: contactB1Id,
    direction: "receivable",
    amount: 999,
    title: "Suresh's debt",
  });
});

after(async () => {
  await cleanData();
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Date Range Resolution
// ─────────────────────────────────────────────────────────────────────────────

test("Date Range - resolves presets correctly", async (t) => {
  const tz = "Asia/Kolkata";

  await t.test("today range contains current moment", () => {
    const range = resolveDateRange("today", tz);
    const now = new Date();
    assert.ok(range.startAt <= now);
    assert.ok(range.endAt >= now);
    assert.equal(range.label, "Today");
    assert.equal(range.timezone, tz);
  });

  await t.test("this_month start is before end", () => {
    const range = resolveDateRange("this_month", tz);
    assert.ok(range.startAt < range.endAt);
    assert.ok(range.label.length > 0);
  });

  await t.test("last_month is before this_month start", () => {
    const lastMonth = resolveDateRange("last_month", tz);
    const thisMonth = resolveDateRange("this_month", tz);
    assert.ok(lastMonth.endAt < thisMonth.startAt);
  });

  await t.test("last_30_days covers at least 29 days", () => {
    const range = resolveDateRange("last_30_days", tz);
    const diffMs = range.endAt.getTime() - range.startAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    assert.ok(diffDays >= 29);
  });

  await t.test("last_7_days covers at least 6 days", () => {
    const range = resolveDateRange("last_7_days", tz);
    const diffMs = range.endAt.getTime() - range.startAt.getTime();
    assert.ok(diffMs >= 6 * 24 * 60 * 60 * 1000);
  });

  await t.test("custom range requires both dates", () => {
    assert.throws(() => resolveDateRange("custom", tz), /Custom date range/);
  });

  await t.test("custom range with invalid date returns null via tryResolveDateRange", () => {
    const result = tryResolveDateRange("custom", tz, "not-a-date", "also-not");
    assert.equal(result, null);
  });

  await t.test("custom range with startAt >= endAt throws", () => {
    assert.throws(
      () =>
        resolveDateRange(
          "custom",
          tz,
          "2026-08-20T00:00:00Z",
          "2026-08-10T00:00:00Z",
        ),
      /startAt must be before endAt/,
    );
  });

  await t.test("UTC timezone fallback works", () => {
    const range = resolveDateRange("today", "UTC");
    assert.equal(range.timezone, "UTC");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pending Money Report
// ─────────────────────────────────────────────────────────────────────────────

test("Pending Money Report", async (t) => {
  await t.test("generates structured report with correct totals", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_A);

    assert.equal(report.type, "pending_money");
    assert.ok(report.metadata.title.length > 0);
    assert.ok(report.metadata.generatedAt);

    // Rahul Sharma: 500 + 300 = 800 receivable
    // Rahul Gupta: 200 payable
    assert.equal(report.summary.totalReceivable, 800);
    assert.equal(report.summary.totalPayable, 200);
    assert.equal(report.summary.netPending, 600);
    assert.equal(report.summary.itemCount, 3);
  });

  await t.test("multi-currency: receivableByCurrency grouped correctly", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_A);
    // All items are INR by default
    assert.ok(report.summary.receivableByCurrency.some((c) => c.currency === "INR"));
  });

  await t.test("contact filter scopes correctly", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_A, contactA1Id);
    assert.equal(report.summary.totalReceivable, 800);
    assert.equal(report.summary.totalPayable, 0);
    assert.equal(report.summary.itemCount, 2);
  });

  await t.test("cross-user isolation: User A cannot see User B's items", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_A);
    const items = (report.sections[0]?.data as any)?.items ?? [];
    const hasB = items.some((i: any) => i.title === "Suresh's debt");
    assert.equal(hasB, false);
  });

  await t.test("empty report returns zero totals", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_B, "00000000-0000-0000-0000-000000000001");
    assert.equal(report.summary.totalReceivable, 0);
    assert.equal(report.summary.totalPayable, 0);
    assert.equal(report.summary.itemCount, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Task Summary Report
// ─────────────────────────────────────────────────────────────────────────────

test("Task Summary Report", async (t) => {
  await t.test("generates correct counts", async () => {
    const report = await generateTaskSummaryReport(TEST_USER_A);
    assert.equal(report.type, "task_summary");
    assert.equal(report.summary.total, 2);
    assert.equal(report.summary.pending, 2);
    assert.equal(report.summary.completed, 0);
    assert.equal(report.summary.overdue, 1); // one task due in the past
  });

  await t.test("completion rate is 0% when none completed", async () => {
    const report = await generateTaskSummaryReport(TEST_USER_A);
    assert.equal(report.summary.completionRatePercent, 0);
  });

  await t.test("zero-task completion is safe (no division error)", async () => {
    const report = await generateTaskSummaryReport(TEST_USER_B); // User B has no tasks
    assert.equal(report.summary.total, 0);
    assert.equal(report.summary.completionRatePercent, 0);
  });

  await t.test("contact filter scopes task query", async () => {
    const report = await generateTaskSummaryReport(TEST_USER_A, undefined, contactA1Id);
    assert.equal(report.summary.total, 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Contact Report
// ─────────────────────────────────────────────────────────────────────────────

test("Contact Report", async (t) => {
  await t.test("generates full contact report", async () => {
    const report = await generateContactReport(TEST_USER_A, contactA1Id);
    assert.equal(report.type, "contact_summary");
    assert.equal(report.summary.contact.name, "Rahul Sharma");
    assert.equal(report.summary.money.summary.totalReceivable, 800);
    assert.equal(report.summary.tasks.summary.total, 2);
    assert.equal(report.summary.reminders.summary.active, 1);
  });

  await t.test("unknown contact throws CONTACT_NOT_FOUND", async () => {
    await assert.rejects(
      () => generateContactReport(TEST_USER_A, "00000000-0000-0000-0000-000000000000"),
      /CONTACT_NOT_FOUND/,
    );
  });

  await t.test("cross-user: User A cannot get User B's contact report", async () => {
    await assert.rejects(
      () => generateContactReport(TEST_USER_A, contactB1Id),
      /CONTACT_NOT_FOUND/,
    );
  });

  await t.test("has sections: money, tasks, reminders", async () => {
    const report = await generateContactReport(TEST_USER_A, contactA1Id);
    const ids = report.sections.map((s) => s.id);
    assert.ok(ids.includes("money"));
    assert.ok(ids.includes("tasks"));
    assert.ok(ids.includes("reminders"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Monthly Summary Report
// ─────────────────────────────────────────────────────────────────────────────

test("Monthly Summary Report", async (t) => {
  await t.test("generates report with money, tasks, reminders sections", async () => {
    const report = await generateMonthlySummaryReport(TEST_USER_A, "this_month");
    assert.equal(report.type, "monthly_summary");
    const ids = report.sections.map((s) => s.id);
    assert.ok(ids.includes("money"));
    assert.ok(ids.includes("tasks"));
    assert.ok(ids.includes("reminders"));
    assert.ok(ids.includes("top_contacts"));
  });

  await t.test("last_month preset returns a valid report", async () => {
    const report = await generateMonthlySummaryReport(TEST_USER_A, "last_month");
    assert.ok(report.metadata.dateRange);
    assert.ok(report.metadata.dateRange.label.length > 0);
  });

  await t.test("custom preset works with ISO strings", async () => {
    const start = "2026-01-01T00:00:00Z";
    const end = "2026-01-31T23:59:59Z";
    const report = await generateMonthlySummaryReport(TEST_USER_A, "custom", start, end);
    assert.ok(report.metadata.dateRange?.label.length);
  });

  await t.test("invalid custom date range throws", async () => {
    await assert.rejects(
      () => generateMonthlySummaryReport(TEST_USER_A, "custom", "bad", "dates"),
      /Invalid/,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Daily Summary Report
// ─────────────────────────────────────────────────────────────────────────────

test("Daily Summary Report", async (t) => {
  await t.test("generates daily summary with expected sections", async () => {
    const report = await generateDailySummaryReport(TEST_USER_A);
    assert.equal(report.type, "daily_summary");
    const ids = report.sections.map((s) => s.id);
    assert.ok(ids.includes("tasks"));
    assert.ok(ids.includes("reminders"));
    assert.ok(ids.includes("pending_money"));
  });

  await t.test("pending_money section has pending items", async () => {
    const report = await generateDailySummaryReport(TEST_USER_A);
    const moneySection = report.sections.find((s) => s.id === "pending_money");
    assert.ok(moneySection);
    assert.ok((moneySection.data as any).summary.itemCount >= 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Overdue Report
// ─────────────────────────────────────────────────────────────────────────────

test("Overdue Summary Report", async (t) => {
  await t.test("finds overdue money items (past due_at)", async () => {
    const report = await generateOverdueReport(TEST_USER_A);
    assert.equal(report.type, "overdue_summary");
    // Food item has due_at in the past
    assert.ok(report.summary.money.count >= 1);
  });

  await t.test("finds overdue tasks (past due_at)", async () => {
    const report = await generateOverdueReport(TEST_USER_A);
    assert.ok(report.summary.tasks.count >= 1);
  });

  await t.test("totalOverdueItems is sum of all three domains", async () => {
    const report = await generateOverdueReport(TEST_USER_A);
    assert.equal(
      report.summary.totalOverdueItems,
      report.summary.money.count +
        report.summary.tasks.count +
        report.summary.reminders.count,
    );
  });

  await t.test("cross-user: User B overdue is separate", async () => {
    const report = await generateOverdueReport(TEST_USER_B);
    // User B has no overdue tasks/money
    assert.equal(report.summary.tasks.count, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Contact Resolution
// ─────────────────────────────────────────────────────────────────────────────

test("Contact Resolution in Report Engine", async (t) => {
  await t.test("resolves unambiguous contact name", async () => {
    const result = await resolveContactByName(TEST_USER_A, "Rahul Sharma");
    assert.equal(result.resolved, true);
    if (result.resolved) {
      assert.equal(result.contactName, "Rahul Sharma");
    }
  });

  await t.test("returns AMBIGUOUS_CONTACT for partial name", async () => {
    const result = await resolveContactByName(TEST_USER_A, "Rahul");
    assert.equal(result.resolved, false);
    if (!result.resolved) {
      assert.equal(result.status, "AMBIGUOUS_CONTACT");
      assert.ok(result.matches && result.matches.length === 2);
    }
  });

  await t.test("returns CONTACT_NOT_FOUND for unknown name", async () => {
    const result = await resolveContactByName(TEST_USER_A, "Nonexistent Person");
    assert.equal(result.resolved, false);
    if (!result.resolved) {
      assert.equal(result.status, "CONTACT_NOT_FOUND");
    }
  });

  await t.test("cross-user isolation: User A contact not found by User B", async () => {
    const result = await resolveContactByName(TEST_USER_B, "Rahul Sharma");
    assert.equal(result.resolved, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Generic Dispatcher (generateReport)
// ─────────────────────────────────────────────────────────────────────────────

test("generateReport dispatcher", async (t) => {
  await t.test("dispatches pending_money correctly", async () => {
    const report = await generateReport({
      type: "pending_money",
      authUserId: TEST_USER_A,
    });
    assert.equal(report.type, "pending_money");
  });

  await t.test("dispatches daily_summary correctly", async () => {
    const report = await generateReport({
      type: "daily_summary",
      authUserId: TEST_USER_A,
    });
    assert.equal(report.type, "daily_summary");
  });

  await t.test("contact_summary without contactId throws", async () => {
    await assert.rejects(
      () =>
        generateReport({
          type: "contact_summary",
          authUserId: TEST_USER_A,
          // no contactId
        }),
      /contactId/,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Report Renderer
// ─────────────────────────────────────────────────────────────────────────────

test("Report Renderer", async (t) => {
  await t.test("renders pending money report as text", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_A);
    const text = renderReport(report);
    assert.ok(text.includes("Pending Money"));
    assert.ok(text.includes("Receivable"));
    assert.ok(text.includes("₹"));
  });

  await t.test("renders task summary report as text", async () => {
    const report = await generateTaskSummaryReport(TEST_USER_A);
    const text = renderReport(report);
    assert.ok(text.includes("Task"));
    assert.ok(text.includes("Pending"));
    assert.ok(text.includes("Completion"));
  });

  await t.test("renders contact report as text", async () => {
    const report = await generateContactReport(TEST_USER_A, contactA1Id);
    const text = renderReport(report);
    assert.ok(text.includes("Rahul Sharma"));
    assert.ok(text.includes("Money"));
    assert.ok(text.includes("Tasks"));
  });

  await t.test("renders monthly summary as text", async () => {
    const report = await generateMonthlySummaryReport(TEST_USER_A, "this_month");
    const text = renderReport(report);
    assert.ok(text.includes("SUMMARY"));
  });

  await t.test("renders overdue report as text", async () => {
    const report = await generateOverdueReport(TEST_USER_A);
    const text = renderReport(report);
    assert.ok(text.includes("OVERDUE"));
  });

  await t.test("renderReportSummaryLine returns one-liner string", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_A);
    const line = renderReportSummaryLine(report);
    assert.ok(typeof line === "string");
    assert.ok(line.length > 0);
    assert.ok(line.includes("receivable") || line.includes("₹"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. report.generate AI Tool
// ─────────────────────────────────────────────────────────────────────────────

test("report.generate AI tool", async (t) => {
  await t.test("generates pending money report via tool", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.generate",
      input: { type: "pending_money" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, "SUCCESS");
    assert.ok(result.data.report);
    assert.ok(result.data.renderedText.length > 0);
  });

  await t.test("generates daily summary via tool", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.generate",
      input: { type: "daily_summary" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, "SUCCESS");
  });

  await t.test("generates monthly summary via tool with date preset", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.generate",
      input: { type: "monthly_summary", dateRangePreset: "this_month" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, "SUCCESS");
    assert.ok(result.data.report.metadata.dateRange);
  });

  await t.test("contact_summary with valid contact name succeeds", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.generate",
      input: { type: "contact_summary", contactName: "Rahul Sharma" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, "SUCCESS");
    assert.equal(result.data.report.summary.contact.name, "Rahul Sharma");
  });

  await t.test("contact_summary with ambiguous name returns AMBIGUOUS_CONTACT", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.generate",
      input: { type: "contact_summary", contactName: "Rahul" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, "AMBIGUOUS_CONTACT");
    assert.ok(result.data.matches.length === 2);
  });

  await t.test("contact_summary with unknown name returns CONTACT_NOT_FOUND", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.generate",
      input: { type: "contact_summary", contactName: "Zuberi Phantom" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, "CONTACT_NOT_FOUND");
  });

  await t.test("contact_summary without contactName returns CONTACT_NOT_FOUND", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.generate",
      input: { type: "contact_summary" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, "CONTACT_NOT_FOUND");
  });

  await t.test("cross-user isolation: User A cannot see User B's data via tool", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.generate",
      input: { type: "pending_money" },
    });
    assert.equal(result.success, true);
    const items = result.data.report.sections[0]?.data.items ?? [];
    const hasB = items.some((i: any) => i.title === "Suresh's debt");
    assert.equal(hasB, false);
  });

  await t.test("overdue report via tool", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.generate",
      input: { type: "overdue_summary" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, "SUCCESS");
    assert.ok(result.data.report.summary.totalOverdueItems >= 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Structured Report Schema Validation
// ─────────────────────────────────────────────────────────────────────────────

test("Structured Report Schema", async (t) => {
  await t.test("report has required top-level fields", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_A);
    assert.ok(report.type);
    assert.ok(report.metadata);
    assert.ok(report.metadata.title);
    assert.ok(report.metadata.generatedAt);
    assert.ok(report.metadata.timezone);
    assert.ok(report.summary !== undefined);
    assert.ok(Array.isArray(report.sections));
  });

  await t.test("sections have id, title, type, data fields", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_A);
    for (const section of report.sections) {
      assert.ok(section.id);
      assert.ok(section.title);
      assert.ok(section.type);
      assert.ok(section.data !== undefined);
    }
  });

  await t.test("generatedAt is a valid ISO timestamp", async () => {
    const report = await generatePendingMoneyReport(TEST_USER_A);
    const date = new Date(report.metadata.generatedAt);
    assert.ok(!isNaN(date.getTime()));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Phase 2B Regression — existing tools still work
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 2B Regression", async (t) => {
  await t.test("assistant.contact_summary still works", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "assistant.contact_summary",
      input: { contactName: "Rahul Sharma" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, "SUCCESS");
  });

  await t.test("assistant.pending_summary still works", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "assistant.pending_summary",
      input: { category: "all" },
    });
    assert.equal(result.success, true);
  });
});
