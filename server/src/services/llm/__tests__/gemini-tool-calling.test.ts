import { test } from "node:test";
import assert from "node:assert/strict";

import {
  toGeminiToolName,
  fromGeminiToolName,
  toGeminiJsonSchema,
  formatGeminiTools,
  formatGeminiToolConfig,
  formatGeminiMessages,
  parseGeminiAssistantMessage,
  parseGeminiStream,
} from "../gemini-tool-formatting.js";
import { GeminiAdapter } from "../adapters/gemini.adapter.js";
import {
  ChatMessage,
  NormalizedToolDefinition,
  LLMProviderError,
} from "../llm-provider.interface.js";

const sampleTools: NormalizedToolDefinition[] = [
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
  {
    name: "calendar.create_event",
    description: "Create meeting",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event title" },
      },
      required: ["title"],
    },
  },
];

test("1. Normal text response parsing", () => {
  const geminiRes = {
    candidates: [
      {
        content: {
          parts: [{ text: "Hello! How can I assist you with your schedule today?" }],
        },
        finishReason: "STOP",
      },
    ],
  };

  const parsed = parseGeminiAssistantMessage(geminiRes, sampleTools);
  assert.equal(parsed.content, "Hello! How can I assist you with your schedule today?");
  assert.equal(parsed.toolCalls, undefined);
  assert.equal(parsed.finishReason, "stop");
});

test("2. Single function call parsing", () => {
  const geminiRes = {
    candidates: [
      {
        content: {
          parts: [
            {
              functionCall: {
                name: "calendar_get_events",
                args: { maxResults: 5 },
              },
            },
          ],
        },
        finishReason: "STOP",
      },
    ],
  };

  const parsed = parseGeminiAssistantMessage(geminiRes, sampleTools);
  assert.equal(parsed.content, null);
  assert.ok(parsed.toolCalls);
  assert.equal(parsed.toolCalls.length, 1);
  assert.equal(parsed.toolCalls[0].name, "calendar.get_events");
  assert.equal(parsed.toolCalls[0].arguments.maxResults, 5);
  assert.equal(parsed.finishReason, "tool_calls");
});

test("3. Multiple function calls parsing", () => {
  const geminiRes = {
    candidates: [
      {
        content: {
          parts: [
            {
              functionCall: {
                name: "calendar_get_events",
                args: { maxResults: 10 },
              },
            },
            {
              functionCall: {
                name: "calendar_create_event",
                args: { title: "Sprint Planning" },
              },
            },
          ],
        },
        finishReason: "STOP",
      },
    ],
  };

  const parsed = parseGeminiAssistantMessage(geminiRes, sampleTools);
  assert.ok(parsed.toolCalls);
  assert.equal(parsed.toolCalls.length, 2);
  assert.equal(parsed.toolCalls[0].name, "calendar.get_events");
  assert.equal(parsed.toolCalls[1].name, "calendar.create_event");
  assert.equal(parsed.toolCalls[1].arguments.title, "Sprint Planning");
  assert.equal(parsed.finishReason, "tool_calls");
});

test("4. Text + function call parsing", () => {
  const geminiRes = {
    candidates: [
      {
        content: {
          parts: [
            { text: "I'll fetch your events now." },
            {
              functionCall: {
                name: "calendar_get_events",
                args: { maxResults: 3 },
              },
            },
          ],
        },
        finishReason: "STOP",
      },
    ],
  };

  const parsed = parseGeminiAssistantMessage(geminiRes, sampleTools);
  assert.equal(parsed.content, "I'll fetch your events now.");
  assert.ok(parsed.toolCalls);
  assert.equal(parsed.toolCalls.length, 1);
  assert.equal(parsed.toolCalls[0].name, "calendar.get_events");
});

test("5. Tool result formatting in Gemini messages", () => {
  const messages: ChatMessage[] = [
    { role: "user", content: "Show my meetings" },
    {
      role: "assistant",
      content: null,
      toolCalls: [
        {
          id: "call_123",
          name: "calendar.get_events",
          arguments: { maxResults: 5 },
        },
      ],
    },
    {
      role: "tool",
      toolCallId: "call_123",
      name: "calendar.get_events",
      content: '{"events":[{"title":"Sync"}]}',
    },
  ];

  const { contents } = formatGeminiMessages(messages, sampleTools);
  assert.equal(contents.length, 3);
  assert.equal(contents[0].role, "user");
  assert.equal(contents[1].role, "model");
  assert.ok(contents[1].parts[0].functionCall);

  assert.equal(contents[2].role, "user");
  assert.ok(contents[2].parts[0].functionResponse);
  const fnRes = contents[2].parts[0].functionResponse as any;
  assert.equal(fnRes.name, "calendar_get_events");
  assert.deepEqual(fnRes.response, { events: [{ title: "Sync" }] });
});

test("6. System instruction mapping", () => {
  const messages: ChatMessage[] = [
    { role: "system", content: "You are Calby Executive Assistant." },
    { role: "system", content: "Always be polite." },
    { role: "user", content: "Hello!" },
  ];

  const { systemInstruction, contents } = formatGeminiMessages(messages);
  assert.ok(systemInstruction);
  assert.equal(systemInstruction.parts.length, 2);
  assert.equal(systemInstruction.parts[0].text, "You are Calby Executive Assistant.");
  assert.equal(systemInstruction.parts[1].text, "Always be polite.");
  assert.equal(contents.length, 1);
  assert.equal(contents[0].role, "user");
});

test("7. User/model message mapping & turn coalescing", () => {
  const messages: ChatMessage[] = [
    { role: "user", content: "Turn 1" },
    { role: "user", content: "Turn 1 extra details" },
    { role: "assistant", content: "Response 1" },
  ];

  const { contents } = formatGeminiMessages(messages);
  assert.equal(contents.length, 2);
  assert.equal(contents[0].role, "user");
  assert.equal(contents[0].parts.length, 2);
  assert.equal(contents[1].role, "model");
});

test("8. Streaming text", async () => {
  const sseChunks = [
    'data: {"candidates":[{"content":{"parts":[{"text":"Hello "}]}}]}\n\n',
    'data: {"candidates":[{"content":{"parts":[{"text":"world!"}]}}]}\n\n',
  ];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of sseChunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

  const events: any[] = [];
  for await (const event of parseGeminiStream(stream, sampleTools)) {
    events.push(event);
  }

  const tokenEvents = events.filter((e) => e.type === "token");
  assert.equal(tokenEvents.map((t) => t.content).join(""), "Hello world!");
  const doneEvent = events.find((e) => e.type === "done");
  assert.ok(doneEvent);
  assert.equal(doneEvent.finishReason, "stop");
});

test("9. Streaming function call", async () => {
  const sseChunks = [
    'data: {"candidates":[{"content":{"parts":[{"functionCall":{"name":"calendar_get_events","args":{"maxResults":5}}}]}}]}\n\n',
  ];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of sseChunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

  const events: any[] = [];
  for await (const event of parseGeminiStream(stream, sampleTools)) {
    events.push(event);
  }

  const startEvent = events.find((e) => e.type === "tool_call_start");
  assert.ok(startEvent);
  assert.equal(startEvent.name, "calendar.get_events");

  const doneEvent = events.find((e) => e.type === "tool_call_done");
  assert.ok(doneEvent);
  assert.equal(doneEvent.toolCall.name, "calendar.get_events");
  assert.equal(doneEvent.toolCall.arguments.maxResults, 5);
});

test("10. Function arguments split across stream events", async () => {
  const sseChunks = [
    'data: {"candidates":[{"content":{"parts":[{"functionCall":{"name":"calendar_get_events","args":{"maxResults":10}}}]}}]}\n\n',
  ];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of sseChunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

  const events: any[] = [];
  for await (const event of parseGeminiStream(stream, sampleTools)) {
    events.push(event);
  }

  const deltaEvent = events.find((e) => e.type === "tool_call_delta");
  assert.ok(deltaEvent);
  assert.equal(deltaEvent.argumentsDelta, '{"maxResults":10}');
});

test("11. Multiple streaming function calls", async () => {
  const sseChunks = [
    'data: {"candidates":[{"content":{"parts":[{"functionCall":{"name":"calendar_get_events","args":{"maxResults":2}}},{"functionCall":{"name":"calendar_create_event","args":{"title":"Doctor Appointment"}}}]}}]}\n\n',
  ];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of sseChunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

  const events: any[] = [];
  for await (const event of parseGeminiStream(stream, sampleTools)) {
    events.push(event);
  }

  const startEvents = events.filter((e) => e.type === "tool_call_start");
  assert.equal(startEvents.length, 2);
  assert.equal(startEvents[0].name, "calendar.get_events");
  assert.equal(startEvents[1].name, "calendar.create_event");
});

test("12. Tool call completion", async () => {
  const sseChunks = [
    'data: {"candidates":[{"content":{"parts":[{"functionCall":{"name":"calendar_get_events","args":{}}}]},"finishReason":"STOP"}]}\n\n',
  ];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of sseChunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

  const events: any[] = [];
  for await (const event of parseGeminiStream(stream, sampleTools)) {
    events.push(event);
  }

  const doneEvent = events.find((e) => e.type === "done");
  assert.ok(doneEvent);
  assert.equal(doneEvent.finishReason, "tool_calls");
  assert.ok(doneEvent.toolCalls);
  assert.equal(doneEvent.toolCalls.length, 1);
});

test("13. Malformed arguments handling in ToolCallBuffer", () => {
  const parsed = parseGeminiAssistantMessage(
    {
      candidates: [
        {
          content: {
            parts: [{ functionCall: { name: "calendar_get_events", args: null } }],
          },
        },
      ],
    },
    sampleTools,
  );
  assert.ok(parsed.toolCalls);
  assert.deepEqual(parsed.toolCalls[0].arguments, {});
});

test("14. Malformed provider response handling", () => {
  const parsed = parseGeminiAssistantMessage({}, sampleTools);
  assert.equal(parsed.content, null);
  assert.equal(parsed.toolCalls, undefined);
  assert.equal(parsed.finishReason, "stop");
});

test("15. Authentication error normalization", () => {
  const adapter = new GeminiAdapter();
  try {
    adapter["handleErrorResponse"]({ status: 401 } as any, { error: { message: "API key invalid" } });
  } catch (err: any) {
    assert.ok(err instanceof LLMProviderError);
    assert.equal(err.code, "INVALID_CREDENTIALS");
  }
});

test("16. Rate-limit/quota error normalization", () => {
  const adapter = new GeminiAdapter();
  try {
    adapter["handleErrorResponse"]({ status: 429 } as any, { error: { message: "Quota exceeded" } });
  } catch (err: any) {
    assert.ok(err instanceof LLMProviderError);
    assert.equal(err.code, "RATE_LIMITED");
  }
});

test("17. Tool-choice mapping", () => {
  const autoCfg = formatGeminiToolConfig("auto");
  assert.deepEqual(autoCfg, { functionCallingConfig: { mode: "AUTO" } });

  const noneCfg = formatGeminiToolConfig("none");
  assert.deepEqual(noneCfg, { functionCallingConfig: { mode: "NONE" } });

  const requiredCfg = formatGeminiToolConfig("required");
  assert.deepEqual(requiredCfg, { functionCallingConfig: { mode: "ANY" } });

  const funcCfg = formatGeminiToolConfig({ type: "function", name: "calendar.get_events" });
  assert.deepEqual(funcCfg, {
    functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["calendar_get_events"] },
  });
});

test("18. Unsupported capability behavior", () => {
  try {
    formatGeminiToolConfig("unsupported_mode" as any);
  } catch (err: any) {
    assert.ok(err instanceof LLMProviderError);
    assert.equal(err.code, "UNSUPPORTED_CAPABILITY");
  }
});

test("19. Capability reporting", () => {
  const adapter = new GeminiAdapter();
  const detailed = adapter.getDetailedCapabilities();
  assert.equal(detailed.supportsChat, true);
  assert.equal(detailed.supportsStreaming, true);
  assert.equal(detailed.supportsToolCalling, true);
  assert.equal(detailed.supportsParallelToolCalling, true);
  assert.equal(detailed.supportsStructuredOutput, true);
  assert.equal(detailed.supportsVision, true);
});

test("20. Normal chat without tools", () => {
  const toolsFormatted = formatGeminiTools([]);
  assert.equal(toolsFormatted, undefined);

  const toolsUndefined = formatGeminiTools(undefined);
  assert.equal(toolsUndefined, undefined);
});
