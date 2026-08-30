import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { closePool, getPool } from "./db/pool.js";
import { connectionRouter } from "./routes/connection.routes.js";
import { agentRoutes } from "./routes/agent.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { llmRouter } from "./routes/llm.routes.js";
import { toolsRouter } from "./routes/tools.routes.js";
import { reminderRoutes } from "./routes/reminder.routes.js";
import { contactRouter } from "./routes/contact.routes.js";
import { taskRouter } from "./routes/task.routes.js";
import { calendarRouter } from "./routes/calendar.routes.js";
import { webhookRouter } from "./routes/webhook.routes.js";
import { moneyRouter } from "./routes/money.routes.js";
import { integrationRouter } from "./routes/integration.routes.js";
import { mountMcpServer } from "./mcp/mount.js";
import { globalScheduler } from "./services/reminder-scheduler.service.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { rateLimiter } from "./middleware/rate-limiter.js";

// Global process error handlers to prevent unhandled database drops from crashing process
process.on("uncaughtException", (err) => {
  console.warn("[Server Process] Uncaught exception safely captured:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.warn("[Server Process] Unhandled rejection safely captured:", reason);
});

const app = express();
const port = Number(process.env.PORT) || 4000;
const appOrigin = process.env.APP_URL ?? "http://localhost:3000";

const allowedOrigins = [
  appOrigin,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by frontend framework
    crossOriginEmbedderPolicy: false,
  }),
);

// Request ID for observability
app.use(requestIdMiddleware);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) and allowed origins
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.startsWith("chrome-extension://")) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));

app.get(["/", "/health", "/api/health"], async (_req, res) => {
  try {
    await getPool().query("SELECT 1");
    res.json({ status: "ok", service: "calby-server", database: "up" });
  } catch {
    res.status(503).json({
      status: "error",
      service: "calby-server",
      database: "down",
    });
  }
});

// Webhook routes — public, no session required, rate limited
app.use("/api/webhooks", rateLimiter({ maxRequests: 100, windowMs: 60_000 }), webhookRouter);

// Agent chat — rate limited to prevent abuse
app.use("/api/agent", rateLimiter({ maxRequests: 30, windowMs: 60_000 }), agentRoutes);

// Integration management — Nango-backed
app.use("/api/integrations", integrationRouter);

// Existing routes
app.use("/api/connections", connectionRouter);
app.use("/api/user", userRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/llm", llmRouter);
app.use("/api/tools", toolsRouter);
app.use("/api/reminders", reminderRoutes);
app.use("/api/contacts", contactRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api", taskRouter);
app.use("/api", moneyRouter);

mountMcpServer(app);

const server = app.listen(port, () => {
  console.log(`Calby is running on http://localhost:${port}`);
  globalScheduler.start();
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  globalScheduler.stop();
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
