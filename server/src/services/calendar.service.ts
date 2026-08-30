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
import { getUserPreferences } from "../repositories/preferences.repository.js";
import { getCalendarConnectionStatus } from "./google-oauth.service.js";

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
  let startStr = event.start?.dateTime ?? event.start?.date ?? new Date().toISOString();
  let endStr = event.end?.dateTime ?? event.end?.date ?? new Date(Date.now() + 3600000).toISOString();
  
  if (event.start?.dateTime && startStr.endsWith("Z")) {
    startStr = startStr.slice(0, -1);
  }
  if (event.end?.dateTime && endStr.endsWith("Z")) {
    endStr = endStr.slice(0, -1);
  }

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

export function getTimezoneOffset(timeZone: string, date: Date = new Date()): number {
  try {
    const localTime = new Date(date.toLocaleString("en-US", { timeZone }));
    const utcTime = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    return localTime.getTime() - utcTime.getTime();
  } catch {
    return 0;
  }
}

export function getLocalDayBounds(timezone: string) {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dateStr = formatter.format(now);

    const startLocal = new Date(`${dateStr}T00:00:00Z`);
    const endLocal = new Date(`${dateStr}T23:59:59.999Z`);

    const offsetMs = getTimezoneOffset(timezone, now);
    
    const startUtc = new Date(startLocal.getTime() - offsetMs);
    const endUtc = new Date(endLocal.getTime() - offsetMs);

    return {
      startIso: startUtc.toISOString(),
      endIso: endUtc.toISOString(),
    };
  } catch {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }
}

export function getLocalDateStr(isoStr: string, timezone: string): string {
  let d: Date;
  if (isoStr.endsWith("Z")) {
    d = new Date(isoStr);
  } else {
    const naiveDate = new Date(isoStr.endsWith("Z") ? isoStr : isoStr + "Z");
    const offsetMs = getTimezoneOffset(timezone, naiveDate);
    d = new Date(naiveDate.getTime() - offsetMs);
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

export function parseLocalOrUtcDate(isoStr: string, timezone: string): Date {
  if (isoStr.endsWith("Z")) {
    return new Date(isoStr);
  }
  const cleanIso = isoStr.endsWith("Z") ? isoStr.slice(0, -1) : isoStr;
  const hasOffset = /[-+]\d{2}:?\d{2}$/.test(cleanIso) || (cleanIso.includes("T") && cleanIso.split("T")[1].includes("-")) || (cleanIso.includes("T") && cleanIso.split("T")[1].includes("+"));
  
  if (!hasOffset) {
    const naiveDate = new Date(cleanIso + "Z");
    const offsetMs = getTimezoneOffset(timezone, naiveDate);
    return new Date(naiveDate.getTime() - offsetMs);
  }
  return new Date(isoStr);
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
  let todayTimezone = "Asia/Kolkata";

  if (input.todayOnly) {
    const prefs = await getUserPreferences(input.authUserId);
    todayTimezone = prefs?.timezone || "Asia/Kolkata";

    // 1. UTC bounds
    const utcStart = new Date();
    utcStart.setUTCHours(0, 0, 0, 0);
    const utcEnd = new Date();
    utcEnd.setUTCHours(23, 59, 59, 999);

    // 2. Local bounds
    const localBounds = getLocalDayBounds(todayTimezone);

    // 3. Union (widest range covering both today in UTC and today in local time)
    const minStart = new Date(Math.min(utcStart.getTime(), new Date(localBounds.startIso).getTime()));
    const maxEnd = new Date(Math.max(utcEnd.getTime(), new Date(localBounds.endIso).getTime()));

    startIso = minStart.toISOString();
    endIso = maxEnd.toISOString();
  }

  // 1. Fetch Calby Native Events from PostgreSQL
  const nativeEvents = await getCalendarEventsForUser(input.authUserId, {
    startIso,
    endIso,
    category: input.category,
  });

  // 2. Fetch Google Calendar events if connected
  let googleEvents: CalendarEventDTO[] = [];
  const connStatus = await getCalendarConnectionStatus(input.authUserId);
  if (connStatus.connected) {
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
      } else {
        throw new Error("CONNECTION_REQUIRED: Google Calendar connection exists but client initialization failed.");
      }
    } catch (err: any) {
      throw new Error(`Google Calendar API failed: ${err.message || err}`);
    }
  }

  // Deduplicate: If a native event has a googleEventId that exists in Google Calendar events,
  // discard the native event and keep the Google Calendar event (live source of truth).
  const googleEventIds = new Set(googleEvents.map((ge) => ge.googleEventId).filter(Boolean));
  const filteredNativeEvents = nativeEvents.filter(
    (ne) => !ne.googleEventId || !googleEventIds.has(ne.googleEventId)
  );

  // 3. Combine, filter out invalid events, and sort
  const combined = [...filteredNativeEvents, ...googleEvents]
    .filter((e) => new Date(e.end).getTime() > new Date(e.start).getTime())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  let finalEvents = combined;
  if (input.todayOnly) {
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: todayTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    finalEvents = combined.filter((e) => {
      return getLocalDateStr(e.start, todayTimezone) === todayStr;
    });
  }

  if (input.maxResults && input.maxResults > 0) {
    return finalEvents.slice(0, input.maxResults);
  }

  return finalEvents;
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
  const prefs = await getUserPreferences(input.authUserId);
  const timezone = prefs?.timezone || "Asia/Kolkata";

  const startAt = parseLocalOrUtcDate(input.startIso, timezone);
  const endAt = parseLocalOrUtcDate(input.endIso, timezone);

  if (endAt <= startAt) {
    throw new Error("End time must be after start time");
  }

  const attendees = (input.attendeeEmails || []).map((email) => ({ email }));

  let googleEventId: string | undefined;

  // Optional: Sync to Google Calendar if requested & user has connected Google
  if (input.syncToGoogle) {
    const gcal = await googleCalendarForUser(input.authUserId);
    if (!gcal) {
      throw new Error("CONNECTION_REQUIRED: Google Calendar is not connected.");
    }
    try {
      const withMeet = input.addGoogleMeet !== false;
      const gResponse = await gcal.events.insert({
        calendarId: "primary",
        sendUpdates: "all",
        conferenceDataVersion: withMeet ? 1 : undefined,
        requestBody: {
          summary: input.title,
          description: input.description,
          location: input.location,
          start: { dateTime: input.startIso, timeZone: timezone },
          end: { dateTime: input.endIso, timeZone: timezone },
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
    } catch (err: any) {
      throw new Error(`Google Calendar API failed to sync meeting: ${err.message || err}`);
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
  const prefs = await getUserPreferences(input.authUserId);
  const timezone = prefs?.timezone || "Asia/Kolkata";

  if (input.eventId.startsWith("gcal-")) {
    const rawGcalId = input.eventId.replace("gcal-", "");
    const gcal = await googleCalendarForUser(input.authUserId);
    if (!gcal) {
      throw new Error("CONNECTION_REQUIRED: Google Calendar is not connected.");
    }

    try {
      const existing = await gcal.events.get({
        calendarId: "primary",
        eventId: rawGcalId,
      });

      const finalStart = input.startIso || existing.data.start?.dateTime || existing.data.start?.date;
      const finalEnd = input.endIso || existing.data.end?.dateTime || existing.data.end?.date;

      if (finalStart && finalEnd && parseLocalOrUtcDate(finalEnd, timezone).getTime() <= parseLocalOrUtcDate(finalStart, timezone).getTime()) {
        throw new Error("End time must be after start time");
      }

      const gResponse = await gcal.events.patch({
        calendarId: "primary",
        eventId: rawGcalId,
        requestBody: {
          summary: input.title !== undefined ? input.title : undefined,
          description: input.description !== undefined ? input.description : undefined,
          location: input.location !== undefined ? input.location : undefined,
          start: input.startIso ? { dateTime: input.startIso, timeZone: timezone } : undefined,
          end: input.endIso ? { dateTime: input.endIso, timeZone: timezone } : undefined,
        },
      });

      return formatGoogleEvent(gResponse.data);
    } catch (err: any) {
      throw new Error(`Google Calendar API failed to reschedule event: ${err.message || err}`);
    }
  }

  const updates: any = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.location !== undefined) updates.location = input.location;
  if (input.category !== undefined) updates.category = input.category;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.startIso !== undefined) updates.startAt = parseLocalOrUtcDate(input.startIso, timezone);
  if (input.endIso !== undefined) updates.endAt = parseLocalOrUtcDate(input.endIso, timezone);
  if (input.allDay !== undefined) updates.allDay = input.allDay;
  if (input.recurrence !== undefined) updates.recurrence = input.recurrence;
  if (input.remindMinutesBefore !== undefined) updates.remindMinutesBefore = input.remindMinutesBefore;
  if (input.ringtone !== undefined) updates.metadata = { ringtone: input.ringtone };
  if (input.attendees !== undefined) updates.attendees = input.attendees;

  if (updates.startAt || updates.endAt) {
    const existing = await getCalendarEventById(input.authUserId, input.eventId);
    if (!existing) {
      return null;
    }
    const finalStart = updates.startAt || new Date(existing.start_at);
    const finalEnd = updates.endAt || new Date(existing.end_at);
    if (finalEnd <= finalStart) {
      throw new Error("End time must be after start time");
    }
  }

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
      } else {
        throw new Error("CONNECTION_REQUIRED: Google Calendar connection exists but client initialization failed.");
      }
    } catch (err: any) {
      const is404 = err?.status === 404 || err?.code === 404 || (err?.message && err.message.toLowerCase().includes("not found"));
      if (!is404) {
        throw new Error(`Google Calendar API failed to delete event: ${err?.message || err}`);
      }
    }
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
