export type LLMAuthType = "api_key" | "oauth" | "bearer_token" | "none";
export type LLMCapability =
  | "chat"
  | "streaming"
  | "vision"
  | "tool_calling"
  | "parallel_tool_calling"
  | "structured_output"
  | "json_mode"
  | "embeddings";

export interface LLMProviderCapabilities {
  supportsChat: boolean;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  supportsParallelToolCalling: boolean;
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
}

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
  docsUrl?: string;
  apiKeyUrl?: string;
  advancedControlsLabel?: string;
  advancedFields?: ConfigFieldDefinition[];
}

export interface NormalizedToolParameter {
  type: string;
  description?: string;
  properties?: Record<string, NormalizedToolParameter>;
  required?: string[];
  enum?: string[];
  items?: NormalizedToolParameter;
  default?: unknown;
}

export interface NormalizedToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, NormalizedToolParameter>;
    required?: string[];
  };
}

export interface NormalizedToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  rawArguments?: string;
}

export interface NormalizedToolResult<T = unknown> {
  toolCallId: string;
  name: string;
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content?: string | null;
  name?: string;
  toolCallId?: string;
  toolCalls?: NormalizedToolCall[];
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  tools?: NormalizedToolDefinition[];
  toolChoice?: "auto" | "none" | "required" | { type: "function"; name: string };
}

export type FinishReason = "stop" | "tool_calls" | "length" | "content_filter" | "error";

export interface NormalizedChatResponse {
  content: string | null;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: FinishReason | string;
  provider: string;
  toolCalls?: NormalizedToolCall[];
}

export type StreamEvent =
  | { type: "token"; content: string }
  | { type: "tool_call_start"; id: string; name: string; index?: number }
  | { type: "tool_call_delta"; id: string; argumentsDelta: string; index?: number }
  | { type: "tool_call_done"; toolCall: NormalizedToolCall }
  | {
      type: "done";
      usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
      finishReason?: FinishReason | string;
      toolCalls?: NormalizedToolCall[];
    }
  | { type: "error"; error: string; code?: string };

export type LLMErrorCode =
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "MODEL_NOT_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "TIMEOUT"
  | "UNSUPPORTED_CAPABILITY"
  | "MALFORMED_PROVIDER_RESPONSE"
  | "TOOL_CALL_PARSING_FAILURE"
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

export function getDetailedCapabilities(
  adapterCapabilities: LLMCapability[],
  modelCapabilities?: LLMCapability[],
): LLMProviderCapabilities {
  const caps = new Set<LLMCapability>([
    ...adapterCapabilities,
    ...(modelCapabilities || []),
  ]);

  return {
    supportsChat: caps.has("chat"),
    supportsStreaming: caps.has("streaming"),
    supportsToolCalling: caps.has("tool_calling"),
    supportsParallelToolCalling: caps.has("parallel_tool_calling"),
    supportsStructuredOutput: caps.has("structured_output") || caps.has("json_mode"),
    supportsVision: caps.has("vision"),
  };
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

  getCapabilities(model?: string): LLMCapability[];
  getDetailedCapabilities?(model?: string): LLMProviderCapabilities;
}

