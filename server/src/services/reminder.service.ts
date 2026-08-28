import {
  createReminderInDb,
  getUserRemindersFromDb,
  getReminderByIdFromDb,
  updateReminderInDb,
  deleteReminderFromDb,
  getDueRemindersFromDb,
  createNotificationDeliveryInDb,
  updateNotificationDeliveryInDb,
  ReminderRow,
  ReminderStatus,
  RecurrenceType,
  getReminderByTaskIdFromDb,
} from "../repositories/reminder.repository.js";
import { InAppNotificationChannel } from "./notifications/in-app-channel.service.js";
import { NotificationChannel } from "./notifications/notification-channel.interface.js";
import { defaultChannelRegistry } from "./notifications/channel-registry.js";
import { getUserTelegramConnection } from "./notifications/telegram-connection.service.js";
import { resolveRecipientDestination } from "./notifications/recipient-resolver.service.js";
import {
  ObligationType,
  RemindBeforeOffset,
  calculateExecutionTimestamp,
  validateObligationInput,
} from "./obligation.service.js";
import { getTaskByIdFromDb } from "../repositories/task.repository.js";



export function calculateNextExecution(
  currentDueAt: Date,
  recurrence: RecurrenceType | null | undefined,
): Date | null {
  if (!recurrence || recurrence === "none") {
    return null;
  }

  const next = new Date(currentDueAt.getTime());

  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

export async function createReminder(input: {
  authUserId: string;
  recipientId?: string | null;
  title: string;
  description?: string;
  obligationType?: ObligationType;
  eventAt?: string | Date;
  remindBefore?: RemindBeforeOffset;
  amount?: number;
  currency?: string;
  subject?: string;
  timezone?: string;
  dueAt?: string | Date;
  recurrence?: RecurrenceType;
  channel?: string;
  metadata?: Record<string, unknown>;
  taskId?: string | null;
}): Promise<ReminderRow> {
  if (input.taskId) {
    const task = await getTaskByIdFromDb(input.authUserId, input.taskId);
    if (!task) {
      throw new Error("Task not found or access denied");
    }
  }

  const obligationType: ObligationType = input.obligationType || "custom";

  validateObligationInput({
    type: obligationType,
    eventAt: input.eventAt,
    remindBefore: input.remindBefore,
    amount: input.amount,
    currency: input.currency,
  });

  let parsedDueAt: Date;

  if (input.eventAt) {
    parsedDueAt = calculateExecutionTimestamp(input.eventAt, input.remindBefore);
  } else if (input.dueAt) {
    parsedDueAt = typeof input.dueAt === "string" ? new Date(input.dueAt) : input.dueAt;
  } else {
    throw new Error("Either dueAt or eventAt timestamp is required");
  }

  if (isNaN(parsedDueAt.getTime())) {
    throw new Error("Invalid dueAt timestamp format");
  }

  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Reminder title is required");
  }

  const targetChannel = input.channel || "in_app";
  if (!defaultChannelRegistry.hasChannel(targetChannel)) {
    throw new Error(`Unsupported or unregistered notification channel '${targetChannel}'`);
  }

  // Validate recipient destination and channel availability
  await resolveRecipientDestination(input.authUserId, targetChannel, input.recipientId);

  if (targetChannel === "telegram" && !input.recipientId) {
    const tgConnection = await getUserTelegramConnection(input.authUserId);
    if (!tgConnection.connected) {
      throw new Error(
        "CONNECTION_REQUIRED: Telegram is not connected for your account. Please connect Telegram in Calby Settings.",
      );
    }
  }

  const obligationMetadata = {
    type: obligationType,
    subject: input.subject || input.title.trim(),
    amount: input.amount,
    currency: input.currency || "INR",
    eventAt: input.eventAt ? new Date(input.eventAt).toISOString() : undefined,
    remindBefore: input.remindBefore,
    ...(input.metadata || {}),
  };

  return createReminderInDb({
    authUserId: input.authUserId,
    recipientId: input.recipientId,
    title: input.title.trim(),
    description: input.description,
    obligationType,
    obligationMetadata,
    timezone: input.timezone || "Asia/Kolkata",
    dueAt: parsedDueAt,
    nextRunAt: parsedDueAt,
    recurrence: input.recurrence || "none",
    channel: targetChannel,
    metadata: input.metadata,
    taskId: input.taskId,
  });
}

export async function getUserReminders(
  authUserId: string,
  status?: ReminderStatus,
): Promise<ReminderRow[]> {
  return getUserRemindersFromDb(authUserId, status);
}

export async function getReminderById(
  authUserId: string,
  reminderId: string,
): Promise<ReminderRow | null> {
  return getReminderByIdFromDb(authUserId, reminderId);
}

export async function updateReminder(
  authUserId: string,
  reminderId: string,
  updates: {
    title?: string;
    description?: string;
    status?: ReminderStatus;
    dueAt?: string | Date;
    recurrence?: RecurrenceType;
    taskId?: string | null;
  },
): Promise<ReminderRow | null> {
  if (updates.taskId) {
    const task = await getTaskByIdFromDb(authUserId, updates.taskId);
    if (!task) {
      throw new Error("Task not found or access denied");
    }
  }

  let parsedDueAt: Date | undefined = undefined;
  if (updates.dueAt) {
    parsedDueAt = typeof updates.dueAt === "string" ? new Date(updates.dueAt) : updates.dueAt;
    if (isNaN(parsedDueAt.getTime())) {
      throw new Error("Invalid dueAt timestamp format");
    }
  }

  return updateReminderInDb(authUserId, reminderId, {
    title: updates.title,
    description: updates.description,
    status: updates.status,
    dueAt: parsedDueAt,
    nextRunAt: parsedDueAt,
    recurrence: updates.recurrence,
    taskId: updates.taskId,
  });
}

export async function pauseReminder(
  authUserId: string,
  reminderId: string,
): Promise<ReminderRow | null> {
  return updateReminderInDb(authUserId, reminderId, { status: "paused" });
}

export async function resumeReminder(
  authUserId: string,
  reminderId: string,
): Promise<ReminderRow | null> {
  return updateReminderInDb(authUserId, reminderId, { status: "active" });
}

export async function cancelReminder(
  authUserId: string,
  reminderId: string,
): Promise<ReminderRow | null> {
  return updateReminderInDb(authUserId, reminderId, { status: "cancelled" });
}

export async function deleteReminder(
  authUserId: string,
  reminderId: string,
): Promise<boolean> {
  return deleteReminderFromDb(authUserId, reminderId);
}

export async function getDueReminders(now: Date = new Date()): Promise<ReminderRow[]> {
  return getDueRemindersFromDb(now);
}

export async function processDueReminder(
  reminder: ReminderRow,
): Promise<{ success: boolean; deliveryId: string; nextRunAt?: Date | null }> {
  // 1. Create pending notification delivery row
  const delivery = await createNotificationDeliveryInDb({
    reminderId: reminder.id,
    authUserId: reminder.auth_user_id,
    channel: reminder.channel,
    status: "pending",
    scheduledAt: reminder.next_run_at,
  });

  // 2. Select notification delivery channel
  const channelImpl = defaultChannelRegistry.getChannel(reminder.channel) || defaultChannelRegistry.getChannel("in_app")!;

  // 3. Deliver notification
  const result = await channelImpl.send({
    deliveryId: delivery.id,
    reminderId: reminder.id,
    authUserId: reminder.auth_user_id,
    title: `Reminder: ${reminder.title}`,
    message: reminder.description || reminder.title,
    metadata: reminder.metadata || {},
  });

  // 4. Update delivery row status
  await updateNotificationDeliveryInDb(delivery.id, {
    status: result.success ? "sent" : "failed",
    deliveredAt: result.success ? new Date() : undefined,
    errorMessage: result.errorMessage,
  });

  // 5. Update reminder state (calculate next run for recurring or mark completed)
  const nextRun = calculateNextExecution(reminder.next_run_at, reminder.recurrence);

  if (nextRun) {
    await updateReminderInDb(reminder.auth_user_id, reminder.id, {
      nextRunAt: nextRun,
      status: "active",
    });
  } else {
    await updateReminderInDb(reminder.auth_user_id, reminder.id, {
      status: "completed",
    });
  }

  return {
    success: result.success,
    deliveryId: delivery.id,
    nextRunAt: nextRun,
  };
}

export async function getReminderByTaskId(
  authUserId: string,
  taskId: string,
): Promise<ReminderRow | null> {
  return getReminderByTaskIdFromDb(authUserId, taskId);
}

export async function snoozeReminder(
  authUserId: string,
  reminderId: string,
  snoozeMinutes: number = 10,
): Promise<ReminderRow | null> {
  const nextRun = new Date(Date.now() + Math.max(1, snoozeMinutes) * 60000);
  const updated = await updateReminderInDb(authUserId, reminderId, {
    nextRunAt: nextRun,
    status: "active",
  });
  return updated;
}

export async function completeReminder(
  authUserId: string,
  reminderId: string,
): Promise<ReminderRow | null> {
  const reminder = await getReminderByIdFromDb(authUserId, reminderId);
  if (!reminder) return null;

  const updated = await updateReminderInDb(authUserId, reminderId, {
    status: "completed",
  });

  if (reminder.task_id) {
    try {
      const { updateTaskInDb } = await import("../repositories/task.repository.js");
      await updateTaskInDb(authUserId, reminder.task_id, { status: "completed" });
    } catch {
      // ignore
    }
  }

  return updated;
}

