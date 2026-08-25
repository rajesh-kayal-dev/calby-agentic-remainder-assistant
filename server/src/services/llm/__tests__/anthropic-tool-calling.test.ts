import { test } from "node:test";
import assert from "node:assert/strict";

import {
  toAnthropicToolName,
  fromAnthropicToolName,
  formatAnthropicTools,
  formatAnthropicMessages,
  parseAnthropicAssistantMessage,
  parseAnthropicStream,
} from "../anthropic-tool-formatting.js";
import { ChatMessage, NormalizedToolDefinition } from "../llm-provider.interface.js";

const sampleTools: NormalizedToolDefinition[] = [
  {
    name: "calendar.get_events",
    description: "Get upcoming meetings",
    parameters: {
      type: "object",
      properties: {
        maxResults: { type: "number" },
      },
      required: [],
    },
  },
];

test("1. toAnthropicToolName and fromAnthropicToolName handle dot sanitization", () => {
  const sanitized = toAnthropicToolName("calendar.get_events");
  assert.equal(sanitized, "calendar_get_events");

  const restored = fromAnthropicToolName("calendar_get_events", sampleTools);
  assert.equal(restored, "calendar.get_events");
});

test("2. formatAnthropicTools formats NormalizedToolDefinition into Anthropic input_schema spec", () => {
  const formatted = formatAnthropicTools(sampleTools);
  assert.ok(formatted);
  assert.equal(formatted.length, 1);
  assert.equal(formatted[0].name, "calendar_get_events");
  assert.equal(formatted[0].description, "Get upcoming meetings");
  assert.ok(formatted[0].input_schema);
  assert.equal(formatted[0].input_schema.type, "object");
  assert.ok((formatted[0].input_schema.properties as any).maxResults);
});

test("3. formatAnthropicMessages enforces alternating role order and tool_result blocks", () => {
  const messages: ChatMessage[] = [
    { role: "system", content: "You are an AI assistant." },
    { role: "user", content: "Check my calendar" },
    {
      role: "assistant",
      content: "Checking now...",
      toolCalls: [
        {
          id: "toolu_123",
          name: "calendar.get_events",
          arguments: { maxResults: 5 },
        },
      ],
    },
    {
      role: "tool",
      toolCallId: "toolu_123",
      name: "calendar.get_events",
      content: '{"events": []}',
    },
    { role: "user", content: "Any events found?" },
  ];

  const { systemPrompt, messages: anthropicMsgs } = formatAnthropicMessages(messages, sampleTools);
  assert.equal(systemPrompt, "You are an AI assistant.");
  assert.ok(Array.isArray(anthropicMsgs));

  // Role alternation check: user -> assistant -> user
  assert.equal(anthropicMsgs[0].role, "user");
  assert.equal(anthropicMsgs[1].role, "assistant");
  assert.equal(anthropicMsgs[2].role, "user"); // Coalesced tool_result + user turn

  // Assistant block check
  const assistantContent = anthropicMsgs[1].content as any[];
  assert.ok(Array.isArray(assistantContent));
  assert.equal(assistantContent[0].type, "text");
  assert.equal(assistantContent[1].type, "tool_use");
  assert.equal(assistantContent[1].name, "calendar_get_events");

  // Coalesced user block check (tool_result + text)
  const userContent = anthropicMsgs[2].content as any[];
  assert.ok(Array.isArray(userContent));
  assert.equal(userContent[0].type, "tool_result");
  assert.equal(userContent[0].tool_use_id, "toolu_123");
  assert.equal(userContent[1].type, "text");
  assert.equal(userContent[1].text, "Any events found?");
});

test("4. parseAnthropicAssistantMessage parses non-streaming response", () => {
  const responseData = {
    id: "msg_01",
    type: "message",
    role: "assistant",
    content: [
      { type: "text", text: "Found your schedule." },
      {
        type: "tool_use",
        id: "toolu_999",
        name: "calendar_get_events",
        input: { maxResults: 10 },
      },
    ],
    stop_reason: "tool_use",
  };

  const parsed = parseAnthropicAssistantMessage(responseData, sampleTools);
  assert.equal(parsed.content, "Found your schedule.");
  assert.ok(parsed.toolCalls);
  assert.equal(parsed.toolCalls.length, 1);
  assert.equal(parsed.toolCalls[0].id, "toolu_999");
  assert.equal(parsed.toolCalls[0].name, "calendar.get_events");
  assert.equal(parsed.toolCalls[0].arguments.maxResults, 10);
  assert.equal(parsed.finishReason, "tool_calls");
});

test("5. parseAnthropicStream processes streamed content blocks and tool calls", async () => {
  const sseChunks = [
    'data: {"type":"message_start","message":{"id":"msg_1","usage":{"input_tokens":50,"output_tokens":1}}}\n\n',
    'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n',
    'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Checking your"}} \n\n',
    'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" calendar..."}}\n\n',
    'data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_stream_1","name":"calendar_get_events","input":{}}}\n\n',
    'data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\\"maxRes"}}\n\n',
    'data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"ults\\": 3}"}}\n\n',
    'data: {"type":"message_delta","delta":{"stop_reason":"tool_use"},"usage":{"output_tokens":30}}\n\n',
    'data: {"type":"message_stop"}\n\n',
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
  for await (const event of parseAnthropicStream(stream, sampleTools)) {
    events.push(event);
  }

  assert.ok(events.length > 0);
  const textTokens = events.filter((e) => e.type === "token").map((e) => e.content).join("");
  assert.equal(textTokens, "Checking your calendar...");

  const toolStart = events.find((e) => e.type === "tool_call_start");
  assert.ok(toolStart);
  assert.equal(toolStart.id, "toolu_stream_1");
  assert.equal(toolStart.name, "calendar.get_events");

  const toolDone = events.find((e) => e.type === "tool_call_done");
  assert.ok(toolDone);
  assert.equal(toolDone.toolCall.id, "toolu_stream_1");
  assert.equal(toolDone.toolCall.name, "calendar.get_events");
  assert.equal(toolDone.toolCall.arguments.maxResults, 3);

  const doneEvent = events.find((e) => e.type === "done");
  assert.ok(doneEvent);
  assert.equal(doneEvent.finishReason, "tool_calls");
  assert.ok(doneEvent.toolCalls);
  assert.equal(doneEvent.toolCalls.length, 1);
});
