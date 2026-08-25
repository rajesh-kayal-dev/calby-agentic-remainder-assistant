import {
  ChatMessage,
  NormalizedToolDefinition,
  NormalizedToolCall,
  StreamEvent,
} from "./llm-provider.interface.js";
import { ToolCallBuffer } from "./tool-call-buffer.js";

export function toAnthropicToolName(name: string): string {
  return name.replace(/\./g, "_");
}

export function fromAnthropicToolName(
  name: string,
  tools?: NormalizedToolDefinition[],
): string {
  if (tools) {
    const match = tools.find(
      (t) => t.name === name || toAnthropicToolName(t.name) === name,
    );
    if (match) return match.name;
  }
  return name;
}

export function formatAnthropicTools(
  tools?: NormalizedToolDefinition[],
): Array<{ name: string; description: string; input_schema: Record<string, unknown> }> | undefined {
  if (!tools || tools.length === 0) return undefined;

  return tools.map((t) => ({
    name: toAnthropicToolName(t.name),
    description: t.description,
    input_schema: {
      type: "object",
      properties: t.parameters.properties || {},
      required: t.parameters.required || [],
    },
  }));
}

export function formatAnthropicMessages(
  messages: ChatMessage[],
  tools?: NormalizedToolDefinition[],
): { systemPrompt?: string; messages: Array<{ role: "user" | "assistant"; content: any }> } {
  const systemMessages = messages.filter((m) => m.role === "system" && m.content);
  const systemPrompt =
    systemMessages.length > 0
      ? systemMessages.map((m) => m.content).join("\n\n")
      : undefined;

  const nonSystemMessages = messages.filter((m) => m.role !== "system");
  const formatted: Array<{ role: "user" | "assistant"; content: any }> = [];

  for (const m of nonSystemMessages) {
    if (m.role === "user") {
      const last = formatted[formatted.length - 1];
      const userBlock = { type: "text", text: m.content || "" };
      if (last && last.role === "user") {
        if (typeof last.content === "string") {
          last.content = [{ type: "text", text: last.content }, userBlock];
        } else if (Array.isArray(last.content)) {
          last.content.push(userBlock);
        }
      } else {
        formatted.push({ role: "user", content: m.content || "" });
      }
    } else if (m.role === "tool") {
      const last = formatted[formatted.length - 1];
      const toolResultBlock = {
        type: "tool_result",
        tool_use_id: m.toolCallId || "",
        content: m.content || "",
      };
      if (last && last.role === "user") {
        if (typeof last.content === "string") {
          last.content = [{ type: "text", text: last.content }, toolResultBlock];
        } else if (Array.isArray(last.content)) {
          last.content.push(toolResultBlock);
        }
      } else {
        formatted.push({ role: "user", content: [toolResultBlock] });
      }
    } else if (m.role === "assistant") {
      if (m.toolCalls && m.toolCalls.length > 0) {
        const blocks: any[] = [];
        if (m.content) {
          blocks.push({ type: "text", text: m.content });
        }
        for (const tc of m.toolCalls) {
          blocks.push({
            type: "tool_use",
            id: tc.id,
            name: toAnthropicToolName(tc.name),
            input: tc.arguments || {},
          });
        }
        formatted.push({ role: "assistant", content: blocks });
      } else {
        formatted.push({ role: "assistant", content: m.content || "" });
      }
    }
  }

  return { systemPrompt, messages: formatted };
}

export function parseAnthropicAssistantMessage(
  data: any,
  tools?: NormalizedToolDefinition[],
): { content: string | null; toolCalls?: NormalizedToolCall[]; finishReason: string } {
  let content: string | null = null;
  const toolCalls: NormalizedToolCall[] = [];

  if (Array.isArray(data?.content)) {
    for (const block of data.content) {
      if (block.type === "text") {
        content = (content ? content + "\n" : "") + block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: fromAnthropicToolName(block.name, tools),
          arguments: (block.input as Record<string, unknown>) || {},
          rawArguments: JSON.stringify(block.input || {}),
        });
      }
    }
  }

  const stopReason = data?.stop_reason || (toolCalls.length > 0 ? "tool_use" : "end_turn");
  const finishReason = stopReason === "tool_use" ? "tool_calls" : stopReason === "end_turn" ? "stop" : stopReason;

  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    finishReason,
  };
}

export async function* parseAnthropicStream(
  bodyStream: ReadableStream<Uint8Array>,
  tools?: NormalizedToolDefinition[],
): AsyncIterable<StreamEvent> {
  const reader = bodyStream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const toolBuffer = new ToolCallBuffer();
  const blockIndexToToolIndex = new Map<number, number>();
  let nextToolIndex = 0;
  let lastStopReason: string | undefined = undefined;
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

        try {
          const parsed = JSON.parse(trimmed.slice(6));

          // 1. Message start event (input tokens usage)
          if (parsed.type === "message_start" && parsed.message?.usage) {
            usageMetadata = {
              promptTokens: parsed.message.usage.input_tokens,
              completionTokens: parsed.message.usage.output_tokens,
              totalTokens:
                (parsed.message.usage.input_tokens || 0) +
                (parsed.message.usage.output_tokens || 0),
            };
          }

          // 2. Content block start (text vs tool_use)
          if (parsed.type === "content_block_start") {
            const block = parsed.content_block;
            const blockIdx = typeof parsed.index === "number" ? parsed.index : 0;

            if (block?.type === "tool_use") {
              const toolIdx = nextToolIndex++;
              blockIndexToToolIndex.set(blockIdx, toolIdx);
              const name = fromAnthropicToolName(block.name, tools);
              toolBuffer.startCall(block.id || "", name, toolIdx);

              yield {
                type: "tool_call_start",
                id: block.id || "",
                name,
                index: toolIdx,
              };
            }
          }

          // 3. Content block delta (text token vs tool argument JSON delta)
          if (parsed.type === "content_block_delta" && parsed.delta) {
            const blockIdx = typeof parsed.index === "number" ? parsed.index : 0;

            if (parsed.delta.type === "text_delta" && parsed.delta.text) {
              yield { type: "token", content: parsed.delta.text };
            } else if (
              parsed.delta.type === "input_json_delta" &&
              typeof parsed.delta.partial_json === "string"
            ) {
              const toolIdx = blockIndexToToolIndex.get(blockIdx) ?? 0;
              toolBuffer.appendDelta(parsed.delta.partial_json, toolIdx);
              const pending = toolBuffer.getPendingCall(toolIdx);

              yield {
                type: "tool_call_delta",
                id: pending?.id || `toolu_${toolIdx}`,
                argumentsDelta: parsed.delta.partial_json,
                index: toolIdx,
              };
            }
          }

          // 4. Message delta (stop reason & output tokens usage)
          if (parsed.type === "message_delta") {
            if (parsed.delta?.stop_reason) {
              lastStopReason = parsed.delta.stop_reason;
            }
            if (parsed.usage?.output_tokens && usageMetadata) {
              usageMetadata.completionTokens = parsed.usage.output_tokens;
              usageMetadata.totalTokens =
                (usageMetadata.promptTokens || 0) + parsed.usage.output_tokens;
            }
          }

          // 5. Message stop event
          if (parsed.type === "message_stop") {
            break;
          }
        } catch {
          // Ignore partial line JSON parse errors
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // 6. Finalize tool argument buffering upon stream completion
  const finalizedResults = toolBuffer.finalizeAll("anthropic");
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

  const finishReason =
    lastStopReason === "tool_use"
      ? "tool_calls"
      : lastStopReason === "end_turn"
      ? "stop"
      : lastStopReason || (completedToolCalls.length > 0 ? "tool_calls" : "stop");

  yield {
    type: "done",
    usage: usageMetadata,
    finishReason,
    toolCalls: completedToolCalls.length > 0 ? completedToolCalls : undefined,
  };
}
