import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
process.env.DESCOPE_PROJECT_ID = process.env.DESCOPE_PROJECT_ID || "mock_project_id";

import { executeTool } from "../src/tools/tool-router.js";
import { closePool, getPool } from "../src/db/pool.js";

async function runTests() {
  console.log("=================================================");
  console.log("🚀 CALBY TOOL ROUTER & INTEGRATION TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}${details ? ` -> ${details}` : ""}`);
      failed++;
    }
  }

  const testAuthUserId = "test_user_tool_router_123";

  // 1. Ensure test user exists in PostgreSQL
  await getPool().query(
    `INSERT INTO users (auth_user_id, email, name) VALUES ($1, $2, $3) ON CONFLICT (auth_user_id) DO NOTHING`,
    [testAuthUserId, "toolrouter@test.com", "Tool Router Tester"],
  );

  // Test 1: Valid Tool Execution (reminder.create)
  const reminderRes = await executeTool({
    authUserId: testAuthUserId,
    toolId: "reminder.create",
    input: { title: "Review Q3 Calendar Plan" },
  });
  assert(
    reminderRes.success && reminderRes.data?.title === "Review Q3 Calendar Plan",
    "Valid tool execution (reminder.create) returns success",
  );

  // Test 2: Invalid Tool Input (missing required title)
  const invalidInputRes = await executeTool({
    authUserId: testAuthUserId,
    toolId: "reminder.create",
    input: {},
  });
  assert(
    !invalidInputRes.success && invalidInputRes.code === "INVALID_INPUT",
    "Invalid input validation returns INVALID_INPUT error code",
  );

  // Test 3: Invalid Tool ID
  const invalidToolRes = await executeTool({
    authUserId: testAuthUserId,
    toolId: "non_existent_tool",
    input: {},
  });
  assert(
    !invalidToolRes.success && invalidToolRes.code === "INVALID_TOOL",
    "Unknown tool ID returns INVALID_TOOL error code",
  );

  // Test 4: Missing Connector Check (gmail.send)
  const gmailRes = await executeTool({
    authUserId: testAuthUserId,
    toolId: "gmail.send",
    input: { to: "team@company.com", subject: "Meeting", body: "Hello" },
    confirmed: true,
  });
  assert(
    !gmailRes.success &&
      gmailRes.code === "CONNECTION_REQUIRED" &&
      gmailRes.provider === "gmail",
    "Missing connector (gmail.send) returns CONNECTION_REQUIRED error code",
  );

  // Test 5: Confirmation-Required Action (calendar.delete_event with confirmed=false)
  const unconfirmedDeleteRes = await executeTool({
    authUserId: testAuthUserId,
    toolId: "calendar.delete_event",
    input: { eventId: "evt_123" },
    confirmed: false,
  });
  assert(
    !unconfirmedDeleteRes.success &&
      unconfirmedDeleteRes.code === "CONFIRMATION_REQUIRED",
    "Unconfirmed dangerous action returns CONFIRMATION_REQUIRED error code",
  );

  // Test 6: Database Execution Logs check
  const logsResult = await getPool().query(
    `SELECT * FROM tool_execution_logs WHERE auth_user_id = $1 ORDER BY created_at DESC`,
    [testAuthUserId],
  );
  assert(
    logsResult.rows.length >= 4,
    `Database execution logs recorded ${logsResult.rows.length} tool executions`,
  );

  console.log("\n=================================================");
  console.log(`📊 TOOL ROUTER TEST RESULTS: ${passed} passed, ${failed} failed.`);
  console.log("=================================================\n");

  await closePool();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
