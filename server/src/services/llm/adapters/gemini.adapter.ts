import { BaseLLMAdapter } from "./base.adapter.js";
import {
  ChatOptions,
  ModelDefinition,
  NormalizedChatResponse,
  StreamEvent,
  LLMCapability,
} from "../llm-provider.interface.js";

export class GeminiAdapter extends BaseLLMAdapter {
  providerId = "google-gemini";
  defaultBaseUrl = "https://generativelanguage.googleapis.com/v1beta";
  capabilities: LLMCapability[] = ["chat", "streaming", "vision", "tool_calling", "json_mode"];

  private getApiKey(credentials: Record<string, string>): string {
    return credentials.apiKey || credentials.api_key || "";
  }

  async validateCredentials(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const apiKey = this.getApiKey(credentials);
      const url = `${this.getBaseUrl(baseUrl)}/models?key=${apiKey}`;
      const res = await this.fetchWithTimeout(url, { method: "GET" });

      if (res.ok) return { valid: true };
      const err = await res.json().catch(() => ({}));
      return { valid: false, message: err?.error?.message || "Invalid Google Gemini API key." };
    } catch (err: any) {
      return { valid: false, message: err?.message || "Failed to validate credentials." };
    }
  }

  async listModels(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<ModelDefinition[]> {
    try {
      const apiKey = this.getApiKey(credentials);
      const url = `${this.getBaseUrl(baseUrl)}/models?key=${apiKey}`;
      const res = await this.fetchWithTimeout(url, { method: "GET" });

      if (!res.ok) return [];
      const data = (await res.json()) as { models?: Array<{ name: string; displayName?: string }> };
      if (!Array.isArray(data.models)) return [];

      return data.models.map((m) => {
        const id = m.name.replace(/^models\//, "");
        return {
          id,
          name: m.displayName || id,
          provider: "google-gemini",
        };
      });
    } catch {
      return [];
    }
  }

  async chat(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<NormalizedChatResponse> {
    const apiKey = this.getApiKey(credentials);
    const model = options.model.startsWith("models/") ? options.model : `models/${options.model}`;
    const url = `${this.getBaseUrl(baseUrl)}/${model}:generateContent?key=${apiKey}`;

    const systemMsg = options.messages.find((m) => m.role === "system");
    const contents = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = { contents };
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }
    if (options.temperature !== undefined) {
      body.generationConfig = { temperature: options.temperature };
    }

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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = data?.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : undefined;

    return {
      content: text,
      model: options.model,
      usage,
      finishReason: data?.candidates?.[0]?.finishReason || "STOP",
      provider: "google-gemini",
    };
  }

  async stream(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<AsyncIterable<StreamEvent>> {
    const apiKey = this.getApiKey(credentials);
    const model = options.model.startsWith("models/") ? options.model : `models/${options.model}`;
    const url = `${this.getBaseUrl(baseUrl)}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const systemMsg = options.messages.find((m) => m.role === "system");
    const contents = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = { contents };
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

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

    async function* parseGeminiStream(
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
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                yield { type: "token", content: text };
              }
            } catch {
              // Ignore partial json parse errors
            }
          }
        }
      }
      yield { type: "done" };
    }

    return parseGeminiStream(res.body);
  }
}
