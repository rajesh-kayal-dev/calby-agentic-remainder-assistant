import { createAgentMemory } from "../config/memory.js";
import { getAgentInstructions } from "../config/agent-instructions.js";
import { getPool } from "../db/pool.js";
import { decryptCredentials } from "./encryption.service.js";
import { getLLMAdapter } from "./llm/llm-factory.service.js";
import { getProviderDefinition } from "./llm/providers.registry.js";
import { LLMProviderError, ChatMessage } from "./llm/llm-provider.interface.js";
import { UserLLMConnectionRow } from "../repositories/llm-connection.repository.js";
import {
  listUserConversations,
  getOrCreateConversation,
  deleteConversation,
  getConversationMessages,
  createMessage,
  updateMessage,
  MessageDTO,
} from "../repositories/chat.repository.js";
import { TOOLS_REGISTRY } from "../tools/tools.registry.js";
import { executeTool } from "../tools/tool-router.js";

export type AgentEvent = {
  type: "started" | "progress" | "token" | "completed" | "error";
  message?: string;
  token?: string;
  code?: string;
};

export type StreamAgentReplyInput = {
  userId: string;
  authUserId: string;
  threadId: string;
  message: string;
  llm?: {
    providerId: string;
    model?: string;
  };
  onEvent: (event: AgentEvent) => void;
  abortSignal?: AbortSignal;
};

export type ThreadSummary = {
  id: string;
  title: string;
  isPinned: boolean;
  updatedAt: string;
};

export type ThreadMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const threadLocks = new Map<string, Promise<void>>();

function buildSystemInstructionsWithTools(): string {
  const base = getAgentInstructions();
  const toolList = Object.values(TOOLS_REGISTRY)
    .map((t) => `- ${t.id}: ${t.description} (Category: ${t.category})`)
    .join("\n");

  return `${base}

# AUTOMATED TOOL CALLING CAPABILITY
You are an intelligent calendar & executive assistant. You can automatically decide when to call backend tools to answer the user's request.

To call a tool, output a single JSON code block formatted EXACTLY as:
\`\`\`json
{
  "tool_call": {
    "name": "<tool_id>",
    "arguments": { ... }
  }
}
\`\`\`

Available Tools:
${toolList}

Rules:
1. If the user asks a question about their schedule, meetings, free time, or creating/updating events, choose the appropriate tool from above and output the JSON tool_call block.
2. Output ONLY the JSON block when making a tool call, without extra conversational text before it.
3. When tool results are provided to you in subsequent turns, summarize them in clear, helpful natural language with clean event lists.
`;
}

function getProgressLabel(toolId: string): string {
  switch (toolId) {
    case "calendar.get_events":
      return "Checking your calendar...";
    case "calendar.find_free_slots":
      return "Finding available time...";
    case "calendar.create_event":
    case "meeting.create":
      return "Creating the meeting...";
    case "calendar.update_event":
      return "Rescheduling your event...";
    case "calendar.delete_event":
      return "Preparing cancellation...";
    case "gmail.send":
      return "Preparing email...";
    case "whatsapp.send":
      return "Preparing WhatsApp message...";
    case "telegram.send":
      return "Preparing Telegram message...";
    default:
      return "Processing request...";
  }
}

export async function listUserThreads(
  authUserId: string,
): Promise<ThreadSummary[]> {
  const conversations = await listUserConversations(authUserId, 50, 0);

  return conversations.map((conv) => ({
    id: conv.id,
    title: conv.title?.trim() || "Untitled Chat",
    isPinned: conv.isPinned ?? false,
    updatedAt: conv.lastMessageAt || conv.updatedAt,
  }));
}

export async function getThreadMessages(
  authUserId: string,
  threadId: string,
): Promise<ThreadMessage[]> {
  const messages = await getConversationMessages(authUserId, threadId);

  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));
}

export async function deleteThread(
  authUserId: string,
  threadId: string,
): Promise<boolean> {
  return deleteConversation(authUserId, threadId);
}

async function getUserActiveLLMConnection(
  authUserId: string,
  requestedProviderId?: string,
): Promise<UserLLMConnectionRow | null> {
  if (requestedProviderId) {
    const res = await getPool().query<UserLLMConnectionRow>(
      `
      SELECT * FROM user_llm_connections
      WHERE auth_user_id = $1 AND provider_id = $2
      ORDER BY updated_at DESC
      LIMIT 1
      `,
      [authUserId, requestedProviderId],
    );
    return res.rows[0] || null;
  }

  const result = await getPool().query<UserLLMConnectionRow>(
    `
    SELECT * FROM user_llm_connections
    WHERE auth_user_id = $1
    ORDER BY is_default DESC, created_at DESC
    LIMIT 1
    `,
    [authUserId],
  );

  return result.rows[0] || null;
}

async function executeAgentStream(
  input: StreamAgentReplyInput,
): Promise<void> {
  if (input.abortSignal?.aborted) {
    return;
  }

  // 1. Resolve authenticated user's active/requested LLM connection
  const conn = await getUserActiveLLMConnection(input.authUserId, input.llm?.providerId);
  if (!conn) {
    const missingMsg = input.llm?.providerId
      ? `This provider (${input.llm.providerId}) is missing credentials! Please set up credentials in Settings.`
      : "No AI provider configured. Connect an AI provider in Settings to start chatting.";

    input.onEvent({
      type: "error",
      message: missingMsg,
      code: "NO_LLM_PROVIDER_CONFIGURED",
    });
    return;
  }

  const def = getProviderDefinition(conn.provider_id);
  if (!def) {
    input.onEvent({
      type: "error",
      message: `Selected provider '${conn.provider_id}' is unsupported.`,
      code: "UNSUPPORTED_PROVIDER",
    });
    return;
  }

  const effectiveModel = input.llm?.model || conn.selected_model || def.defaultModels[0]?.id || "default";

  input.onEvent({
    type: "started",
    message: `Using ${def.name} (${effectiveModel})`,
  });

  try {
    const creds = decryptCredentials(conn.encrypted_credentials);
    const adapter = getLLMAdapter(conn.provider_id);

    // 2. Get or create PostgreSQL conversation
    const conv = await getOrCreateConversation({
      id: input.threadId,
      authUserId: input.authUserId,
      title: input.message.slice(0, 80),
      providerId: conn.provider_id,
      model: effectiveModel,
    });

    // 3. Load existing message history from PostgreSQL
    const historyMessages = await getConversationMessages(input.authUserId, conv.id);

    // 4. Persist user message to PostgreSQL BEFORE calling LLM adapter
    const lastMsg = historyMessages[historyMessages.length - 1];
    let userMsgRecord: MessageDTO;
    if (lastMsg && lastMsg.role === "user" && lastMsg.content === input.message) {
      userMsgRecord = lastMsg;
    } else {
      userMsgRecord = await createMessage({
        conversationId: conv.id,
        authUserId: input.authUserId,
        role: "user",
        content: input.message,
      });
    }

    // 5. Create placeholder assistant message record in PostgreSQL with status 'streaming'
    const assistantMsgRecord = await createMessage({
      conversationId: conv.id,
      authUserId: input.authUserId,
      role: "assistant",
      content: "",
      providerId: conn.provider_id,
      model: effectiveModel,
      status: "streaming",
    });

    // 6. Build prompt history with automated tool calling capability
    const chatMessages: ChatMessage[] = [
      { role: "system", content: buildSystemInstructionsWithTools() },
      ...historyMessages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== input.message) {
      chatMessages.push({ role: "user", content: input.message });
    }

    const modelName = effectiveModel;
    const baseUrl = (conn.config?.baseUrl as string) || def.baseUrl;

    // 7. Multi-step LLM Tool Execution Loop
    let turns = 0;
    const maxTurns = 5;
    let finalResponseText = "";

    while (turns < maxTurns) {
      turns++;
      let fullTurnText = "";

      const stream = await adapter.stream(
        creds,
        {
          model: modelName,
          messages: chatMessages,
          temperature: 0.7,
          stream: true,
        },
        baseUrl,
      );

      for await (const event of stream) {
        if (input.abortSignal?.aborted) {
          break;
        }

        if (event.type === "token") {
          fullTurnText += event.content;
          // Emit tokens to client if not raw tool_call json block
          if (!fullTurnText.includes("```json") && !fullTurnText.includes('"tool_call"')) {
            input.onEvent({
              type: "token",
              token: event.content,
            });
          }
        } else if (event.type === "error") {
          await updateMessage(input.authUserId, assistantMsgRecord.id, {
            status: "failed",
          });
          throw new Error(event.error);
        }
      }

      if (input.abortSignal?.aborted) {
        return;
      }

      // Check if turn generated a tool call
      const toolCallMatch =
        fullTurnText.match(/```json\s*(\{[\s\S]*?"tool_call"[\s\S]*?\})\s*```/i) ||
        fullTurnText.match(/(\{[\s\S]*?"tool_call"[\s\S]*?\})/i);

      if (toolCallMatch) {
        try {
          const parsedJson = JSON.parse(toolCallMatch[1]);
          const toolCallObj = parsedJson.tool_call || parsedJson;
          const targetToolId = toolCallObj.name || toolCallObj.tool;
          const targetArgs = toolCallObj.arguments || toolCallObj.args || {};

          if (targetToolId) {
            // Emit progress event
            input.onEvent({
              type: "progress",
              message: getProgressLabel(targetToolId),
            });

            // Execute tool via Tool Router
            const toolResult = await executeTool({
              authUserId: input.authUserId,
              toolId: targetToolId,
              input: targetArgs,
              confirmed: input.message.toLowerCase().includes("confirm") || false,
              conversationId: conv.id,
            });

            // Handle CONNECTION_REQUIRED
            if (!toolResult.success && toolResult.code === "CONNECTION_REQUIRED") {
              finalResponseText = `Google Calendar is not connected. Please connect your calendar in Settings to proceed.`;
              input.onEvent({ type: "token", token: finalResponseText });
              break;
            }

            // Handle CONFIRMATION_REQUIRED
            if (!toolResult.success && toolResult.code === "CONFIRMATION_REQUIRED") {
              const confirmPayload = {
                type: "confirmation_required",
                toolId: targetToolId,
                toolName: TOOLS_REGISTRY[targetToolId]?.name || targetToolId,
                details: targetArgs,
              };
              finalResponseText = `\`\`\`json\n${JSON.stringify(confirmPayload, null, 2)}\n\`\`\``;
              input.onEvent({ type: "token", token: finalResponseText });
              break;
            }

            // Append tool execution to history for synthesis turn
            chatMessages.push({ role: "assistant", content: fullTurnText });
            chatMessages.push({
              role: "system",
              content: `Tool Execution Result for ${targetToolId}:\n${JSON.stringify(toolResult, null, 2)}`,
            });

            continue;
          }
        } catch {
          // If JSON parse failed, fallback to treating output as final text
        }
      }

      finalResponseText = fullTurnText;
      break;
    }

    // 8. Update assistant message record to 'completed' in PostgreSQL
    await updateMessage(input.authUserId, assistantMsgRecord.id, {
      content: finalResponseText,
      status: "completed",
    });

    // Sync to Mastra Memory for background tools compatibility
    try {
      const memory = createAgentMemory();
      await memory.saveMessages({
        messages: [
          {
            role: "user",
            content: { content: input.message } as any,
            createdAt: new Date(),
            id: userMsgRecord.id,
            threadId: input.threadId,
            resourceId: input.authUserId,
          },
          {
            role: "assistant",
            content: { content: finalResponseText } as any,
            createdAt: new Date(),
            id: assistantMsgRecord.id,
            threadId: input.threadId,
            resourceId: input.authUserId,
          },
        ],
      });
    } catch (saveErr) {
      console.warn("Mastra memory fallback sync notice:", saveErr);
    }

    input.onEvent({
      type: "completed",
      message: "done",
    });
  } catch (error: any) {
    if (input.abortSignal?.aborted) {
      return;
    }

    let userMessage = "Agent streaming failed. Please try again.";
    if (error instanceof LLMProviderError) {
      switch (error.code) {
        case "INVALID_CREDENTIALS":
          userMessage = `Your ${def.name} API key is invalid. Please check your credentials in Settings.`;
          break;
        case "RATE_LIMITED":
          userMessage = `${def.name} rate limit reached. Please wait a moment and try again.`;
          break;
        case "TIMEOUT":
          userMessage = `Request to ${def.name} timed out. Please try again.`;
          break;
        case "PROVIDER_UNAVAILABLE":
          userMessage = `${def.name} service is currently unavailable. Please check your connection.`;
          break;
        default:
          userMessage = error.message || userMessage;
      }
    } else if (error?.message) {
      userMessage = error.message;
    }

    input.onEvent({
      type: "error",
      message: userMessage,
    });
  }
}

export async function streamAgentReply(
  input: StreamAgentReplyInput,
): Promise<void> {
  const { threadId, abortSignal } = input;

  const previousLock = threadLocks.get(threadId) ?? Promise.resolve();

  let releaseLock!: () => void;
  const currentLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  threadLocks.set(threadId, currentLock);

  try {
    await previousLock.catch(() => {});

    if (abortSignal?.aborted) {
      return;
    }

    await executeAgentStream(input);
  } finally {
    releaseLock();

    if (threadLocks.get(threadId) === currentLock) {
      threadLocks.delete(threadId);
    }
  }
}
