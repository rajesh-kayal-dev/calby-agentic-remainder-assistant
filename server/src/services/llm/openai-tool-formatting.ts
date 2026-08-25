import {
  ChatMessage,
  ChatOptions,
  NormalizedToolDefinition,
  NormalizedToolCall,
  StreamEvent,
} from "./llm-provider.interface.js";
import { ToolCallBuffer } from "./tool-call-buffer.js";

export function formatOpenAITools(
  tools?: NormalizedToolDefinition[],
): Array<{ type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } }> | undefined {
  if (!tools || tools.length === 0) return undefined;

  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

export function formatOpenAIToolChoice(
  toolChoice?: ChatOptions["toolChoice"],
): unknown {
  if (!toolChoice) return undefined;
  if (typeof toolChoice === "string") return toolChoice;
  if (toolChoice.type === "function") {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }
  return undefined;
}

export function formatOpenAIMessages(
  messages: ChatMessage[],
): Array<Record<string, unknown>> {
  return messages.map((m) => {
    if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
      return {
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: tc.rawArguments || JSON.stringify(tc.arguments || {}),
          },
        })),
      };
    }

    if (m.role === "tool") {
      return {
        role: "tool",
        tool_call_id: m.toolCallId || "",
        name: m.name,
        content: m.content || "",
      };
    }

    return {
      role: m.role,
      content: m.content ?? "",
    };
  });
}

export function parseOpenAIAssistantMessage(messageObj: any): {
  content: string | null;
  toolCalls?: NormalizedToolCall[];
} {
  const content = typeof messageObj?.content === "string" ? messageObj.content : null;
  let toolCalls: NormalizedToolCall[] | undefined = undefined;

  if (Array.isArray(messageObj?.tool_calls) && messageObj.tool_calls.length > 0) {
    toolCalls = messageObj.tool_calls.map((tc: any, index: number) => {
      let parsedArgs: Record<string, unknown> = {};
      const raw = tc.function?.arguments || "{}";
      try {
        parsedArgs = JSON.parse(raw);
      } catch {
        // Leave as empty object if raw parsing fails, storing raw
      }

      return {
        id: tc.id || `call_${Date.now()}_${index}`,
        name: tc.function?.name || "",
        arguments: parsedArgs,
        rawArguments: raw,
      };
    });
  }

  return { content, toolCalls };
}

export async function* parseOpenAIStream(
  bodyStream: ReadableStream<Uint8Array>,
  providerId: string,
): AsyncIterable<StreamEvent> {
  const reader = bodyStream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const toolBuffer = new ToolCallBuffer();
  const emittedStarts = new Set<number>();
  let lastFinishReason: string | undefined = undefined;
  let usageMetadata: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined = undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === "[DONE]") {
          break;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.usage) {
            usageMetadata = {
              promptTokens: parsed.usage.prompt_tokens,
              completionTokens: parsed.usage.completion_tokens,
              totalTokens: parsed.usage.total_tokens,
            };
          }

          const choice = parsed?.choices?.[0];
          if (!choice) continue;

          if (choice.finish_reason) {
            lastFinishReason = choice.finish_reason;
          }

          const delta = choice.delta;
          if (!delta) continue;

          // 1. Yield text content token if present
          if (typeof delta.content === "string" && delta.content.length > 0) {
            yield { type: "token", content: delta.content };
          }

          // 2. Handle streaming tool calls
          if (Array.isArray(delta.tool_calls)) {
            for (const tcDelta of delta.tool_calls) {
              const idx = typeof tcDelta.index === "number" ? tcDelta.index : 0;

              if (tcDelta.id || tcDelta.function?.name) {
                toolBuffer.startCall(tcDelta.id || "", tcDelta.function?.name || "", idx);
                if (!emittedStarts.has(idx)) {
                  const pending = toolBuffer.getPendingCall(idx);
                  if (pending && pending.name) {
                    emittedStarts.add(idx);
                    yield {
                      type: "tool_call_start",
                      id: pending.id,
                      name: pending.name,
                      index: idx,
                    };
                  }
                }
              }

              if (typeof tcDelta.function?.arguments === "string" && tcDelta.function.arguments.length > 0) {
                toolBuffer.appendDelta(tcDelta.function.arguments, idx);
                const pending = toolBuffer.getPendingCall(idx);
                yield {
                  type: "tool_call_delta",
                  id: pending?.id || `call_${idx}`,
                  argumentsDelta: tcDelta.function.arguments,
                  index: idx,
                };
              }
            }
          }
        } catch {
          // Ignore partial line JSON parse errors
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // 3. Finalize buffered tool calls upon stream end
  const finalizedResults = toolBuffer.finalizeAll(providerId);
  const completedToolCalls: NormalizedToolCall[] = [];

  for (const res of finalizedResults) {
    if (res.success) {
      completedToolCalls.push(res.toolCall);
      yield { type: "tool_call_done", toolCall: res.toolCall };
    } else {
      yield {
        type: "error",
        error: res.error.message,
        code: res.error.code,
      };
    }
  }

  yield {
    type: "done",
    usage: usageMetadata,
    finishReason: lastFinishReason || (completedToolCalls.length > 0 ? "tool_calls" : "stop"),
    toolCalls: completedToolCalls.length > 0 ? completedToolCalls : undefined,
  };
}
