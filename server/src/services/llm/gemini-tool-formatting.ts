import {
  ChatMessage,
  ChatOptions,
  NormalizedToolDefinition,
  NormalizedToolParameter,
  NormalizedToolCall,
  StreamEvent,
  LLMProviderError,
} from "./llm-provider.interface.js";
import { ToolCallBuffer } from "./tool-call-buffer.js";

export function toGeminiToolName(name: string): string {
  return name.replace(/\./g, "_");
}

export function fromGeminiToolName(
  name: string,
  tools?: NormalizedToolDefinition[],
): string {
  if (tools) {
    const match = tools.find(
      (t) => t.name === name || toGeminiToolName(t.name) === name,
    );
    if (match) return match.name;
  }
  return name;
}

export function toGeminiJsonSchema(param: NormalizedToolParameter): Record<string, unknown> {
  const typeMap: Record<string, string> = {
    string: "STRING",
    number: "NUMBER",
    integer: "NUMBER",
    boolean: "BOOLEAN",
    object: "OBJECT",
    array: "ARRAY",
  };

  const geminiType = typeMap[(param.type || "string").toLowerCase()] || "STRING";
  const result: Record<string, unknown> = { type: geminiType };

  if (param.description) result.description = param.description;
  if (param.enum) result.enum = param.enum;

  if (param.properties && geminiType === "OBJECT") {
    const props: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(param.properties)) {
      props[key] = toGeminiJsonSchema(val);
    }
    result.properties = props;
    if (param.required && param.required.length > 0) {
      result.required = param.required;
    }
  }

  if (param.items && geminiType === "ARRAY") {
    result.items = toGeminiJsonSchema(param.items);
  }

  return result;
}

export function formatGeminiTools(
  tools?: NormalizedToolDefinition[],
): Array<{ functionDeclarations: Array<{ name: string; description: string; parameters: Record<string, unknown> }> }> | undefined {
  if (!tools || tools.length === 0) return undefined;

  const declarations = tools.map((t) => ({
    name: toGeminiToolName(t.name),
    description: t.description,
    parameters: toGeminiJsonSchema({
      type: "object",
      properties: t.parameters.properties,
      required: t.parameters.required,
    }),
  }));

  return [{ functionDeclarations: declarations }];
}

export function formatGeminiToolConfig(
  toolChoice?: ChatOptions["toolChoice"],
): Record<string, unknown> | undefined {
  if (!toolChoice) return undefined;

  if (toolChoice === "auto") {
    return { functionCallingConfig: { mode: "AUTO" } };
  }
  if (toolChoice === "none") {
    return { functionCallingConfig: { mode: "NONE" } };
  }
  if (toolChoice === "required") {
    return { functionCallingConfig: { mode: "ANY" } };
  }
  if (typeof toolChoice === "object" && toolChoice.type === "function") {
    return {
      functionCallingConfig: {
        mode: "ANY",
        allowedFunctionNames: [toGeminiToolName(toolChoice.name)],
      },
    };
  }

  throw new LLMProviderError(
    "UNSUPPORTED_CAPABILITY",
    `Unsupported toolChoice configuration for Gemini: ${JSON.stringify(toolChoice)}`,
    "google-gemini",
  );
}

export function formatGeminiMessages(
  messages: ChatMessage[],
  tools?: NormalizedToolDefinition[],
): {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: Array<{ role: string; parts: Array<Record<string, unknown>> }>;
} {
  const systemMsgs = messages.filter((m) => m.role === "system" && m.content);
  const systemInstruction =
    systemMsgs.length > 0
      ? { parts: systemMsgs.map((m) => ({ text: m.content || "" })) }
      : undefined;

  const nonSystemMessages = messages.filter((m) => m.role !== "system");
  const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];

  for (const m of nonSystemMessages) {
    if (m.role === "user") {
      const part = { text: m.content || "" };
      const last = contents[contents.length - 1];
      if (last && last.role === "user") {
        last.parts.push(part);
      } else {
        contents.push({ role: "user", parts: [part] });
      }
    } else if (m.role === "tool") {
      let jsonResponse: Record<string, unknown> = {};
      try {
        jsonResponse = JSON.parse(m.content || "{}");
      } catch {
        jsonResponse = { result: m.content || "" };
      }

      const part = {
        functionResponse: {
          name: toGeminiToolName(m.name || ""),
          response: jsonResponse,
        },
      };

      const last = contents[contents.length - 1];
      if (last && last.role === "user") {
        last.parts.push(part);
      } else {
        contents.push({ role: "user", parts: [part] });
      }
    } else if (m.role === "assistant") {
      const parts: Array<Record<string, unknown>> = [];
      if (m.content) {
        parts.push({ text: m.content });
      }
      if (m.toolCalls && m.toolCalls.length > 0) {
        for (const tc of m.toolCalls) {
          parts.push({
            functionCall: {
              name: toGeminiToolName(tc.name),
              args: tc.arguments || {},
            },
          });
        }
      }
      contents.push({ role: "model", parts: parts.length > 0 ? parts : [{ text: "" }] });
    }
  }

  return { systemInstruction, contents };
}

export function parseGeminiAssistantMessage(
  data: any,
  tools?: NormalizedToolDefinition[],
): { content: string | null; toolCalls?: NormalizedToolCall[]; finishReason: string } {
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts || candidate?.parts || [];
  let content: string | null = null;
  const toolCalls: NormalizedToolCall[] = [];

  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx];
    if (typeof part.text === "string" && part.text.length > 0) {
      content = (content ? content + "\n" : "") + part.text;
    }
    if (part.functionCall) {
      const rawName = part.functionCall.name || "";
      const originalName = fromGeminiToolName(rawName, tools);
      const args = (part.functionCall.args as Record<string, unknown>) || {};

      toolCalls.push({
        id: `call_${toGeminiToolName(originalName)}_${idx}_${Date.now()}`,
        name: originalName,
        arguments: args,
        rawArguments: JSON.stringify(args),
      });
    }
  }

  const rawFinish = candidate?.finishReason || "STOP";
  const finishReason =
    toolCalls.length > 0
      ? "tool_calls"
      : rawFinish === "STOP"
      ? "stop"
      : rawFinish === "MAX_TOKENS"
      ? "length"
      : rawFinish;

  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    finishReason,
  };
}

export async function* parseGeminiStream(
  bodyStream: ReadableStream<Uint8Array>,
  tools?: NormalizedToolDefinition[],
): AsyncIterable<StreamEvent> {
  const reader = bodyStream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const toolBuffer = new ToolCallBuffer();
  let nextToolIndex = 0;
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

        try {
          const parsed = JSON.parse(trimmed.slice(6));

          if (parsed.usageMetadata) {
            usageMetadata = {
              promptTokens: parsed.usageMetadata.promptTokenCount,
              completionTokens: parsed.usageMetadata.candidatesTokenCount,
              totalTokens: parsed.usageMetadata.totalTokenCount,
            };
          }

          const candidate = parsed?.candidates?.[0];
          if (candidate?.finishReason) {
            lastFinishReason = candidate.finishReason;
          }

          const parts = candidate?.content?.parts || candidate?.parts || [];
          for (const part of parts) {
            if (typeof part.text === "string" && part.text.length > 0) {
              yield { type: "token", content: part.text };
            }

            if (part.functionCall) {
              const toolIdx = nextToolIndex++;
              const rawName = part.functionCall.name || "";
              const originalName = fromGeminiToolName(rawName, tools);
              const toolId = `call_${toGeminiToolName(originalName)}_${toolIdx}_${Date.now()}`;
              const argsObj = part.functionCall.args || {};
              const argsJson = JSON.stringify(argsObj);

              toolBuffer.startCall(toolId, originalName, toolIdx);
              yield {
                type: "tool_call_start",
                id: toolId,
                name: originalName,
                index: toolIdx,
              };

              toolBuffer.appendDelta(argsJson, toolIdx);
              yield {
                type: "tool_call_delta",
                id: toolId,
                argumentsDelta: argsJson,
                index: toolIdx,
              };
            }
          }
        } catch {
          // Ignore partial SSE JSON parse errors
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const finalizedResults = toolBuffer.finalizeAll("google-gemini");
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
    lastFinishReason === "STOP" && completedToolCalls.length > 0
      ? "tool_calls"
      : lastFinishReason === "STOP"
      ? "stop"
      : lastFinishReason === "MAX_TOKENS"
      ? "length"
      : lastFinishReason || (completedToolCalls.length > 0 ? "tool_calls" : "stop");

  yield {
    type: "done",
    usage: usageMetadata,
    finishReason,
    toolCalls: completedToolCalls.length > 0 ? completedToolCalls : undefined,
  };
}
