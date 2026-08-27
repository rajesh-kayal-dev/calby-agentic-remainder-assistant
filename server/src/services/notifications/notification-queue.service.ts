import { Queue, Worker } from "bullmq";
import RedisPkg from "ioredis";
import { defaultChannelRegistry } from "./channel-registry.js";
import {
  updateNotificationDeliveryInDb,
  getReminderByIdFromDb,
} from "../../repositories/reminder.repository.js";
import { executeScheduledReportJob } from "../reports/scheduled-report.service.js";

const RedisClient = (RedisPkg as any).default || RedisPkg;

export interface DeliveryJobPayload {
  deliveryId: string;
  reminderId: string;
  authUserId: string;
  channel: string;
  scheduledAt: string;
}

export interface ScheduledReportJobPayload {
  scheduleId: string;
  authUserId: string;
}

export interface NotificationQueueDispatcher {
  dispatchDelivery(payload: DeliveryJobPayload): Promise<void>;
  dispatchScheduledReport(payload: ScheduledReportJobPayload): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRedisEnabled(): boolean;
}

export class InlineNotificationDispatcher implements NotificationQueueDispatcher {
  isRedisEnabled(): boolean {
    return false;
  }

  async start(): Promise<void> {}
  async stop(): Promise<void> {}

  async dispatchScheduledReport(payload: ScheduledReportJobPayload): Promise<void> {
    try {
      await executeScheduledReportJob(payload.scheduleId, payload.authUserId);
    } catch (err) {
      console.error("[InlineNotificationDispatcher] Error executing scheduled report:", err);
    }
  }

  async dispatchDelivery(payload: DeliveryJobPayload): Promise<void> {
    const channelImpl = defaultChannelRegistry.getChannel(payload.channel);
    if (!channelImpl) {
      try {
        await updateNotificationDeliveryInDb(payload.deliveryId, {
          status: "failed",
          errorMessage: `Unregistered notification channel '${payload.channel}'`,
        });
      } catch {}
      return;
    }

    let title = "Reminder Alert";
    let message = "You have a scheduled reminder.";
    let metadata = {};

    try {
      const reminder = await getReminderByIdFromDb(payload.authUserId, payload.reminderId);
      if (reminder) {
        title = `Reminder: ${reminder.title}`;
        message = reminder.description || reminder.title;
        metadata = reminder.metadata || {};
      }
    } catch {}

    const result = await channelImpl.send({
      deliveryId: payload.deliveryId,
      reminderId: payload.reminderId,
      authUserId: payload.authUserId,
      title,
      message,
      metadata,
    });

    try {
      await updateNotificationDeliveryInDb(payload.deliveryId, {
        status: result.success ? "sent" : "failed",
        deliveredAt: result.success ? new Date() : undefined,
        errorMessage: result.errorMessage,
      });
    } catch {}
  }
}

export class BullMQNotificationDispatcher implements NotificationQueueDispatcher {
  private queue: Queue<DeliveryJobPayload> | null = null;
  private worker: Worker<DeliveryJobPayload> | null = null;
  private redisConnection: any = null;
  private redisUrl: string;

  constructor(redisUrl?: string) {
    this.redisUrl = redisUrl || process.env.REDIS_URL || "";
  }

  isRedisEnabled(): boolean {
    return Boolean(this.redisUrl);
  }

  async start(): Promise<void> {
    if (!this.redisUrl) {
      return;
    }

    // 1. Establish Redis Connection
    this.redisConnection = new RedisClient(this.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    // 2. Initialize BullMQ Queue
    this.queue = new Queue<DeliveryJobPayload>("calby-notifications", {
      connection: this.redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });

    // 3. Initialize Worker with Rate Limiting
    this.worker = new Worker<DeliveryJobPayload>(
      "calby-notifications",
      async (job) => {
        const payload = job.data;
        const channelImpl = defaultChannelRegistry.getChannel(payload.channel);

        if (!channelImpl) {
          await updateNotificationDeliveryInDb(payload.deliveryId, {
            status: "failed",
            errorMessage: `Unregistered notification channel '${payload.channel}'`,
          });
          return;
        }

        const reminder = await getReminderByIdFromDb(payload.authUserId, payload.reminderId);
        const title = reminder ? `Reminder: ${reminder.title}` : "Reminder Alert";
        const message = reminder?.description || reminder?.title || "You have a scheduled reminder.";

        const result = await channelImpl.send({
          deliveryId: payload.deliveryId,
          reminderId: payload.reminderId,
          authUserId: payload.authUserId,
          title,
          message,
          metadata: reminder?.metadata || {},
        });

        if (!result.success) {
          await updateNotificationDeliveryInDb(payload.deliveryId, {
            status: "failed",
            errorMessage: result.errorMessage,
          });
          throw new Error(result.errorMessage || "Notification delivery failed");
        }

        await updateNotificationDeliveryInDb(payload.deliveryId, {
          status: "sent",
          deliveredAt: new Date(),
        });
      },
      {
        connection: this.redisConnection,
        concurrency: 10,
        limiter: {
          max: 30, // Telegram / provider safety cap
          duration: 1000,
        },
      },
    );

    // 4. Initialize Worker for Scheduled Reports
    new Worker<ScheduledReportJobPayload>(
      "calby-reports",
      async (job) => {
        const payload = job.data;
        await executeScheduledReportJob(payload.scheduleId, payload.authUserId);
      },
      {
        connection: this.redisConnection,
        concurrency: 5,
      },
    );
  }

  async dispatchDelivery(payload: DeliveryJobPayload): Promise<void> {
    if (!this.queue) {
      throw new Error("BullMQ queue is not initialized. Call start() first.");
    }

    await this.queue.add("deliver-notification", payload, {
      jobId: payload.deliveryId, // Database idempotency mapping
    });
  }

  async dispatchScheduledReport(payload: ScheduledReportJobPayload): Promise<void> {
    if (!this.redisConnection) {
      throw new Error("Redis is not initialized. Call start() first.");
    }

    const reportQueue = new Queue<ScheduledReportJobPayload>("calby-reports", {
      connection: this.redisConnection,
    });
    
    await reportQueue.add("run-scheduled-report", payload, {
      jobId: `report-${payload.scheduleId}-${Date.now()}`,
    });
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
    if (this.redisConnection) {
      await this.redisConnection.quit();
      this.redisConnection = null;
    }
  }
}

export function createNotificationDispatcher(): NotificationQueueDispatcher {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl && redisUrl.trim().length > 0) {
    return new BullMQNotificationDispatcher(redisUrl);
  }
  return new InlineNotificationDispatcher();
}

export const globalQueueDispatcher = createNotificationDispatcher();
