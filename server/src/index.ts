import "dotenv/config";
import cors from "cors";
import express from "express";
import { closePool, getPool } from "./db/pool.js";
import { connectionRouter } from "./routes/connection.routes.js";
import { agentRoutes } from "./routes/agent.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { llmRouter } from "./routes/llm.routes.js";
import { toolsRouter } from "./routes/tools.routes.js";
import { reminderRoutes } from "./routes/reminder.routes.js";
import { contactRouter } from "./routes/contact.routes.js";
import { webhookRouter } from "./routes/webhook.routes.js";
import { mountMcpServer } from "./mcp/mount.js";
import { globalScheduler } from "./services/reminder-scheduler.service.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const appOrigin = process.env.APP_URL ?? "http://localhost:3000";

app.use(
  cors({
    origin: appOrigin,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await getPool().query("SELECT 1");
    res.json({ status: "ok", service: "agentic-calendar-app", database: "up" });
  } catch {
    res.status(503).json({
      status: "error",
      service: "agentic-calendar-app",
      database: "down",
    });
  }
});

app.use("/api/webhooks", webhookRouter);
app.use("/api/connections", connectionRouter);
app.use("/api/agent", agentRoutes);
app.use("/api/user", userRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/llm", llmRouter);
app.use("/api/tools", toolsRouter);
app.use("/api/reminders", reminderRoutes);
app.use("/api/contacts", contactRouter);

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

