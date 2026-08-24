import { LLMProviderAdapter } from "./llm-provider.interface.js";
import { getProviderDefinition } from "./providers.registry.js";
import {
  OpenAIAdapter,
  GroqAdapter,
  GeminiAdapter,
  AnthropicAdapter,
  OpenRouterAdapter,
  OllamaAdapter,
  DeepSeekAdapter,
  PerplexityAdapter,
  MistralAdapter,
  MiniMaxAdapter,
  GrokAdapter,
  ZAIAdapter,
} from "./adapters/index.js";

const adapterCache: Map<string, LLMProviderAdapter> = new Map();

export function getLLMAdapter(providerId: string): LLMProviderAdapter {
  if (adapterCache.has(providerId)) {
    return adapterCache.get(providerId)!;
  }

  const def = getProviderDefinition(providerId);
  if (!def) {
    throw new Error(`Unsupported LLM provider: ${providerId}`);
  }

  let adapter: LLMProviderAdapter;

  switch (def.id) {
    case "openai":
      adapter = new OpenAIAdapter();
      break;
    case "groq":
      adapter = new GroqAdapter();
      break;
    case "google-gemini":
    case "gemini":
      adapter = new GeminiAdapter();
      break;
    case "anthropic":
      adapter = new AnthropicAdapter();
      break;
    case "openrouter":
      adapter = new OpenRouterAdapter();
      break;
    case "ollama":
      adapter = new OllamaAdapter();
      break;
    case "deepseek":
      adapter = new DeepSeekAdapter();
      break;
    case "perplexity":
      adapter = new PerplexityAdapter();
      break;
    case "mistral":
      adapter = new MistralAdapter();
      break;
    case "minimax":
      adapter = new MiniMaxAdapter();
      break;
    case "xai-grok":
    case "grok":
      adapter = new GrokAdapter();
      break;
    case "zai":
      adapter = new ZAIAdapter();
      break;
    default:
      adapter = new OpenAIAdapter();
      break;
  }

  adapterCache.set(providerId, adapter);
  return adapter;
}
