import { Router, Request, Response } from "express";
import { requireSession } from "../middleware/requireSession.js";
import { LLM_PROVIDERS, getProviderDefinition } from "../services/llm/providers.registry.js";
import { getLLMAdapter } from "../services/llm/llm-factory.service.js";
import { decryptCredentials } from "../services/encryption.service.js";
import {
  getUserLLMConnections,
  getLLMConnectionById,
  createLLMConnection,
  updateLLMConnection,
  deleteLLMConnection,
  setDefaultLLMConnection,
  updateConnectionStatus,
  sanitizeConnectionRow,
} from "../repositories/llm-connection.repository.js";

export const llmRouter: Router = Router();

// 1. GET /api/llm/providers - Get list of supported LLM provider definitions (Public)
llmRouter.get("/providers", (_req: Request, res: Response) => {
  res.json({
    success: true,
    providers: LLM_PROVIDERS,
  });
});

llmRouter.use(requireSession);

// 2. GET /api/llm/providers/:providerId/models - Discover or list models for a provider
llmRouter.get("/providers/:providerId/models", async (req: Request, res: Response) => {
  const providerId = Array.isArray(req.params.providerId)
    ? req.params.providerId[0]
    : req.params.providerId;
  const def = getProviderDefinition(providerId);

  if (!def) {
    res.status(404).json({ error: `Provider '${providerId}' not found`, success: false });
    return;
  }

  const authUserId = req.authContext!.authUserId;
  const connections = await getUserLLMConnections(authUserId);
  const conn = connections.find((c) => c.providerId === providerId);

  if (conn && conn.hasApiKey) {
    try {
      const fullConn = await getLLMConnectionById(authUserId, conn.id);
      if (fullConn) {
        const creds = decryptCredentials(fullConn.encrypted_credentials);
        const adapter = getLLMAdapter(providerId);
        const discovered = await adapter.listModels(creds, def.baseUrl);

        if (discovered.length > 0) {
          res.json({ success: true, models: discovered });
          return;
        }
      }
    } catch {
      // Fallback to static defaults if online discovery fails
    }
  }

  res.json({
    success: true,
    models: def.defaultModels,
  });
});

// 3. GET /api/llm/connections - List all user connections (sanitized DTOs)
llmRouter.get("/connections", async (req: Request, res: Response) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const connections = await getUserLLMConnections(authUserId);
    res.json({ success: true, connections });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch LLM connections", success: false });
  }
});

// 4. POST /api/llm/connections - Create new user connection
llmRouter.post("/connections", async (req: Request, res: Response) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const { providerId, apiKey, selectedModel, config, isDefault } = req.body;

    if (!providerId || typeof providerId !== "string") {
      res.status(400).json({ error: "providerId is required", success: false });
      return;
    }

    const def = getProviderDefinition(providerId);
    if (!def) {
      res.status(404).json({ error: `Provider '${providerId}' is not supported`, success: false });
      return;
    }

    if (def.apiKeyRequired && (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "")) {
      res.status(400).json({ error: `API key is required for provider ${def.name}`, success: false });
      return;
    }

    const credentials: Record<string, string> = { apiKey: apiKey?.trim() || "" };
    const connection = await createLLMConnection({
      authUserId,
      providerId,
      credentials,
      selectedModel: selectedModel || def.defaultModels[0]?.id,
      config: config || {},
      isDefault: Boolean(isDefault),
    });

    res.status(201).json({ success: true, connection });
  } catch (error) {
    res.status(500).json({ error: "Failed to create LLM connection", success: false });
  }
});

// 5. GET /api/llm/connections/:id - Get specific connection (credentials masked)
llmRouter.get("/connections/:id", async (req: Request, res: Response) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const connectionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const row = await getLLMConnectionById(authUserId, connectionId);
    if (!row) {
      res.status(404).json({ error: "LLM connection not found", success: false });
      return;
    }

    res.json({ success: true, connection: sanitizeConnectionRow(row) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch LLM connection", success: false });
  }
});

// 6. PATCH /api/llm/connections/:id - Update connection
llmRouter.patch("/connections/:id", async (req: Request, res: Response) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const connectionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { apiKey, selectedModel, config, isDefault } = req.body;

    const existing = await getLLMConnectionById(authUserId, connectionId);
    if (!existing) {
      res.status(404).json({ error: "LLM connection not found", success: false });
      return;
    }

    const credentialsUpdate =
      typeof apiKey === "string" && apiKey.trim() !== ""
        ? { apiKey: apiKey.trim() }
        : undefined;

    const updated = await updateLLMConnection(authUserId, connectionId, {
      credentials: credentialsUpdate,
      selectedModel,
      config,
      isDefault,
    });

    res.json({ success: true, connection: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update LLM connection", success: false });
  }
});

// 7. DELETE /api/llm/connections/:id - Delete connection
llmRouter.delete("/connections/:id", async (req: Request, res: Response) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const connectionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const deleted = await deleteLLMConnection(authUserId, connectionId);
    if (!deleted) {
      res.status(404).json({ error: "LLM connection not found", success: false });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete LLM connection", success: false });
  }
});

// 8. POST /api/llm/connections/:id/test - Test credentials against provider API
llmRouter.post("/connections/:id/test", async (req: Request, res: Response) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const connectionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const row = await getLLMConnectionById(authUserId, connectionId);
    if (!row) {
      res.status(404).json({ error: "LLM connection not found", success: false });
      return;
    }

    const creds = decryptCredentials(row.encrypted_credentials);
    const def = getProviderDefinition(row.provider_id);

    if (!def) {
      res.status(400).json({ error: "Unsupported provider", success: false });
      return;
    }

    const adapter = getLLMAdapter(row.provider_id);
    const result = await adapter.validateCredentials(creds, def.baseUrl);

    const status = result.valid ? "active" : "error";
    await updateConnectionStatus(authUserId, connectionId, status, new Date());

    res.json({
      success: result.valid,
      status,
      message: result.message || (result.valid ? "Connection successful" : "Connection failed"),
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Connection test failed",
      message: error?.message || "Unknown error",
      success: false,
    });
  }
});

// 9. PATCH /api/llm/connections/:id/default - Set connection as default
llmRouter.patch("/connections/:id/default", async (req: Request, res: Response) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const connectionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const success = await setDefaultLLMConnection(authUserId, connectionId);
    if (!success) {
      res.status(404).json({ error: "LLM connection not found", success: false });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to set default LLM connection", success: false });
  }
});
