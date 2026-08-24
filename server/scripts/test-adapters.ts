import { getLLMAdapter } from "../src/services/llm/llm-factory.service.js";
import { LLMProviderError } from "../src/services/llm/llm-provider.interface.js";

async function runAdapterTests() {
  console.log("⚡ Starting LLM Provider Adapters Unit Test Suite...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // Save original fetch
  const originalFetch = globalThis.fetch;

  try {
    // 1. Test Adapter Factory Resolution
    const providers = ["openai", "groq", "google-gemini", "anthropic", "openrouter", "ollama", "deepseek", "perplexity", "mistral", "minimax", "xai-grok", "zai"];
    for (const pId of providers) {
      const adapter = getLLMAdapter(pId);
      assert(Boolean(adapter), `Factory resolves adapter for provider '${pId}'`);
    }

    // 2. Test Invalid Credentials Handling (Mocked 401 response)
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: { message: "Incorrect API key provided" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    const openaiAdapter = getLLMAdapter("openai");
    const valResult = await openaiAdapter.validateCredentials({ apiKey: "invalid-key" });
    assert(valResult.valid === false, "ValidateCredentials returns valid: false for 401");

    // 3. Test Error Mapping for 429 Rate Limit
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: { message: "Rate limit reached" } }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      await openaiAdapter.chat({ apiKey: "key" }, { model: "gpt-4o", messages: [{ role: "user", content: "hi" }] });
      assert(false, "Chat should throw on 429 status");
    } catch (err: any) {
      assert(err instanceof LLMProviderError && err.code === "RATE_LIMITED", "429 HTTP status maps to RATE_LIMITED LLMErrorCode");
    }

    // 4. Test Response Normalization (Mocked 200 Chat response)
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          id: "chatcmpl-123",
          model: "gpt-4o-mini",
          choices: [{ message: { role: "assistant", content: "Hello from OpenAI!" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const chatRes = await openaiAdapter.chat({ apiKey: "sk-test12345" }, { model: "gpt-4o-mini", messages: [{ role: "user", content: "hello" }] });
    assert(chatRes.content === "Hello from OpenAI!", "Normalized response returns correct content");
    assert(chatRes.provider === "openai", "Normalized response returns correct provider");
    assert(chatRes.usage?.totalTokens === 15, "Normalized response includes usage token counts");

    // 5. Test Anthropic Adapter Normalization
    const anthropicAdapter = getLLMAdapter("anthropic");
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          id: "msg_123",
          model: "claude-3-5-sonnet-20241022",
          content: [{ type: "text", text: "Hello from Claude!" }],
          usage: { input_tokens: 8, output_tokens: 4 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const anthropicRes = await anthropicAdapter.chat({ apiKey: "sk-ant-test" }, { model: "claude-3-5-sonnet-20241022", messages: [{ role: "user", content: "hi" }] });
    assert(anthropicRes.content === "Hello from Claude!", "Anthropic adapter normalizes message content");

    // 6. Test Model List Normalization
    const geminiAdapter = getLLMAdapter("google-gemini");
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          models: [
            { name: "models/gemini-2.0-flash", displayName: "Gemini 2.0 Flash" },
            { name: "models/gemini-1.5-pro", displayName: "Gemini 1.5 Pro" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const modelsList = await geminiAdapter.listModels({ apiKey: "key" });
    assert(modelsList.length === 2, "Gemini adapter normalizes model list");
    assert(modelsList[0].id === "gemini-2.0-flash", "Model ID stripped of models/ prefix");

    console.log(`\n📊 Adapter Test Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runAdapterTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
