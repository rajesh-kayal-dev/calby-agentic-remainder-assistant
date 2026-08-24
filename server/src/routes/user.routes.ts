import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import { getUserByAuthId, updateUserName, ensureUser } from "../repositories/user.repository.js";
import { getUserPreferences, upsertUserPreferences } from "../repositories/preferences.repository.js";
import { getCalendarConnection } from "../services/connection.service.js";

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
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to save preferences. Please try again.", success: false });
  }
});
