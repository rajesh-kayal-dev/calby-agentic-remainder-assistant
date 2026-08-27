import { getPool } from "../db/pool.js";
import { ReportType } from "../services/reports/report.types.js";

export interface ScheduledReportRow {
  id: string;
  auth_user_id: string;
  recipient_id: string | null;
  report_type: string;
  report_parameters: Record<string, any>;
  channel: string;
  schedule_definition: {
    frequency: "daily" | "weekly" | "monthly";
    timeOfDay?: string; // HH:mm
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  timezone: string;
  enabled: boolean;
  next_run_at: string; // ISO timestamp
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateScheduledReportInput = Omit<
  ScheduledReportRow,
  "id" | "created_at" | "updated_at" | "last_run_at"
>;

export async function createScheduledReport(
  authUserId: string,
  data: Omit<CreateScheduledReportInput, "auth_user_id">
): Promise<ScheduledReportRow> {
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO scheduled_reports (
        auth_user_id, recipient_id, report_type, report_parameters,
        channel, schedule_definition, timezone, enabled, next_run_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      authUserId,
      data.recipient_id,
      data.report_type,
      JSON.stringify(data.report_parameters),
      data.channel,
      JSON.stringify(data.schedule_definition),
      data.timezone,
      data.enabled,
      data.next_run_at,
    ]
  );

  const row = result.rows[0] as ScheduledReportRow;
  if (typeof row.schedule_definition === "string") {
    row.schedule_definition = JSON.parse(row.schedule_definition);
  }
  if (typeof row.report_parameters === "string") {
    row.report_parameters = JSON.parse(row.report_parameters);
  }
  return row;
}

export async function listScheduledReports(
  authUserId: string
): Promise<ScheduledReportRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM scheduled_reports WHERE auth_user_id = $1 ORDER BY created_at DESC`,
    [authUserId]
  );

  return result.rows.map((row) => {
    if (typeof row.schedule_definition === "string") {
      row.schedule_definition = JSON.parse(row.schedule_definition);
    }
    if (typeof row.report_parameters === "string") {
      row.report_parameters = JSON.parse(row.report_parameters);
    }
    return row as ScheduledReportRow;
  });
}

export async function updateScheduledReport(
  authUserId: string,
  id: string,
  updates: Partial<Pick<ScheduledReportRow, "enabled" | "next_run_at" | "schedule_definition">>
): Promise<ScheduledReportRow | null> {
  const pool = getPool();
  const sets: string[] = [];
  const args: any[] = [id, authUserId];
  let idx = 3;

  if (updates.enabled !== undefined) {
    sets.push(`enabled = $${idx++}`);
    args.push(updates.enabled);
  }
  if (updates.next_run_at !== undefined) {
    sets.push(`next_run_at = $${idx++}`);
    args.push(updates.next_run_at);
  }
  if (updates.schedule_definition !== undefined) {
    sets.push(`schedule_definition = $${idx++}`);
    args.push(JSON.stringify(updates.schedule_definition));
  }

  if (sets.length === 0) return null;
  sets.push(`updated_at = NOW()`);

  const result = await pool.query(
    `
      UPDATE scheduled_reports
      SET ${sets.join(", ")}
      WHERE id = $1 AND auth_user_id = $2
      RETURNING *
    `,
    args
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0] as ScheduledReportRow;
  if (typeof row.schedule_definition === "string") row.schedule_definition = JSON.parse(row.schedule_definition);
  if (typeof row.report_parameters === "string") row.report_parameters = JSON.parse(row.report_parameters);
  return row;
}

export async function deleteScheduledReport(authUserId: string, id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM scheduled_reports WHERE id = $1 AND auth_user_id = $2 RETURNING id`,
    [id, authUserId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function getDueScheduledReports(now: Date): Promise<ScheduledReportRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT * FROM scheduled_reports
      WHERE enabled = true AND next_run_at <= $1
      ORDER BY next_run_at ASC
    `,
    [now.toISOString()]
  );
  return result.rows.map((row) => {
    if (typeof row.schedule_definition === "string") row.schedule_definition = JSON.parse(row.schedule_definition);
    if (typeof row.report_parameters === "string") row.report_parameters = JSON.parse(row.report_parameters);
    return row as ScheduledReportRow;
  });
}

export async function markScheduledReportRun(id: string, lastRunAt: Date, nextRunAt: Date): Promise<void> {
  const pool = getPool();
  await pool.query(
    `
      UPDATE scheduled_reports
      SET last_run_at = $1, next_run_at = $2, updated_at = NOW()
      WHERE id = $3
    `,
    [lastRunAt.toISOString(), nextRunAt.toISOString(), id]
  );
}
export async function getScheduledReportById(authUserId: string, id: string): Promise<ScheduledReportRow | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM scheduled_reports WHERE id = $1 AND auth_user_id = $2`,
    [id, authUserId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as ScheduledReportRow;
  if (typeof row.schedule_definition === "string") row.schedule_definition = JSON.parse(row.schedule_definition);
  if (typeof row.report_parameters === "string") row.report_parameters = JSON.parse(row.report_parameters);
  return row;
}
