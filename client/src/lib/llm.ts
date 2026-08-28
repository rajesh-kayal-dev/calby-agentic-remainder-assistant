import { apiFetch } from "./api";

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
  contextWindow?: number;
  description?: string;
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
  docsUrl?: string;
  apiKeyUrl?: string;
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

export interface UserLLMConnectionDTO {
  id: string;
  authUserId: string;
  providerId: string;
  selectedModel: string | null;
  status: string;
  isDefault: boolean;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
  hasApiKey: boolean;
  maskedApiKey: string;
  config: Record<string, unknown>;
}

export const DEFAULT_LLM_PROVIDERS: LLMProviderDefinition[] = [
  {
    id: "groq",
    name: "Groq",
    slug: "groq",
    description: "Fast inference — recommended for high-speed reasoning with Llama 3.3 & DeepSeek models.",
    authType: "api_key",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKeyRequired: true,
    apiKeyLabel: "Groq API Key",
    apiKeyPlaceholder: "gsk_...",
    docsUrl: "https://console.groq.com/docs",
    apiKeyUrl: "https://console.groq.com/keys",
    modelFieldLabel: "Select Groq Model",
    modelDiscoverySupported: true,
    streamingSupported: true,
    capabilities: ["chat", "streaming", "tool_calling", "json_mode"],
    enabled: true,
    defaultModels: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", contextWindow: 128000 },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", contextWindow: 128000 },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", contextWindow: 32768 },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill 70B", contextWindow: 128000 },
    ],
  },
  {
    id: "google-gemini",
    name: "Google Gemini",
    slug: "google-gemini",
    description: "Google's flagship multimodal Gemini 2.5 Flash & 1.5 Pro reasoning models.",
    authType: "api_key",
    baseUrl: "https://generativelanguage.googleapis.com",
    apiKeyRequired: true,
    apiKeyLabel: "Google AI API Key",
    apiKeyPlaceholder: "AIzaSy...",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    apiKeyUrl: "https://aistudio.google.com/app/apikey",
    modelFieldLabel: "Select Gemini Model",
    modelDiscoverySupported: true,
    streamingSupported: true,
    capabilities: ["chat", "streaming", "vision", "tool_calling", "json_mode"],
    enabled: true,
    defaultModels: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Recommended)", contextWindow: 1000000 },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", contextWindow: 1000000 },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextWindow: 2000000 },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextWindow: 1000000 },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    slug: "openai",
    description: "Industry-standard GPT-4o, GPT-4o-mini, and o3 reasoning models from OpenAI.",
    authType: "api_key",
    baseUrl: "https://api.openai.com/v1",
    apiKeyRequired: true,
    apiKeyLabel: "OpenAI API Key",
    apiKeyPlaceholder: "sk-proj-...",
    docsUrl: "https://platform.openai.com/docs",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    modelFieldLabel: "Select OpenAI Model",
    modelDiscoverySupported: true,
    streamingSupported: true,
    capabilities: ["chat", "streaming", "vision", "tool_calling", "json_mode"],
    enabled: true,
    defaultModels: [
      { id: "gpt-4o", name: "GPT-4o Omniscience", contextWindow: 128000 },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128000 },
      { id: "o3-mini", name: "o3 Mini Reasoning", contextWindow: 200000 },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", contextWindow: 128000 },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    slug: "anthropic",
    description: "High-quality reasoning via Claude 3.5 Sonnet & Claude 3 Opus models.",
    authType: "api_key",
    baseUrl: "https://api.anthropic.com/v1",
    apiKeyRequired: true,
    apiKeyLabel: "Anthropic API Key",
    apiKeyPlaceholder: "sk-ant-...",
    docsUrl: "https://docs.anthropic.com/",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    modelFieldLabel: "Select Claude Model",
    modelDiscoverySupported: true,
    streamingSupported: true,
    capabilities: ["chat", "streaming", "vision", "tool_calling"],
    enabled: true,
    defaultModels: [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", contextWindow: 200000 },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", contextWindow: 200000 },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", contextWindow: 200000 },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    slug: "openrouter",
    description: "Access 100+ open-weights and commercial models through one unified API.",
    authType: "api_key",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyRequired: true,
    apiKeyLabel: "OpenRouter API Key",
    apiKeyPlaceholder: "sk-or-...",
    docsUrl: "https://openrouter.ai/docs",
    apiKeyUrl: "https://openrouter.ai/keys",
    modelFieldLabel: "Select OpenRouter Model",
    modelDiscoverySupported: true,
    streamingSupported: true,
    capabilities: ["chat", "streaming", "tool_calling"],
    enabled: true,
    defaultModels: [
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", contextWindow: 200000 },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", contextWindow: 128000 },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1", contextWindow: 164000 },
      { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", contextWindow: 1000000 },
    ],
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    slug: "ollama",
    description: "Run local LLMs directly on your device via Ollama with zero data leaving your machine.",
    authType: "none",
    baseUrl: "http://localhost:11434",
    apiKeyRequired: false,
    docsUrl: "https://docs.ollama.com/",
    apiKeyUrl: "https://ollama.com/download",
    modelFieldLabel: "Select Local Ollama Model",
    modelDiscoverySupported: true,
    streamingSupported: true,
    capabilities: ["chat", "streaming", "tool_calling"],
    enabled: true,
    defaultModels: [
      { id: "llama3.2:latest", name: "Llama 3.2 (Local)", contextWindow: 128000 },
      { id: "deepseek-r1:14b", name: "DeepSeek R1 14B (Local)", contextWindow: 64000 },
      { id: "mistral:latest", name: "Mistral 7B (Local)", contextWindow: 32768 },
      { id: "qwen2.5:latest", name: "Qwen 2.5 (Local)", contextWindow: 32768 },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    slug: "deepseek",
    description: "High performance reasoning (R1) and general intelligence (V3) models from DeepSeek.",
    authType: "api_key",
    baseUrl: "https://api.deepseek.com/v1",
    apiKeyRequired: true,
    apiKeyLabel: "DeepSeek API Key",
    apiKeyPlaceholder: "sk-...",
    docsUrl: "https://api-docs.deepseek.com/",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    modelFieldLabel: "Select DeepSeek Model",
    modelDiscoverySupported: true,
    streamingSupported: true,
    capabilities: ["chat", "streaming", "tool_calling", "json_mode"],
    enabled: true,
    defaultModels: [
      { id: "deepseek-chat", name: "DeepSeek V3", contextWindow: 64000 },
      { id: "deepseek-reasoner", name: "DeepSeek R1 (Reasoning)", contextWindow: 64000 },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    slug: "perplexity",
    description: "Search-augmented LLMs with live web citations and grounding.",
    authType: "api_key",
    baseUrl: "https://api.perplexity.ai",
    apiKeyRequired: true,
    apiKeyLabel: "Perplexity API Key",
    apiKeyPlaceholder: "pplx-...",
    docsUrl: "https://docs.perplexity.ai/",
    apiKeyUrl: "https://www.perplexity.ai/settings/api",
    modelFieldLabel: "Select Perplexity Model",
    modelDiscoverySupported: false,
    streamingSupported: true,
    capabilities: ["chat", "streaming"],
    enabled: true,
    defaultModels: [
      { id: "sonar-pro", name: "Sonar Pro (Web Search)", contextWindow: 200000 },
      { id: "sonar", name: "Sonar Search", contextWindow: 128000 },
      { id: "sonar-reasoning-pro", name: "Sonar Reasoning Pro", contextWindow: 128000 },
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    slug: "mistral",
    description: "European frontier models including Mistral Large 24.11 and Codestral 25.01.",
    authType: "api_key",
    baseUrl: "https://api.mistral.ai/v1",
    apiKeyRequired: true,
    apiKeyLabel: "Mistral API Key",
    apiKeyPlaceholder: "Enter your Mistral API Key",
    docsUrl: "https://docs.mistral.ai/",
    apiKeyUrl: "https://console.mistral.ai/api-keys/",
    modelFieldLabel: "Select Mistral Model",
    modelDiscoverySupported: true,
    streamingSupported: true,
    capabilities: ["chat", "streaming", "tool_calling", "json_mode"],
    enabled: true,
    defaultModels: [
      { id: "mistral-large-latest", name: "Mistral Large 24.11", contextWindow: 128000 },
      { id: "codestral-latest", name: "Codestral 25.01", contextWindow: 256000 },
      { id: "mistral-small-latest", name: "Mistral Small", contextWindow: 32000 },
    ],
  },
  {
    id: "minimax",
    name: "MiniMax",
    slug: "minimax",
    description: "MiniMax-01 and multimodal intelligence models.",
    authType: "api_key",
    baseUrl: "https://api.minimax.chat/v1",
    apiKeyRequired: true,
    apiKeyLabel: "MiniMax API Key",
    apiKeyPlaceholder: "Enter your MiniMax API Key",
    docsUrl: "https://platform.minimax.io/docs",
    apiKeyUrl: "https://platform.minimax.io/user-center/basic-information/interface-key",
    modelFieldLabel: "Select MiniMax Model",
    modelDiscoverySupported: false,
    streamingSupported: true,
    capabilities: ["chat", "streaming"],
    enabled: true,
    defaultModels: [
      { id: "minimax-01", name: "MiniMax-01", contextWindow: 1000000 },
      { id: "abab6.5g-chat", name: "Abab 6.5G", contextWindow: 24576 },
    ],
  },
  {
    id: "xai-grok",
    name: "xAI Grok",
    slug: "xai-grok",
    description: "xAI's Grok 2 and Grok 2 Vision frontier reasoning models.",
    authType: "api_key",
    baseUrl: "https://api.x.ai/v1",
    apiKeyRequired: true,
    apiKeyLabel: "xAI Grok API Key",
    apiKeyPlaceholder: "xai-...",
    docsUrl: "https://docs.x.ai/",
    apiKeyUrl: "https://console.x.ai/",
    modelFieldLabel: "Select Grok Model",
    modelDiscoverySupported: true,
    streamingSupported: true,
    capabilities: ["chat", "streaming", "vision", "tool_calling"],
    enabled: true,
    defaultModels: [
      { id: "grok-2-latest", name: "Grok 2", contextWindow: 131072 },
      { id: "grok-2-vision-latest", name: "Grok 2 Vision", contextWindow: 32768 },
    ],
  },
  {
    id: "zai",
    name: "Z.AI",
    slug: "zai",
    description: "Z.AI / Zhipu GLM enterprise reasoning model suite.",
    authType: "api_key",
    baseUrl: "https://api.z.ai/v1",
    apiKeyRequired: true,
    apiKeyLabel: "Z.AI API Key",
    apiKeyPlaceholder: "Enter your Z.AI API Key",
    docsUrl: "https://docs.z.ai/",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    modelFieldLabel: "Select Z.AI Model",
    modelDiscoverySupported: false,
    streamingSupported: true,
    capabilities: ["chat", "streaming"],
    enabled: true,
    defaultModels: [
      { id: "zai-pro", name: "Z.AI Pro", contextWindow: 128000 },
      { id: "zai-turbo", name: "Z.AI Turbo", contextWindow: 64000 },
      { id: "glm-4-plus", name: "GLM-4 Plus", contextWindow: 128000 },
    ],
  },
];

export async function fetchLLMProviders(
  token?: string,
): Promise<{ success: boolean; providers: LLMProviderDefinition[] }> {
  try {
    return await apiFetch<{ success: boolean; providers: LLMProviderDefinition[] }>("/api/llm/providers", {
      token,
    });
  } catch {
    return { success: true, providers: DEFAULT_LLM_PROVIDERS };
  }
}

export async function fetchLLMProviderModels(
  token: string,
  providerId: string,
): Promise<{ success: boolean; models: ModelDefinition[] }> {
  try {
    return await apiFetch<{ success: boolean; models: ModelDefinition[] }>(
      `/api/llm/providers/${providerId}/models`,
      { token },
    );
  } catch {
    const prov = DEFAULT_LLM_PROVIDERS.find((p) => p.id === providerId);
    return { success: true, models: prov?.defaultModels || [] };
  }
}

export async function fetchLLMConnections(
  token: string,
): Promise<{ success: boolean; connections: UserLLMConnectionDTO[] }> {
  try {
    return await apiFetch<{ success: boolean; connections: UserLLMConnectionDTO[] }>("/api/llm/connections", {
      token,
    });
  } catch {
    return { success: true, connections: [] };
  }
}

export async function createLLMConnectionApi(
  token: string,
  data: {
    providerId: string;
    apiKey?: string;
    selectedModel?: string;
    config?: Record<string, unknown>;
    isDefault?: boolean;
  },
): Promise<{ success: boolean; connection: UserLLMConnectionDTO }> {
  return await apiFetch<{ success: boolean; connection: UserLLMConnectionDTO }>("/api/llm/connections", {
    method: "POST",
    token,
    body: data,
  });
}

export async function updateLLMConnectionApi(
  token: string,
  id: string,
  data: {
    apiKey?: string;
    selectedModel?: string;
    config?: Record<string, unknown>;
    isDefault?: boolean;
  },
): Promise<{ success: boolean; connection: UserLLMConnectionDTO }> {
  return await apiFetch<{ success: boolean; connection: UserLLMConnectionDTO }>(`/api/llm/connections/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export async function deleteLLMConnectionApi(
  token: string,
  id: string,
): Promise<{ success: boolean }> {
  return await apiFetch<{ success: boolean }>(`/api/llm/connections/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function testLLMConnectionApi(
  token: string,
  id: string,
): Promise<{ success: boolean; status: string; message: string }> {
  return await apiFetch<{ success: boolean; status: string; message: string }>(
    `/api/llm/connections/${id}/test`,
    {
      method: "POST",
      token,
    },
  );
}

export async function setDefaultLLMConnectionApi(
  token: string,
  id: string,
): Promise<{ success: boolean }> {
  return await apiFetch<{ success: boolean }>(`/api/llm/connections/${id}/default`, {
    method: "PATCH",
    token,
  });
}
