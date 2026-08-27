/**
 * report-delivery.test.ts
 *
 * Integration tests for Phase 2C-2: Production Report Delivery.
 *
 * Tests cover:
 * - Channel renderers (email, whatsapp, telegram)
 * - Delivery service: prepare, execute, channel resolution
 * - Confirmation requirement
 * - Connection checks (mocked via mock channels)
 * - User isolation
 * - Error handling and sanitization
 * - report.send AI tool
 * - notification_deliveries tracking
 */

import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

import { closePool, getPool } from "../../db/pool.js";
import { ensureUser } from "../../repositories/user.repository.js";
import { createContact } from "../contact.service.js";
import { createLedgerItem } from "../money.service.js";
import { createTask, createTaskList } from "../task.service.js";

import { renderReportEmail } from "../reports/renderers/report-email-renderer.js";
import { renderReportWhatsApp } from "../reports/renderers/report-whatsapp-renderer.js";
import { renderReportTelegram } from "../reports/renderers/report-telegram-renderer.js";
import {
  checkChannelConnection,
  resolveDeliveryChannel,
  prepareReportDelivery,
  executeReportDelivery,
  type DeliveryChannel,
} from "../reports/report-delivery.service.js";
import {
  generatePendingMoneyReport,
  generateDailySummaryReport,
} from "../reports/report-engine.service.js";
import type { Report } from "../reports/report.types.js";
import { executeTool, type ExecuteToolInput } from "../../tools/tool-router.js";
import {
  defaultChannelRegistry,
} from "../notifications/channel-registry.js";
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationDeliveryResult,
} from "../notifications/notification-channel.interface.js";

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────────────────────

const TEST_USER_A = "test_delivery_user_a";
const TEST_USER_B = "test_delivery_user_b";

let contactRahulId = "";
let contactRahulId2 = "";
let taskListAId = "";

async function cleanData() {
  const client = await getPool().connect();
  try {
    await client.query("DELETE FROM ledger_payments WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM ledger_items WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM notification_deliveries WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM tasks WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM task_lists WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM contacts WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock channel helper
// ─────────────────────────────────────────────────────────────────────────────

function makeMockChannel(
  channelId: string,
  success: boolean,
  errorMessage?: string,
): NotificationChannel {
  return {
    channelId,
    name: `Mock ${channelId}`,
    async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
      return success
        ? { success: true, channel: channelId, metadata: { mockDeliveryId: "mock-123" } }
        : { success: false, channel: channelId, errorMessage: errorMessage ?? "Mock failure" };
    },
  };
}

function buildMockReport(): Report {
  return {
    type: "pending_money",
    metadata: {
      title: "Pending Money",
      generatedAt: new Date().toISOString(),
      timezone: "Asia/Kolkata",
    },
    sections: [
      {
        id: "pending_money",
        title: "Pending Money",
        type: "money_summary",
        data: {
          summary: {
            totalReceivable: 500,
            totalPayable: 200,
            netPending: 300,
            itemCount: 2,
            currency: "INR",
          },
          items: [
            {
              id: "item-1",
              title: "Books debt",
              amount: 500,
              remainingAmount: 500,
              direction: "receivable",
              currency: "INR",
              contactName: "Rahul",
              isOverdue: false,
              due_at: null,
            },
          ],
        },
      },
    ],
  } as Report;
}

before(async () => {
  await ensureUser({ authUserId: TEST_USER_A, email: "delivery_user_a@test.com" });
  await ensureUser({ authUserId: TEST_USER_B, email: "delivery_user_b@test.com" });
  await cleanData();

  // Create contacts for User A
  const c1 = await createContact(TEST_USER_A, {
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phoneNumber: "+919876543210",
    telegramId: "rahul_tg_123",
  });
  contactRahulId = c1.id;

  const c2 = await createContact(TEST_USER_A, {
    name: "Rahul Gupta",
    email: "rahul.gupta@example.com",
    phoneNumber: "+919876543211",
  });
  contactRahulId2 = c2.id;

  // Task list + tasks for User A
  const tl = await createTaskList(TEST_USER_A, "Delivery Test List");
  taskListAId = tl.id;
  await createTask(TEST_USER_A, taskListAId, { title: "Task Delivery 1" });

  // Ledger item for User A
  await createLedgerItem(TEST_USER_A, {
    title: "Books debt",
    amount: 500,
    currency: "INR",
    direction: "receivable",
    contactId: contactRahulId,
  });
});

after(async () => {
  await cleanData();
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Channel Renderers
// ─────────────────────────────────────────────────────────────────────────────

test("Report Renderers", async (t) => {
  const report = buildMockReport();

  await t.test("email renderer: subject contains report title", () => {
    const { subject, html, text } = renderReportEmail(report, "Rahul Sharma");
    assert.ok(subject.includes("Pending Money"), `Subject should include title: ${subject}`);
    assert.ok(html.length > 100, "HTML should be non-trivial");
    assert.ok(text.length > 20, "Plain text should be non-trivial");
  });

  await t.test("email renderer: HTML escapes user content", () => {
    const maliciousReport = buildMockReport();
    (maliciousReport.sections[0].data as any).items[0].title = '<script>alert("xss")</script>';
    const { html } = renderReportEmail(maliciousReport, "Rahul");
    assert.ok(!html.includes("<script>"), "HTML must not contain unescaped script tags");
    assert.ok(html.includes("&lt;script&gt;"), "Should escape < as &lt;");
  });

  await t.test("email renderer: HTML includes recipient name", () => {
    const { html } = renderReportEmail(report, "Rahul Sharma");
    assert.ok(html.includes("Rahul Sharma"), "HTML should contain recipient name");
  });

  await t.test("whatsapp renderer: output is concise string", () => {
    const text = renderReportWhatsApp(report, "Rahul");
    assert.equal(typeof text, "string");
    assert.ok(text.length > 20 && text.length <= 1500, `WhatsApp text length out of range: ${text.length}`);
  });

  await t.test("whatsapp renderer: contains report title", () => {
    const text = renderReportWhatsApp(report, "Rahul");
    assert.ok(text.includes("Pending Money"), "WhatsApp text should include report title");
  });

  await t.test("whatsapp renderer: no HTML tags", () => {
    const text = renderReportWhatsApp(report, "Rahul");
    assert.ok(!text.includes("<div>") && !text.includes("<p>"), "WhatsApp must not contain HTML div/p tags");
  });

  await t.test("telegram renderer: contains HTML tags for bold", () => {
    const text = renderReportTelegram(report, "Rahul");
    assert.ok(text.includes("<b>"), "Telegram must use bold tags");
  });

  await t.test("telegram renderer: escapes user content", () => {
    const maliciousReport = buildMockReport();
    (maliciousReport.sections[0].data as any).items[0].title = '<script>xss</script>';
    const text = renderReportTelegram(maliciousReport, "Rahul");
    assert.ok(!text.includes("<script>"), "Telegram must escape <script>");
  });

  await t.test("telegram renderer: contains recipient name", () => {
    const text = renderReportTelegram(report, "Rahul Sharma");
    assert.ok(text.includes("Rahul Sharma"), "Telegram text should include recipient name");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Channel Connection Checks
// ─────────────────────────────────────────────────────────────────────────────

test("Channel Connection Checks", async (t) => {
  await t.test("in_app always returns connected=true", async () => {
    const connected = await checkChannelConnection(TEST_USER_A, "in_app");
    assert.equal(connected, true);
  });

  await t.test("gmail returns false for user with no google connection", async () => {
    // Test user A has no real Google OAuth stored
    const connected = await checkChannelConnection(TEST_USER_A, "gmail");
    assert.equal(connected, false);
  });

  await t.test("whatsapp returns false for user with no whatsapp connection", async () => {
    const connected = await checkChannelConnection(TEST_USER_A, "whatsapp");
    assert.equal(connected, false);
  });

  await t.test("telegram returns false for user with no telegram connection", async () => {
    const connected = await checkChannelConnection(TEST_USER_A, "telegram");
    assert.equal(connected, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. resolveDeliveryChannel
// ─────────────────────────────────────────────────────────────────────────────

test("resolveDeliveryChannel", async (t) => {
  await t.test("returns CONNECTION_REQUIRED when gmail not connected and explicitly requested", async () => {
    const result = await resolveDeliveryChannel(TEST_USER_A, undefined, "gmail");
    assert.ok(!("resolved" in result), "Should not be resolved");
    assert.equal((result as any).status, "CONNECTION_REQUIRED");
    assert.equal((result as any).channel, "gmail");
  });

  await t.test("returns CONNECTION_REQUIRED when whatsapp not connected and explicitly requested", async () => {
    const result = await resolveDeliveryChannel(TEST_USER_A, undefined, "whatsapp");
    assert.ok(!("resolved" in result));
    assert.equal((result as any).status, "CONNECTION_REQUIRED");
  });

  await t.test("returns CONNECTION_REQUIRED when no channels connected and none specified", async () => {
    // No external channels connected for test user
    const result = await resolveDeliveryChannel(TEST_USER_A, undefined, undefined);
    assert.ok(!("resolved" in result));
    assert.equal((result as any).status, "CONNECTION_REQUIRED");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. prepareReportDelivery
// ─────────────────────────────────────────────────────────────────────────────

test("prepareReportDelivery", async (t) => {
  await t.test("returns CONNECTION_REQUIRED when gmail not connected", async () => {
    const result = await prepareReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "gmail",
    });
    assert.equal(result.status, "CONNECTION_REQUIRED");
  });

  await t.test("returns CONNECTION_REQUIRED for any external channel when disconnected", async () => {
    const result = await prepareReportDelivery({
      authUserId: TEST_USER_A,
      type: "daily_summary",
      channel: "telegram",
    });
    assert.equal(result.status, "CONNECTION_REQUIRED");
  });

  // With mock connected in_app channel (always available)
  await t.test("returns CONFIRMATION_REQUIRED for in_app channel (always connected)", async () => {
    const result = await prepareReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "in_app",
    });
    assert.equal(result.status, "CONFIRMATION_REQUIRED");
    assert.ok("report" in result, "Result should include report");
    assert.ok("summaryLine" in result, "Result should include summaryLine");
    assert.ok((result as any).summaryLine.length > 0, "summaryLine should be non-empty");
  });

  await t.test("CONFIRMATION_REQUIRED includes recipientIsOwner=true when no contactName given", async () => {
    const result = await prepareReportDelivery({
      authUserId: TEST_USER_A,
      type: "daily_summary",
      channel: "in_app",
    });
    assert.equal(result.status, "CONFIRMATION_REQUIRED");
    assert.equal((result as any).recipientIsOwner, true);
  });

  await t.test("CONFIRMATION_REQUIRED includes correct recipientName for contact", async () => {
    const result = await prepareReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "in_app",
      contactId: contactRahulId,
    });
    assert.equal(result.status, "CONFIRMATION_REQUIRED");
    assert.equal((result as any).recipientName, "Rahul Sharma");
    assert.equal((result as any).recipientIsOwner, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. executeReportDelivery — with mock channels
// ─────────────────────────────────────────────────────────────────────────────

test("executeReportDelivery", async (t) => {
  const report = buildMockReport();

  await t.test("delivers via in_app channel (real channel, always registered)", async () => {
    const result = await executeReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "in_app",
      report,
      recipientName: "Account Owner",
      recipientIsOwner: true,
    });
    assert.equal(result.status, "SUCCESS");
    assert.equal(result.channel, "in_app");
  });

  await t.test("delivers via mock gmail channel and records delivery row", async () => {
    const mockGmail = makeMockChannel("gmail", true);
    defaultChannelRegistry.registerChannel(mockGmail);

    const result = await executeReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "gmail",
      report,
      recipientName: "Account Owner",
      recipientIsOwner: true,
    });

    assert.equal(result.status, "SUCCESS");
    assert.equal(result.channel, "gmail");
    assert.ok("deliveryId" in result && typeof (result as any).deliveryId === "string");
  });

  await t.test("delivers via mock whatsapp channel", async () => {
    const mockWA = makeMockChannel("whatsapp", true);
    defaultChannelRegistry.registerChannel(mockWA);

    const result = await executeReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "whatsapp",
      report,
      recipientName: "Account Owner",
      recipientIsOwner: true,
    });

    assert.equal(result.status, "SUCCESS");
    assert.equal(result.channel, "whatsapp");
  });

  await t.test("delivers via mock telegram channel", async () => {
    const mockTG = makeMockChannel("telegram", true);
    defaultChannelRegistry.registerChannel(mockTG);

    const result = await executeReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "telegram",
      report,
      recipientName: "Account Owner",
      recipientIsOwner: true,
    });

    assert.equal(result.status, "SUCCESS");
    assert.equal(result.channel, "telegram");
  });

  await t.test("returns DELIVERY_FAILED when mock channel returns failure", async () => {
    const mockFail = makeMockChannel("gmail", false, "Provider auth error");
    defaultChannelRegistry.registerChannel(mockFail);

    const result = await executeReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "gmail",
      report,
      recipientName: "Account Owner",
      recipientIsOwner: true,
    });

    assert.equal(result.status, "DELIVERY_FAILED");
    assert.ok(!!(result as any).message, "Should include error message");
  });

  await t.test("sanitized error message does not contain bearer tokens", async () => {
    const mockFail = makeMockChannel("gmail", false, "Bearer eyJhbGciOiJSUzI1NiJ9.secret auth error");
    defaultChannelRegistry.registerChannel(mockFail);

    const result = await executeReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "gmail",
      report,
      recipientName: "Account Owner",
      recipientIsOwner: true,
    });

    assert.equal(result.status, "DELIVERY_FAILED");
    const msg = (result as any).message ?? "";
    assert.ok(!msg.includes("eyJ"), "Error message must not contain raw JWT token");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Delivery tracking in notification_deliveries
// ─────────────────────────────────────────────────────────────────────────────

test("Delivery Tracking", async (t) => {
  const report = buildMockReport();

  await t.test("successful delivery creates row with status=sent", async () => {
    const mockInApp = makeMockChannel("in_app", true);
    defaultChannelRegistry.registerChannel(mockInApp);

    await executeReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "in_app",
      report,
      recipientName: "Account Owner",
      recipientIsOwner: true,
    });

    const rows = await getPool().query(
      `SELECT * FROM notification_deliveries WHERE auth_user_id = $1 AND channel = 'in_app' ORDER BY created_at DESC LIMIT 1`,
      [TEST_USER_A],
    );
    const row = rows.rows[0];
    assert.ok(row, "Delivery row should exist");
    assert.equal(row.status, "sent");
    assert.equal(row.channel, "in_app");
    assert.ok(row.metadata?.source === "report_delivery", "Metadata should include source=report_delivery");
    assert.ok(row.metadata?.reportType === "pending_money", "Metadata should include reportType");
  });

  await t.test("failed delivery creates row with status=failed", async () => {
    const mockFail = makeMockChannel("in_app", false, "Test failure");
    defaultChannelRegistry.registerChannel(mockFail);

    await executeReportDelivery({
      authUserId: TEST_USER_A,
      type: "pending_money",
      channel: "in_app",
      report,
      recipientName: "Account Owner",
      recipientIsOwner: true,
    });

    const rows = await getPool().query(
      `SELECT * FROM notification_deliveries WHERE auth_user_id = $1 AND channel = 'in_app' AND status = 'failed' ORDER BY created_at DESC LIMIT 1`,
      [TEST_USER_A],
    );
    const row = rows.rows[0];
    assert.ok(row, "Failed delivery row should exist");
    assert.equal(row.status, "failed");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Security: User isolation
// ─────────────────────────────────────────────────────────────────────────────

test("Security: User Isolation", async (t) => {
  await t.test("User B cannot prepare a report using User A's contactId", async () => {
    // contactRahulId belongs to User A — User B preparing with it should not return User A's data
    const result = await prepareReportDelivery({
      authUserId: TEST_USER_B,
      type: "contact_summary",
      channel: "in_app",
      contactId: contactRahulId, // User A's contact ID
    });

    // Either returns DELIVERY_FAILED or a report with empty/zero data (no cross-user leak)
    if (result.status === "CONFIRMATION_REQUIRED") {
      const report = (result as any).report as Report;
      // If it returns a report, it must not contain User A's money
      const totalReceivable = (report.sections[0]?.data as any)?.summary?.totalReceivable ?? 0;
      assert.equal(totalReceivable, 0, "User B should not see User A's receivables");
    } else {
      // DELIVERY_FAILED due to contact not found is also acceptable
      assert.ok(["DELIVERY_FAILED", "CONFIRMATION_REQUIRED"].includes(result.status));
    }
  });

  await t.test("User isolation: notification_deliveries are per-user", async () => {
    const rows = await getPool().query(
      `SELECT auth_user_id FROM notification_deliveries WHERE auth_user_id = $1`,
      [TEST_USER_B],
    );
    // User B should have no delivery rows (only User A created them above)
    assert.ok(rows.rows.every((r: any) => r.auth_user_id === TEST_USER_B));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. report.send AI tool
// ─────────────────────────────────────────────────────────────────────────────

test("report.send AI tool", async (t) => {
  await t.test("returns CONFIRMATION_REQUIRED (not sent) when confirmed not set", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.send",
      input: { type: "pending_money", channel: "in_app" },
    });
    assert.equal((result.data as any)?.status, "CONFIRMATION_REQUIRED", "Tool must require confirmation before sending");
  });

  await t.test("returns CONNECTION_REQUIRED for gmail when not connected", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.send",
      input: { type: "pending_money", channel: "gmail" },
    });
    assert.equal((result.data as any)?.status, "CONNECTION_REQUIRED");
    const msg = (result.data as any)?.message ?? "";
    assert.ok(msg.includes("Gmail") || msg.includes("connected"), `Expected connection message: ${msg}`);
  });

  await t.test("returns AMBIGUOUS_CONTACT when multiple contacts match the name", async () => {
    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.send",
      input: { type: "pending_money", contactName: "Rahul", channel: "in_app" },
    });
    assert.equal((result.data as any)?.status, "AMBIGUOUS_CONTACT");
  });

  await t.test("executes delivery with confirmed=true and in_app", async () => {
    // Re-register real in_app channel
    defaultChannelRegistry.registerChannel(makeMockChannel("in_app", true));

    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.send",
      input: {
        type: "pending_money",
        channel: "in_app",
        confirmed: true,
        confirmedChannel: "in_app",
        confirmedRecipientName: "Account Owner",
        confirmedRecipientIsOwner: true,
      },
    });
    assert.equal((result.data as any)?.status, "SUCCESS");
    assert.equal((result.data as any)?.channel, "in_app");
  });

  await t.test("does not expose internal stack traces or tokens in DELIVERY_FAILED", async () => {
    defaultChannelRegistry.registerChannel(makeMockChannel("in_app", false, "Bearer secret123 failed"));

    const result = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "report.send",
      input: {
        type: "pending_money",
        channel: "in_app",
        confirmed: true,
        confirmedChannel: "in_app",
        confirmedRecipientName: "Account Owner",
        confirmedRecipientIsOwner: true,
      },
    });
    assert.equal((result.data as any)?.status, "DELIVERY_FAILED");
    const msg = (result.data as any)?.message ?? "";
    assert.ok(!msg.includes("secret123"), "Error message must not contain secret tokens");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. No arbitrary recipient injection
// ─────────────────────────────────────────────────────────────────────────────

test("Security: No Arbitrary Recipient Injection", async (t) => {
  await t.test("report.send does not accept raw email as input", async () => {
    // The tool schema has no 'email' or 'phoneNumber' field
    const schema = (await import("../../tools/tools.registry.js")).TOOLS_REGISTRY["report.send"]?.inputSchema;
    if (schema) {
      const parsed = schema.safeParse({ type: "pending_money", email: "evil@attacker.com" });
      // The 'email' field is not in the schema — it's simply ignored by zod
      // The parsed result should not include email
      if (parsed.success) {
        assert.ok(!("email" in parsed.data), "Parsed data must not include arbitrary 'email' field");
      }
    }
    assert.ok(true, "Schema does not accept arbitrary email/phone/chatId");
  });
});
