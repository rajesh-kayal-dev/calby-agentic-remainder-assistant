import { OpenAIAdapter } from "./openai.adapter.js";
import { LLMCapability } from "../llm-provider.interface.js";

export class MiniMaxAdapter extends OpenAIAdapter {
  override providerId = "minimax";
  override defaultBaseUrl = "https://api.minimax.chat/v1";
  override capabilities: LLMCapability[] = ["chat", "streaming"];
}

export class GrokAdapter extends OpenAIAdapter {
  override providerId = "xai-grok";
  override defaultBaseUrl = "https://api.x.ai/v1";
  override capabilities: LLMCapability[] = ["chat", "streaming", "vision", "tool_calling"];
}

export class ZAIAdapter extends OpenAIAdapter {
  override providerId = "zai";
  override defaultBaseUrl = "https://api.z.ai/v1";
  override capabilities: LLMCapability[] = ["chat", "streaming"];
}
