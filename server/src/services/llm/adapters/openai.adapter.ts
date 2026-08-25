import { BaseLLMAdapter } from "./base.adapter.js";
import {
  ChatOptions,
  ModelDefinition,
  NormalizedChatResponse,
  StreamEvent,
  LLMCapability,
} from "../llm-provider.interface.js";
import {
  formatOpenAITools,
  formatOpenAIMessages,
  formatOpenAIToolChoice,
  parseOpenAIAssistantMessage,
  parseOpenAIStream,
} from "../openai-tool-formatting.js";

export class OpenAIAdapter extends BaseLLMAdapter {
  providerId = "openai";
  defaultBaseUrl = "https://api.openai.com/v1";
  capabilities: LLMCapability[] = [
    "chat",
    "streaming",
    "vision",
    "tool_calling",
    "parallel_tool_calling",
    "json_mode",
    "embeddings",
  ];

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
    const tools = formatOpenAITools(options.tools);
    const toolChoice = formatOpenAIToolChoice(options.toolChoice);

    const body: Record<string, unknown> = {
      model: options.model,
      messages: formatOpenAIMessages(options.messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: false,
    };

    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

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

    return parseOpenAIStream(res.body, this.providerId);
  }
}

