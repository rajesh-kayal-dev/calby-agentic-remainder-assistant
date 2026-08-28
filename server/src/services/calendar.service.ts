import { randomUUID } from "node:crypto";
import { getCalendarAccessToken } from "./token.service.js";
import {
  getCalendarEventsForUser,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  CalendarEventDTO,
} from "../repositories/calendar-event.repository.js";
import { createReminderInDb } from "../repositories/reminder.repository.js";
import { createNotification } from "../repositories/notifications.repository.js";

let googleModule: typeof import("googleapis") | null = null;

async function getGoogle() {
  if (!googleModule) {
    googleModule = await import("googleapis");
  }
  return googleModule.google;
}

async function calendarClient(accessToken: string) {
  const google = await getGoogle();
  const auth = new google.auth.OAuth2();

  auth.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({
    version: "v3",
    auth,
  });
}

async function googleCalendarForUser(authUserId: string) {
  try {
    const accessToken = await getCalendarAccessToken(authUserId);
    if (!accessToken) return null;
    return calendarClient(accessToken);
  } catch {
    return null;
  }
}

function formatGoogleEvent(event: any): CalendarEventDTO {
  const startStr = event.start?.dateTime ?? event.start?.date ?? new Date().toISOString();
  const endStr = event.end?.dateTime ?? event.end?.date ?? new Date(Date.now() + 3600000).toISOString();
  const isAllDay = !event.start?.dateTime && Boolean(event.start?.date);

  return {
    id: `gcal-${event.id}`,
    authUserId: "",
    title: event.summary ?? "(no title)",
    description: event.description?.trim() || null,
    location: event.location?.trim() || null,
    category: "meeting",
    priority: "medium",
    start: startStr,
    end: endStr,
    allDay: isAllDay,
    recurrence: "none",
    remindMinutesBefore: 15,
    attendees: (event.attendees ?? [])
      .map((person: any) => ({
        email: person.email,
        name: person.displayName,
      }))
      .filter((a: any) => Boolean(a.email || a.name)),
    googleEventId: event.id,
    source: "google",
    metadata: {
      htmlLink: event.htmlLink ?? null,
      meetLink: event.hangoutLink ?? null,
    },
    createdAt: event.created ?? new Date().toISOString(),
    updatedAt: event.updated ?? new Date().toISOString(),
  };
}

export async function listUpcomingMeetings(input: {
  authUserId: string;
  startIso?: string;
  endIso?: string;
  category?: string;
  maxResults?: number;
  todayOnly?: boolean;
}): Promise<CalendarEventDTO[]> {
  let startIso = input.startIso;
  let endIso = input.endIso;

  if (input.todayOnly) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    startIso = start.toISOString();
    endIso = end.toISOString();
  }

  // 1. Fetch Calby Native Events from PostgreSQL
  const nativeEvents = await getCalendarEventsForUser(input.authUserId, {
    startIso,
    endIso,
    category: input.category,
  });

  // 2. Fetch Google Calendar events if connected
  let googleEvents: CalendarEventDTO[] = [];
  try {
    const gcal = await googleCalendarForUser(input.authUserId);
    if (gcal) {
      const response = await gcal.events.list({
        calendarId: "primary",
        timeMin: startIso || new Date().toISOString(),
        timeMax: endIso,
        maxResults: input.maxResults ?? 50,
        singleEvents: true,
        orderBy: "startTime",
      });

      googleEvents = (response.data.items ?? []).map(formatGoogleEvent);
    }
  } catch {
    // Google Calendar fetch failed or disconnected - safely fallback to native events
  }

  // 3. Combine and sort
  const combined = [...nativeEvents, ...googleEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  if (input.maxResults && input.maxResults > 0) {
    return combined.slice(0, input.maxResults);
  }

  return combined;
}

export async function createMeeting(input: {
  authUserId: string;
  title: string;
  startIso: string;
  endIso: string;
  description?: string;
  location?: string;
  category?: "work" | "meeting" | "personal" | "focus" | "other";
  priority?: "low" | "medium" | "high" | "urgent";
  allDay?: boolean;
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  remindMinutesBefore?: number | null;
  ringtone?: string;
  attendeeEmails?: string[];
  addGoogleMeet?: boolean;
  syncToGoogle?: boolean;
}): Promise<CalendarEventDTO> {
  const startAt = new Date(input.startIso);
  const endAt = new Date(input.endIso);

  const attendees = (input.attendeeEmails || []).map((email) => ({ email }));

  let googleEventId: string | undefined;

  // Optional: Sync to Google Calendar if requested & user has connected Google
  if (input.syncToGoogle) {
    try {
      const gcal = await googleCalendarForUser(input.authUserId);
      if (gcal) {
        const withMeet = input.addGoogleMeet !== false;
        const gResponse = await gcal.events.insert({
          calendarId: "primary",
          sendUpdates: "all",
          conferenceDataVersion: withMeet ? 1 : undefined,
          requestBody: {
            summary: input.title,
            description: input.description,
            location: input.location,
            start: { dateTime: input.startIso },
            end: { dateTime: input.endIso },
            attendees: (input.attendeeEmails ?? []).map((email) => ({ email })),
            conferenceData: withMeet
              ? {
                  createRequest: {
                    requestId: randomUUID(),
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                  },
                }
              : undefined,
          },
        });
        googleEventId = gResponse.data.id || undefined;
      }
    } catch {
      // Ignore Google sync failure and persist locally
    }
  }

  // 1. Create native event in DB
  const event = await createCalendarEvent({
    authUserId: input.authUserId,
    title: input.title,
    description: input.description,
    location: input.location,
    category: input.category || "work",
    priority: input.priority || "medium",
    startAt,
    endAt,
    allDay: input.allDay ?? false,
    recurrence: input.recurrence || "none",
    remindMinutesBefore: input.remindMinutesBefore !== undefined ? input.remindMinutesBefore : 0,
    attendees,
    googleEventId,
    metadata: { ringtone: input.ringtone || "chime" },
  });

  // 2. Schedule a reminder if requested (or create immediate notification if starting soon/now)
  if (input.remindMinutesBefore !== undefined && input.remindMinutesBefore !== null) {
    try {
      const mins = Number(input.remindMinutesBefore) || 0;
      const remindTime = new Date(startAt.getTime() - mins * 60000);
      const now = new Date();

      await createReminderInDb({
        authUserId: input.authUserId,
        title: `Upcoming Event: ${input.title}`,
        description: input.description || `Starts at ${startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        dueAt: remindTime,
        recurrence: (input.recurrence as any) || "none",
        channel: "in_app",
        metadata: { eventId: event.id, ringtone: input.ringtone || "calby_bell" },
      });

      // If event reminder time has arrived or event starts within 15 minutes, trigger real-time notification immediately!
      if (remindTime <= new Date(now.getTime() + 60000)) {
        await createNotification({
          authUserId: input.authUserId,
          type: "event",
          title: `🔔 Event Alert: ${input.title}`,
          message: `Your event "${input.title}" is starting at ${startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          metadata: { eventId: event.id, ringtone: input.ringtone || "calby_bell" },
        });
      }
    } catch {
      // Non-blocking reminder schedule failure
    }
  }

  return event;
}

export async function rescheduleMeeting(input: {
  authUserId: string;
  eventId: string;
  title?: string;
  description?: string;
  location?: string;
  category?: "work" | "meeting" | "personal" | "focus" | "other";
  priority?: "low" | "medium" | "high" | "urgent";
  startIso?: string;
  endIso?: string;
  allDay?: boolean;
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  remindMinutesBefore?: number | null;
  ringtone?: string;
  attendees?: Array<{ email?: string; name?: string }>;
}): Promise<CalendarEventDTO | null> {
  const updates: any = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.location !== undefined) updates.location = input.location;
  if (input.category !== undefined) updates.category = input.category;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.startIso !== undefined) updates.startAt = new Date(input.startIso);
  if (input.endIso !== undefined) updates.endAt = new Date(input.endIso);
  if (input.allDay !== undefined) updates.allDay = input.allDay;
  if (input.recurrence !== undefined) updates.recurrence = input.recurrence;
  if (input.remindMinutesBefore !== undefined) updates.remindMinutesBefore = input.remindMinutesBefore;
  if (input.ringtone !== undefined) updates.metadata = { ringtone: input.ringtone };
  if (input.attendees !== undefined) updates.attendees = input.attendees;

  return await updateCalendarEvent(input.authUserId, input.eventId, updates);
}

export async function cancelMeeting(input: {
  authUserId: string;
  eventId: string;
}): Promise<{ cancelled: boolean; eventId: string }> {
  // If it's a google-prefixed event
  if (input.eventId.startsWith("gcal-")) {
    const rawGcalId = input.eventId.replace("gcal-", "");
    try {
      const gcal = await googleCalendarForUser(input.authUserId);
      if (gcal) {
        await gcal.events.delete({
          calendarId: "primary",
          eventId: rawGcalId,
        });
      }
    } catch {}
    return { cancelled: true, eventId: input.eventId };
  }

  const success = await deleteCalendarEvent(input.authUserId, input.eventId);
  return {
    cancelled: success,
    eventId: input.eventId,
  };
}

export async function checkCalendarBusy(input: {
  authUserId: string;
  startIso: string;
  endIso: string;
}) {
  const events = await listUpcomingMeetings({
    authUserId: input.authUserId,
    startIso: input.startIso,
    endIso: input.endIso,
  });

  const busy = events.map((e) => ({
    start: e.start,
    end: e.end,
    title: e.title,
  }));

  return { busy };
}
