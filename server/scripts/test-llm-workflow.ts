import "dotenv/config";
import { getPool, closePool } from "../src/db/pool.js";
import { encryptCredentials, decryptCredentials, maskCredentialString } from "../src/services/encryption.service.js";
import { LLM_PROVIDERS, getProviderDefinition } from "../src/services/llm/providers.registry.js";
import { getLLMAdapter } from "../src/services/llm/llm-factory.service.js";
import {
  createLLMConnection,
  getUserLLMConnections,
  getLLMConnectionById,
  updateLLMConnection,
  setDefaultLLMConnection,
  deleteLLMConnection,
} from "../src/repositories/llm-connection.repository.js";
import { LLMProviderError } from "../src/services/llm/llm-provider.interface.js";

async function runFullWorkflowTests() {
  console.log("=================================================");
  console.log("🚀 CALBY PRODUCTION LLM WORKFLOW TEST SUITE");
  console.log("=================================================\n");

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

  const TEST_USER_A = "test-user-auth-id-a";
  const TEST_USER_B = "test-user-auth-id-b";

  try {
    // 1. Ensure test users exist in database
    await getPool().query(
      `INSERT INTO users (auth_user_id, email, name) VALUES ($1, $2, $3) ON CONFLICT (auth_user_id) DO NOTHING`,
      [TEST_USER_A, "userA@calby.test", "User Alpha"],
    );
    await getPool().query(
      `INSERT INTO users (auth_user_id, email, name) VALUES ($1, $2, $3) ON CONFLICT (auth_user_id) DO NOTHING`,
      [TEST_USER_B, "userB@calby.test", "User Beta"],
    );

    // Clean up previous test connections
    await getPool().query(`DELETE FROM user_llm_connections WHERE auth_user_id IN ($1, $2)`, [
      TEST_USER_A,
      TEST_USER_B,
    ]);

    // 2. Test Provider Registry
    assert(LLM_PROVIDERS.length === 12, "Provider Registry contains 12 configured providers");
    const groqDef = getProviderDefinition("groq");
    assert(Boolean(groqDef && groqDef.name === "Groq"), "Provider definition for 'groq' resolves correctly");

    // 3. Test Encryption & Decryption
    const rawApiKey = "gsk_prod_secret_key_1234567890abcdef";
    const encrypted = encryptCredentials({ apiKey: rawApiKey });
    assert(encrypted !== rawApiKey && encrypted.includes(":"), "AES-256-GCM encryption creates secure ciphertext");
    const decrypted = decryptCredentials(encrypted);
    assert(decrypted.apiKey === rawApiKey, "Decryption reproduces original API key faithfully");

    // 4. Test Key Masking
    const masked = maskCredentialString(rawApiKey);
    assert(masked.startsWith("gsk") && masked.endsWith("def") && masked.includes("••••••••"), "Key masking produces safe display string");

    // 5. Test User LLM Connection Creation
    const connA1 = await createLLMConnection({
      authUserId: TEST_USER_A,
      providerId: "groq",
      credentials: { apiKey: rawApiKey },
      selectedModel: "llama-3.3-70b-versatile",
      isDefault: true,
    });
    assert(connA1.providerId === "groq", "Created LLM connection for User A");
    assert(connA1.isDefault === true, "Connection is flagged as default");
    assert(connA1.hasApiKey === true, "Connection reports hasApiKey: true");

    // 6. Test Zero Plaintext Leakage in DTO
    const userAConnections = await getUserLLMConnections(TEST_USER_A);
    assert(userAConnections.length === 1, "Fetched connections list for User A");
    assert((userAConnections[0] as any).apiKey === undefined, "Sanitized DTO NEVER contains raw apiKey field");
    assert((userAConnections[0] as any).encrypted_credentials === undefined, "Sanitized DTO NEVER contains encrypted_credentials");

    // 7. Test Multi-Provider & Default Switching
    const connA2 = await createLLMConnection({
      authUserId: TEST_USER_A,
      providerId: "openai",
      credentials: { apiKey: "sk-openai-key-999" },
      selectedModel: "gpt-4o-mini",
      isDefault: false,
    });
    assert(connA2.providerId === "openai", "Added second provider (OpenAI) for User A");

    // Switch default to OpenAI
    await setDefaultLLMConnection(TEST_USER_A, connA2.id);
    const updatedConns = await getUserLLMConnections(TEST_USER_A);
    const defaultConn = updatedConns.find((c) => c.isDefault);
    assert(defaultConn?.id === connA2.id && defaultConn.providerId === "openai", "Switched default provider to OpenAI");

    // 8. Test Cross-Tenant Isolation
    const connB1 = await createLLMConnection({
      authUserId: TEST_USER_B,
      providerId: "anthropic",
      credentials: { apiKey: "sk-ant-userB-key" },
      selectedModel: "claude-3-5-sonnet-20241022",
      isDefault: true,
    });

    const userBAccessingA = await getLLMConnectionById(TEST_USER_B, connA1.id);
    assert(userBAccessingA === null, "Tenant Isolation: User B CANNOT read or access User A's connection");

    const userADeletingB = await deleteLLMConnection(TEST_USER_A, connB1.id);
    assert(userADeletingB === false, "Tenant Isolation: User A CANNOT delete User B's connection");

    // 9. Test Provider Adapter Mocked Generation & Stream
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            id: "chat-101",
            model: "llama-3.3-70b-versatile",
            choices: [{ message: { role: "assistant", content: "AI reasoning active" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 12, completion_tokens: 6, total_tokens: 18 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as any;

      const groqAdapter = getLLMAdapter("groq");
      const chatRes = await groqAdapter.chat({ apiKey: rawApiKey }, { model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "schedule a meeting" }] });
      assert(chatRes.content === "AI reasoning active", "Groq adapter produces normalized chat completion");
      assert(chatRes.provider === "groq", "Normalized response identifies provider as 'groq'");

      // Test Error Mapping on 429
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ error: { message: "Groq rate limit reached" } }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }) as any;

      try {
        await groqAdapter.chat({ apiKey: rawApiKey }, { model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "test" }] });
        assert(false, "Chat should throw on rate limit");
      } catch (err: any) {
        assert(err instanceof LLMProviderError && err.code === "RATE_LIMITED", "Adapter maps HTTP 429 to RATE_LIMITED code");
      }
    } finally {
      globalThis.fetch = originalFetch;
    }

    // 10. Test Connection Deletion
    const deleteResult = await deleteLLMConnection(TEST_USER_A, connA1.id);
    assert(deleteResult === true, "Successfully deleted Groq connection for User A");
    const remainingA = await getUserLLMConnections(TEST_USER_A);
    assert(remainingA.length === 1, "Remaining connections for User A is 1");

    // Clean up test records
    await getPool().query(`DELETE FROM user_llm_connections WHERE auth_user_id IN ($1, $2)`, [
      TEST_USER_A,
      TEST_USER_B,
    ]);
    await getPool().query(`DELETE FROM users WHERE auth_user_id IN ($1, $2)`, [
      TEST_USER_A,
      TEST_USER_B,
    ]);

    console.log(`\n=================================================`);
    console.log(`📊 END-TO-END WORKFLOW RESULTS: ${passed} passed, ${failed} failed.`);
    console.log(`=================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await closePool();
  }
}

runFullWorkflowTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
