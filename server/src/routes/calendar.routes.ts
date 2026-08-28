import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import {
  listUpcomingMeetings,
  createMeeting,
  rescheduleMeeting,
  cancelMeeting,
  checkCalendarBusy,
} from "../services/calendar.service.js";
import { listTasks } from "../services/task.service.js";
import { getUserRemindersFromDb } from "../repositories/reminder.repository.js";

export const calendarRouter = Router();

// Require authenticated session for all calendar endpoints
calendarRouter.use(requireSession);

// 1. GET /api/calendar/events - List events within date range
calendarRouter.get("/events", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const { start, end, category, maxResults, todayOnly } = req.query;

    const events = await listUpcomingMeetings({
      authUserId,
      startIso: typeof start === "string" ? start : undefined,
      endIso: typeof end === "string" ? end : undefined,
      category: typeof category === "string" ? category : undefined,
      maxResults: maxResults ? parseInt(String(maxResults), 10) : undefined,
      todayOnly: todayOnly === "true",
    });

    res.json({ success: true, events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Failed to fetch calendar events" });
  }
});

// 2. POST /api/calendar/events - Create new event
calendarRouter.post("/events", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const {
      title,
      description,
      location,
      category,
      priority,
      start,
      end,
      allDay,
      recurrence,
      remindMinutesBefore,
      ringtone,
      attendees,
      addGoogleMeet,
      syncToGoogle,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ success: false, error: "Event title is required" });
      return;
    }

    if (!start) {
      res.status(400).json({ success: false, error: "Event start time is required" });
      return;
    }

    const event = await createMeeting({
      authUserId,
      title: title.trim(),
      description,
      location,
      category,
      priority,
      startIso: start,
      endIso: end || new Date(new Date(start).getTime() + 3600000).toISOString(),
      allDay: Boolean(allDay),
      recurrence,
      remindMinutesBefore: remindMinutesBefore !== undefined ? Number(remindMinutesBefore) : 0,
      ringtone: typeof ringtone === "string" ? ringtone : "chime",
      attendeeEmails: Array.isArray(attendees) ? attendees : [],
      addGoogleMeet: Boolean(addGoogleMeet),
      syncToGoogle: Boolean(syncToGoogle),
    });

    res.status(201).json({ success: true, event });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Failed to create calendar event" });
  }
});

// 3. PATCH /api/calendar/events/:id - Update or reschedule event
calendarRouter.patch("/events/:id", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const {
      title,
      description,
      location,
      category,
      priority,
      start,
      end,
      allDay,
      recurrence,
      remindMinutesBefore,
      ringtone,
      attendees,
    } = req.body;

    const event = await rescheduleMeeting({
      authUserId,
      eventId,
      title,
      description,
      location,
      category,
      priority,
      startIso: start,
      endIso: end,
      allDay: allDay !== undefined ? Boolean(allDay) : undefined,
      recurrence,
      remindMinutesBefore: remindMinutesBefore !== undefined ? Number(remindMinutesBefore) : undefined,
      ringtone: typeof ringtone === "string" ? ringtone : undefined,
      attendees: Array.isArray(attendees) ? attendees : undefined,
    });

    if (!event) {
      res.status(404).json({ success: false, error: "Event not found" });
      return;
    }

    res.json({ success: true, event });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Failed to update calendar event" });
  }
});

// 4. DELETE /api/calendar/events/:id - Delete event
calendarRouter.delete("/events/:id", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await cancelMeeting({
      authUserId,
      eventId,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Failed to delete calendar event" });
  }
});

// 5. GET /api/calendar/free-busy - Check busy intervals
calendarRouter.get("/free-busy", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const { start, end } = req.query;

    const busy = await checkCalendarBusy({
      authUserId,
      startIso: typeof start === "string" ? start : new Date().toISOString(),
      endIso: typeof end === "string" ? end : new Date(Date.now() + 86400000).toISOString(),
    });

    res.json({ success: true, ...busy });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Failed to check calendar busy slots" });
  }
});

// 6. GET /api/calendar/summary - Unified view of today's schedule, pending tasks, and reminders
calendarRouter.get("/summary", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;

    const [events, tasks, reminders] = await Promise.all([
      listUpcomingMeetings({ authUserId, todayOnly: true }),
      listTasks(authUserId, { status: "pending" }),
      getUserRemindersFromDb(authUserId, "active"),
    ]);

    res.json({
      success: true,
      todayEvents: events,
      pendingTasks: tasks.slice(0, 5),
      activeReminders: reminders.slice(0, 5),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Failed to get calendar summary" });
  }
});
