import { createAgentMemory } from "../config/memory.js";
import { getAgentInstructions } from "../config/agent-instructions.js";
import { getPool } from "../db/pool.js";
import { decryptCredentials } from "./encryption.service.js";
import { getLLMAdapter } from "./llm/llm-factory.service.js";
import { getProviderDefinition } from "./llm/providers.registry.js";
import {
  LLMProviderError,
  ChatMessage,
  NormalizedToolCall,
  NormalizedToolResult,
  getDetailedCapabilities,
} from "./llm/llm-provider.interface.js";
import { UserLLMConnectionRow } from "../repositories/llm-connection.repository.js";
import {
  listUserConversations,
  getOrCreateConversation,
  updateConversation,
  deleteConversation,
  getConversationMessages,
  createMessage,
  updateMessage,
  reconstructChatMessagesHistory,
  MessageDTO,
} from "../repositories/chat.repository.js";
import {
  TOOLS_REGISTRY,
  getNormalizedToolsRegistry,
  formatToolResultToChatMessage,
} from "../tools/tools.registry.js";
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
  role: "user" | "assistant" | "system" | "tool";
  content: string;
};

const threadLocks = new Map<string, Promise<void>>();

const MAX_AGENT_TURNS = 5;
const MAX_TOOL_CALLS_PER_TURN = 10;

function buildSystemInstructions(): string {
  return getAgentInstructions();
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
    case "gmail.search":
      return "Searching your emails...";
    case "gmail.get_message":
      return "Reading email...";
    case "gmail.send":
      return "Preparing email...";
    case "drive.search":
      return "Searching your Drive...";
    case "drive.get_file":
      return "Reading file...";
    case "notion.search":
      return "Searching Notion...";
    case "notion.get_page":
      return "Reading Notion page...";
    case "notion.create_page":
      return "Creating Notion page...";
    case "slack.send_message":
      return "Sending Slack message...";
    case "slack.search_messages":
      return "Searching Slack...";
    case "teams.create_meeting":
      return "Creating Teams meeting...";
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

    // Capability resolution
    const detailedCaps = adapter.getDetailedCapabilities
      ? adapter.getDetailedCapabilities(effectiveModel)
      : getDetailedCapabilities(adapter.getCapabilities(effectiveModel));

    const normalizedTools = detailedCaps.supportsToolCalling
      ? getNormalizedToolsRegistry()
      : undefined;

    // 2. Get or create PostgreSQL conversation
    const conv = await getOrCreateConversation({
      id: input.threadId,
      authUserId: input.authUserId,
      title: input.message.slice(0, 80),
      providerId: conn.provider_id,
      model: effectiveModel,
    });

    // If conversation had pending confirmation, clear it now since request processed
    if (conv.pending_confirmation) {
      await updateConversation(input.authUserId, conv.id, {
        status: "active",
        pendingConfirmation: null,
      });
    }

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

    // 6. Build prompt history from reconstructed PostgreSQL history
    const reconstructedHistory = reconstructChatMessagesHistory(historyMessages);
    const chatMessages: ChatMessage[] = [
      { role: "system", content: buildSystemInstructions() },
      ...reconstructedHistory,
    ];

    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== input.message) {
      chatMessages.push({ role: "user", content: input.message });
    }

    const modelName = effectiveModel;
    const baseUrl = (conn.config?.baseUrl as string) || def.baseUrl;

    // 7. Native Multi-turn Tool Calling Execution Loop
    let turns = 0;
    let finalResponseText = "";
    const executedToolCallIds = new Set<string>();

    while (turns < MAX_AGENT_TURNS) {
      turns++;
      let fullTurnText = "";
      let turnToolCalls: NormalizedToolCall[] = [];

      const stream = await adapter.stream(
        creds,
        {
          model: modelName,
          messages: chatMessages,
          temperature: 0.7,
          stream: true,
          tools: normalizedTools,
          toolChoice: normalizedTools && normalizedTools.length > 0 ? "auto" : undefined,
        },
        baseUrl,
      );

      for await (const event of stream) {
        if (input.abortSignal?.aborted) {
          break;
        }

        if (event.type === "token") {
          fullTurnText += event.content;
          input.onEvent({
            type: "token",
            token: event.content,
          });
        } else if (event.type === "tool_call_start") {
          input.onEvent({
            type: "progress",
            message: getProgressLabel(event.name),
          });
        } else if (event.type === "done") {
          if (event.toolCalls && event.toolCalls.length > 0) {
            turnToolCalls = event.toolCalls;
          }
        } else if (event.type === "error") {
          await updateMessage(input.authUserId, assistantMsgRecord.id, {
            status: "failed",
          });
          throw new LLMProviderError("PROVIDER_UNAVAILABLE", event.error, conn.provider_id);
        }
      }

      if (input.abortSignal?.aborted) {
        return;
      }

      // Check if LLM emitted native tool calls
      if (turnToolCalls.length > 0) {
        const safeToolCalls = turnToolCalls.slice(0, MAX_TOOL_CALLS_PER_TURN);

        // 1. Persist Assistant tool-call turn to PostgreSQL
        await createMessage({
          conversationId: conv.id,
          authUserId: input.authUserId,
          role: "assistant",
          content: fullTurnText || null,
          providerId: conn.provider_id,
          model: effectiveModel,
          status: "completed",
          toolCalls: safeToolCalls,
        });

        // Also append to in-memory history for synthesis turn
        chatMessages.push({
          role: "assistant",
          content: fullTurnText || null,
          toolCalls: safeToolCalls,
        });

        let stopLoop = false;

        for (const tc of safeToolCalls) {
          // Deduplication check: prevent executing same tool call ID twice
          if (executedToolCallIds.has(tc.id)) {
            continue;
          }
          executedToolCallIds.add(tc.id);

          input.onEvent({
            type: "progress",
            message: getProgressLabel(tc.name),
          });

          let toolResult: NormalizedToolResult;
          try {
            const rawRes = await executeTool({
              authUserId: input.authUserId,
              toolId: tc.name,
              input: tc.arguments,
              confirmed: input.message.toLowerCase().includes("confirm") || false,
              conversationId: conv.id,
            });

            toolResult = {
              toolCallId: tc.id,
              name: tc.name,
              success: rawRes.success,
              data: rawRes.data,
              error: rawRes.message,
              code: rawRes.code,
            };
          } catch (execErr: any) {
            toolResult = {
              toolCallId: tc.id,
              name: tc.name,
              success: false,
              error: execErr?.message || "Tool execution failed",
              code: "TOOL_EXECUTION_ERROR",
            };
          }

          const toolMsg = formatToolResultToChatMessage(toolResult);

          // 2. Persist Tool Result message to PostgreSQL
          await createMessage({
            conversationId: conv.id,
            authUserId: input.authUserId,
            role: "tool",
            content: toolMsg.content,
            providerId: conn.provider_id,
            model: effectiveModel,
            status: "completed",
            toolCallId: tc.id,
            toolName: tc.name,
          });

          // Append to in-memory history
          chatMessages.push(toolMsg);

          // Handle CONNECTION_REQUIRED
          if (!toolResult.success && toolResult.code === "CONNECTION_REQUIRED") {
            finalResponseText =
              "Google Calendar is not connected. Please connect your calendar in Settings to proceed.";
            input.onEvent({ type: "token", token: finalResponseText });
            stopLoop = true;
            break;
          }

          // Handle CONFIRMATION_REQUIRED
          if (!toolResult.success && toolResult.code === "CONFIRMATION_REQUIRED") {
            const confirmPayload = {
              type: "confirmation_required",
              toolId: tc.name,
              toolName: TOOLS_REGISTRY[tc.name]?.name || tc.name,
              details: tc.arguments,
            };
            finalResponseText = `\`\`\`json\n${JSON.stringify(confirmPayload, null, 2)}\n\`\`\``;
            input.onEvent({ type: "token", token: finalResponseText });

            // Persist confirmation state to PostgreSQL conversation record
            await updateConversation(input.authUserId, conv.id, {
              status: "waiting_confirmation",
              pendingConfirmation: confirmPayload,
            });

            stopLoop = true;
            break;
          }
        }

        if (stopLoop) {
          break;
        }

        // Continue agent loop to next turn
        continue;
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
