import {
  getDueRemindersFromDb,
  createDeliveryIfNotExists,
  claimPendingDeliveries,
  recoverStaleDeliveries,
  recordDeliveryResult,
  getReminderByIdFromDb,
  updateReminderInDb,
  NotificationDeliveryRow,
} from "../repositories/reminder.repository.js";
import { calculateNextExecution } from "./reminder.service.js";
import { defaultChannelRegistry, NotificationChannelRegistry } from "./notifications/channel-registry.js";

export interface SchedulerConfig {
  enabled: boolean;
  intervalMs: number;
  batchSize: number;
  leaseTimeoutMs: number;
  maxAttempts: number;
}

export class ReminderSchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  public workerId: string;
  private config: SchedulerConfig;
  private channelRegistry: NotificationChannelRegistry;

  constructor(
    config?: Partial<SchedulerConfig>,
    channelRegistry: NotificationChannelRegistry = defaultChannelRegistry,
  ) {
    this.config = {
      enabled: process.env.REMINDER_SCHEDULER_ENABLED !== "false",
      intervalMs: Number(process.env.REMINDER_SCHEDULER_INTERVAL_MS) || 5000,
      batchSize: Number(process.env.REMINDER_SCHEDULER_BATCH_SIZE) || 25,
      leaseTimeoutMs: 60000,
      maxAttempts: 3,
      ...config,
    };
    this.workerId = `worker_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.channelRegistry = channelRegistry;
  }

  start(): void {
    if (!this.config.enabled) {
      console.log("ReminderSchedulerService is disabled in configuration.");
      return;
    }

    if (this.timer) {
      return;
    }

    console.log(
      `ReminderSchedulerService started [${this.workerId}] (Interval: ${this.config.intervalMs}ms, Batch: ${this.config.batchSize})`,
    );

    this.timer = setInterval(() => {
      this.runCycle().catch((err) => {
        console.error(`[${this.workerId}] Error in scheduler runCycle:`, err?.message || err);
      });
    }, this.config.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log(`ReminderSchedulerService stopped cleanly [${this.workerId}]`);
    }
  }

  async runCycle(): Promise<{ claimedCount: number; processedCount: number }> {
    if (this.isProcessing) {
      return { claimedCount: 0, processedCount: 0 };
    }

    this.isProcessing = true;
    let processedCount = 0;
    let claimedCount = 0;

    try {
      // 1. Recover stale processing claims
      await recoverStaleDeliveries(this.config.leaseTimeoutMs, this.config.maxAttempts);

      const now = new Date();

      // 2. Fetch active due reminders and create pending deliveries (ON CONFLICT DO NOTHING)
      const dueReminders = await getDueRemindersFromDb(now, this.config.batchSize);
      for (const reminder of dueReminders) {
        await createDeliveryIfNotExists(reminder);
      }

      // 3. Claim pending/failed retryable deliveries using FOR UPDATE SKIP LOCKED
      const claimedDeliveries = await claimPendingDeliveries(
        this.config.batchSize,
        this.workerId,
      );

      claimedCount = claimedDeliveries.length;

      // 4. Process each claimed delivery
      for (const delivery of claimedDeliveries) {
        const success = await this.processSingleDelivery(delivery, now);
        if (success) {
          processedCount++;
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { claimedCount, processedCount };
  }

  private async processSingleDelivery(
    delivery: NotificationDeliveryRow,
    now: Date,
  ): Promise<boolean> {
    const channelImpl = this.channelRegistry.getChannel(delivery.channel);

    if (!channelImpl) {
      console.warn(
        `[${this.workerId}] Unregistered notification channel '${delivery.channel}' for delivery ${delivery.id}`,
      );
      await recordDeliveryResult(
        delivery.id,
        false,
        `Unregistered notification channel '${delivery.channel}'`,
        this.config.maxAttempts,
      );
      return false;
    }

    // Load reminder title & details
    let reminderTitle = "Reminder";
    let reminderDesc = "";

    if (delivery.reminder_id) {
      const reminder = await getReminderByIdFromDb(delivery.auth_user_id, delivery.reminder_id);
      if (reminder) {
        reminderTitle = reminder.title;
        reminderDesc = reminder.description || "";
      }
    }

    // Execute delivery OUTSIDE DB transaction
    let deliveryResult;
    try {
      deliveryResult = await channelImpl.send({
        deliveryId: delivery.id,
        reminderId: delivery.reminder_id || undefined,
        authUserId: delivery.auth_user_id,
        title: `Reminder: ${reminderTitle}`,
        message: reminderDesc || reminderTitle,
        metadata: delivery.metadata || {},
      });
    } catch (sendErr: any) {
      deliveryResult = {
        success: false,
        channel: delivery.channel,
        errorMessage: sendErr?.message || "Delivery exception",
      };
    }

    // Record delivery outcome
    const updatedDelivery = await recordDeliveryResult(
      delivery.id,
      deliveryResult.success,
      deliveryResult.errorMessage,
      this.config.maxAttempts,
    );

    // Update reminder recurrence or completion state if sent or permanently failed
    if (delivery.reminder_id && (deliveryResult.success || updatedDelivery?.status === "failed")) {
      await this.advanceOrCompleteReminder(delivery.auth_user_id, delivery.reminder_id, now);
    }

    return deliveryResult.success;
  }

  private async advanceOrCompleteReminder(
    authUserId: string,
    reminderId: string,
    now: Date,
  ): Promise<void> {
    const reminder = await getReminderByIdFromDb(authUserId, reminderId);
    if (!reminder || reminder.status !== "active") {
      return;
    }

    // Recurrence logic: compute next run date
    let nextRun = calculateNextExecution(reminder.next_run_at, reminder.recurrence);

    // Missed Occurrences Policy: If worker was down for multiple cycles, advance next_run_at to future
    while (nextRun && nextRun <= now) {
      nextRun = calculateNextExecution(nextRun, reminder.recurrence);
    }

    if (nextRun) {
      await updateReminderInDb(authUserId, reminderId, {
        nextRunAt: nextRun,
        status: "active",
      });
    } else {
      await updateReminderInDb(authUserId, reminderId, {
        status: "completed",
      });
    }
  }
}

export const globalScheduler = new ReminderSchedulerService();
