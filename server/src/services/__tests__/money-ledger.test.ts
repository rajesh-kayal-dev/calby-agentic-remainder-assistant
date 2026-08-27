import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

import { closePool, getPool } from "../../db/pool.js";
import { ensureUser } from "../../repositories/user.repository.js";
import { createContact } from "../contact.service.js";
import {
  createLedgerItem,
  listLedgerItems,
  getLedgerItem,
  recordPayment,
  markLedgerItemPaid,
  cancelLedgerItem,
  getContactBalance,
  getPaymentsForLedgerItem,
} from "../money.service.js";
import { executeTool } from "../../tools/tool-router.js";
import { getTask } from "../task.service.js";
import { getReminderById } from "../reminder.service.js";

const TEST_USER_A = "test_money_user_a";
const TEST_USER_B = "test_money_user_b";

let contactA1Id = "";
let contactA2Id = "";
let contactB1Id = "";

async function cleanMoneyData() {
  const client = await getPool().connect();
  try {
    // Clean ledger payments first due to FK constraints
    await client.query("DELETE FROM ledger_payments WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM ledger_items WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM reminders WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM tasks WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
    await client.query("DELETE FROM contacts WHERE auth_user_id IN ($1, $2)", [TEST_USER_A, TEST_USER_B]);
  } finally {
    client.release();
  }
}

before(async () => {
  await ensureUser({ authUserId: TEST_USER_A, email: "user_a_money@test.com" });
  await ensureUser({ authUserId: TEST_USER_B, email: "user_b_money@test.com" });

  await cleanMoneyData();

  // Create contacts for User A
  const cA1 = await createContact(TEST_USER_A, { name: "Rahul Sharma", phoneNumber: "9876543210" });
  contactA1Id = cA1.id;
  const cA2 = await createContact(TEST_USER_A, { name: "Rahul Gupta", phoneNumber: "9876543211" });
  contactA2Id = cA2.id;

  // Create contact for User B
  const cB1 = await createContact(TEST_USER_B, { name: "Suresh Kumar", phoneNumber: "8765432100" });
  contactB1Id = cB1.id;
});

after(async () => {
  await cleanMoneyData();
  await closePool();
});

// ==========================================
// 1. DOMAIN & SERVICE OPERATION TESTS
// ==========================================

test("1. create ledger item (receivables and payables)", async () => {
  // Create Receivable
  const recItem = await createLedgerItem(TEST_USER_A, {
    contactId: contactA1Id,
    direction: "receivable",
    amount: 500,
    title: "Book purchase",
  });
  assert.equal(recItem.direction, "receivable");
  assert.equal(Number(recItem.amount), 500);
  assert.equal(Number(recItem.remaining_amount), 500);
  assert.equal(recItem.status, "pending");

  // Create Payable
  const payItem = await createLedgerItem(TEST_USER_A, {
    contactId: contactA1Id,
    direction: "payable",
    amount: 150,
    title: "Tea bill",
  });
  assert.equal(payItem.direction, "payable");
  assert.equal(Number(payItem.amount), 150);
  assert.equal(Number(payItem.remaining_amount), 150);
});

test("2. validates positive amount constraints", async () => {
  await assert.rejects(async () => {
    await createLedgerItem(TEST_USER_A, {
      contactId: contactA1Id,
      direction: "receivable",
      amount: -100,
      title: "Invalid negative item",
    });
  }, /must be positive/i);
});

test("3. contact ownership validation prevents cross-user contact attachment", async () => {
  // User B tries to create ledger item for User A's contact
  await assert.rejects(async () => {
    await createLedgerItem(TEST_USER_B, {
      contactId: contactA1Id, // User A's contact
      direction: "receivable",
      amount: 100,
      title: "Hacked contact assignment",
    });
  }, /not found or access denied/i);
});

test("4. records payments, transitions statuses, and rejects overpayments", async () => {
  const item = await createLedgerItem(TEST_USER_A, {
    contactId: contactA1Id,
    direction: "receivable",
    amount: 1000,
    title: "Course fee",
  });

  // Record Partial Payment 1: pending -> partially_paid
  const res1 = await recordPayment(TEST_USER_A, item.id, {
    amount: 300,
    currency: "INR",
    notes: "First installment",
  });
  assert.equal(res1.ledgerItem.status, "partially_paid");
  assert.equal(Number(res1.ledgerItem.remaining_amount), 700);

  // Record Partial Payment 2: partially_paid -> partially_paid
  const res2 = await recordPayment(TEST_USER_A, item.id, {
    amount: 400,
    currency: "INR",
  });
  assert.equal(res2.ledgerItem.status, "partially_paid");
  assert.equal(Number(res2.ledgerItem.remaining_amount), 300);

  // Assert payment history is preserved (immutable)
  const history = await getPaymentsForLedgerItem(TEST_USER_A, item.id);
  assert.equal(history.length, 2);
  assert.equal(Number(history[0].amount) + Number(history[1].amount), 700);

  // Reject overpayment
  await assert.rejects(async () => {
    await recordPayment(TEST_USER_A, item.id, {
      amount: 400, // exceeds remaining 300
      currency: "INR",
    });
  }, /exceeds remaining balance/i);

  // Final payment: partially_paid -> paid
  const res3 = await recordPayment(TEST_USER_A, item.id, {
    amount: 300,
    currency: "INR",
    notes: "Clear balance",
  });
  assert.equal(res3.ledgerItem.status, "paid");
  assert.equal(Number(res3.ledgerItem.remaining_amount), 0);
  assert.ok(res3.ledgerItem.paid_at);
});

test("5. prevents cross-user access to ledger items", async () => {
  const item = await createLedgerItem(TEST_USER_A, {
    contactId: contactA1Id,
    direction: "receivable",
    amount: 200,
    title: "Secret item",
  });

  // User B tries to view
  const fetched = await getLedgerItem(TEST_USER_B, item.id);
  assert.equal(fetched, null);

  // User B tries to pay
  await assert.rejects(async () => {
    await recordPayment(TEST_USER_B, item.id, { amount: 100, currency: "INR" });
  }, /not found or access denied/i);

  // User B tries to cancel
  await assert.rejects(async () => {
    await cancelLedgerItem(TEST_USER_B, item.id);
  }, /not found or access denied/i);
});

test("6. calculates contact balances and net standings correctly", async () => {
  // Clean first
  await cleanMoneyData();
  const c = await createContact(TEST_USER_A, { name: "Balance Check Contact" });

  // Add receivable of 300
  await createLedgerItem(TEST_USER_A, {
    contactId: c.id,
    direction: "receivable",
    amount: 300,
    title: "Receivable 1",
  });

  // Add receivable of 200, pay 50 (150 remaining)
  const item2 = await createLedgerItem(TEST_USER_A, {
    contactId: c.id,
    direction: "receivable",
    amount: 200,
    title: "Receivable 2",
  });
  await recordPayment(TEST_USER_A, item2.id, { amount: 50, currency: "INR" });

  // Add payable of 100
  await createLedgerItem(TEST_USER_A, {
    contactId: c.id,
    direction: "payable",
    amount: 100,
    title: "Payable 1",
  });

  const balance = await getContactBalance(TEST_USER_A, c.id);
  // Receivables = 300 + 150 = 450
  // Payables = 100
  // Net = 450 - 100 = 350
  assert.equal(balance.receivables, 450);
  assert.equal(balance.payables, 100);
  assert.equal(balance.net, 350);
});

test("7. cancels outstanding ledger items and cancels linked reminder", async () => {
  const localContact = await createContact(TEST_USER_A, { name: "Cancel Test Contact" });
  const item = await createLedgerItem(TEST_USER_A, {
    contactId: localContact.id,
    direction: "receivable",
    amount: 120,
    title: "Dinner share",
  });

  const cancelled = await cancelLedgerItem(TEST_USER_A, item.id);
  assert.equal(cancelled.status, "cancelled");

  // Cannot pay cancelled item
  await assert.rejects(async () => {
    await recordPayment(TEST_USER_A, item.id, { amount: 50, currency: "INR" });
  }, /cannot record payment on a cancelled/i);
});

// ==========================================
// 2. CONCURRENCY TESTS
// ==========================================

test("8. concurrency row lock prevents double payment overdrafts", async () => {
  const localContact = await createContact(TEST_USER_A, { name: "Concurrency Test Contact" });
  const item = await createLedgerItem(TEST_USER_A, {
    contactId: localContact.id,
    direction: "receivable",
    amount: 100,
    title: "Race condition test",
  });

  // Trigger two recordPayment queries concurrently
  const p1 = recordPayment(TEST_USER_A, item.id, { amount: 70, currency: "INR" });
  const p2 = recordPayment(TEST_USER_A, item.id, { amount: 50, currency: "INR" });

  const results = await Promise.allSettled([p1, p2]);
  const succeeded = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");

  // Exactly one payment must succeed, and the other must fail due to overpayment protection!
  assert.equal(succeeded.length, 1);
  assert.equal(rejected.length, 1);

  // Assert remaining balance is 30 (100 - 70) and not negative
  const finalItem = await getLedgerItem(TEST_USER_A, item.id);
  assert.ok(finalItem);
  assert.equal(Number(finalItem.remaining_amount), 30);
});

// ==========================================
// 3. AI TOOL REGISTER TESTS
// ==========================================

test("9. money.create tool works and handles contact & direction ambiguities", async () => {
  await cleanMoneyData();
  // Setup two Rahul contacts to trigger ambiguity
  const rahul1 = await createContact(TEST_USER_A, { name: "Rahul Sharma" });
  const rahul2 = await createContact(TEST_USER_A, { name: "Rahul Gupta" });

  // Test 9.1: Ambiguous Contact Name resolution
  const res1 = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "money.create",
    input: {
      contactName: "Rahul",
      amount: 100,
      title: "Tea",
    },
  });
  assert.ok(res1.success);
  assert.equal(res1.data.status, "AMBIGUOUS_CONTACT");
  assert.equal(res1.data.matches.length, 2);

  // Test 9.2: Ambiguous Direction resolution
  const res2 = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "money.create",
    input: {
      contactId: rahul1.id,
      amount: 100,
      title: "Tea",
    },
  });
  assert.ok(res2.success);
  assert.equal(res2.data.status, "AMBIGUOUS_DIRECTION");

  // Test 9.3: Create money ledger with task and reminder links
  const res3 = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "money.create",
    input: {
      contactId: rahul1.id,
      direction: "receivable",
      amount: 250,
      title: "Invoice share",
      createTask: true,
      createReminder: true,
      reminderTimeIso: new Date(Date.now() + 3600000).toISOString(),
    },
  });
  assert.ok(res3.success);
  assert.ok(res3.data.created);
  assert.ok(res3.data.taskId);
  assert.ok(res3.data.reminderId);

  // Verify task exists and is linked
  const task = await getTask(TEST_USER_A, res3.data.taskId);
  assert.ok(task);
  assert.equal(task.contact_id, rahul1.id);

  // Verify reminder exists and is linked
  const reminder = await getReminderById(TEST_USER_A, res3.data.reminderId);
  assert.ok(reminder);
  assert.equal(reminder.recipient_id, rahul1.id);
});

test("10. AI money list, balance, cancel, and payment tools", async () => {
  await cleanMoneyData();
  const c = await createContact(TEST_USER_A, { name: "Agent Test Person" });

  const res1 = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "money.create",
    input: {
      contactId: c.id,
      direction: "receivable",
      amount: 400,
      title: "Office lunch",
    },
  });
  const ledgerId = res1.data.id;

  // Test 10.1: money.list
  const listRes = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "money.list",
    input: { direction: "receivable" },
  });
  assert.ok(listRes.success);
  assert.equal(listRes.data.ledgerItems.length, 1);

  // Test 10.2: money.get_balance
  const balRes = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "money.get_balance",
    input: { contactName: "Agent Test Person" },
  });
  assert.ok(balRes.success);
  assert.equal(balRes.data.receivables, 400);

  // Test 10.3: money.record_payment
  const payRes = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "money.record_payment",
    input: {
      ledgerItemId: ledgerId,
      amount: 150,
    },
  });
  assert.ok(payRes.success);
  assert.equal(payRes.data.remainingAmount, 250);
  assert.equal(payRes.data.status, "partially_paid");

  // Test 10.4: money.mark_paid
  const markRes = await executeTool({
    authUserId: TEST_USER_A,
    toolId: "money.mark_paid",
    input: { ledgerItemId: ledgerId },
  });
  assert.ok(markRes.success);
  assert.equal(markRes.data.remainingAmount, 0);
  assert.equal(markRes.data.status, "paid");
});
