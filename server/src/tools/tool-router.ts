import { getPool } from "../db/pool.js";
import { getCalendarAccessToken } from "../services/token.service.js";
import { TOOLS_REGISTRY, ToolExecutionContext } from "./tools.registry.js";

export type NormalizedToolResult<T = any> = {
  success: boolean;
  tool: string;
  data?: T;
  message?: string;
  code?: string;
  provider?: string;
};

export type ExecuteToolInput = {
  authUserId: string;
  toolId: string;
  input: unknown;
  confirmed?: boolean;
  conversationId?: string;
};

async function checkConnectorAvailable(
  authUserId: string,
  requiredConnection?: string,
): Promise<{ connected: boolean; provider?: string }> {
  if (!requiredConnection) return { connected: true };

  if (requiredConnection === "google_calendar") {
    try {
      const token = await getCalendarAccessToken(authUserId);
      return { connected: Boolean(token), provider: "google_calendar" };
    } catch {
      return { connected: false, provider: "google_calendar" };
    }
  }

  // Gmail, WhatsApp, Telegram integrations return CONNECTION_REQUIRED in Step 2
  return { connected: false, provider: requiredConnection };
}

async function logToolExecution(entry: {
  authUserId: string;
  conversationId?: string;
  toolId: string;
  action: string;
  status: "success" | "failed" | "rejected";
  durationMs: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await getPool().query(
      `
      INSERT INTO tool_execution_logs (
        auth_user_id,
        conversation_id,
        tool_id,
        action,
        status,
        duration_ms,
        error_code,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        entry.authUserId,
        entry.conversationId || null,
        entry.toolId,
        entry.action,
        entry.status,
        entry.durationMs,
        entry.errorCode || null,
        JSON.stringify(entry.metadata || {}),
      ],
    );
  } catch (err) {
    console.warn("Failed to write tool execution log:", err);
  }
}

export async function executeTool(
  params: ExecuteToolInput,
): Promise<NormalizedToolResult> {
  const startTime = Date.now();
  const { authUserId, toolId, input, confirmed, conversationId } = params;

  // 1. Resolve Tool Definition
  const tool = TOOLS_REGISTRY[toolId];
  if (!tool) {
    await logToolExecution({
      authUserId,
      conversationId,
      toolId,
      action: "validate_tool",
      status: "failed",
      durationMs: Date.now() - startTime,
      errorCode: "INVALID_TOOL",
    });

    return {
      success: false,
      tool: toolId,
      code: "INVALID_TOOL",
      message: `Unknown or unregistered tool '${toolId}'.`,
    };
  }

  // 2. Validate Input Schema with Zod
  const parseResult = tool.inputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");

    await logToolExecution({
      authUserId,
      conversationId,
      toolId,
      action: "validate_input",
      status: "failed",
      durationMs: Date.now() - startTime,
      errorCode: "INVALID_INPUT",
    });

    return {
      success: false,
      tool: toolId,
      code: "INVALID_INPUT",
      message: `Invalid input for tool '${toolId}': ${errorDetails}`,
    };
  }

  // 3. Enforce Confirmation Safeguard
  if (tool.confirmationRequired && !confirmed) {
    await logToolExecution({
      authUserId,
      conversationId,
      toolId,
      action: "check_confirmation",
      status: "rejected",
      durationMs: Date.now() - startTime,
      errorCode: "CONFIRMATION_REQUIRED",
    });

    return {
      success: false,
      tool: toolId,
      code: "CONFIRMATION_REQUIRED",
      message: `Action '${tool.name}' requires explicit user confirmation before execution.`,
    };
  }

  // 4. Check Connector Availability
  const connCheck = await checkConnectorAvailable(authUserId, tool.requiredConnection);
  if (!connCheck.connected) {
    await logToolExecution({
      authUserId,
      conversationId,
      toolId,
      action: "check_connection",
      status: "rejected",
      durationMs: Date.now() - startTime,
      errorCode: "CONNECTION_REQUIRED",
      metadata: { provider: connCheck.provider },
    });

    return {
      success: false,
      tool: toolId,
      code: "CONNECTION_REQUIRED",
      provider: connCheck.provider,
      message: `The '${tool.name}' tool requires connecting ${connCheck.provider || "the service"} first.`,
    };
  }

  // 5. Execute Tool Handler
  try {
    const context: ToolExecutionContext = { conversationId };
    const resultData = await tool.execute(authUserId, parseResult.data, context);

    const durationMs = Date.now() - startTime;
    await logToolExecution({
      authUserId,
      conversationId,
      toolId,
      action: "execute",
      status: "success",
      durationMs,
    });

    return {
      success: true,
      tool: toolId,
      data: resultData,
      message: `${tool.name} executed successfully.`,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const errMsg = error?.message || "Tool execution failed";

    await logToolExecution({
      authUserId,
      conversationId,
      toolId,
      action: "execute",
      status: "failed",
      durationMs,
      errorCode: "EXECUTION_ERROR",
    });

    return {
      success: false,
      tool: toolId,
      code: "EXECUTION_ERROR",
      message: errMsg,
    };
  }
}
