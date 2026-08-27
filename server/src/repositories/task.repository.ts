import { getPool } from "../db/pool.js";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskListStatus = "active" | "archived";

export interface TaskList {
  id: string;
  auth_user_id: string;
  name: string;
  description: string | null;
  status: TaskListStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  auth_user_id: string;
  task_list_id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  reminder_id?: string | null;
  reminder_due_at?: Date | null;
  reminder_status?: string | null;
  reminder_channel?: string | null;
  recurrence_rule: "none" | "daily" | "weekly" | "monthly";
  recurrence_timezone: string;
  next_occurrence_at: Date | null;
}

// ==========================================
// TASK LIST REPOSITORY METHODS
// ==========================================

export async function createTaskListInDb(
  authUserId: string,
  name: string,
  description?: string,
): Promise<TaskList> {
  const result = await getPool().query<TaskList>(
    `
    INSERT INTO task_lists (
      auth_user_id,
      name,
      description,
      status,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, 'active', NOW(), NOW())
    RETURNING *
    `,
    [authUserId, name.trim(), description?.trim() || null],
  );

  return result.rows[0];
}

export async function getTaskListByIdFromDb(
  authUserId: string,
  id: string,
): Promise<TaskList | null> {
  try {
    const result = await getPool().query<TaskList>(
      `
      SELECT *
      FROM task_lists
      WHERE id = $1 AND auth_user_id = $2
      `,
      [id, authUserId],
    );

    return result.rows[0] || null;
  } catch {
    return null;
  }
}

export async function listTaskListsFromDb(authUserId: string): Promise<TaskList[]> {
  const result = await getPool().query<TaskList>(
    `
    SELECT *
    FROM task_lists
    WHERE auth_user_id = $1
    ORDER BY name ASC
    `,
    [authUserId],
  );

  return result.rows;
}

export async function updateTaskListInDb(
  authUserId: string,
  id: string,
  updates: {
    name?: string;
    description?: string | null;
    status?: TaskListStatus;
  },
): Promise<TaskList | null> {
  const fields: string[] = [];
  const params: any[] = [id, authUserId];
  let paramIdx = 3;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIdx++}`);
    params.push(updates.name.trim());
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIdx++}`);
    params.push(updates.description ? updates.description.trim() : null);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIdx++}`);
    params.push(updates.status);
  }

  if (fields.length === 0) {
    return getTaskListByIdFromDb(authUserId, id);
  }

  fields.push(`updated_at = NOW()`);

  const query = `
    UPDATE task_lists
    SET ${fields.join(", ")}
    WHERE id = $1 AND auth_user_id = $2
    RETURNING *
  `;

  const result = await getPool().query<TaskList>(query, params);
  return result.rows[0] || null;
}

export async function deleteTaskListFromDb(
  authUserId: string,
  id: string,
): Promise<boolean> {
  const result = await getPool().query(
    `
    DELETE FROM task_lists
    WHERE id = $1 AND auth_user_id = $2
    `,
    [id, authUserId],
  );

  return (result.rowCount ?? 0) > 0;
}

// ==========================================
// TASK REPOSITORY METHODS
// ==========================================

export async function createTaskInDb(
  authUserId: string,
  taskListId: string,
  input: {
    title: string;
    description?: string | null;
    contactId?: string | null;
    priority?: TaskPriority;
    dueAt?: Date | null;
    recurrenceRule?: "none" | "daily" | "weekly" | "monthly";
    recurrenceTimezone?: string;
    nextOccurrenceAt?: Date | null;
  },
  client?: any,
): Promise<Task> {
  const executor = client || getPool();
  const result = await executor.query(
    `
    INSERT INTO tasks (
      auth_user_id,
      task_list_id,
      contact_id,
      title,
      description,
      status,
      priority,
      due_at,
      completed_at,
      recurrence_rule,
      recurrence_timezone,
      next_occurrence_at,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, NULL, $8, $9, $10, NOW(), NOW())
    RETURNING *
    `,
    [
      authUserId,
      taskListId,
      input.contactId || null,
      input.title.trim(),
      input.description?.trim() || null,
      input.priority || "medium",
      input.dueAt || null,
      input.recurrenceRule || "none",
      input.recurrenceTimezone || "UTC",
      input.nextOccurrenceAt || null,
    ],
  );

  return result.rows[0] as Task;
}

export async function getTaskByIdFromDb(
  authUserId: string,
  id: string,
): Promise<Task | null> {
  try {
    const result = await getPool().query<Task>(
      `
      SELECT t.*, r.id AS reminder_id, r.due_at AS reminder_due_at, r.status AS reminder_status, r.channel AS reminder_channel
      FROM tasks t
      LEFT JOIN reminders r ON r.task_id = t.id AND r.status IN ('active', 'paused')
      WHERE t.id = $1 AND t.auth_user_id = $2
      `,
      [id, authUserId],
    );

    return result.rows[0] || null;
  } catch {
    return null;
  }
}

export async function listTasksFromDb(
  authUserId: string,
  options?: {
    taskListId?: string;
    status?: TaskStatus;
    contactId?: string;
    priority?: TaskPriority;
    overdue?: boolean;
    dueBefore?: Date;
    dueAfter?: Date;
    search?: string;
  },
): Promise<Task[]> {
  let query = `
    SELECT t.*, r.id AS reminder_id, r.due_at AS reminder_due_at, r.status AS reminder_status, r.channel AS reminder_channel
    FROM tasks t
    LEFT JOIN reminders r ON r.task_id = t.id AND r.status IN ('active', 'paused')
    WHERE t.auth_user_id = $1
  `;
  const params: any[] = [authUserId];
  let paramIdx = 2;

  if (options?.taskListId) {
    query += ` AND t.task_list_id = $${paramIdx++}`;
    params.push(options.taskListId);
  }
  if (options?.status) {
    query += ` AND t.status = $${paramIdx++}`;
    params.push(options.status);
  }
  if (options?.contactId) {
    query += ` AND t.contact_id = $${paramIdx++}`;
    params.push(options.contactId);
  }
  if (options?.priority) {
    query += ` AND t.priority = $${paramIdx++}`;
    params.push(options.priority);
  }
  if (options?.overdue) {
    query += ` AND t.status IN ('pending', 'in_progress') AND t.due_at < NOW()`;
  }
  if (options?.dueBefore) {
    query += ` AND t.due_at <= $${paramIdx++}`;
    params.push(options.dueBefore);
  }
  if (options?.dueAfter) {
    query += ` AND t.due_at >= $${paramIdx++}`;
    params.push(options.dueAfter);
  }
  if (options?.search) {
    query += ` AND (LOWER(t.title) LIKE $${paramIdx} OR LOWER(t.description) LIKE $${paramIdx})`;
    paramIdx++;
    params.push(`%${options.search.trim().toLowerCase()}%`);
  }

  query += ` ORDER BY t.due_at ASC NULLS LAST, t.created_at DESC`;

  const result = await getPool().query<Task>(query, params);
  return result.rows;
}

export async function updateTaskInDb(
  authUserId: string,
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    contactId?: string | null;
    taskListId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueAt?: Date | null;
    completedAt?: Date | null;
    recurrenceRule?: "none" | "daily" | "weekly" | "monthly";
    recurrenceTimezone?: string;
    nextOccurrenceAt?: Date | null;
  },
  client?: any,
): Promise<Task | null> {
  const fields: string[] = [];
  const params: any[] = [id, authUserId];
  let paramIdx = 3;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIdx++}`);
    params.push(updates.title.trim());
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIdx++}`);
    params.push(updates.description ? updates.description.trim() : null);
  }
  if (updates.contactId !== undefined) {
    fields.push(`contact_id = $${paramIdx++}`);
    params.push(updates.contactId || null);
  }
  if (updates.taskListId !== undefined) {
    fields.push(`task_list_id = $${paramIdx++}`);
    params.push(updates.taskListId);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIdx++}`);
    params.push(updates.status);
  }
  if (updates.priority !== undefined) {
    fields.push(`priority = $${paramIdx++}`);
    params.push(updates.priority);
  }
  if (updates.dueAt !== undefined) {
    fields.push(`due_at = $${paramIdx++}`);
    params.push(updates.dueAt || null);
  }
  if (updates.completedAt !== undefined) {
    fields.push(`completed_at = $${paramIdx++}`);
    params.push(updates.completedAt || null);
  }
  if (updates.recurrenceRule !== undefined) {
    fields.push(`recurrence_rule = $${paramIdx++}`);
    params.push(updates.recurrenceRule);
  }
  if (updates.recurrenceTimezone !== undefined) {
    fields.push(`recurrence_timezone = $${paramIdx++}`);
    params.push(updates.recurrenceTimezone);
  }
  if (updates.nextOccurrenceAt !== undefined) {
    fields.push(`next_occurrence_at = $${paramIdx++}`);
    params.push(updates.nextOccurrenceAt || null);
  }

  if (fields.length === 0) {
    return getTaskByIdFromDb(authUserId, id);
  }

  fields.push(`updated_at = NOW()`);

  const query = `
    UPDATE tasks
    SET ${fields.join(", ")}
    WHERE id = $1 AND auth_user_id = $2
    RETURNING *
  `;

  const executor = client || getPool();
  const result = await executor.query(query, params);
  return (result.rows[0] as Task) || null;
}

export async function deleteTaskFromDb(
  authUserId: string,
  id: string,
): Promise<boolean> {
  const result = await getPool().query(
    `
    DELETE FROM tasks
    WHERE id = $1 AND auth_user_id = $2
    `,
    [id, authUserId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function searchTasksByTitleInDb(
  authUserId: string,
  titleQuery: string,
): Promise<Task[]> {
  try {
    const cleanTitle = `%${titleQuery.trim().toLowerCase()}%`;
    const result = await getPool().query<Task>(
      `
      SELECT t.*, r.id AS reminder_id, r.due_at AS reminder_due_at, r.status AS reminder_status, r.channel AS reminder_channel
      FROM tasks t
      LEFT JOIN reminders r ON r.task_id = t.id AND r.status IN ('active', 'paused')
      WHERE t.auth_user_id = $1 AND LOWER(t.title) LIKE $2
      ORDER BY t.due_at ASC NULLS LAST, t.created_at DESC
      `,
      [authUserId, cleanTitle],
    );

    return result.rows;
  } catch {
    return [];
  }
}

export async function listPendingTasksFromDb(authUserId: string): Promise<Task[]> {
  const result = await getPool().query<Task>(
    `
    SELECT t.*, r.id AS reminder_id, r.due_at AS reminder_due_at, r.status AS reminder_status, r.channel AS reminder_channel
    FROM tasks t
    LEFT JOIN reminders r ON r.task_id = t.id AND r.status IN ('active', 'paused')
    WHERE t.auth_user_id = $1 AND t.status IN ('pending', 'in_progress')
    ORDER BY t.due_at ASC NULLS LAST, t.created_at DESC
    `,
    [authUserId],
  );

  return result.rows;
}

export async function listTasksForContactFromDb(
  authUserId: string,
  contactId: string,
): Promise<Task[]> {
  const result = await getPool().query<Task>(
    `
    SELECT t.*, r.id AS reminder_id, r.due_at AS reminder_due_at, r.status AS reminder_status, r.channel AS reminder_channel
    FROM tasks t
    LEFT JOIN reminders r ON r.task_id = t.id AND r.status IN ('active', 'paused')
    WHERE t.auth_user_id = $1 AND t.contact_id = $2
    ORDER BY t.due_at ASC NULLS LAST, t.created_at DESC
    `,
    [authUserId, contactId],
  );

  return result.rows;
}
