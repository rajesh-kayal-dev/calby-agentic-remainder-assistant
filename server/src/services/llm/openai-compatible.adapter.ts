import {
  LLMProviderAdapter,
  ChatOptions,
  ModelDefinition,
  LLMCapability,
  NormalizedChatResponse,
  StreamEvent,
  LLMProviderCapabilities,
  getDetailedCapabilities,
} from "./llm-provider.interface.js";
import {
  formatOpenAITools,
  formatOpenAIMessages,
  formatOpenAIToolChoice,
  parseOpenAIAssistantMessage,
  parseOpenAIStream,
} from "./openai-tool-formatting.js";

export class OpenAICompatibleAdapter implements LLMProviderAdapter {
  constructor(
    public providerId: string,
    private defaultBaseUrl: string,
    private capabilities: LLMCapability[] = [
      "chat",
      "streaming",
      "tool_calling",
      "parallel_tool_calling",
    ],
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
    const tools = formatOpenAITools(options.tools);
    const toolChoice = formatOpenAIToolChoice(options.toolChoice);

    const body: Record<string, unknown> = {
      model: options.model,
      messages: formatOpenAIMessages(options.messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stream: false,
    };

    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

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
    const choice = data?.choices?.[0];
    const parsedMsg = parseOpenAIAssistantMessage(choice?.message);

    return {
      content: parsedMsg.content,
      model: data.model || options.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      finishReason: choice?.finish_reason || (parsedMsg.toolCalls ? "tool_calls" : "stop"),
      provider: this.providerId,
      toolCalls: parsedMsg.toolCalls,
    };
  }

  async stream(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<AsyncIterable<StreamEvent>> {
    const url = `${this.getBaseUrl(baseUrl)}/chat/completions`;
    const tools = formatOpenAITools(options.tools);
    const toolChoice = formatOpenAIToolChoice(options.toolChoice);

    const body: Record<string, unknown> = {
      model: options.model,
      messages: formatOpenAIMessages(options.messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
    };

    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

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

    return parseOpenAIStream(res.body, this.providerId);
  }

  getCapabilities(_model?: string): LLMCapability[] {
    return this.capabilities;
  }

  getDetailedCapabilities(model?: string): LLMProviderCapabilities {
    return getDetailedCapabilities(this.getCapabilities(model));
  }
}


