import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import {
  LLMProviderError,
  getDetailedCapabilities,
  NormalizedToolResult,
  StreamEvent,
} from "../llm-provider.interface.js";
import { ToolCallBuffer } from "../tool-call-buffer.js";
import {
  backendToolToNormalizedDefinition,
  zodSchemaToJsonSchema,
  formatToolResultToChatMessage,
} from "../../../tools/tool-serializer.js";
import { TOOLS_REGISTRY } from "../../../tools/tools.registry.js";

test("1. Normalized Tool Definition Creation", () => {
  const toolDef = TOOLS_REGISTRY["calendar.create_event"];
  assert.ok(toolDef, "calendar.create_event should exist in tools registry");

  const normalized = backendToolToNormalizedDefinition(toolDef);
  assert.equal(normalized.name, "calendar.create_event");
  assert.equal(normalized.description, "Create a new meeting or event on calendar");
  assert.equal(normalized.parameters.type, "object");
  assert.ok(normalized.parameters.properties.title);
  assert.equal(normalized.parameters.properties.title.type, "string");
  assert.ok(normalized.parameters.required?.includes("title"));
  assert.ok(normalized.parameters.required?.includes("startIso"));
  assert.ok(normalized.parameters.required?.includes("endIso"));
  assert.ok(!normalized.parameters.required?.includes("description"));
});

test("2. Zod Schema to JSON Schema Conversion", () => {
  const schema = z.object({
    maxResults: z.number().optional().default(10),
    category: z.enum(["WORK", "PERSONAL"]).optional(),
    tags: z.array(z.string()).optional(),
  });

  const converted = zodSchemaToJsonSchema(schema);
  assert.equal(converted.type, "object");
  assert.ok(converted.properties);
  assert.equal(converted.properties.maxResults.type, "number");
  assert.equal(converted.properties.maxResults.default, 10);
  assert.equal(converted.properties.category.type, "string");
  assert.deepEqual(converted.properties.category.enum, ["WORK", "PERSONAL"]);
  assert.equal(converted.properties.tags.type, "array");
});

test("3. Capability Detection", () => {
  const caps1 = getDetailedCapabilities(["chat", "streaming", "tool_calling", "parallel_tool_calling"]);
  assert.equal(caps1.supportsChat, true);
  assert.equal(caps1.supportsStreaming, true);
  assert.equal(caps1.supportsToolCalling, true);
  assert.equal(caps1.supportsParallelToolCalling, true);
  assert.equal(caps1.supportsStructuredOutput, false);
  assert.equal(caps1.supportsVision, false);

  const caps2 = getDetailedCapabilities(["chat"], ["vision", "json_mode"]);
  assert.equal(caps2.supportsChat, true);
  assert.equal(caps2.supportsVision, true);
  assert.equal(caps2.supportsStructuredOutput, true);
  assert.equal(caps2.supportsToolCalling, false);
});

test("4. Tool Call Argument Buffering (No Premature Parsing)", () => {
  const buffer = new ToolCallBuffer();
  buffer.startCall("call_999", "calendar.get_events", 0);

  buffer.appendDelta('{"maxResults":', 0);
  assert.equal(buffer.getPendingCall(0)?.rawArguments, '{"maxResults":');

  buffer.appendDelta(" 5}", 0);
  assert.equal(buffer.getPendingCall(0)?.rawArguments, '{"maxResults": 5}');
});

test("5. Tool Argument Parsing Only After Completion", () => {
  const buffer = new ToolCallBuffer();
  buffer.startCall("call_101", "calendar.find_free_slots", 0);
  buffer.appendDelta('{"startIso": "2026-08-25T10:00:00Z", "endIso": "2026-08-25T18:00:00Z"}', 0);

  const result = buffer.finalizeCall(0, "openai");
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.toolCall.id, "call_101");
    assert.equal(result.toolCall.name, "calendar.find_free_slots");
    assert.equal(result.toolCall.arguments.startIso, "2026-08-25T10:00:00Z");
    assert.equal(result.toolCall.arguments.endIso, "2026-08-25T18:00:00Z");
  }
});

test("6. Invalid Tool Arguments Handling", () => {
  const buffer = new ToolCallBuffer();
  buffer.startCall("call_102", "calendar.delete_event", 0);
  buffer.appendDelta('{"eventId": bad_json_value}', 0);

  const result = buffer.finalizeCall(0, "openai");
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.code, "TOOL_CALL_PARSING_FAILURE");
    assert.equal(result.rawArguments, '{"eventId": bad_json_value}');
    assert.equal(result.error.provider, "openai");
  }
});

test("7. Normalized Tool Result Formatting", () => {
  const successResult: NormalizedToolResult = {
    toolCallId: "call_abc",
    name: "calendar.create_event",
    success: true,
    data: { id: "evt_789", title: "Team Sync" },
  };

  const successMessage = formatToolResultToChatMessage(successResult);
  assert.equal(successMessage.role, "tool");
  assert.equal(successMessage.toolCallId, "call_abc");
  assert.equal(successMessage.name, "calendar.create_event");
  assert.equal(successMessage.content, '{"id":"evt_789","title":"Team Sync"}');

  const failedResult: NormalizedToolResult = {
    toolCallId: "call_xyz",
    name: "gmail.send",
    success: false,
    error: "Gmail connector required",
    code: "CONNECTION_REQUIRED",
  };

  const failedMessage = formatToolResultToChatMessage(failedResult);
  assert.equal(failedMessage.role, "tool");
  assert.equal(failedMessage.toolCallId, "call_xyz");
  assert.equal(failedMessage.content, '{"error":"Gmail connector required","code":"CONNECTION_REQUIRED"}');
});

test("8. Stream Event Types Discrimination", () => {
  const tokenEvent: StreamEvent = { type: "token", content: "Hello" };
  const startEvent: StreamEvent = { type: "tool_call_start", id: "call_1", name: "calendar.get_events", index: 0 };
  const deltaEvent: StreamEvent = { type: "tool_call_delta", id: "call_1", argumentsDelta: '{"todayOnly": true}', index: 0 };
  const doneEvent: StreamEvent = { type: "done", finishReason: "stop" };
  const errorEvent: StreamEvent = { type: "error", error: "Unauthorized access", code: "INVALID_CREDENTIALS" };

  assert.equal(tokenEvent.type, "token");
  assert.equal(startEvent.type, "tool_call_start");
  assert.equal(deltaEvent.type, "tool_call_delta");
  assert.equal(doneEvent.type, "done");
  assert.equal(errorEvent.type, "error");

  const providerError = new LLMProviderError("INVALID_CREDENTIALS", "Bad API key", "openai", 401);
  assert.equal(providerError.code, "INVALID_CREDENTIALS");
  assert.equal(providerError.provider, "openai");
  assert.equal(providerError.statusCode, 401);
});
