import { test } from "node:test";
import assert from "node:assert/strict";
import { TOOLS_REGISTRY } from "../../tools/tools.registry.js";

test("1. Tools registry registers all new Gmail, Drive, Notion, Slack, and Teams tools", () => {
  const toolIds = [
    "gmail.search",
    "gmail.get_message",
    "gmail.send",
    "drive.search",
    "drive.get_file",
    "notion.search",
    "notion.get_page",
    "notion.create_page",
    "slack.send_message",
    "slack.search_messages",
    "teams.create_meeting",
  ];

  for (const id of toolIds) {
    const tool = TOOLS_REGISTRY[id];
    assert.ok(tool, `Tool ${id} should be registered in TOOLS_REGISTRY`);
    assert.ok(tool.inputSchema, `Tool ${id} must define an inputSchema`);
    assert.equal(typeof tool.execute, "function", `Tool ${id} must have an execute function`);
  }
});

test("2. Tools registry correctly flags high-impact operations for confirmation", () => {
  assert.equal(TOOLS_REGISTRY["gmail.send"].confirmationRequired, true);
  assert.equal(TOOLS_REGISTRY["notion.create_page"].confirmationRequired, true);
  assert.equal(TOOLS_REGISTRY["slack.send_message"].confirmationRequired, true);
  assert.equal(TOOLS_REGISTRY["teams.create_meeting"].confirmationRequired, true);

  // Read-only operations do not require confirmation
  assert.equal(TOOLS_REGISTRY["gmail.search"].confirmationRequired, false);
  assert.equal(TOOLS_REGISTRY["drive.search"].confirmationRequired, false);
  assert.equal(TOOLS_REGISTRY["notion.search"].confirmationRequired, false);
  assert.equal(TOOLS_REGISTRY["slack.search_messages"].confirmationRequired, false);
});
