import { getPool } from "../db/pool.js";

export type NotificationRow = {
  id: string;
  auth_user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: Date;
};

export async function getUserNotifications(
  authUserId: string,
  limit = 50,
): Promise<NotificationRow[]> {
  const result = await getPool().query<NotificationRow>(
    `
    SELECT * FROM notifications
    WHERE auth_user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [authUserId, limit],
  );

  return result.rows;
}

export async function getUnreadCount(authUserId: string): Promise<number> {
  const result = await getPool().query<{ count: string }>(
    `
    SELECT COUNT(*) as count FROM notifications
    WHERE auth_user_id = $1 AND read = false
    `,
    [authUserId],
  );

  return parseInt(result.rows[0]?.count || "0", 10);
}

export async function markAsRead(
  authUserId: string,
  notificationId: string,
): Promise<boolean> {
  const result = await getPool().query(
    `
    UPDATE notifications
    SET read = true
    WHERE id = $1 AND auth_user_id = $2
    `,
    [notificationId, authUserId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function markAllAsRead(authUserId: string): Promise<boolean> {
  await getPool().query(
    `
    UPDATE notifications
    SET read = true
    WHERE auth_user_id = $1 AND read = false
    `,
    [authUserId],
  );

  return true;
}

export async function deleteNotification(
  authUserId: string,
  notificationId: string,
): Promise<boolean> {
  const result = await getPool().query(
    `
    DELETE FROM notifications
    WHERE id = $1 AND auth_user_id = $2
    `,
    [notificationId, authUserId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function createNotification(input: {
  authUserId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<NotificationRow> {
  const result = await getPool().query<NotificationRow>(
    `
    INSERT INTO notifications (auth_user_id, type, title, message, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      input.authUserId,
      input.type,
      input.title,
      input.message,
      JSON.stringify(input.metadata || {}),
    ],
  );

  return result.rows[0];
}
