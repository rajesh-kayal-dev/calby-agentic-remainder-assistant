import { getPool } from "../db/pool.js";

export type ReminderStatus = "active" | "paused" | "completed" | "cancelled";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type DeliveryStatus = "pending" | "processing" | "sent" | "failed" | "cancelled";

export type ReminderRow = {
  id: string;
  auth_user_id: string;
  recipient_id?: string | null;
  recipient_name?: string | null;
  title: string;
  description: string | null;
  obligation_type: string;
  obligation_metadata: Record<string, unknown> | null;
  status: ReminderStatus;
  timezone: string;
  due_at: Date;
  next_run_at: Date;
  recurrence: RecurrenceType | null;
  channel: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type NotificationDeliveryRow = {
  id: string;
  reminder_id: string | null;
  auth_user_id: string;
  channel: string;
  status: DeliveryStatus;
  scheduled_at: Date;
  delivered_at: Date | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
};

export async function createReminderInDb(input: {
  authUserId: string;
  recipientId?: string | null;
  title: string;
  description?: string;
  obligationType?: string;
  obligationMetadata?: Record<string, unknown>;
  timezone?: string;
  dueAt: Date;
  nextRunAt?: Date;
  recurrence?: RecurrenceType;
  channel?: string;
  metadata?: Record<string, unknown>;
}): Promise<ReminderRow> {
  const result = await getPool().query<ReminderRow>(
    `
    INSERT INTO reminders (
      auth_user_id,
      recipient_id,
      title,
      description,
      obligation_type,
      obligation_metadata,
      timezone,
      due_at,
      next_run_at,
      recurrence,
      channel,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
    `,
    [
      input.authUserId,
      input.recipientId || null,
      input.title,
      input.description || null,
      input.obligationType || "custom",
      JSON.stringify(input.obligationMetadata || {}),
      input.timezone || "Asia/Kolkata",
      input.dueAt,
      input.nextRunAt || input.dueAt,
      input.recurrence || "none",
      input.channel || "in_app",
      JSON.stringify(input.metadata || {}),
    ],
  );

  return result.rows[0];
}

export async function getUserRemindersFromDb(
  authUserId: string,
  status?: ReminderStatus,
  limit = 50,
): Promise<ReminderRow[]> {
  if (status) {
    const res = await getPool().query<ReminderRow>(
      `
      SELECT r.*, c.name AS recipient_name
      FROM reminders r
      LEFT JOIN contacts c ON r.recipient_id = c.id
      WHERE r.auth_user_id = $1 AND r.status = $2
      ORDER BY r.due_at ASC
      LIMIT $3
      `,
      [authUserId, status, limit],
    );
    return res.rows;
  }

  const res = await getPool().query<ReminderRow>(
    `
    SELECT r.*, c.name AS recipient_name
    FROM reminders r
    LEFT JOIN contacts c ON r.recipient_id = c.id
    WHERE r.auth_user_id = $1
    ORDER BY r.due_at ASC
    LIMIT $2
    `,
    [authUserId, limit],
  );
  return res.rows;
}

export async function getReminderByIdFromDb(
  authUserId: string,
  reminderId: string,
): Promise<ReminderRow | null> {
  const res = await getPool().query<ReminderRow>(
    `
    SELECT r.*, c.name AS recipient_name
    FROM reminders r
    LEFT JOIN contacts c ON r.recipient_id = c.id
    WHERE r.id = $1 AND r.auth_user_id = $2
    `,
    [reminderId, authUserId],
  );
  return res.rows[0] || null;
}

export async function updateReminderInDb(
  authUserId: string,
  reminderId: string,
  updates: {
    title?: string;
    description?: string;
    status?: ReminderStatus;
    dueAt?: Date;
    nextRunAt?: Date;
    recurrence?: RecurrenceType;
    metadata?: Record<string, unknown>;
  },
): Promise<ReminderRow | null> {
  const res = await getPool().query<ReminderRow>(
    `
    UPDATE reminders
    SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      status = COALESCE($3, status),
      due_at = COALESCE($4, due_at),
      next_run_at = COALESCE($5, next_run_at),
      recurrence = COALESCE($6, recurrence),
      metadata = CASE WHEN $7::boolean THEN $8::jsonb ELSE metadata END,
      updated_at = NOW()
    WHERE id = $9 AND auth_user_id = $10
    RETURNING *
    `,
    [
      updates.title ?? null,
      updates.description ?? null,
      updates.status ?? null,
      updates.dueAt ?? null,
      updates.nextRunAt ?? null,
      updates.recurrence ?? null,
      updates.metadata !== undefined,
      updates.metadata ? JSON.stringify(updates.metadata) : null,
      reminderId,
      authUserId,
    ],
  );

  return res.rows[0] || null;
}

export async function deleteReminderFromDb(
  authUserId: string,
  reminderId: string,
): Promise<boolean> {
  const res = await getPool().query(
    `
    DELETE FROM reminders
    WHERE id = $1 AND auth_user_id = $2
    `,
    [reminderId, authUserId],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function getDueRemindersFromDb(
  now: Date = new Date(),
  limit = 50,
): Promise<ReminderRow[]> {
  const res = await getPool().query<ReminderRow>(
    `
    SELECT * FROM reminders
    WHERE status = 'active' AND next_run_at <= $1
    ORDER BY next_run_at ASC
    LIMIT $2
    `,
    [now, limit],
  );
  return res.rows;
}

export async function createNotificationDeliveryInDb(input: {
  reminderId?: string;
  authUserId: string;
  channel?: string;
  status?: DeliveryStatus;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}): Promise<NotificationDeliveryRow> {
  const res = await getPool().query<NotificationDeliveryRow>(
    `
    INSERT INTO notification_deliveries (
      reminder_id,
      auth_user_id,
      channel,
      status,
      scheduled_at,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (reminder_id, scheduled_at) DO NOTHING
    RETURNING *
    `,
    [
      input.reminderId || null,
      input.authUserId,
      input.channel || "in_app",
      input.status || "pending",
      input.scheduledAt || new Date(),
      JSON.stringify(input.metadata || {}),
    ],
  );
  return res.rows[0];
}

export async function createDeliveryIfNotExists(
  reminder: ReminderRow,
): Promise<NotificationDeliveryRow | null> {
  const res = await getPool().query<NotificationDeliveryRow>(
    `
    INSERT INTO notification_deliveries (
      reminder_id,
      auth_user_id,
      channel,
      status,
      scheduled_at,
      metadata
    )
    VALUES ($1, $2, $3, 'pending', $4, $5)
    ON CONFLICT (reminder_id, scheduled_at) DO NOTHING
    RETURNING *
    `,
    [
      reminder.id,
      reminder.auth_user_id,
      reminder.channel,
      reminder.next_run_at,
      JSON.stringify(reminder.metadata || {}),
    ],
  );
  return res.rows[0] || null;
}

export async function claimPendingDeliveries(
  batchSize = 25,
  lockToken: string,
): Promise<NotificationDeliveryRow[]> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const selectRes = await client.query<{ id: string }>(
      `
      SELECT id FROM notification_deliveries
      WHERE (status = 'pending' OR status = 'failed')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        AND attempt_count < 3
      ORDER BY scheduled_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
      `,
      [batchSize],
    );

    if (selectRes.rows.length === 0) {
      await client.query("COMMIT");
      return [];
    }

    const ids = selectRes.rows.map((r) => r.id);

    const updateRes = await client.query<NotificationDeliveryRow>(
      `
      UPDATE notification_deliveries
      SET
        status = 'processing',
        locked_at = NOW(),
        lock_token = $1,
        attempt_count = attempt_count + 1
      WHERE id = ANY($2::uuid[])
      RETURNING *
      `,
      [lockToken, ids],
    );

    await client.query("COMMIT");
    return updateRes.rows;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function recoverStaleDeliveries(
  leaseTimeoutMs = 60000,
  maxAttempts = 3,
): Promise<number> {
  const cutoff = new Date(Date.now() - leaseTimeoutMs);
  const res = await getPool().query(
    `
    UPDATE notification_deliveries
    SET
      status = CASE WHEN attempt_count >= $1 THEN 'failed' ELSE 'pending' END,
      locked_at = NULL,
      lock_token = NULL,
      error_message = CASE WHEN attempt_count >= $1 THEN 'Max attempts exceeded due to stale worker lock timeout' ELSE error_message END
    WHERE status = 'processing' AND locked_at < $2
    `,
    [maxAttempts, cutoff],
  );
  return res.rowCount ?? 0;
}

export async function recordDeliveryResult(
  deliveryId: string,
  success: boolean,
  errorMessage?: string,
  maxAttempts = 3,
  baseBackoffMs = 30000,
): Promise<NotificationDeliveryRow | null> {
  if (success) {
    const res = await getPool().query<NotificationDeliveryRow>(
      `
      UPDATE notification_deliveries
      SET
        status = 'sent',
        delivered_at = NOW(),
        locked_at = NULL,
        lock_token = NULL,
        error_message = NULL
      WHERE id = $1
      RETURNING *
      `,
      [deliveryId],
    );
    return res.rows[0] || null;
  }

  const current = await getPool().query<{ attempt_count: number }>(
    `SELECT attempt_count FROM notification_deliveries WHERE id = $1`,
    [deliveryId],
  );

  const attempts = current.rows[0]?.attempt_count || 1;
  const isFinal = attempts >= maxAttempts;
  const backoff = Math.pow(2, attempts - 1) * baseBackoffMs;
  const nextRetry = isFinal ? null : new Date(Date.now() + backoff);

  const res = await getPool().query<NotificationDeliveryRow>(
    `
    UPDATE notification_deliveries
    SET
      status = 'failed',
      locked_at = NULL,
      lock_token = NULL,
      error_message = $1,
      next_retry_at = $2
    WHERE id = $3
    RETURNING *
    `,
    [errorMessage || "Delivery failed", nextRetry, deliveryId],
  );
  return res.rows[0] || null;
}

export async function updateNotificationDeliveryInDb(
  deliveryId: string,
  updates: {
    status?: DeliveryStatus;
    deliveredAt?: Date;
    errorMessage?: string;
  },
): Promise<NotificationDeliveryRow | null> {
  const res = await getPool().query<NotificationDeliveryRow>(
    `
    UPDATE notification_deliveries
    SET
      status = COALESCE($1, status),
      delivered_at = COALESCE($2, delivered_at),
      error_message = COALESCE($3, error_message)
    WHERE id = $4
    RETURNING *
    `,
    [
      updates.status ?? null,
      updates.deliveredAt ?? null,
      updates.errorMessage ?? null,
      deliveryId,
    ],
  );
  return res.rows[0] || null;
}

export async function updateWhatsAppDeliveryStatusByProviderMessageId(input: {
  providerMessageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  errorMessage?: string;
}): Promise<boolean> {
  const { providerMessageId, status, errorMessage } = input;

  const res = await getPool().query(
    `
    UPDATE notification_deliveries
    SET
      whatsapp_status = $1,
      status = CASE
        WHEN $1 = 'failed' THEN 'failed'
        WHEN $1 IN ('delivered', 'read') THEN 'sent'
        ELSE status
      END,
      delivered_at = CASE
        WHEN $1 IN ('delivered', 'read') THEN COALESCE(delivered_at, NOW())
        ELSE delivered_at
      END,
      error_message = CASE
        WHEN $1 = 'failed' THEN COALESCE($2, error_message, 'WhatsApp delivery failed')
        ELSE error_message
      END
    WHERE provider_message_id = $3
       OR metadata->>'providerMessageId' = $3
    `,
    [status, errorMessage || null, providerMessageId],
  );

  return (res.rowCount ?? 0) > 0;
}
