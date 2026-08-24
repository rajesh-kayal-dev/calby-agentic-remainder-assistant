import {
  LLMProviderAdapter,
  ChatOptions,
  ModelDefinition,
  LLMCapability,
  NormalizedChatResponse,
  StreamEvent,
} from "./llm-provider.interface.js";

export class OpenAICompatibleAdapter implements LLMProviderAdapter {
  constructor(
    public providerId: string,
    private defaultBaseUrl: string,
    private capabilities: LLMCapability[] = ["chat", "streaming", "tool_calling"],
  ) {}

  private getBaseUrl(overrideUrl?: string): string {
    const url = overrideUrl || this.defaultBaseUrl;
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  private getHeaders(credentials: Record<string, string>): Record<string, string> {
    const apiKey = credentials.apiKey || credentials.api_key || credentials.token || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    if (credentials.orgId) {
      headers["OpenAI-Organization"] = credentials.orgId;
    }
    return headers;
  }

  async validateCredentials(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const url = `${this.getBaseUrl(baseUrl)}/models`;
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(credentials),
      });

      if (res.ok) {
        return { valid: true };
      }

      if (res.status === 401 || res.status === 403) {
        return { valid: false, message: "Invalid API key or unauthorized access." };
      }

      return { valid: true, message: "Connected successfully." };
    } catch (err: any) {
      return { valid: false, message: `Connection failed: ${err?.message || "Network error"}` };
    }
  }

  async listModels(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<ModelDefinition[]> {
    try {
      const url = `${this.getBaseUrl(baseUrl)}/models`;
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(credentials),
      });

      if (!res.ok) return [];

      const data = (await res.json()) as { data?: Array<{ id: string; name?: string }> };
      if (!Array.isArray(data.data)) return [];

      return data.data.map((m) => ({
        id: m.id,
        name: m.name || m.id,
        provider: this.providerId,
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
      top_p: options.topP,
      stream: false,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(credentials),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `Provider request failed with status ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const usage = data?.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;

    return {
      content,
      model: data.model || options.model,
      usage,
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

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(credentials),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Streaming failed with status ${res.status}`);
    }

    if (!res.body) {
      throw new Error("Response body is empty");
    }

    async function* parseStream(bodyStream: ReadableStream<Uint8Array>): AsyncIterable<StreamEvent> {
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
              // Ignore line parse errors
            }
          }
        }
      }
      yield { type: "done" };
    }

    return parseStream(res.body);
  }

  getCapabilities(): LLMCapability[] {
    return this.capabilities;
  }
}
