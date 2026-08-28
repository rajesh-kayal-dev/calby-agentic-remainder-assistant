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
  alerts_enabled: boolean;
  alert_calendar: boolean;
  alert_tasks: boolean;
  alert_followups: boolean;
  default_reminder_minutes: number;
  alert_sound: string;
  alert_volume: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
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
  alertsEnabled?: boolean;
  alertCalendar?: boolean;
  alertTasks?: boolean;
  alertFollowups?: boolean;
  defaultReminderMinutes?: number;
  alertSound?: string;
  alertVolume?: number;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
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

  const alertsEnabled = input.alertsEnabled ?? existing?.alerts_enabled ?? true;
  const alertCalendar = input.alertCalendar ?? existing?.alert_calendar ?? true;
  const alertTasks = input.alertTasks ?? existing?.alert_tasks ?? true;
  const alertFollowups = input.alertFollowups ?? existing?.alert_followups ?? true;
  const defaultReminderMinutes = input.defaultReminderMinutes ?? existing?.default_reminder_minutes ?? 15;
  const alertSound = input.alertSound ?? existing?.alert_sound ?? "calby_bell";
  const alertVolume = input.alertVolume ?? existing?.alert_volume ?? 70;
  const quietHoursEnabled = input.quietHoursEnabled ?? existing?.quiet_hours_enabled ?? false;
  const quietHoursStart = input.quietHoursStart ?? existing?.quiet_hours_start ?? "22:00";
  const quietHoursEnd = input.quietHoursEnd ?? existing?.quiet_hours_end ?? "07:00";

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
      alerts_enabled,
      alert_calendar,
      alert_tasks,
      alert_followups,
      default_reminder_minutes,
      alert_sound,
      alert_volume,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
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
      alerts_enabled = EXCLUDED.alerts_enabled,
      alert_calendar = EXCLUDED.alert_calendar,
      alert_tasks = EXCLUDED.alert_tasks,
      alert_followups = EXCLUDED.alert_followups,
      default_reminder_minutes = EXCLUDED.default_reminder_minutes,
      alert_sound = EXCLUDED.alert_sound,
      alert_volume = EXCLUDED.alert_volume,
      quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
      quiet_hours_start = EXCLUDED.quiet_hours_start,
      quiet_hours_end = EXCLUDED.quiet_hours_end,
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
      alertsEnabled,
      alertCalendar,
      alertTasks,
      alertFollowups,
      defaultReminderMinutes,
      alertSound,
      alertVolume,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
    ],
  );

  return result.rows[0];
}
