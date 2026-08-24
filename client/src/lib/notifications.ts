import { apiFetch } from "./api";

export type NotificationType =
  | "CALENDAR_REMINDER"
  | "CALENDAR_CONNECTED"
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "EVENT_CANCELLED"
  | "AI_PROVIDER_UPDATED"
  | "SECURITY"
  | "SYSTEM";

export type NotificationItem = {
  id: string;
  authUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type FetchNotificationsResponse = {
  success: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
};

export async function fetchNotifications(token: string): Promise<FetchNotificationsResponse> {
  return await apiFetch<FetchNotificationsResponse>("/api/notifications", {
    token,
  });
}

export async function markNotificationRead(
  token: string,
  id: string,
): Promise<{ unreadCount: number }> {
  return await apiFetch<{ success: boolean; unreadCount: number }>(`/api/notifications/${id}/read`, {
    method: "PATCH",
    token,
  });
}

export async function markAllNotificationsRead(token: string): Promise<{ unreadCount: number }> {
  return await apiFetch<{ success: boolean; unreadCount: number }>("/api/notifications/read-all", {
    method: "POST",
    token,
  });
}

export async function deleteNotificationApi(
  token: string,
  id: string,
): Promise<{ unreadCount: number }> {
  return await apiFetch<{ success: boolean; unreadCount: number }>(`/api/notifications/${id}`, {
    method: "DELETE",
    token,
  });
}
