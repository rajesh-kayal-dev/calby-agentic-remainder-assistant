import { OpenAIAdapter } from "./openai.adapter.js";
import { LLMCapability } from "../llm-provider.interface.js";

export class GrokAdapter extends OpenAIAdapter {
  override providerId = "xai-grok";
  override defaultBaseUrl = "https://api.x.ai/v1";
  override capabilities: LLMCapability[] = ["chat", "streaming", "vision", "tool_calling"];
}
