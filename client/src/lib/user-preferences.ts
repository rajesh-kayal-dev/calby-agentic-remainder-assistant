import { apiFetch } from "./api";

export type UserNotificationPreferences = {
  dailyBriefing: boolean;
  eventReminder: boolean;
  reminderMinutes: number;
};

export type AlertSoundOption =
  | "calby_bell"
  | "classic_alarm"
  | "soft_chime"
  | "digital"
  | "gentle_reminder"
  | "silent";

export type UserPreferencesData = {
  theme: "dark" | "midnight" | "system";
  defaultCalendarId: string;
  timezone: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  notifications: UserNotificationPreferences;

  // Alert Settings
  alertsEnabled?: boolean;
  alertCalendar?: boolean;
  alertTasks?: boolean;
  alertFollowups?: boolean;
  defaultReminderMinutes?: number;
  alertSound?: AlertSoundOption | string;
  alertVolume?: number;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
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
