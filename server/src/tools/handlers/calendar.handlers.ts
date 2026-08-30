import {
  listUpcomingMeetings,
  createMeeting,
  cancelMeeting,
  rescheduleMeeting,
  checkCalendarBusy,
  getTimezoneOffset,
} from "../../services/calendar.service.js";
import { getUserPreferences } from "../../repositories/preferences.repository.js";

function formatToLocalTime(isoStr: string, timezone: string, allDay?: boolean): string {
  try {
    if (allDay) {
      const d = new Date(isoStr.endsWith("Z") ? isoStr : isoStr + "Z");
      return d.toLocaleDateString("en-US", {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    let d: Date;
    if (isoStr.endsWith("Z")) {
      // Parse as UTC
      d = new Date(isoStr);
    } else {
      // Parse as timezone-naive local time in timezone
      const naiveDate = new Date(isoStr + "Z");
      const offsetMs = getTimezoneOffset(timezone, naiveDate);
      d = new Date(naiveDate.getTime() - offsetMs);
    }

    return d.toLocaleString("en-US", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}

function getLocalDatePart(isoStr: string, timezone: string): string {
  try {
    let d: Date;
    if (isoStr.endsWith("Z")) {
      d = new Date(isoStr);
    } else {
      const naiveDate = new Date(isoStr.endsWith("Z") ? isoStr : isoStr + "Z");
      const offsetMs = getTimezoneOffset(timezone, naiveDate);
      d = new Date(naiveDate.getTime() - offsetMs);
    }
    return d.toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoStr;
  }
}

function getLocalTimePart(isoStr: string, timezone: string, allDay?: boolean): string {
  if (allDay) return "All Day";
  try {
    let d: Date;
    if (isoStr.endsWith("Z")) {
      d = new Date(isoStr);
    } else {
      const naiveDate = new Date(isoStr.endsWith("Z") ? isoStr : isoStr + "Z");
      const offsetMs = getTimezoneOffset(timezone, naiveDate);
      d = new Date(naiveDate.getTime() - offsetMs);
    }
    return d.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}

export async function handleGetEvents(authUserId: string, input: any) {
  const events = await listUpcomingMeetings({
    authUserId,
    maxResults: input.maxResults ?? 10,
    todayOnly: input.todayOnly ?? false,
  });

  const prefs = await getUserPreferences(authUserId);
  let timezone = prefs?.timezone || "Asia/Kolkata";
  if (timezone === "Asia/Calcutta") timezone = "Asia/Kolkata";

  // Sort events by start time (ISO strings) before formatting
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const formattedEvents = events.map((e) => {
    const date = getLocalDatePart(e.start, timezone);
    const startTime = getLocalTimePart(e.start, timezone, e.allDay);
    const endTime = getLocalTimePart(e.end, timezone, e.allDay);

    return {
      ...e,
      start: formatToLocalTime(e.start, timezone, e.allDay),
      end: formatToLocalTime(e.end, timezone, e.allDay),
      date,
      startTime,
      endTime,
      timezone,
    };
  });

  return {
    events: formattedEvents,
    count: formattedEvents.length,
    timezone,
  };
}

export async function handleFindFreeSlots(authUserId: string, input: any) {
  const prefs = await getUserPreferences(authUserId);
  let timezone = prefs?.timezone || "Asia/Kolkata";
  if (timezone === "Asia/Calcutta") timezone = "Asia/Kolkata";

  const startIso = input.startIso || new Date().toISOString();
  const endIso =
    input.endIso || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const busyData = await checkCalendarBusy({
    authUserId,
    startIso,
    endIso,
  });

  // Sort busy slots
  const busySorted = [...busyData.busy].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const busyLocal = busySorted.map((b) => ({
    ...b,
    start: formatToLocalTime(b.start, timezone),
    end: formatToLocalTime(b.end, timezone),
  }));

  return {
    periodStart: formatToLocalTime(startIso, timezone),
    periodEnd: formatToLocalTime(endIso, timezone),
    busy: busyLocal,
    timezone,
  };
}

export async function handleCreateEvent(authUserId: string, input: any) {
  const event = await createMeeting({
    authUserId,
    title: input.title || "New Event",
    startIso: input.startIso,
    endIso: input.endIso,
    attendeeEmails: input.attendees || [],
    description: input.description,
    addGoogleMeet: input.addGoogleMeet ?? true,
  });

  return event;
}

export async function handleUpdateEvent(authUserId: string, input: any) {
  const updated = await rescheduleMeeting({
    authUserId,
    eventId: input.eventId,
    startIso: input.startIso,
    endIso: input.endIso,
  });

  return updated;
}

export async function handleDeleteEvent(authUserId: string, input: any) {
  const result = await cancelMeeting({
    authUserId,
    eventId: input.eventId,
  });

  return result;
}
