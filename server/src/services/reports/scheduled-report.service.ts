import { getDueScheduledReports, markScheduledReportRun, getScheduledReportById } from "../../repositories/scheduled-report.repository.js";
import { generateReport } from "./report-engine.service.js";
import { executeReportDelivery } from "./report-delivery.service.js";
import { globalQueueDispatcher } from "../notifications/notification-queue.service.js";
import { ReportType } from "./report.types.js";

export function computeNextRunAt(
  schedule: {
    frequency: "daily" | "weekly" | "monthly";
    timeOfDay?: string; // HH:mm
    dayOfWeek?: number;
    dayOfMonth?: number;
  },
  timezone: string,
  baseDate: Date = new Date()
): Date {
  // A naive implementation for Phase 2C-3.
  // In production, use date-fns-tz or luxon to properly handle IANA timezones.

  const next = new Date(baseDate);
  const timeOfDay = schedule.timeOfDay || "09:00";
  const [hours, minutes] = timeOfDay.split(":").map(Number);

  if (schedule.frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (schedule.frequency === "weekly") {
    const currentDay = next.getDay();
    const targetDay = schedule.dayOfWeek ?? 1;
    const diff = targetDay - currentDay;
    const daysToAdd = diff <= 0 ? diff + 7 : diff;
    next.setDate(next.getDate() + daysToAdd);
  } else if (schedule.frequency === "monthly") {
    const targetDay = schedule.dayOfMonth ?? 1;
    next.setMonth(next.getMonth() + 1);
    next.setDate(targetDay);
  }

  next.setHours(hours, minutes, 0, 0);
  return next;
}

export class ScheduledReportScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.checkSchedules(), 30000); // 30 seconds
    console.log("[ScheduledReportScheduler] Started");
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async checkSchedules() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const now = new Date();
      const dueSchedules = await getDueScheduledReports(now);
      
      for (const schedule of dueSchedules) {
        // Dispatch to BullMQ via global dispatcher
        await globalQueueDispatcher.dispatchScheduledReport({
          scheduleId: schedule.id,
          authUserId: schedule.auth_user_id,
        });

        // Compute next run
        const nextRun = computeNextRunAt(schedule.schedule_definition, schedule.timezone, now);
        await markScheduledReportRun(schedule.id, now, nextRun);
      }
    } catch (err) {
      console.error("[ScheduledReportScheduler] Error checking schedules:", err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const scheduledReportScheduler = new ScheduledReportScheduler();

export async function executeScheduledReportJob(scheduleId: string, authUserId: string) {
  const schedule = await getScheduledReportById(authUserId, scheduleId);
  if (!schedule || !schedule.enabled) {
    return;
  }

  const report = await generateReport({
    authUserId,
    type: schedule.report_type as ReportType,
    ...schedule.report_parameters,
  });

  await executeReportDelivery({
    authUserId,
    report,
    type: schedule.report_type as ReportType,
    channel: schedule.channel as any,
    contactId: schedule.recipient_id || undefined,
    recipientName: "User", // Can be resolved
    recipientIsOwner: !schedule.recipient_id,
  });
}
