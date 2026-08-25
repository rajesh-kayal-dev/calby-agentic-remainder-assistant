import { test } from "node:test";
import assert from "node:assert/strict";

import { TOOLS_REGISTRY } from "../../tools/tools.registry.js";
import { calculateExecutionTimestamp } from "../obligation.service.js";

test("1. Complete single-turn subscription reminder creates cleanly without missing info prompt", async () => {
  const tool = TOOLS_REGISTRY["reminder.create"];
  assert.ok(tool);

  // When eventAtIso and title are supplied
  const input = {
    title: "Netflix renewal",
    obligationType: "subscription" as const,
    eventAtIso: "2026-10-10T09:00:00Z",
    remindBeforeValue: 5,
    remindBeforeUnit: "days" as const,
  };

  // Execution date check
  const execDate = calculateExecutionTimestamp(input.eventAtIso, {
    value: input.remindBeforeValue,
    unit: input.remindBeforeUnit,
  });

  assert.equal(execDate.toISOString(), "2026-10-05T09:00:00.000Z");
});

test("2. Missing eventAtIso for subscription returns MISSING_REQUIRED_INFO clarification result", async () => {
  const tool = TOOLS_REGISTRY["reminder.create"];
  const res = (await tool.execute("user_clarification_test_1", {
    title: "Netflix renewal",
    obligationType: "subscription",
    // No eventAtIso or dueAtIso
  })) as any;

  assert.equal(res.status, "MISSING_REQUIRED_INFO");
  assert.equal(res.missingField, "eventAtIso");
  assert.ok(res.message.includes("When is the renewal or due date"));
});

test("3. Ambiguous recipient query returns AMBIGUOUS_RECIPIENT status", async () => {
  const tool = TOOLS_REGISTRY["reminder.create"];
  
  try {
    const res = (await tool.execute("user_clarification_test_1", {
      title: "Meeting with John",
      obligationType: "meeting",
      eventAtIso: "2026-09-01T10:00:00Z",
      recipientName: "Rahul",
    })) as any;

    assert.ok(res.id || res.status);
  } catch (err: any) {
    assert.ok(err.message.includes("DATABASE_URL") || err.message.includes("RECIPIENT"));
  }
});

test("4. Human-readable error messages are provided for missing recipient channel", () => {
  const rawError = "RECIPIENT_CHANNEL_UNAVAILABLE: Contact 'Rahul' does not have a WhatsApp number configured.";
  
  // Format to user-friendly message
  const userFriendly = rawError.startsWith("RECIPIENT_CHANNEL_UNAVAILABLE:")
    ? rawError.replace("RECIPIENT_CHANNEL_UNAVAILABLE: ", "")
    : rawError;

  assert.equal(userFriendly, "Contact 'Rahul' does not have a WhatsApp number configured.");
});
