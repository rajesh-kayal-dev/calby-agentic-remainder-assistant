import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatOpenAITools,
  formatOpenAIMessages,
  parseOpenAIAssistantMessage,
  parseOpenAIStream,
} from "../openai-tool-formatting.js";
import { ChatMessage, NormalizedToolDefinition } from "../llm-provider.interface.js";

test("1. formatOpenAITools converts NormalizedToolDefinition to OpenAI tools format", () => {
  const tools: NormalizedToolDefinition[] = [
    {
      name: "calendar.get_events",
      description: "Get upcoming meetings",
      parameters: {
        type: "object",
        properties: {
          maxResults: { type: "number", description: "Max count" },
        },
        required: [],
      },
    },
  ];

  const formatted = formatOpenAITools(tools);
  assert.ok(formatted);
  assert.equal(formatted.length, 1);
  assert.equal(formatted[0].type, "function");
  assert.equal(formatted[0].function.name, "calendar.get_events");
  assert.equal(formatted[0].function.description, "Get upcoming meetings");
  assert.deepEqual(formatted[0].function.parameters, tools[0].parameters);
});

test("2. formatOpenAIMessages converts tool messages & tool call history to OpenAI schema", () => {
  const messages: ChatMessage[] = [
    { role: "user", content: "Schedule a meeting" },
    {
      role: "assistant",
      content: null,
      toolCalls: [
        {
          id: "call_abc123",
          name: "calendar.create_event",
          arguments: { title: "Team Sync", startIso: "2026-08-25T12:00:00Z" },
        },
      ],
    },
    {
      role: "tool",
      toolCallId: "call_abc123",
      name: "calendar.create_event",
      content: '{"id": "evt_100", "created": true}',
    },
  ];

  const formatted = formatOpenAIMessages(messages);
  assert.equal(formatted.length, 3);
  assert.equal(formatted[0].role, "user");
  assert.equal(formatted[1].role, "assistant");
  assert.ok(Array.isArray((formatted[1] as any).tool_calls));
  assert.equal((formatted[1] as any).tool_calls[0].id, "call_abc123");
  assert.equal((formatted[1] as any).tool_calls[0].function.name, "calendar.create_event");
  assert.equal(formatted[2].role, "tool");
  assert.equal((formatted[2] as any).tool_call_id, "call_abc123");
  assert.equal((formatted[2] as any).content, '{"id": "evt_100", "created": true}');
});

test("3. parseOpenAIAssistantMessage converts OpenAI assistant tool_calls response", () => {
  const openAIResponseMsg = {
    role: "assistant",
    content: null,
    tool_calls: [
      {
        id: "call_xyz",
        type: "function",
        function: {
          name: "calendar.find_free_slots",
          arguments: '{"startIso": "2026-08-25T09:00:00Z"}',
        },
      },
    ],
  };

  const parsed = parseOpenAIAssistantMessage(openAIResponseMsg);
  assert.equal(parsed.content, null);
  assert.ok(parsed.toolCalls);
  assert.equal(parsed.toolCalls.length, 1);
  assert.equal(parsed.toolCalls[0].id, "call_xyz");
  assert.equal(parsed.toolCalls[0].name, "calendar.find_free_slots");
  assert.equal(parsed.toolCalls[0].arguments.startIso, "2026-08-25T09:00:00Z");
});

test("4. parseOpenAIStream processes text tokens and streaming tool call deltas", async () => {
  const sseChunks = [
    'data: {"choices":[{"delta":{"content":"Checking your"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":" schedule..."}}]}\n\n',
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_stream_1","function":{"name":"calendar.get_events","arguments":"{\\"max"}}]}}]}\n\n',
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"Results\\": 5}"}}]}}]}\n\n',
    'data: [DONE]\n\n',
  ];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of sseChunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  const events: any[] = [];
  for await (const event of parseOpenAIStream(stream, "openai")) {
    events.push(event);
  }

  assert.ok(events.length > 0);
  const tokenEvents = events.filter((e) => e.type === "token");
  assert.equal(tokenEvents.map((t) => t.content).join(""), "Checking your schedule...");

  const toolStart = events.find((e) => e.type === "tool_call_start");
  assert.ok(toolStart);
  assert.equal(toolStart.id, "call_stream_1");
  assert.equal(toolStart.name, "calendar.get_events");

  const toolDone = events.find((e) => e.type === "tool_call_done");
  assert.ok(toolDone);
  assert.equal(toolDone.toolCall.id, "call_stream_1");
  assert.equal(toolDone.toolCall.name, "calendar.get_events");
  assert.equal(toolDone.toolCall.arguments.maxResults, 5);

  const doneEvent = events.find((e) => e.type === "done");
  assert.ok(doneEvent);
  assert.equal(doneEvent.finishReason, "tool_calls");
  assert.ok(doneEvent.toolCalls);
  assert.equal(doneEvent.toolCalls.length, 1);
});
