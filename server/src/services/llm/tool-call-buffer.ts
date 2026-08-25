import { NormalizedToolCall, LLMProviderError } from "./llm-provider.interface.js";

export interface PendingToolCall {
  id: string;
  name: string;
  index: number;
  rawArguments: string;
}

export type ParseToolCallResult =
  | { success: true; toolCall: NormalizedToolCall }
  | { success: false; error: LLMProviderError; rawArguments: string };

export class ToolCallBuffer {
  private calls: Map<number, PendingToolCall> = new Map();

  startCall(id: string, name: string, index = 0): void {
    const existing = this.calls.get(index);
    if (existing) {
      existing.id = id || existing.id;
      existing.name = name || existing.name;
    } else {
      this.calls.set(index, { id, name, index, rawArguments: "" });
    }
  }

  appendDelta(argumentsDelta: string, index = 0): void {
    let call = this.calls.get(index);
    if (!call) {
      call = { id: `call_${Date.now()}_${index}`, name: "", index, rawArguments: "" };
      this.calls.set(index, call);
    }
    call.rawArguments += argumentsDelta;
  }

  getPendingCall(index = 0): PendingToolCall | undefined {
    return this.calls.get(index);
  }

  getAllPendingCalls(): PendingToolCall[] {
    return Array.from(this.calls.values()).sort((a, b) => a.index - b.index);
  }

  finalizeCall(index = 0, providerId = "unknown"): ParseToolCallResult {
    const pending = this.calls.get(index);
    if (!pending) {
      return {
        success: false,
        rawArguments: "",
        error: new LLMProviderError(
          "TOOL_CALL_PARSING_FAILURE",
          `No tool call found at index ${index}`,
          providerId,
        ),
      };
    }

    const raw = pending.rawArguments.trim();
    if (!raw) {
      return {
        success: true,
        toolCall: {
          id: pending.id,
          name: pending.name,
          arguments: {},
          rawArguments: "",
        },
      };
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Tool arguments JSON must be an object");
      }
      return {
        success: true,
        toolCall: {
          id: pending.id,
          name: pending.name,
          arguments: parsed as Record<string, unknown>,
          rawArguments: raw,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        rawArguments: raw,
        error: new LLMProviderError(
          "TOOL_CALL_PARSING_FAILURE",
          `Failed to parse tool call arguments for tool '${pending.name}': ${err?.message || "Invalid JSON"}`,
          providerId,
        ),
      };
    }
  }

  finalizeAll(providerId = "unknown"): ParseToolCallResult[] {
    const indices = Array.from(this.calls.keys()).sort((a, b) => a - b);
    return indices.map((idx) => this.finalizeCall(idx, providerId));
  }

  clear(): void {
    this.calls.clear();
  }
}
