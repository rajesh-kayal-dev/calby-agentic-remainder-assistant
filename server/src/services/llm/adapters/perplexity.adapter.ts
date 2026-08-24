import { OpenAIAdapter } from "./openai.adapter.js";
import { LLMCapability } from "../llm-provider.interface.js";

export class PerplexityAdapter extends OpenAIAdapter {
  override providerId = "perplexity";
  override defaultBaseUrl = "https://api.perplexity.ai";
  override capabilities: LLMCapability[] = ["chat", "streaming"];
}
