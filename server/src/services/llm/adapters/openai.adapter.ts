import { BaseLLMAdapter } from "./base.adapter.js";
import {
  ChatOptions,
  ModelDefinition,
  NormalizedChatResponse,
  StreamEvent,
  LLMCapability,
} from "../llm-provider.interface.js";

export class OpenAIAdapter extends BaseLLMAdapter {
  providerId = "openai";
  defaultBaseUrl = "https://api.openai.com/v1";
  capabilities: LLMCapability[] = ["chat", "streaming", "vision", "tool_calling", "json_mode", "embeddings"];

  protected getHeaders(credentials: Record<string, string>): Record<string, string> {
    const apiKey = credentials.apiKey || credentials.api_key || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
  }

  async validateCredentials(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const res = await this.fetchWithTimeout(`${this.getBaseUrl(baseUrl)}/models`, {
        method: "GET",
        headers: this.getHeaders(credentials),
      });

      if (res.ok) return { valid: true };
      const err = await res.json().catch(() => ({}));
      return { valid: false, message: err?.error?.message || "Invalid API key." };
    } catch (err: any) {
      return { valid: false, message: err?.message || "Failed to validate credentials." };
    }
  }

  async listModels(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<ModelDefinition[]> {
    try {
      const res = await this.fetchWithTimeout(`${this.getBaseUrl(baseUrl)}/models`, {
        method: "GET",
        headers: this.getHeaders(credentials),
      });

      if (!res.ok) return [];
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      if (!Array.isArray(data.data)) return [];

      return data.data.map((m) => ({
        id: m.id,
        name: m.id,
        provider: "openai",
      }));
    } catch {
      return [];
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
      max_tokens: options.maxTokens,
      stream: false,
    };

    const res = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: this.getHeaders(credentials),
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
      provider: this.providerId,
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
      max_tokens: options.maxTokens,
      stream: true,
    };

    const res = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: this.getHeaders(credentials),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      this.handleErrorResponse(res, err);
    }

    if (!res.body) {
      throw new Error("Response body is empty");
    }

    async function* parseOpenAIStream(
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
              if (delta) {
                yield { type: "token", content: delta };
              }
            } catch {
              // Ignore partial json parse errors
            }
          }
        }
      }
      yield { type: "done" };
    }

    return parseOpenAIStream(res.body);
  }
}
