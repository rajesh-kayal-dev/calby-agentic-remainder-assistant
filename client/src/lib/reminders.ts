import { apiFetch } from "./api";
import { Reminder, ReminderStatus, RecurrenceType } from "./types";

export interface CreateReminderPayload {
  title: string;
  dueAt?: string;
  obligationType?: string;
  eventAt?: string;
  remindBefore?: {
    value: number;
    unit: "minutes" | "hours" | "days" | "weeks" | "months";
  };
  amount?: number;
  currency?: string;
  subject?: string;
  recipientId?: string;
  channel?: string;
  description?: string;
  timezone?: string;
  recurrence?: RecurrenceType;
}

export interface UpdateReminderPayload {
  title?: string;
  description?: string;
  obligationType?: string;
  eventAt?: string;
  remindBefore?: {
    value: number;
    unit: "minutes" | "hours" | "days" | "weeks" | "months";
  };
  amount?: number;
  currency?: string;
  subject?: string;
  recipientId?: string;
  channel?: string;
  dueAt?: string;
  status?: ReminderStatus;
  recurrence?: RecurrenceType;
}

export async function fetchReminders(
  token: string,
  status?: ReminderStatus,
): Promise<{ reminders: Reminder[] }> {
  const query = status ? `?status=${status}` : "";
  return apiFetch<{ reminders: Reminder[] }>(`/api/reminders${query}`, { token });
}

export async function fetchReminderById(
  token: string,
  id: string,
): Promise<{ reminder: Reminder }> {
  return apiFetch<{ reminder: Reminder }>(`/api/reminders/${id}`, { token });
}

export async function createReminderApi(
  token: string,
  payload: CreateReminderPayload,
): Promise<{ reminder: Reminder }> {
  return apiFetch<{ reminder: Reminder }>("/api/reminders", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateReminderApi(
  token: string,
  id: string,
  payload: UpdateReminderPayload,
): Promise<{ reminder: Reminder }> {
  return apiFetch<{ reminder: Reminder }>(`/api/reminders/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function pauseReminderApi(
  token: string,
  id: string,
): Promise<{ reminder: Reminder }> {
  return apiFetch<{ reminder: Reminder }>(`/api/reminders/${id}/pause`, {
    method: "PATCH",
    token,
  });
}

export async function resumeReminderApi(
  token: string,
  id: string,
): Promise<{ reminder: Reminder }> {
  return apiFetch<{ reminder: Reminder }>(`/api/reminders/${id}/resume`, {
    method: "PATCH",
    token,
  });
}

export async function deleteReminderApi(
  token: string,
  id: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/reminders/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchReminderChannelsApi(
  token: string,
): Promise<{ channels: { id: string; name: string; enabled: boolean; connected?: boolean }[] }> {
  return apiFetch<{ channels: { id: string; name: string; enabled: boolean; connected?: boolean }[] }>(
    "/api/reminders/channels",
    { token },
  );
}
