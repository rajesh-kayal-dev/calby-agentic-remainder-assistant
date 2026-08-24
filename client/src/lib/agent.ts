import { apiFetch } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type AgentStreamEvent = {
  type: "started" | "progress" | "token" | "completed" | "error";
  message?: string;
  token?: string;
};

export type ThreadSummary = {
  id: string;
  title: string;
  isPinned?: boolean;
  updatedAt: string;
};

export type ThreadMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export async function listThreads(token: string) {
  return apiFetch<{ threads: ThreadSummary[] }>("/api/agent/threads", {
    token,
  });
}

export async function loadThread(token: string, threadId: string) {
  return apiFetch<{ threadId: string; messages: ThreadMessage[] }>(
    `/api/agent/threads/${threadId}`,
    { token },
  );
}

export async function streamAgentChat(
  token: string,
  input: {
    message: string;
    threadId: string;
    llm?: { providerId: string; model?: string };
    selectedTool?: {
      id: string;
      category: string;
      name: string;
    };
  },
  onEvent: (event: AgentStreamEvent) => void,
) {
  const res = await fetch(`${API_URL}/api/agent/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.body) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.message || `Agent request failed with status ${res.status}`,
    );
  }

  const reader = res.body.getReader();

  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    buffer += decoder.decode(value, { stream: !done });

    // sse events ->
    const blocks = buffer.split(/\n\n/);
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      for (const line of block.split("\n")) {
        if (!line.startsWith("data:")) continue;
        // strip the data: prefix
        const data = line.slice(5).trim();

        if (data) onEvent(JSON.parse(data) as AgentStreamEvent);
      }
    }

    if (done) break;
  }
}

export async function deleteThreadApi(token: string, threadId: string) {
  return apiFetch<{ success: boolean }>(`/api/agent/threads/${threadId}`, {
    method: "DELETE",
    token,
  });
}

export async function updateThreadApi(
  token: string,
  threadId: string,
  updates: { title?: string; isPinned?: boolean },
) {
  return apiFetch<{ thread: ThreadSummary }>(`/api/agent/threads/${threadId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(updates),
  });
}

