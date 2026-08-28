import { OpenAIAdapter } from "./openai.adapter.js";
import { LLMCapability } from "../llm-provider.interface.js";

export class ZAIAdapter extends OpenAIAdapter {
  override providerId = "zai";
  override defaultBaseUrl = "https://api.z.ai/v1";
  override capabilities: LLMCapability[] = ["chat", "streaming"];
}
