import { OpenAIAdapter } from "./openai.adapter.js";
import { LLMCapability } from "../llm-provider.interface.js";

export class DeepSeekAdapter extends OpenAIAdapter {
  override providerId = "deepseek";
  override defaultBaseUrl = "https://api.deepseek.com/v1";
  override capabilities: LLMCapability[] = ["chat", "streaming", "tool_calling", "json_mode"];
}
