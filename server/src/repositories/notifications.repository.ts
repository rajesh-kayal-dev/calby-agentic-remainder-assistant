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
  await seedInitialNotificationsIfEmpty(authUserId);

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
  await seedInitialNotificationsIfEmpty(authUserId);

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

export async function seedInitialNotificationsIfEmpty(authUserId: string): Promise<void> {
  const check = await getPool().query<{ count: string }>(
    `SELECT COUNT(*) as count FROM notifications WHERE auth_user_id = $1`,
    [authUserId],
  );

  if (parseInt(check.rows[0]?.count || "0", 10) > 0) {
    return;
  }

  const now = new Date();
  const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const initialSeeds = [
    {
      type: "CALENDAR_REMINDER",
      title: "Calendar Reminder",
      message: "Team meeting starts in 10 minutes",
      read: false,
      created_at: twoMinsAgo,
    },
    {
      type: "CALENDAR_CONNECTED",
      title: "Google Calendar",
      message: "Google Calendar connected successfully",
      read: false,
      created_at: oneHourAgo,
    },
    {
      type: "AI_PROVIDER_UPDATED",
      title: "AI Provider",
      message: "OpenAI provider updated",
      read: true,
      created_at: yesterday,
    },
    {
      type: "EVENT_CREATED",
      title: "Meeting Scheduled",
      message: "Client call was added to your calendar",
      read: true,
      created_at: twoDaysAgo,
    },
  ];

  for (const seed of initialSeeds) {
    await getPool().query(
      `
      INSERT INTO notifications (auth_user_id, type, title, message, read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [authUserId, seed.type, seed.title, seed.message, seed.read, seed.created_at],
    );
  }
}
