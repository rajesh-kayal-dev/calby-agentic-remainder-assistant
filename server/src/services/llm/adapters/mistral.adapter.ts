import { OpenAIAdapter } from "./openai.adapter.js";
import { LLMCapability } from "../llm-provider.interface.js";

export class MistralAdapter extends OpenAIAdapter {
  override providerId = "mistral";
  override defaultBaseUrl = "https://api.mistral.ai/v1";
  override capabilities: LLMCapability[] = ["chat", "streaming", "tool_calling", "json_mode"];
}
