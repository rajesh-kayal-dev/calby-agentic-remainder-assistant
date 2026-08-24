import { getPool } from "../db/pool.js";

export type UserPreferencesRow = {
  id: string;
  auth_user_id: string;
  theme: string;
  default_calendar_id: string;
  timezone: string;
  date_format: string;
  time_format: string;
  daily_briefing: boolean;
  event_reminder: boolean;
  reminder_minutes: number;
  created_at: Date;
  updated_at: Date;
};

export type UserPreferencesInput = {
  theme?: string;
  defaultCalendarId?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  dailyBriefing?: boolean;
  eventReminder?: boolean;
  reminderMinutes?: number;
};

export async function getUserPreferences(authUserId: string): Promise<UserPreferencesRow | null> {
  const result = await getPool().query<UserPreferencesRow>(
    `SELECT * FROM user_preferences WHERE auth_user_id = $1`,
    [authUserId],
  );
  return result.rows[0] || null;
}

export async function upsertUserPreferences(
  authUserId: string,
  input: UserPreferencesInput,
): Promise<UserPreferencesRow> {
  const existing = await getUserPreferences(authUserId);

  const theme = input.theme ?? existing?.theme ?? "dark";
  const defaultCalendarId = input.defaultCalendarId ?? existing?.default_calendar_id ?? "primary";
  const timezone = input.timezone ?? existing?.timezone ?? "UTC";
  const dateFormat = input.dateFormat ?? existing?.date_format ?? "DD/MM/YYYY";
  const timeFormat = input.timeFormat ?? existing?.time_format ?? "24h";
  const dailyBriefing = input.dailyBriefing ?? existing?.daily_briefing ?? true;
  const eventReminder = input.eventReminder ?? existing?.event_reminder ?? true;
  const reminderMinutes = input.reminderMinutes ?? existing?.reminder_minutes ?? 10;

  const result = await getPool().query<UserPreferencesRow>(
    `
    INSERT INTO user_preferences (
      auth_user_id,
      theme,
      default_calendar_id,
      timezone,
      date_format,
      time_format,
      daily_briefing,
      event_reminder,
      reminder_minutes,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (auth_user_id)
    DO UPDATE SET
      theme = EXCLUDED.theme,
      default_calendar_id = EXCLUDED.default_calendar_id,
      timezone = EXCLUDED.timezone,
      date_format = EXCLUDED.date_format,
      time_format = EXCLUDED.time_format,
      daily_briefing = EXCLUDED.daily_briefing,
      event_reminder = EXCLUDED.event_reminder,
      reminder_minutes = EXCLUDED.reminder_minutes,
      updated_at = NOW()
    RETURNING *
    `,
    [
      authUserId,
      theme,
      defaultCalendarId,
      timezone,
      dateFormat,
      timeFormat,
      dailyBriefing,
      eventReminder,
      reminderMinutes,
    ],
  );

  return result.rows[0];
}
