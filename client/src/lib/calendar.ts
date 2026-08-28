import { apiFetch } from "./api";

export type EventCategory = "work" | "meeting" | "personal" | "focus" | "other";
export type EventPriority = "low" | "medium" | "high" | "urgent";
export type EventRecurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarEventItem {
  id: string;
  authUserId?: string;
  title: string;
  description?: string | null;
  location?: string | null;
  category: EventCategory;
  priority: EventPriority;
  start: string; // ISO string
  end: string; // ISO string
  allDay?: boolean;
  recurrence?: EventRecurrence;
  remindMinutesBefore?: number | null;
  attendees?: Array<{ email?: string; name?: string }>;
  googleEventId?: string | null;
  source?: "calby" | "google";
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarSummaryDTO {
  todayEvents: CalendarEventItem[];
  pendingTasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    due_at?: string | null;
  }>;
  activeReminders: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: string;
    due_at: string;
    channel: string;
  }>;
}

export async function fetchCalendarEvents(
  token: string,
  options?: {
    start?: string;
    end?: string;
    category?: string;
    todayOnly?: boolean;
  },
): Promise<{ success: boolean; events: CalendarEventItem[] }> {
  try {
    const params = new URLSearchParams();
    if (options?.start) params.append("start", options.start);
    if (options?.end) params.append("end", options.end);
    if (options?.category && options.category !== "all") params.append("category", options.category);
    if (options?.todayOnly) params.append("todayOnly", "true");

    const query = params.toString() ? `?${params.toString()}` : "";
    return await apiFetch<{ success: boolean; events: CalendarEventItem[] }>(
      `/api/calendar/events${query}`,
      { token },
    );
  } catch (err: any) {
    return { success: false, events: [] };
  }
}

export async function createCalendarEventApi(
  token: string,
  data: {
    title: string;
    description?: string;
    location?: string;
    category?: EventCategory;
    priority?: EventPriority;
    start: string;
    end: string;
    allDay?: boolean;
    recurrence?: EventRecurrence;
    remindMinutesBefore?: number;
    ringtone?: string;
    attendees?: string[];
    addGoogleMeet?: boolean;
    syncToGoogle?: boolean;
  },
): Promise<{ success: boolean; event: CalendarEventItem }> {
  return await apiFetch<{ success: boolean; event: CalendarEventItem }>("/api/calendar/events", {
    method: "POST",
    token,
    body: data,
  });
}

export async function updateCalendarEventApi(
  token: string,
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    location: string | null;
    category: EventCategory;
    priority: EventPriority;
    start: string;
    end: string;
    allDay: boolean;
    recurrence: EventRecurrence;
    remindMinutesBefore: number | null;
    ringtone: string;
    attendees: Array<{ email?: string; name?: string }>;
  }>,
): Promise<{ success: boolean; event: CalendarEventItem }> {
  return await apiFetch<{ success: boolean; event: CalendarEventItem }>(`/api/calendar/events/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export async function deleteCalendarEventApi(
  token: string,
  id: string,
): Promise<{ success: boolean; cancelled: boolean; eventId: string }> {
  return await apiFetch<{ success: boolean; cancelled: boolean; eventId: string }>(
    `/api/calendar/events/${id}`,
    {
      method: "DELETE",
      token,
    },
  );
}

export async function fetchCalendarSummaryApi(
  token: string,
): Promise<{ success: boolean } & CalendarSummaryDTO> {
  try {
    return await apiFetch<{ success: boolean } & CalendarSummaryDTO>("/api/calendar/summary", {
      token,
    });
  } catch {
    return { success: false, todayEvents: [], pendingTasks: [], activeReminders: [] };
  }
}
