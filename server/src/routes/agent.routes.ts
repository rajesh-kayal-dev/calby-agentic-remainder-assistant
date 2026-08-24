import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import {
  getThreadMessages,
  listUserThreads,
  streamAgentReply,
} from "../services/agent.service.js";

export const agentRoutes = Router();

const chatSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  threadId: z.string().uuid(),
});

const threadIdSchema = z.string().uuid();

agentRoutes.use(requireSession);

agentRoutes.get("/threads", async (req, res) => {
  try {
    const threads = await listUserThreads(req.authContext!.authUserId);
    res.json({ threads });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list threads";
    res.status(500).json({ error: message });
  }
});

agentRoutes.get("/threads/:threadId", async (req, res) => {
  const parsed = threadIdSchema.safeParse(req.params.threadId);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid threadId" });
    return;
  }
  try {
    const messages = await getThreadMessages(
      req.authContext!.authUserId,
      parsed.data,
    );
    res.json({ threadId: parsed.data, messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get thread messages";
    res.status(500).json({ error: message });
  }
});

agentRoutes.post("/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid chat body" });
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const abortController = new AbortController();

  req.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  const write = (event: Record<string, unknown>) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };

  try {
    await streamAgentReply({
      userId: req.authContext!.userId,
      authUserId: req.authContext!.authUserId,
      threadId: parsed.data.threadId,
      message: parsed.data.message,
      onEvent: write,
      abortSignal: abortController.signal,
    });
  } catch (error) {
    if (!abortController.signal.aborted && !res.writableEnded) {
      const message =
        error instanceof Error ? error.message : "Agent execution failed";
      write({ type: "error", message });
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});


