import { OpenAIAdapter } from "./openai.adapter.js";
import { LLMCapability } from "../llm-provider.interface.js";

export class OpenRouterAdapter extends OpenAIAdapter {
  override providerId = "openrouter";
  override defaultBaseUrl = "https://openrouter.ai/api/v1";
  override capabilities: LLMCapability[] = ["chat", "streaming", "vision", "tool_calling"];

  protected override getHeaders(credentials: Record<string, string>): Record<string, string> {
    const apiKey = credentials.apiKey || credentials.api_key || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://calby.app",
      "X-Title": "Calby Calendar Assistant",
    };
  }
}
