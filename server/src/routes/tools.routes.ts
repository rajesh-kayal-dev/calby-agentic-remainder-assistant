import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import { executeTool } from "../tools/tool-router.js";
import { TOOLS_REGISTRY } from "../tools/tools.registry.js";

export const toolsRouter = Router();

toolsRouter.use(requireSession);

const executeSchema = z.object({
  toolId: z.string().min(1),
  input: z.unknown().default({}),
  confirmed: z.boolean().optional().default(false),
  conversationId: z.string().uuid().optional(),
});

toolsRouter.post("/execute", async (req, res) => {
  const parsed = executeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      tool: req.body?.toolId || "unknown",
      code: "INVALID_REQUEST",
      message: "Invalid request payload for tool execution",
    });
    return;
  }

  try {
    const result = await executeTool({
      authUserId: req.authContext!.authUserId,
      toolId: parsed.data.toolId,
      input: parsed.data.input,
      confirmed: parsed.data.confirmed,
      conversationId: parsed.data.conversationId,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      tool: parsed.data.toolId,
      code: "SERVER_ERROR",
      message: error?.message || "Tool router execution failed",
    });
  }
});

toolsRouter.get("/registry", async (_req, res) => {
  const tools = Object.values(TOOLS_REGISTRY).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    requiredConnection: t.requiredConnection,
    confirmationRequired: t.confirmationRequired,
  }));

  res.json({ tools });
});
