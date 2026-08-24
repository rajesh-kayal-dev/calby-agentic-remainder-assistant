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

export async function fetchLLMProviders(
  token?: string,
): Promise<{ success: boolean; providers: LLMProviderDefinition[] }> {
  return await apiFetch<{ success: boolean; providers: LLMProviderDefinition[] }>("/api/llm/providers", {
    token,
  });
}

export async function fetchLLMProviderModels(
  token: string,
  providerId: string,
): Promise<{ success: boolean; models: ModelDefinition[] }> {
  return await apiFetch<{ success: boolean; models: ModelDefinition[] }>(
    `/api/llm/providers/${providerId}/models`,
    { token },
  );
}

export async function fetchLLMConnections(
  token: string,
): Promise<{ success: boolean; connections: UserLLMConnectionDTO[] }> {
  return await apiFetch<{ success: boolean; connections: UserLLMConnectionDTO[] }>("/api/llm/connections", {
    token,
  });
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
