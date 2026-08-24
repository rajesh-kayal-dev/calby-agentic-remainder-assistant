import { BaseLLMAdapter } from "./base.adapter.js";
import {
  ChatOptions,
  ModelDefinition,
  NormalizedChatResponse,
  StreamEvent,
  LLMCapability,
} from "../llm-provider.interface.js";

export class OllamaAdapter extends BaseLLMAdapter {
  providerId = "ollama";
  defaultBaseUrl = "http://localhost:11434/v1";
  capabilities: LLMCapability[] = ["chat", "streaming", "tool_calling"];

  private getNativeBaseUrl(overrideUrl?: string): string {
    const base = this.getBaseUrl(overrideUrl);
    return base.endsWith("/v1") ? base.slice(0, -3) : base;
  }

  async validateCredentials(
    _credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const nativeUrl = `${this.getNativeBaseUrl(baseUrl)}/api/tags`;
      const res = await this.fetchWithTimeout(nativeUrl, { method: "GET" }, 5000);

      if (res.ok) {
        return { valid: true, message: "Connected to local Ollama server." };
      }
      return { valid: false, message: `Ollama server returned status ${res.status}.` };
    } catch (err: any) {
      return {
        valid: false,
        message: `Cannot connect to Ollama at ${baseUrl || this.defaultBaseUrl}. Ensure Ollama is running.`,
      };
    }
  }

  async listModels(
    _credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<ModelDefinition[]> {
    try {
      const nativeUrl = `${this.getNativeBaseUrl(baseUrl)}/api/tags`;
      const res = await this.fetchWithTimeout(nativeUrl, { method: "GET" });

      if (!res.ok) return [];
      const data = (await res.json()) as { models?: Array<{ name: string; size?: number }> };
      if (!Array.isArray(data.models)) return [];

      return data.models.map((m) => ({
        id: m.name,
        name: m.name,
        provider: "ollama",
      }));
    } catch {
      return [
        { id: "llama3.2", name: "Llama 3.2 (Local)", provider: "ollama" },
        { id: "deepseek-r1", name: "DeepSeek R1 (Local)", provider: "ollama" },
      ];
    }
  }

  async chat(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<NormalizedChatResponse> {
    const url = `${this.getBaseUrl(baseUrl)}/chat/completions`;
    const body = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      stream: false,
    };

    const res = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      this.handleErrorResponse(res, err);
    }

    const data = await res.json();
    return {
      content: data?.choices?.[0]?.message?.content || "",
      model: data.model || options.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      finishReason: data?.choices?.[0]?.finish_reason || "stop",
      provider: "ollama",
    };
  }

  async stream(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<AsyncIterable<StreamEvent>> {
    const url = `${this.getBaseUrl(baseUrl)}/chat/completions`;
    const body = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      stream: true,
    };

    const res = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      this.handleErrorResponse(res, err);
    }

    if (!res.body) {
      throw new Error("Response body is empty");
    }

    async function* parseOllamaStream(
      bodyStream: ReadableStream<Uint8Array>,
    ): AsyncIterable<StreamEvent> {
      const reader = bodyStream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") {
              yield { type: "done" };
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) yield { type: "token", content: delta };
            } catch {
              // Ignore partial json parse
            }
          }
        }
      }
      yield { type: "done" };
    }

    return parseOllamaStream(res.body);
  }
}
