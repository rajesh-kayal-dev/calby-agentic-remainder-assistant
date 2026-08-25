import { BaseLLMAdapter } from "./base.adapter.js";
import {
  ChatOptions,
  ModelDefinition,
  NormalizedChatResponse,
  StreamEvent,
  LLMCapability,
} from "../llm-provider.interface.js";
import {
  formatGeminiTools,
  formatGeminiToolConfig,
  formatGeminiMessages,
  parseGeminiAssistantMessage,
  parseGeminiStream,
} from "../gemini-tool-formatting.js";

export class GeminiAdapter extends BaseLLMAdapter {
  providerId = "google-gemini";
  defaultBaseUrl = "https://generativelanguage.googleapis.com/v1beta";
  capabilities: LLMCapability[] = [
    "chat",
    "streaming",
    "vision",
    "tool_calling",
    "parallel_tool_calling",
    "structured_output",
    "json_mode",
  ];

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

    const { systemInstruction, contents } = formatGeminiMessages(options.messages, options.tools);
    const tools = formatGeminiTools(options.tools);
    const toolConfig = formatGeminiToolConfig(options.toolChoice);

    const body: Record<string, unknown> = { contents };
    if (systemInstruction) body.systemInstruction = systemInstruction;
    if (tools) body.tools = tools;
    if (toolConfig) body.toolConfig = toolConfig;

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
    const parsedMsg = parseGeminiAssistantMessage(data, options.tools);

    const usage = data?.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : undefined;

    return {
      content: parsedMsg.content,
      model: options.model,
      usage,
      finishReason: parsedMsg.finishReason,
      provider: "google-gemini",
      toolCalls: parsedMsg.toolCalls,
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

    const { systemInstruction, contents } = formatGeminiMessages(options.messages, options.tools);
    const tools = formatGeminiTools(options.tools);
    const toolConfig = formatGeminiToolConfig(options.toolChoice);

    const body: Record<string, unknown> = { contents };
    if (systemInstruction) body.systemInstruction = systemInstruction;
    if (tools) body.tools = tools;
    if (toolConfig) body.toolConfig = toolConfig;

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

    if (!res.body) {
      throw new Error("Response body is empty");
    }

    return parseGeminiStream(res.body, options.tools);
  }
}

