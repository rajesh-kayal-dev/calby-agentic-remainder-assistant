import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import {
  createReminder,
  getUserReminders,
  getReminderById,
  updateReminder,
  pauseReminder,
  resumeReminder,
  deleteReminder,
} from "../services/reminder.service.js";
import { defaultChannelRegistry } from "../services/notifications/channel-registry.js";
import { getUserTelegramConnection } from "../services/notifications/telegram-connection.service.js";
import { getWhatsAppConnectionStatus } from "../services/notifications/whatsapp-connection.service.js";
import { getGoogleConnectionStatus } from "../services/google-oauth.service.js";

export const reminderRoutes = Router();

const createReminderSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().optional(),
  timezone: z.string().optional(),
  dueAt: z.string().optional(),
  eventAt: z.string().optional(),
  remindBefore: z
    .object({
      value: z.number(),
      unit: z.enum(["minutes", "hours", "days", "weeks", "months"]),
    })
    .optional(),
  obligationType: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  subject: z.string().optional(),
  recipientId: z.string().uuid().nullable().optional(),
  channel: z.string().optional(),
  taskId: z.string().uuid().nullable().optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
});

const updateReminderSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().optional(),
  status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
  dueAt: z.string().optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
  recipientId: z.string().uuid().nullable().optional(),
  channel: z.string().optional(),
  taskId: z.string().uuid().nullable().optional(),
});

reminderRoutes.use(requireSession);

reminderRoutes.post("/", async (req, res) => {
  const parsed = createReminderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.issues });
    return;
  }

  try {
    const reminder = await createReminder({
      authUserId: req.authContext!.authUserId,
      ...parsed.data,
      obligationType: parsed.data.obligationType as any,
    });
    res.status(201).json({ reminder });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to create reminder" });
  }
});

reminderRoutes.get("/channels", async (req, res) => {
  try {
    const rawChannels = defaultChannelRegistry.getAvailableChannels();
    const tgConnection = await getUserTelegramConnection(req.authContext!.authUserId);
    const waConnection = await getWhatsAppConnectionStatus(req.authContext!.authUserId);
    const gmailConnection = await getGoogleConnectionStatus(req.authContext!.authUserId);

    const channels = rawChannels.map((c) => {
      if (c.id === "telegram") {
        return {
          ...c,
          name: tgConnection.connected ? `Telegram (@${tgConnection.username || "Connected"})` : "Telegram — Connect in Settings",
          connected: tgConnection.connected,
          enabled: tgConnection.connected,
        };
      }
      if (c.id === "whatsapp") {
        return {
          ...c,
          name: waConnection.connected ? `WhatsApp (${waConnection.displayPhoneNumber || "Connected"})` : "WhatsApp — Connect in Settings",
          connected: waConnection.connected,
          enabled: waConnection.connected,
        };
      }
      if (c.id === "gmail") {
        return {
          ...c,
          name: gmailConnection.connected ? `Gmail (${gmailConnection.email})` : "Gmail — Connect in Settings",
          connected: gmailConnection.connected,
          enabled: gmailConnection.connected,
        };
      }
      return {
        ...c,
        connected: true,
        enabled: true,
      };
    });

    res.json({ channels });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to list channels" });
  }
});

reminderRoutes.get("/", async (req, res) => {
  try {
    const status = req.query.status as any;
    const reminders = await getUserReminders(req.authContext!.authUserId, status);
    res.json({ reminders });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to list reminders" });
  }
});

reminderRoutes.get("/:id", async (req, res) => {
  try {
    const reminder = await getReminderById(req.authContext!.authUserId, req.params.id);
    if (!reminder) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    res.json({ reminder });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to get reminder" });
  }
});

reminderRoutes.patch("/:id", async (req, res) => {
  const parsed = updateReminderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.issues });
    return;
  }

  try {
    const reminder = await updateReminder(
      req.authContext!.authUserId,
      req.params.id,
      parsed.data,
    );
    if (!reminder) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    res.json({ reminder });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to update reminder" });
  }
});

reminderRoutes.patch("/:id/pause", async (req, res) => {
  try {
    const reminder = await pauseReminder(req.authContext!.authUserId, req.params.id);
    if (!reminder) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    res.json({ reminder });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to pause reminder" });
  }
});

reminderRoutes.patch("/:id/resume", async (req, res) => {
  try {
    const reminder = await resumeReminder(req.authContext!.authUserId, req.params.id);
    if (!reminder) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    res.json({ reminder });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to resume reminder" });
  }
});

reminderRoutes.delete("/:id", async (req, res) => {
  try {
    const success = await deleteReminder(req.authContext!.authUserId, req.params.id);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to delete reminder" });
  }
});
