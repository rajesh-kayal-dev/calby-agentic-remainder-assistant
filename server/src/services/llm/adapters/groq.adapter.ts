import { OpenAIAdapter } from "./openai.adapter.js";
import { LLMCapability } from "../llm-provider.interface.js";

export class GroqAdapter extends OpenAIAdapter {
  override providerId = "groq";
  override defaultBaseUrl = "https://api.groq.com/openai/v1";
  override capabilities: LLMCapability[] = ["chat", "streaming", "tool_calling", "json_mode"];
}
