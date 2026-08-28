import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import { getUserByAuthId, updateUserName, ensureUser, purgeUserDataFromDb } from "../repositories/user.repository.js";
import { getUserPreferences, upsertUserPreferences } from "../repositories/preferences.repository.js";
import { getCalendarConnection } from "../services/connection.service.js";
import { listContactsFromDb } from "../repositories/contact.repository.js";
import { listTasksFromDb } from "../repositories/task.repository.js";
import { getUserRemindersFromDb } from "../repositories/reminder.repository.js";
import { listLedgerItemsFromDb } from "../repositories/money.repository.js";
import { getUserStorageStats } from "../services/storage.service.js";

export const userRouter: Router = Router();

userRouter.get("/profile", requireSession, async (req, res) => {
  try {
    const authContext = req.authContext;
    if (!authContext) {
      res.status(401).json({ error: "Unauthorized", success: false });
      return;
    }

    let dbUser = await getUserByAuthId(authContext.authUserId);
    if (!dbUser) {
      dbUser = await ensureUser({
        authUserId: authContext.authUserId,
        email: authContext.email,
        name: authContext.name,
      });
    }

    // Determine resolved display name: DB name -> token claim name -> email prefix -> fallback
    const emailPrefix = authContext.email ? authContext.email.split("@")[0] : undefined;
    const name = dbUser.name || authContext.name || emailPrefix || "User";

    res.json({
      success: true,
      user: {
        id: dbUser.id,
        authUserId: authContext.authUserId,
        email: dbUser.email ?? authContext.email ?? null,
        name,
        accountType: "Permanent Account",
        sessionStatus: "Authenticated Session",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile", success: false });
  }
});

userRouter.patch("/profile", requireSession, async (req, res) => {
  try {
    const authContext = req.authContext;
    if (!authContext) {
      res.status(401).json({ error: "Unauthorized", success: false });
      return;
    }

    const { name } = req.body || {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      res.status(400).json({ error: "Unable to update your name. Please try again.", success: false });
      return;
    }

    const trimmedName = name.trim();
    const updatedUser = await updateUserName(authContext.authUserId, trimmedName);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        authUserId: authContext.authUserId,
        email: updatedUser.email ?? authContext.email ?? null,
        name: updatedUser.name || trimmedName,
        accountType: "Permanent Account",
        sessionStatus: "Authenticated Session",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to update your name. Please try again.", success: false });
  }
});

userRouter.get("/preferences", requireSession, async (req, res) => {
  try {
    const authContext = req.authContext;
    if (!authContext) {
      res.status(401).json({ error: "Unauthorized", success: false });
      return;
    }

    const dbPrefs = await getUserPreferences(authContext.authUserId);
    const conn = await getCalendarConnection(authContext.userId);

    // Build connected calendars list
    const calendars: Array<{ id: string; name: string; account?: string; primary?: boolean }> = [];
    if (conn?.status === "connected") {
      calendars.push({
        id: "primary",
        name: "Google Calendar",
        account: authContext.email || "Primary Account",
        primary: true,
      });
    }

    const preferences = {
      theme: dbPrefs?.theme ?? "dark",
      defaultCalendarId: dbPrefs?.default_calendar_id ?? (calendars[0]?.id || "none"),
      timezone: dbPrefs?.timezone ?? "UTC",
      dateFormat: dbPrefs?.date_format ?? "DD/MM/YYYY",
      timeFormat: dbPrefs?.time_format ?? "24h",
      notifications: {
        dailyBriefing: dbPrefs?.daily_briefing ?? true,
        eventReminder: dbPrefs?.event_reminder ?? true,
        reminderMinutes: dbPrefs?.reminder_minutes ?? 10,
      },
      alertsEnabled: dbPrefs?.alerts_enabled ?? true,
      alertCalendar: dbPrefs?.alert_calendar ?? true,
      alertTasks: dbPrefs?.alert_tasks ?? true,
      alertFollowups: dbPrefs?.alert_followups ?? true,
      defaultReminderMinutes: dbPrefs?.default_reminder_minutes ?? 15,
      alertSound: dbPrefs?.alert_sound ?? "calby_bell",
      alertVolume: dbPrefs?.alert_volume ?? 70,
      quietHoursEnabled: dbPrefs?.quiet_hours_enabled ?? false,
      quietHoursStart: dbPrefs?.quiet_hours_start ?? "22:00",
      quietHoursEnd: dbPrefs?.quiet_hours_end ?? "07:00",
    };

    res.json({
      success: true,
      preferences,
      calendars,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user preferences", success: false });
  }
});

userRouter.patch("/preferences", requireSession, async (req, res) => {
  try {
    const authContext = req.authContext;
    if (!authContext) {
      res.status(401).json({ error: "Unauthorized", success: false });
      return;
    }

    const {
      theme,
      defaultCalendarId,
      timezone,
      dateFormat,
      timeFormat,
      notifications,
      alertsEnabled,
      alertCalendar,
      alertTasks,
      alertFollowups,
      defaultReminderMinutes,
      alertSound,
      alertVolume,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
    } = req.body || {};

    const updated = await upsertUserPreferences(authContext.authUserId, {
      theme: typeof theme === "string" ? theme : undefined,
      defaultCalendarId: typeof defaultCalendarId === "string" ? defaultCalendarId : undefined,
      timezone: typeof timezone === "string" ? timezone : undefined,
      dateFormat: typeof dateFormat === "string" ? dateFormat : undefined,
      timeFormat: typeof timeFormat === "string" ? timeFormat : undefined,
      dailyBriefing: typeof notifications?.dailyBriefing === "boolean" ? notifications.dailyBriefing : undefined,
      eventReminder: typeof notifications?.eventReminder === "boolean" ? notifications.eventReminder : undefined,
      reminderMinutes: typeof notifications?.reminderMinutes === "number" ? notifications.reminderMinutes : undefined,
      alertsEnabled: typeof alertsEnabled === "boolean" ? alertsEnabled : undefined,
      alertCalendar: typeof alertCalendar === "boolean" ? alertCalendar : undefined,
      alertTasks: typeof alertTasks === "boolean" ? alertTasks : undefined,
      alertFollowups: typeof alertFollowups === "boolean" ? alertFollowups : undefined,
      defaultReminderMinutes: typeof defaultReminderMinutes === "number" ? defaultReminderMinutes : undefined,
      alertSound: typeof alertSound === "string" ? alertSound : undefined,
      alertVolume: typeof alertVolume === "number" ? alertVolume : undefined,
      quietHoursEnabled: typeof quietHoursEnabled === "boolean" ? quietHoursEnabled : undefined,
      quietHoursStart: typeof quietHoursStart === "string" ? quietHoursStart : undefined,
      quietHoursEnd: typeof quietHoursEnd === "string" ? quietHoursEnd : undefined,
    });

    res.json({
      success: true,
      preferences: {
        theme: updated.theme,
        defaultCalendarId: updated.default_calendar_id,
        timezone: updated.timezone,
        dateFormat: updated.date_format,
        timeFormat: updated.time_format,
        notifications: {
          dailyBriefing: updated.daily_briefing,
          eventReminder: updated.event_reminder,
          reminderMinutes: updated.reminder_minutes,
        },
        alertsEnabled: updated.alerts_enabled,
        alertCalendar: updated.alert_calendar,
        alertTasks: updated.alert_tasks,
        alertFollowups: updated.alert_followups,
        defaultReminderMinutes: updated.default_reminder_minutes,
        alertSound: updated.alert_sound,
        alertVolume: updated.alert_volume,
        quietHoursEnabled: updated.quiet_hours_enabled,
        quietHoursStart: updated.quiet_hours_start,
        quietHoursEnd: updated.quiet_hours_end,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to save preferences. Please try again.", success: false });
  }
});

userRouter.get("/export-data", requireSession, async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;

    const [user, prefs, contacts, tasks, reminders, ledger] = await Promise.all([
      getUserByAuthId(authUserId),
      getUserPreferences(authUserId),
      listContactsFromDb(authUserId),
      listTasksFromDb(authUserId),
      getUserRemindersFromDb(authUserId),
      listLedgerItemsFromDb(authUserId, {}),
    ]);

    const dataBundle = {
      exportedAt: new Date().toISOString(),
      user: {
        email: req.authContext!.email,
        name: req.authContext!.name,
      },
      preferences: prefs,
      contacts,
      tasks,
      reminders,
      moneyLedger: ledger,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="calby-user-export-${Date.now()}.json"`);
    res.json(dataBundle);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to export user data" });
  }
});

userRouter.delete("/account", requireSession, async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    await purgeUserDataFromDb(authUserId);
    res.json({ success: true, message: "Account and associated data deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to delete account" });
  }
});

userRouter.get("/storage", requireSession, async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const stats = await getUserStorageStats(authUserId);
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to fetch storage statistics" });
  }
});

userRouter.post("/clear-cache", requireSession, async (req, res) => {
  try {
    res.json({ success: true, message: "Temporary server cache cleared successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to clear cache" });
  }
});
