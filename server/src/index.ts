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
import { mountMcpServer } from "./mcp/mount.js";

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

app.use("/api/connections", connectionRouter);
app.use("/api/agent", agentRoutes);
app.use("/api/user", userRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/llm", llmRouter);
app.use("/api/tools", toolsRouter);

mountMcpServer(app);

const server = app.listen(port, () => {
  console.log(`Calby is running on http://localhost:${port}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

