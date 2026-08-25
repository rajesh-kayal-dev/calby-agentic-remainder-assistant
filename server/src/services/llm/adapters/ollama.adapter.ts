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

export class OllamaAdapter extends BaseLLMAdapter {
  providerId = "ollama";
  defaultBaseUrl = "http://localhost:11434/v1";
  capabilities: LLMCapability[] = ["chat", "streaming", "tool_calling", "parallel_tool_calling"];

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
    const tools = formatOpenAITools(options.tools);
    const toolChoice = formatOpenAIToolChoice(options.toolChoice);

    const body: Record<string, unknown> = {
      model: options.model,
      messages: formatOpenAIMessages(options.messages),
      temperature: options.temperature ?? 0.7,
      stream: false,
    };

    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

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
      provider: "ollama",
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
      stream: true,
    };

    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

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

    return parseOpenAIStream(res.body, this.providerId);
  }
}

