import { getPool } from "../db/pool.js";

export interface CalendarEventRow {
  id: string;
  auth_user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  category: "work" | "meeting" | "personal" | "focus" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  start_at: Date;
  end_at: Date;
  all_day: boolean;
  recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly";
  remind_minutes_before: number | null;
  attendees: Array<{ email?: string; name?: string }>;
  google_event_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CalendarEventDTO {
  id: string;
  authUserId: string;
  title: string;
  description: string | null;
  location: string | null;
  category: "work" | "meeting" | "personal" | "focus" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  start: string;
  end: string;
  allDay: boolean;
  recurrence: string;
  remindMinutesBefore: number | null;
  attendees: Array<{ email?: string; name?: string }>;
  googleEventId: string | null;
  source: "calby" | "google";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function sanitizeCalendarEvent(row: CalendarEventRow): CalendarEventDTO {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    title: row.title,
    description: row.description,
    location: row.location,
    category: row.category,
    priority: row.priority,
    start: row.start_at.toISOString(),
    end: row.end_at.toISOString(),
    allDay: row.all_day,
    recurrence: row.recurrence,
    remindMinutesBefore: row.remind_minutes_before,
    attendees: Array.isArray(row.attendees) ? row.attendees : [],
    googleEventId: row.google_event_id,
    source: "calby",
    metadata: row.metadata || {},
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getCalendarEventsForUser(
  authUserId: string,
  options?: {
    startIso?: string;
    endIso?: string;
    category?: string;
  },
): Promise<CalendarEventDTO[]> {
  const conditions: string[] = ["auth_user_id = $1"];
  const params: any[] = [authUserId];
  let paramIdx = 2;

  if (options?.startIso) {
    conditions.push(`end_at >= $${paramIdx++}`);
    params.push(new Date(options.startIso));
  }

  if (options?.endIso) {
    conditions.push(`start_at <= $${paramIdx++}`);
    params.push(new Date(options.endIso));
  }

  if (options?.category && options.category !== "all") {
    conditions.push(`category = $${paramIdx++}`);
    params.push(options.category);
  }

  const query = `
    SELECT * FROM calendar_events
    WHERE ${conditions.join(" AND ")}
    ORDER BY start_at ASC
  `;

  const result = await getPool().query<CalendarEventRow>(query, params);
  return result.rows.map(sanitizeCalendarEvent);
}

export async function getCalendarEventById(
  authUserId: string,
  eventId: string,
): Promise<CalendarEventRow | null> {
  const result = await getPool().query<CalendarEventRow>(
    `SELECT * FROM calendar_events WHERE id = $1 AND auth_user_id = $2`,
    [eventId, authUserId],
  );
  return result.rows[0] || null;
}

export async function createCalendarEvent(input: {
  authUserId: string;
  title: string;
  description?: string;
  location?: string;
  category?: "work" | "meeting" | "personal" | "focus" | "other";
  priority?: "low" | "medium" | "high" | "urgent";
  startAt: Date;
  endAt: Date;
  allDay?: boolean;
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  remindMinutesBefore?: number | null;
  attendees?: Array<{ email?: string; name?: string }>;
  googleEventId?: string;
  metadata?: Record<string, unknown>;
}): Promise<CalendarEventDTO> {
  const result = await getPool().query<CalendarEventRow>(
    `
    INSERT INTO calendar_events (
      auth_user_id,
      title,
      description,
      location,
      category,
      priority,
      start_at,
      end_at,
      all_day,
      recurrence,
      remind_minutes_before,
      attendees,
      google_event_id,
      metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    )
    RETURNING *
    `,
    [
      input.authUserId,
      input.title,
      input.description || null,
      input.location || null,
      input.category || "work",
      input.priority || "medium",
      input.startAt,
      input.endAt,
      input.allDay ?? false,
      input.recurrence || "none",
      input.remindMinutesBefore ?? 15,
      JSON.stringify(input.attendees || []),
      input.googleEventId || null,
      JSON.stringify(input.metadata || {}),
    ],
  );

  return sanitizeCalendarEvent(result.rows[0]);
}

export async function updateCalendarEvent(
  authUserId: string,
  eventId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    location: string | null;
    category: "work" | "meeting" | "personal" | "focus" | "other";
    priority: "low" | "medium" | "high" | "urgent";
    startAt: Date;
    endAt: Date;
    allDay: boolean;
    recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly";
    remindMinutesBefore: number | null;
    attendees: Array<{ email?: string; name?: string }>;
    googleEventId: string | null;
    metadata: Record<string, unknown>;
  }>,
): Promise<CalendarEventDTO | null> {
  const existing = await getCalendarEventById(authUserId, eventId);
  if (!existing) return null;

  const setClauses: string[] = ["updated_at = NOW()"];
  const params: any[] = [eventId, authUserId];
  let paramIdx = 3;

  if (updates.title !== undefined) {
    setClauses.push(`title = $${paramIdx++}`);
    params.push(updates.title);
  }
  if (updates.description !== undefined) {
    setClauses.push(`description = $${paramIdx++}`);
    params.push(updates.description);
  }
  if (updates.location !== undefined) {
    setClauses.push(`location = $${paramIdx++}`);
    params.push(updates.location);
  }
  if (updates.category !== undefined) {
    setClauses.push(`category = $${paramIdx++}`);
    params.push(updates.category);
  }
  if (updates.priority !== undefined) {
    setClauses.push(`priority = $${paramIdx++}`);
    params.push(updates.priority);
  }
  if (updates.startAt !== undefined) {
    setClauses.push(`start_at = $${paramIdx++}`);
    params.push(updates.startAt);
  }
  if (updates.endAt !== undefined) {
    setClauses.push(`end_at = $${paramIdx++}`);
    params.push(updates.endAt);
  }
  if (updates.allDay !== undefined) {
    setClauses.push(`all_day = $${paramIdx++}`);
    params.push(updates.allDay);
  }
  if (updates.recurrence !== undefined) {
    setClauses.push(`recurrence = $${paramIdx++}`);
    params.push(updates.recurrence);
  }
  if (updates.remindMinutesBefore !== undefined) {
    setClauses.push(`remind_minutes_before = $${paramIdx++}`);
    params.push(updates.remindMinutesBefore);
  }
  if (updates.attendees !== undefined) {
    setClauses.push(`attendees = $${paramIdx++}`);
    params.push(JSON.stringify(updates.attendees));
  }
  if (updates.googleEventId !== undefined) {
    setClauses.push(`google_event_id = $${paramIdx++}`);
    params.push(updates.googleEventId);
  }
  if (updates.metadata !== undefined) {
    setClauses.push(`metadata = $${paramIdx++}`);
    params.push(JSON.stringify(updates.metadata));
  }

  const query = `
    UPDATE calendar_events
    SET ${setClauses.join(", ")}
    WHERE id = $1 AND auth_user_id = $2
    RETURNING *
  `;

  const result = await getPool().query<CalendarEventRow>(query, params);
  return result.rows[0] ? sanitizeCalendarEvent(result.rows[0]) : null;
}

export async function deleteCalendarEvent(
  authUserId: string,
  eventId: string,
): Promise<boolean> {
  const result = await getPool().query(
    `DELETE FROM calendar_events WHERE id = $1 AND auth_user_id = $2`,
    [eventId, authUserId],
  );
  return (result.rowCount ?? 0) > 0;
}
