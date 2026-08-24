import {
  LLMProviderAdapter,
  ChatOptions,
  ModelDefinition,
  NormalizedChatResponse,
  StreamEvent,
  LLMCapability,
  LLMErrorCode,
  LLMProviderError,
} from "../llm-provider.interface.js";

export abstract class BaseLLMAdapter implements LLMProviderAdapter {
  abstract providerId: string;
  abstract defaultBaseUrl: string;
  abstract capabilities: LLMCapability[];

  protected getBaseUrl(overrideUrl?: string): string {
    const url = overrideUrl || this.defaultBaseUrl;
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = 30000,
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return res;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new LLMProviderError(
          "TIMEOUT",
          `Request to ${this.providerId} timed out after ${timeoutMs / 1000}s`,
          this.providerId,
        );
      }
      throw new LLMProviderError(
        "PROVIDER_UNAVAILABLE",
        `Network failure connecting to ${this.providerId}: ${err?.message || "Connection error"}`,
        this.providerId,
      );
    } finally {
      clearTimeout(id);
    }
  }

  protected handleErrorResponse(res: Response, errBody?: any): never {
    const message =
      errBody?.error?.message ||
      errBody?.message ||
      `HTTP error ${res.status} from ${this.providerId}`;

    let code: LLMErrorCode = "UNKNOWN_PROVIDER_ERROR";
    if (res.status === 401 || res.status === 403) code = "INVALID_CREDENTIALS";
    else if (res.status === 429) code = "RATE_LIMITED";
    else if (res.status === 404) code = "MODEL_NOT_FOUND";
    else if (res.status >= 500) code = "PROVIDER_UNAVAILABLE";
    else if (res.status === 400) code = "INVALID_REQUEST";

    // Ensure no API keys or sensitive authorization headers exist in error message
    const sanitizedMsg = String(message).replace(/sk-[a-zA-Z0-9\-_]{20,}/g, "sk-••••••••");

    throw new LLMProviderError(code, sanitizedMsg, this.providerId, res.status);
  }

  abstract validateCredentials(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<{ valid: boolean; message?: string }>;

  abstract listModels(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<ModelDefinition[]>;

  abstract chat(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<NormalizedChatResponse>;

  abstract stream(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<AsyncIterable<StreamEvent>>;

  getCapabilities(): LLMCapability[] {
    return this.capabilities;
  }
}
