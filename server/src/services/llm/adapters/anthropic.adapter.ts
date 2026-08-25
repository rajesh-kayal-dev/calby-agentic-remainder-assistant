import { BaseLLMAdapter } from "./base.adapter.js";
import {
  ChatOptions,
  ModelDefinition,
  NormalizedChatResponse,
  StreamEvent,
  LLMCapability,
} from "../llm-provider.interface.js";
import {
  formatAnthropicTools,
  formatAnthropicMessages,
  parseAnthropicAssistantMessage,
  parseAnthropicStream,
} from "../anthropic-tool-formatting.js";

export class AnthropicAdapter extends BaseLLMAdapter {
  providerId = "anthropic";
  defaultBaseUrl = "https://api.anthropic.com/v1";
  capabilities: LLMCapability[] = [
    "chat",
    "streaming",
    "vision",
    "tool_calling",
    "parallel_tool_calling",
  ];

  private getHeaders(credentials: Record<string, string>): Record<string, string> {
    const apiKey = credentials.apiKey || credentials.api_key || "";
    return {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
  }

  async validateCredentials(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      // Test credential validation using a minimal messages ping
      const res = await this.fetchWithTimeout(`${this.getBaseUrl(baseUrl)}/messages`, {
        method: "POST",
        headers: this.getHeaders(credentials),
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
      });

      if (res.ok) return { valid: true };
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) {
        return { valid: false, message: "Invalid Anthropic API key." };
      }
      return { valid: true };
    } catch (err: any) {
      return { valid: false, message: err?.message || "Failed to validate credentials." };
    }
  }

  async listModels(
    _credentials: Record<string, string>,
    _baseUrl?: string,
  ): Promise<ModelDefinition[]> {
    return [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic", contextWindow: 200000 },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic", contextWindow: 200000 },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic", contextWindow: 200000 },
    ];
  }

  async chat(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<NormalizedChatResponse> {
    const url = `${this.getBaseUrl(baseUrl)}/messages`;
    const { systemPrompt, messages } = formatAnthropicMessages(options.messages, options.tools);
    const tools = formatAnthropicTools(options.tools);

    const body: Record<string, unknown> = {
      model: options.model,
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature,
      stream: false,
    };

    if (systemPrompt) body.system = systemPrompt;
    if (tools) body.tools = tools;

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
    const parsedMsg = parseAnthropicAssistantMessage(data, options.tools);

    const usage = data?.usage
      ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
        }
      : undefined;

    return {
      content: parsedMsg.content,
      model: data.model || options.model,
      usage,
      finishReason: parsedMsg.finishReason,
      provider: "anthropic",
      toolCalls: parsedMsg.toolCalls,
    };
  }

  async stream(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<AsyncIterable<StreamEvent>> {
    const url = `${this.getBaseUrl(baseUrl)}/messages`;
    const { systemPrompt, messages } = formatAnthropicMessages(options.messages, options.tools);
    const tools = formatAnthropicTools(options.tools);

    const body: Record<string, unknown> = {
      model: options.model,
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature,
      stream: true,
    };

    if (systemPrompt) body.system = systemPrompt;
    if (tools) body.tools = tools;

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

    return parseAnthropicStream(res.body, options.tools);
  }
}

