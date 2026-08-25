import { test } from "node:test";
import assert from "node:assert/strict";

import {
  listUserThreads,
  getThreadMessages,
  deleteThread,
} from "../agent.service.js";
import { getNormalizedToolsRegistry, formatToolResultToChatMessage } from "../../tools/tools.registry.js";
import { NormalizedToolResult } from "../llm/llm-provider.interface.js";

test("1. listUserThreads exports and returns thread mapping", async () => {
  assert.equal(typeof listUserThreads, "function");
  assert.equal(typeof getThreadMessages, "function");
  assert.equal(typeof deleteThread, "function");
});

test("2. getNormalizedToolsRegistry returns valid normalized tool array for agent loop", () => {
  const tools = getNormalizedToolsRegistry();
  assert.ok(Array.isArray(tools));
  assert.ok(tools.length > 0);

  const getEventsTool = tools.find((t) => t.name === "calendar.get_events");
  assert.ok(getEventsTool);
  assert.equal(getEventsTool.description, "Fetch upcoming meetings and events from calendar");
  assert.equal(getEventsTool.parameters.type, "object");
});

test("3. formatToolResultToChatMessage formats success tool results into role: tool message", () => {
  const result: NormalizedToolResult = {
    toolCallId: "call_123",
    name: "calendar.get_events",
    success: true,
    data: { events: [{ title: "Team Sync" }] },
  };

  const msg = formatToolResultToChatMessage(result);
  assert.equal(msg.role, "tool");
  assert.equal(msg.toolCallId, "call_123");
  assert.equal(msg.name, "calendar.get_events");
  assert.equal(msg.content, '{"events":[{"title":"Team Sync"}]}');
});

test("4. formatToolResultToChatMessage formats failure tool results safely", () => {
  const result: NormalizedToolResult = {
    toolCallId: "call_456",
    name: "calendar.create_event",
    success: false,
    error: "Invalid start time",
    code: "INVALID_ARGUMENTS",
  };

  const msg = formatToolResultToChatMessage(result);
  assert.equal(msg.role, "tool");
  assert.equal(msg.toolCallId, "call_456");
  assert.equal(msg.name, "calendar.create_event");
  assert.deepEqual(JSON.parse(msg.content!), {
    error: "Invalid start time",
    code: "INVALID_ARGUMENTS",
  });
});
