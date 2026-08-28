import { getPool } from "../db/pool.js";

export type StorageCategoryBreakdown = {
  id: string;
  label: string;
  bytes: number;
  formattedSize: string;
  percentage: number;
};

export type UserStorageStats = {
  totalUsedBytes: number;
  formattedUsed: string;
  storageLimitBytes: number;
  formattedLimit: string;
  remainingBytes: number;
  formattedRemaining: string;
  usagePercentage: number;
  isHighUsage: boolean;
  categories: StorageCategoryBreakdown[];
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

export async function getUserStorageStats(authUserId: string): Promise<UserStorageStats> {
  const pool = getPool();

  // 1. Tasks & Reminders Storage
  const tasksRes = await pool.query<{ size: string }>(
    `
    SELECT COALESCE(SUM(pg_column_size(t.*)), 0) as size
    FROM tasks t
    WHERE t.auth_user_id = $1
    `,
    [authUserId],
  );
  const remindersRes = await pool.query<{ size: string }>(
    `
    SELECT COALESCE(SUM(pg_column_size(r.*)), 0) as size
    FROM reminders r
    WHERE r.auth_user_id = $1
    `,
    [authUserId],
  );
  const taskListsRes = await pool.query<{ size: string }>(
    `
    SELECT COALESCE(SUM(pg_column_size(tl.*)), 0) as size
    FROM task_lists tl
    WHERE tl.auth_user_id = $1
    `,
    [authUserId],
  );

  const tasksRemindersBytes =
    Number(tasksRes.rows[0]?.size || 0) +
    Number(remindersRes.rows[0]?.size || 0) +
    Number(taskListsRes.rows[0]?.size || 0);

  // 2. Contacts Storage
  const contactsRes = await pool.query<{ size: string }>(
    `
    SELECT COALESCE(SUM(pg_column_size(c.*)), 0) as size
    FROM contacts c
    WHERE c.auth_user_id = $1
    `,
    [authUserId],
  );
  const contactsBytes = Number(contactsRes.rows[0]?.size || 0);

  // 3. Money Ledger Storage
  const ledgerRes = await pool.query<{ size: string }>(
    `
    SELECT COALESCE(SUM(pg_column_size(l.*)), 0) as size
    FROM ledger_items l
    WHERE l.auth_user_id = $1
    `,
    [authUserId],
  );
  const paymentsRes = await pool.query<{ size: string }>(
    `
    SELECT COALESCE(SUM(pg_column_size(p.*)), 0) as size
    FROM ledger_payments p
    WHERE p.auth_user_id = $1
    `,
    [authUserId],
  );
  const moneyBytes = Number(ledgerRes.rows[0]?.size || 0) + Number(paymentsRes.rows[0]?.size || 0);

  // 4. AI Conversations & History
  let aiBytes = 0;
  try {
    const chatRes = await pool.query<{ size: string }>(
      `
      SELECT COALESCE(SUM(pg_column_size(m.*)), 0) as size
      FROM chat_messages m
      WHERE m.auth_user_id = $1
      `,
      [authUserId],
    );
    aiBytes = Number(chatRes.rows[0]?.size || 0);
  } catch {
    aiBytes = 0;
  }

  // 5. Calendar Events Storage
  let calendarBytes = 0;
  try {
    const calRes = await pool.query<{ size: string }>(
      `
      SELECT COALESCE(SUM(pg_column_size(e.*)), 0) as size
      FROM calendar_events e
      WHERE e.auth_user_id = $1
      `,
      [authUserId],
    );
    calendarBytes = Number(calRes.rows[0]?.size || 0);
  } catch {
    calendarBytes = 0;
  }

  const totalUsedBytes = tasksRemindersBytes + contactsBytes + moneyBytes + aiBytes + calendarBytes;

  // Plan Limit: 500 MB Default Limit (524,288,000 bytes)
  const storageLimitBytes = 524288000;
  const remainingBytes = Math.max(0, storageLimitBytes - totalUsedBytes);
  const usagePercentage = Number(((totalUsedBytes / storageLimitBytes) * 100).toFixed(1));

  const categories: StorageCategoryBreakdown[] = [];

  if (aiBytes > 0 || totalUsedBytes === 0) {
    categories.push({
      id: "ai_chat",
      label: "AI Conversations & History",
      bytes: aiBytes,
      formattedSize: formatBytes(aiBytes),
      percentage: totalUsedBytes > 0 ? Number(((aiBytes / totalUsedBytes) * 100).toFixed(1)) : 0,
    });
  }

  categories.push({
    id: "tasks_reminders",
    label: "Tasks & Reminders",
    bytes: tasksRemindersBytes,
    formattedSize: formatBytes(tasksRemindersBytes),
    percentage: totalUsedBytes > 0 ? Number(((tasksRemindersBytes / totalUsedBytes) * 100).toFixed(1)) : 0,
  });

  categories.push({
    id: "contacts",
    label: "Contacts Directory",
    bytes: contactsBytes,
    formattedSize: formatBytes(contactsBytes),
    percentage: totalUsedBytes > 0 ? Number(((contactsBytes / totalUsedBytes) * 100).toFixed(1)) : 0,
  });

  categories.push({
    id: "money_ledger",
    label: "Money Ledger Transactions",
    bytes: moneyBytes,
    formattedSize: formatBytes(moneyBytes),
    percentage: totalUsedBytes > 0 ? Number(((moneyBytes / totalUsedBytes) * 100).toFixed(1)) : 0,
  });

  if (calendarBytes > 0) {
    categories.push({
      id: "calendar_events",
      label: "Calendar Events Context",
      bytes: calendarBytes,
      formattedSize: formatBytes(calendarBytes),
      percentage: totalUsedBytes > 0 ? Number(((calendarBytes / totalUsedBytes) * 100).toFixed(1)) : 0,
    });
  }

  return {
    totalUsedBytes,
    formattedUsed: formatBytes(totalUsedBytes),
    storageLimitBytes,
    formattedLimit: formatBytes(storageLimitBytes),
    remainingBytes,
    formattedRemaining: formatBytes(remainingBytes),
    usagePercentage,
    isHighUsage: usagePercentage >= 85,
    categories,
  };
}
