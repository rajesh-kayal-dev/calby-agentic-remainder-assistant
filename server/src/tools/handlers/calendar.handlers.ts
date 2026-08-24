import {
  listUpcomingMeetings,
  createMeeting,
  cancelMeeting,
  rescheduleMeeting,
  checkCalendarBusy,
} from "../../services/calendar.service.js";

export async function handleGetEvents(authUserId: string, input: any) {
  const events = await listUpcomingMeetings({
    authUserId,
    maxResults: input.maxResults ?? 10,
    todayOnly: input.todayOnly ?? false,
  });

  return {
    events,
    count: events.length,
  };
}

export async function handleFindFreeSlots(authUserId: string, input: any) {
  const startIso = input.startIso || new Date().toISOString();
  const endIso =
    input.endIso || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const busyData = await checkCalendarBusy({
    authUserId,
    startIso,
    endIso,
  });

  return {
    periodStart: startIso,
    periodEnd: endIso,
    busy: busyData.busy,
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
