import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

import { closePool, getPool } from "../../db/pool.js";
import { ensureUser } from "../../repositories/user.repository.js";
import { createContact } from "../contact.service.js";
import { createLedgerItem } from "../money.service.js";
import { createTask, createTaskList } from "../task.service.js";
import { createReminder } from "../reminder.service.js";
import { executeTool } from "../../tools/tool-router.js";

const TEST_USER_A = "test_assistant_user_a";
const TEST_USER_B = "test_assistant_user_b";

let contactA1Id = "";
let contactA2Id = "";
let contactB1Id = "";
let taskListAId = "";

async function cleanData() {
  const client = await getPool().connect();
  try {
    await client.query("DELETE FROM notification_deliveries WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM ledger_payments WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM ledger_items WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM reminders WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM tasks WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM task_lists WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM contacts WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
  } finally {
    client.release();
  }
}

before(async () => {
  await ensureUser({ authUserId: TEST_USER_A, email: "user_a_assistant@test.com" });
  await ensureUser({ authUserId: TEST_USER_B, email: "user_b_assistant@test.com" });

  await cleanData();

  // Create contacts for User A
  const cA1 = await createContact(TEST_USER_A, { name: "Rahul Sharma", phoneNumber: "9876543210" });
  contactA1Id = cA1.id;
  
  const cA2 = await createContact(TEST_USER_A, { name: "Rahul Gupta", phoneNumber: "9876543211" });
  contactA2Id = cA2.id;

  // Create contact for User B
  const cB1 = await createContact(TEST_USER_B, { name: "Suresh Kumar", phoneNumber: "8765432100" });
  contactB1Id = cB1.id;
  
  // Setup data for Rahul Sharma (User A)
  const taskList = await createTaskList(TEST_USER_A, "General");
  taskListAId = taskList.id;

  // 1. Money
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
  });

  // 2. Task
  await createTask(TEST_USER_A, taskListAId, {
    title: "Collect remaining money",
    contactId: contactA1Id,
  });

  // 3. Reminder
  await createReminder({
    authUserId: TEST_USER_A,
    recipientId: contactA1Id,
    title: "Collect payment",
    dueAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    channel: "in_app"
  });
  
});

after(async () => {
  await cleanData();
  await closePool();
});

test("Assistant Intelligence - Contact Summary", async (t) => {
  await t.test("Retrieves comprehensive summary for unambiguous contact", async () => {
    const res = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "assistant.contact_summary",
      input: { contactName: "Rahul Sharma" }
    });
    
    assert.equal(res.success, true);
    assert.equal(res.data.status, "SUCCESS");
    assert.equal(res.data.summary.contact.name, "Rahul Sharma");
    assert.equal(res.data.summary.money.totalReceivables, 800);
    assert.equal(res.data.summary.tasks.pendingCount, 1);
    assert.equal(res.data.summary.tasks.items[0].title, "Collect remaining money");
    assert.equal(res.data.summary.reminders.upcomingCount, 1);
  });

  await t.test("Returns AMBIGUOUS_CONTACT for ambiguous name", async () => {
    const res = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "assistant.contact_summary",
      input: { contactName: "Rahul" }
    });
    
    assert.equal(res.success, true);
    assert.equal(res.data.status, "AMBIGUOUS_CONTACT");
    assert.ok(Array.isArray(res.data.matches));
    assert.equal(res.data.matches.length, 2);
  });

  await t.test("Cross-user isolation: User B cannot see User A's contact", async () => {
    const res = await executeTool({
      authUserId: TEST_USER_B,
      toolId: "assistant.contact_summary",
      input: { contactName: "Rahul Sharma" }
    });
    
    assert.equal(res.success, true);
    assert.equal(res.data.status, "CONTACT_NOT_FOUND");
  });
});

test("Assistant Intelligence - User Pending Summary", async (t) => {
  await t.test("Retrieves global user pending summary", async () => {
    const res = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "assistant.pending_summary",
      input: { category: "all" }
    });
    
    assert.equal(res.success, true);
    assert.equal(res.data.money.totalReceivables, 800);
    assert.equal(res.data.tasks.pendingCount, 1);
  });
});

test("Assistant Intelligence - Smart Payment Resolution", async (t) => {
  await t.test("Returns AMBIGUOUS_LEDGER_ITEM when payment lacks explicit title and multiple items exist", async () => {
    const res = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "money.record_payment",
      input: { contactName: "Rahul Sharma", amount: 200 }
    });
    
    assert.equal(res.success, true);
    assert.equal(res.data.status, "AMBIGUOUS_LEDGER_ITEM");
    assert.equal(res.data.matches.length, 2);
    assert.ok(res.data.message.includes("Please specify which item"));
  });

  await t.test("Resolves implicitly when only 1 pending item matches title", async () => {
    const res = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "money.record_payment",
      input: { ledgerItemTitle: "Books", amount: 200 }
    });
    
    assert.equal(res.success, true);
    assert.equal(res.data.success, true);
    assert.equal(res.data.title, "Books");
    assert.equal(res.data.amountPaid, 200);
    assert.equal(Number(res.data.remainingAmount), 300);
  });
});

test("Assistant Intelligence - Prepare Pending List", async (t) => {
  await t.test("Formats pending list correctly without sending", async () => {
    const res = await executeTool({
      authUserId: TEST_USER_A,
      toolId: "assistant.prepare_pending_list",
      input: { contactName: "Rahul Sharma" }
    });
    
    assert.equal(res.success, true);
    assert.equal(res.data.status, "READY_TO_SEND");
    assert.equal(res.data.contact.name, "Rahul Sharma");
    assert.ok(res.data.messagePreview.includes("Rahul Sharma's pending list:"));
    assert.ok(res.data.messagePreview.includes("Books"));
    assert.ok(res.data.messagePreview.includes("Food"));
    assert.ok(res.data.messagePreview.includes("Collect remaining money"));
  });
});
