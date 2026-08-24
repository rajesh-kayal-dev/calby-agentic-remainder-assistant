export type LLMAuthType = "api_key" | "oauth" | "bearer_token" | "none";
export type LLMCapability =
  | "chat"
  | "streaming"
  | "vision"
  | "tool_calling"
  | "json_mode"
  | "embeddings";

export interface ModelDefinition {
  id: string;
  name: string;
  provider?: string;
  contextWindow?: number;
  description?: string;
  capabilities?: LLMCapability[];
}

export interface ConfigFieldDefinition {
  id: string;
  name: string;
  type: "text" | "password" | "select" | "number";
  placeholder?: string;
  defaultValue?: string | number | boolean;
  helperText?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  hasAutoDetect?: boolean;
  tooltip?: string;
}

export interface LLMProviderDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  authType: LLMAuthType;
  baseUrl: string;
  apiKeyRequired: boolean;
  apiKeyLabel?: string;
  apiKeyPlaceholder?: string;
  modelFieldLabel?: string;
  modelPlaceholder?: string;
  modelHelperText?: string;
  modelDiscoverySupported: boolean;
  streamingSupported: boolean;
  capabilities: LLMCapability[];
  enabled: boolean;
  defaultModels: ModelDefinition[];
  advancedControlsLabel?: string;
  advancedFields?: ConfigFieldDefinition[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface NormalizedChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
  provider: string;
}

export type StreamEvent =
  | { type: "token"; content: string }
  | {
      type: "done";
      usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
      finishReason?: string;
    }
  | { type: "error"; error: string; code?: string };

export type LLMErrorCode =
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "MODEL_NOT_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "TIMEOUT"
  | "UNKNOWN_PROVIDER_ERROR";

export class LLMProviderError extends Error {
  constructor(
    public code: LLMErrorCode,
    message: string,
    public provider: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "LLMProviderError";
  }
}

export interface LLMProviderAdapter {
  providerId: string;
  validateCredentials(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<{ valid: boolean; message?: string }>;

  listModels(
    credentials: Record<string, string>,
    baseUrl?: string,
  ): Promise<ModelDefinition[]>;

  chat(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<NormalizedChatResponse>;

  stream(
    credentials: Record<string, string>,
    options: ChatOptions,
    baseUrl?: string,
  ): Promise<AsyncIterable<StreamEvent>>;

  getCapabilities(): LLMCapability[];
}
