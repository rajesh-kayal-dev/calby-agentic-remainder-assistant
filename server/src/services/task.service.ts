import {
  TaskList,
  Task,
  TaskStatus,
  TaskPriority,
  TaskListStatus,
  createTaskListInDb,
  getTaskListByIdFromDb,
  listTaskListsFromDb,
  updateTaskListInDb,
  deleteTaskListFromDb,
  createTaskInDb,
  getTaskByIdFromDb,
  listTasksFromDb,
  updateTaskInDb,
  deleteTaskFromDb,
  searchTasksByTitleInDb,
  listPendingTasksFromDb,
  listTasksForContactFromDb,
} from "../repositories/task.repository.js";
import { getContactByIdFromDb } from "../repositories/contact.repository.js";
import { getReminderByTaskId, cancelReminder, createReminder } from "./reminder.service.js";
import { getUserPreferences } from "../repositories/preferences.repository.js";
import { getPool } from "../db/pool.js";

// ==========================================
// VALIDATION HELPERS
// ==========================================

const VALID_STATUSES: TaskStatus[] = ["pending", "in_progress", "completed", "cancelled"];
const VALID_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const VALID_LIST_STATUSES: TaskListStatus[] = ["active", "archived"];

function validateStatus(status?: TaskStatus): void {
  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid task status: ${status}`);
  }
}

function validatePriority(priority?: TaskPriority): void {
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    throw new Error(`Invalid task priority: ${priority}`);
  }
}

function validateListStatus(status?: TaskListStatus): void {
  if (status && !VALID_LIST_STATUSES.includes(status)) {
    throw new Error(`Invalid task list status: ${status}`);
  }
}

function validateRecurrence(rule?: string): void {
  if (rule && !["none", "daily", "weekly", "monthly"].includes(rule)) {
    throw new Error(`Invalid task recurrence rule: ${rule}`);
  }
}

export function calculateNextOccurrence(
  dueAt: Date,
  rule: "daily" | "weekly" | "monthly",
  timezone: string
): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(dueAt);
  const p: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      p[part.type] = parseInt(part.value, 10);
    }
  }

  let year = p.year;
  let month = p.month - 1; // JS Date month is 0-based
  let day = p.day;
  const hour = p.hour;
  const minute = p.minute;
  const second = p.second;

  if (rule === "daily") {
    day += 1;
  } else if (rule === "weekly") {
    day += 7;
  } else if (rule === "monthly") {
    month += 1;
  }

  const localMs = Date.UTC(year, month, day, hour, minute, second);
  const candidate = new Date(localMs);
  
  const cParts = formatter.formatToParts(candidate);
  const cp: Record<string, number> = {};
  for (const part of cParts) {
    if (part.type !== "literal") cp[part.type] = parseInt(part.value, 10);
  }
  
  const candLocalMs = Date.UTC(cp.year, cp.month - 1, cp.day, cp.hour, cp.minute, cp.second);
  const offset = candLocalMs - localMs;
  return new Date(localMs - offset);
}

// ==========================================
// TASK LIST SERVICE METHODS
// ==========================================

export async function createTaskList(
  authUserId: string,
  name: string,
  description?: string,
): Promise<TaskList> {
  if (!name || name.trim().length === 0) {
    throw new Error("Task list name is required");
  }

  return createTaskListInDb(authUserId, name, description);
}

export async function getTaskList(
  authUserId: string,
  taskListId: string,
): Promise<TaskList | null> {
  return getTaskListByIdFromDb(authUserId, taskListId);
}

export async function listTaskLists(authUserId: string): Promise<TaskList[]> {
  return listTaskListsFromDb(authUserId);
}

export async function updateTaskList(
  authUserId: string,
  taskListId: string,
  updates: {
    name?: string;
    description?: string | null;
    status?: TaskListStatus;
  },
): Promise<TaskList> {
  if (updates.name !== undefined && updates.name.trim().length === 0) {
    throw new Error("Task list name cannot be empty");
  }

  if (updates.status !== undefined) {
    validateListStatus(updates.status);
  }

  const existing = await getTaskListByIdFromDb(authUserId, taskListId);
  if (!existing) {
    throw new Error("Task list not found");
  }

  const updated = await updateTaskListInDb(authUserId, taskListId, updates);
  if (!updated) {
    throw new Error("Failed to update task list");
  }

  return updated;
}

export async function deleteTaskList(
  authUserId: string,
  taskListId: string,
): Promise<boolean> {
  const existing = await getTaskListByIdFromDb(authUserId, taskListId);
  if (!existing) {
    throw new Error("Task list not found");
  }

  return deleteTaskListFromDb(authUserId, taskListId);
}

// ==========================================
// TASK SERVICE METHODS
// ==========================================

export async function createTask(
  authUserId: string,
  taskListIdInput: string | undefined | null,
  input: {
    title: string;
    description?: string | null;
    contactId?: string | null;
    priority?: TaskPriority;
    dueAt?: string | Date | null;
    recurrenceRule?: "none" | "daily" | "weekly" | "monthly";
    recurrenceTimezone?: string;
  },
): Promise<Task> {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Task title is required");
  }

  validatePriority(input.priority);
  validateRecurrence(input.recurrenceRule);

  let targetListId = taskListIdInput;
  if (!targetListId) {
    const existingLists = await listTaskListsFromDb(authUserId);
    if (existingLists.length > 0) {
      targetListId = existingLists[0].id;
    } else {
      const newList = await createTaskListInDb(authUserId, "Personal", "Default task list");
      targetListId = newList.id;
    }
  }

  // Check task list ownership
  const taskList = await getTaskListByIdFromDb(authUserId, targetListId);
  if (!taskList) {
    throw new Error("Task list not found or access denied");
  }

  // Check contact ownership if contactId is supplied
  if (input.contactId) {
    const contact = await getContactByIdFromDb(authUserId, input.contactId);
    if (!contact) {
      throw new Error("Contact not found or access denied");
    }
  }

  let parsedDueAt: Date | null = null;
  if (input.dueAt) {
    parsedDueAt = typeof input.dueAt === "string" ? new Date(input.dueAt) : input.dueAt;
    if (isNaN(parsedDueAt.getTime())) {
      throw new Error("Invalid due date format");
    }
  }

  let targetTimezone = input.recurrenceTimezone;
  if (!targetTimezone && input.recurrenceRule && input.recurrenceRule !== "none") {
    const prefs = await getUserPreferences(authUserId);
    targetTimezone = prefs?.timezone || "UTC";
  }

  let nextOccurrenceAt: Date | null = null;
  if (input.recurrenceRule && input.recurrenceRule !== "none" && parsedDueAt) {
    nextOccurrenceAt = calculateNextOccurrence(parsedDueAt, input.recurrenceRule, targetTimezone || "UTC");
  }

  return createTaskInDb(authUserId, targetListId, {
    title: input.title,
    description: input.description,
    contactId: input.contactId,
    priority: input.priority,
    dueAt: parsedDueAt,
    recurrenceRule: input.recurrenceRule,
    recurrenceTimezone: targetTimezone,
    nextOccurrenceAt,
  });
}

export async function getTask(
  authUserId: string,
  taskId: string,
): Promise<Task | null> {
  return getTaskByIdFromDb(authUserId, taskId);
}

export async function listTasks(
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
  // If taskListId is supplied, optionally verify list ownership
  if (options?.taskListId) {
    const taskList = await getTaskListByIdFromDb(authUserId, options.taskListId);
    if (!taskList) {
      return [];
    }
  }

  // If contactId is supplied, optionally verify contact ownership
  if (options?.contactId) {
    const contact = await getContactByIdFromDb(authUserId, options.contactId);
    if (!contact) {
      return [];
    }
  }

  if (options?.status) {
    validateStatus(options.status);
  }
  if (options?.priority) {
    validatePriority(options.priority);
  }

  return listTasksFromDb(authUserId, options);
}

export async function updateTask(
  authUserId: string,
  taskId: string,
  updates: {
    title?: string;
    description?: string | null;
    contactId?: string | null;
    taskListId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueAt?: string | Date | null;
    recurrenceRule?: "none" | "daily" | "weekly" | "monthly";
    recurrenceTimezone?: string;
  },
): Promise<Task> {
  if (updates.title !== undefined && updates.title.trim().length === 0) {
    throw new Error("Task title cannot be empty");
  }

  validateStatus(updates.status);
  validatePriority(updates.priority);
  validateRecurrence(updates.recurrenceRule);

  // Check task list ownership if updating taskListId
  if (updates.taskListId) {
    const taskList = await getTaskListByIdFromDb(authUserId, updates.taskListId);
    if (!taskList) {
      throw new Error("Task list not found or access denied");
    }
  }

  // Check contact ownership if updating contactId
  if (updates.contactId) {
    const contact = await getContactByIdFromDb(authUserId, updates.contactId);
    if (!contact) {
      throw new Error("Contact not found or access denied");
    }
  }

  let parsedDueAt: Date | null | undefined = undefined;
  if (updates.dueAt !== undefined) {
    if (updates.dueAt === null) {
      parsedDueAt = null;
    } else {
      parsedDueAt = typeof updates.dueAt === "string" ? new Date(updates.dueAt) : updates.dueAt;
      if (isNaN(parsedDueAt.getTime())) {
        throw new Error("Invalid due date format");
      }
    }
  }

  // Check out a client from the pool to execute a transaction
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    // Acquire lock on the task row
    const lockRes = await client.query<Task>(
      `SELECT * FROM tasks WHERE id = $1 AND auth_user_id = $2 FOR UPDATE`,
      [taskId, authUserId]
    );
    const existing = lockRes.rows[0];
    if (!existing) {
      throw new Error("Task not found");
    }

    // If status is updated, enforce state transitions
    if (updates.status !== undefined && updates.status !== existing.status) {
      // Prevent transitioning away from terminal statuses
      if (existing.status === "completed" || existing.status === "cancelled") {
        throw new Error(
          `Cannot transition task from terminal status '${existing.status}' to '${updates.status}'`,
        );
      }
    }

    let completedAt: Date | null | undefined = undefined;
    let cancelLinkedReminder = false;
    if (updates.status !== undefined && updates.status !== existing.status) {
      if (updates.status === "completed") {
        completedAt = new Date();
        cancelLinkedReminder = true;
      } else if (updates.status === "cancelled") {
        completedAt = null;
        cancelLinkedReminder = true;
      } else {
        completedAt = null;
      }
    }

    // Determine the next occurrence if completing a recurring task
    const isCompletingRecurring = 
      updates.status === "completed" && 
      existing.status !== "completed" && 
      existing.recurrence_rule !== "none";

    let nextTask: Task | null = null;
    let nextDue: Date | null = null;
    let reminderToClone: any = null;

    if (isCompletingRecurring && existing.due_at) {
      const targetTimezone = existing.recurrence_timezone || "UTC";
      nextDue = calculateNextOccurrence(existing.due_at, existing.recurrence_rule as any, targetTimezone);
      const nextNextDue = calculateNextOccurrence(nextDue, existing.recurrence_rule as any, targetTimezone);

      // Create the next pending occurrence task row
      nextTask = await createTaskInDb(authUserId, existing.task_list_id, {
        title: existing.title,
        description: existing.description,
        contactId: existing.contact_id,
        priority: existing.priority,
        dueAt: nextDue,
        recurrenceRule: existing.recurrence_rule as any,
        recurrenceTimezone: targetTimezone,
        nextOccurrenceAt: nextNextDue,
      }, client);

      // Fetch the reminder associated with the completed task
      const reminder = await getReminderByTaskId(authUserId, existing.id);
      if (reminder && reminder.status !== "cancelled") {
        reminderToClone = reminder;
      }
    }

    // Cancel active/paused reminders for this current completed/cancelled task
    if (cancelLinkedReminder) {
      const activeReminder = await getReminderByTaskId(authUserId, taskId);
      if (activeReminder && (activeReminder.status === "active" || activeReminder.status === "paused")) {
        await cancelReminder(authUserId, activeReminder.id);
      }
    }

    // Perform database updates on the task
    const updated = await updateTaskInDb(authUserId, taskId, {
      title: updates.title,
      description: updates.description,
      contactId: updates.contactId,
      taskListId: updates.taskListId,
      status: updates.status,
      priority: updates.priority,
      dueAt: parsedDueAt,
      completedAt,
      recurrenceRule: updates.recurrenceRule,
      recurrenceTimezone: updates.recurrenceTimezone,
      nextOccurrenceAt: updates.recurrenceRule && updates.recurrenceRule !== "none" && (parsedDueAt || existing.due_at)
        ? calculateNextOccurrence(
            parsedDueAt || existing.due_at || new Date(),
            updates.recurrenceRule,
            updates.recurrenceTimezone || existing.recurrence_timezone || "UTC"
          )
        : undefined,
    }, client);

    if (!updated) {
      throw new Error("Failed to update task");
    }

    await client.query("COMMIT");

    // Outside transaction (after commit): clone the reminder for the next occurrence if one was active
    if (nextTask && reminderToClone && nextDue && existing.due_at) {
      const oldTaskDue = existing.due_at.getTime();
      const offsetMs = reminderToClone.due_at.getTime() - oldTaskDue;
      const newReminderDue = new Date(nextDue.getTime() + offsetMs);

      await createReminder({
        authUserId,
        recipientId: reminderToClone.recipient_id,
        title: reminderToClone.title,
        description: reminderToClone.description || undefined,
        dueAt: newReminderDue,
        channel: reminderToClone.channel,
        timezone: reminderToClone.timezone,
        recurrence: "none",
        taskId: nextTask.id,
        obligationType: reminderToClone.obligation_type as any,
      });
    }

    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function completeTask(authUserId: string, taskId: string): Promise<Task> {
  return updateTask(authUserId, taskId, { status: "completed" });
}

export async function cancelTask(authUserId: string, taskId: string): Promise<Task> {
  return updateTask(authUserId, taskId, { status: "cancelled" });
}

export async function deleteTask(authUserId: string, taskId: string): Promise<boolean> {
  const existing = await getTaskByIdFromDb(authUserId, taskId);
  if (!existing) {
    throw new Error("Task not found");
  }

  return deleteTaskFromDb(authUserId, taskId);
}

export async function searchTasksByTitle(
  authUserId: string,
  titleQuery: string,
): Promise<Task[]> {
  if (!titleQuery || titleQuery.trim().length === 0) {
    return [];
  }
  return searchTasksByTitleInDb(authUserId, titleQuery);
}

export async function listPendingTasks(authUserId: string): Promise<Task[]> {
  return listPendingTasksFromDb(authUserId);
}

export async function listTasksForContact(
  authUserId: string,
  contactId: string,
): Promise<Task[]> {
  const contact = await getContactByIdFromDb(authUserId, contactId);
  if (!contact) {
    return [];
  }
  return listTasksForContactFromDb(authUserId, contactId);
}
