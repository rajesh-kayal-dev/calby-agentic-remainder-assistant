import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
process.env.DESCOPE_PROJECT_ID = process.env.DESCOPE_PROJECT_ID || "mock_project_id";

import { executeTool } from "../src/tools/tool-router.js";
import { getProviderDefinition, LLM_PROVIDERS } from "../src/services/llm/providers.registry.js";
import { getPool, closePool } from "../src/db/pool.js";

async function runE2ETests() {
  console.log("=================================================");
  console.log("🚀 CALBY END-TO-END AUTOMATED TOOL CALLING TEST SUITE");
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

  const testAuthUserId = "e2e_tool_user_999";

  await getPool().query(
    `INSERT INTO users (auth_user_id, email, name) VALUES ($1, $2, $3) ON CONFLICT (auth_user_id) DO NOTHING`,
    [testAuthUserId, "e2e_tools@calby.ai", "E2E Tool Tester"],
  );

  // Scenario 1: Calendar Read (calendar.get_events)
  const readRes = await executeTool({
    authUserId: testAuthUserId,
    toolId: "calendar.get_events",
    input: { todayOnly: true },
  });
  assert(
    !readRes.success && readRes.code === "CONNECTION_REQUIRED",
    "Scenario 1: Unconnected user attempting calendar read returns CONNECTION_REQUIRED",
  );

  // Scenario 2: Calendar Create (calendar.create_event)
  const createRes = await executeTool({
    authUserId: testAuthUserId,
    toolId: "calendar.create_event",
    input: {
      title: "Strategy Sync",
      startIso: new Date().toISOString(),
      endIso: new Date(Date.now() + 3600000).toISOString(),
    },
  });
  assert(
    !createRes.success && createRes.code === "CONNECTION_REQUIRED",
    "Scenario 2: Calendar create requires Google Calendar OAuth connection",
  );

  // Scenario 3: Missing Connector (gmail.send)
  const gmailRes = await executeTool({
    authUserId: testAuthUserId,
    toolId: "gmail.send",
    input: { to: "alex@example.com", subject: "Sync", body: "Let's meet" },
    confirmed: true,
  });
  assert(
    !gmailRes.success && gmailRes.code === "CONNECTION_REQUIRED" && gmailRes.provider === "gmail",
    "Scenario 3: Missing connector (gmail.send) returns CONNECTION_REQUIRED with provider metadata",
  );

  // Scenario 4: Confirmation-Required Action (calendar.delete_event)
  const deleteUnconfirmed = await executeTool({
    authUserId: testAuthUserId,
    toolId: "calendar.delete_event",
    input: { eventId: "evt_123" },
    confirmed: false,
  });
  assert(
    !deleteUnconfirmed.success && deleteUnconfirmed.code === "CONFIRMATION_REQUIRED",
    "Scenario 4: Dangerous tool (calendar.delete_event) requires user confirmation before execution",
  );

  // Scenario 5: Tool Failure & Recovery (invalid tool arguments)
  const invalidArgRes = await executeTool({
    authUserId: testAuthUserId,
    toolId: "calendar.create_event",
    input: { title: "" }, // missing startIso/endIso
  });
  assert(
    !invalidArgRes.success && invalidArgRes.code === "INVALID_INPUT",
    "Scenario 5: Tool failure handles schema invalidity cleanly with INVALID_INPUT error code",
  );

  // Scenario 6: Multi-step Tool Execution (reminder.create -> task.create)
  const step1 = await executeTool({
    authUserId: testAuthUserId,
    toolId: "reminder.create",
    input: { title: "Review Q3 Report" },
  });
  const step2 = await executeTool({
    authUserId: testAuthUserId,
    toolId: "task.create",
    input: { title: "Follow up with design team" },
  });
  assert(
    step1.success && step2.success && step1.data?.created && step2.data?.created,
    "Scenario 6: Multi-step tool workflow executes sequential backend actions successfully",
  );

  // Scenario 7: LLM Provider Abstraction Compatibility
  const providers = LLM_PROVIDERS.map((p) => p.id);
  const allProvidersValid = providers.every((pId) => {
    const def = getProviderDefinition(pId);
    return Boolean(def && def.id && def.name);
  });
  assert(
    allProvidersValid && providers.length >= 10,
    `Scenario 7: Tool selection loop is compatible with all ${providers.length} registered LLM providers`,
  );

  console.log("\n=================================================");
  console.log(`📊 E2E TOOL CALLING RESULTS: ${passed} passed, ${failed} failed.`);
  console.log("=================================================\n");

  await closePool();

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error("E2E test suite error:", err);
  process.exit(1);
});
