import { apiFetch } from "./api";

export type UserNotificationPreferences = {
  dailyBriefing: boolean;
  eventReminder: boolean;
  reminderMinutes: number;
};

export type UserPreferencesData = {
  theme: "dark" | "midnight" | "system";
  defaultCalendarId: string;
  timezone: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  notifications: UserNotificationPreferences;
};

export type ConnectedCalendarItem = {
  id: string;
  name: string;
  account?: string;
  primary?: boolean;
};

export type FetchPreferencesResponse = {
  success: boolean;
  preferences: UserPreferencesData;
  calendars: ConnectedCalendarItem[];
};

export async function fetchUserPreferences(token: string): Promise<FetchPreferencesResponse> {
  return await apiFetch<FetchPreferencesResponse>("/api/user/preferences", {
    token,
  });
}

export async function updateUserPreferences(
  token: string,
  newPrefs: Partial<UserPreferencesData>,
): Promise<UserPreferencesData> {
  const res = await apiFetch<{ success: boolean; preferences: UserPreferencesData }>(
    "/api/user/preferences",
    {
      method: "PATCH",
      token,
      body: newPrefs,
    },
  );
  return res.preferences;
}
