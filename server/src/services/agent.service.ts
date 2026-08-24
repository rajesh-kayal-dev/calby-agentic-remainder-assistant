import { Agent } from "@mastra/core/agent";
import { createAgentMemory } from "../config/memory.js";
import { getAgentInstructions } from "../config/agent-instructions.js";
import { createCalendarTools } from "./agent-tools.service.js";

export type AgentEvent = {
  type: "started" | "progress" | "token" | "completed" | "error";
  message?: string;
  token?: string;
};

export type StreamAgentReplyInput = {
  userId: string;
  authUserId: string;
  threadId: string;
  message: string;
  onEvent: (event: AgentEvent) => void;
  abortSignal?: AbortSignal;
};

export type ThreadSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ThreadMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const threadLocks = new Map<string, Promise<void>>();

function modelName(): `openai/${string}` {
  return `openai/${process.env.AI_MODEL ?? "gpt-4o-mini"}`;
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!content || typeof content !== "object") return "";

  const record = content as {
    content?: unknown;
    parts?: Array<{ type?: string; text?: string }>;
  };

  if (typeof record.content === "string" && record.content.trim()) {
    return record.content.trim();
  }

  if (!Array.isArray(record.parts)) return "";
  return record.parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text!.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function listUserThreads(
  authUserId: string,
): Promise<ThreadSummary[]> {
  const memory = createAgentMemory();

  const result = await memory.listThreads({
    filter: { resourceId: authUserId },
    perPage: 30,
    orderBy: { field: "updatedAt", direction: "DESC" },
  });

  return result.threads.map((thread) => ({
    id: thread.id,
    title: thread.title?.trim() || "Untitled Chat",
    updatedAt:
      thread.updatedAt instanceof Date
        ? thread.updatedAt.toISOString()
        : String(thread.updatedAt),
  }));
}

export async function getThreadMessages(
  authUserId: string,
  threadId: string,
): Promise<ThreadMessage[]> {
  const memory = createAgentMemory();

  const thread = await memory.getThreadById({
    threadId,
    resourceId: authUserId,
  });

  if (!thread || thread.resourceId !== authUserId) {
    throw new Error("Thread not found");
  }

  const recalledMemoryData = await memory.recall({
    threadId,
    resourceId: authUserId,
    perPage: false,
  });

  const messages: ThreadMessage[] = [];

  for (const message of recalledMemoryData.messages) {
    const content = messageText(message.content);

    if (!content) {
      continue;
    }

    const role: ThreadMessage["role"] =
      message.role === "user" || message.role === "assistant"
        ? message.role
        : "system";

    messages.push({
      id: message.id,
      role,
      content,
    });
  }

  return messages;
}

async function executeAgentStream(
  input: StreamAgentReplyInput,
): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  if (input.abortSignal?.aborted) {
    return;
  }

  input.onEvent({
    type: "started",
    message: "Agent is planning",
  });

  try {
    const memory = createAgentMemory();

    const agent = new Agent({
      id: "meeting-assistant",
      name: "Calby",
      instructions: getAgentInstructions(),
      model: modelName(),
      tools: createCalendarTools(input.authUserId),
      memory,
    });

    const result = await agent.stream(input.message, {
      memory: {
        resource: input.authUserId,
        thread: input.threadId,
      },
      abortSignal: input.abortSignal,
    });

    for await (const chunk of result.fullStream) {
      if (input.abortSignal?.aborted) {
        break;
      }

      if (chunk.type === "tool-call") {
        input.onEvent({
          type: "progress",
          message: `Running ${chunk.payload.toolName}`,
        });

        continue;
      }

      if (chunk.type === "text-delta") {
        const text = chunk.payload.text;

        if (text) {
          input.onEvent({
            type: "token",
            token: text,
          });
        }
      }
    }

    if (input.abortSignal?.aborted) {
      return;
    }

    const thread = await memory.getThreadById({
      threadId: input.threadId,
      resourceId: input.authUserId,
    });

    if (thread && !thread.title?.trim()) {
      try {
        await memory.updateThread({
          id: thread.id,
          title: input.message.slice(0, 80),
          metadata: thread.metadata ?? {},
        });
      } catch (error) {
        console.warn("Failed to update thread title in memory store", error);
      }
    }

    input.onEvent({
      type: "completed",
      message: "done",
    });
  } catch (error) {
    if (input.abortSignal?.aborted) {
      return;
    }

    const message =
      error instanceof Error ? error.message : "Agent streaming failed";
    input.onEvent({
      type: "error",
      message,
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



