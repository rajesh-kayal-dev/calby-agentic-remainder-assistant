import {
  NotificationChannel,
  NotificationPayload,
  NotificationDeliveryResult,
} from "./notification-channel.interface.js";
import { createNotification } from "../../repositories/notifications.repository.js";

export class InAppNotificationChannel implements NotificationChannel {
  channelId = "in_app";
  name = "In-App Notification";

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    try {
      await createNotification({
        authUserId: payload.authUserId,
        type: "REMINDER_DUE",
        title: payload.title,
        message: payload.message,
        metadata: {
          reminderId: payload.reminderId,
          deliveryId: payload.deliveryId,
          ...payload.metadata,
        },
      });

      return {
        success: true,
        channel: this.channelId,
      };
    } catch (err: any) {
      return {
        success: false,
        channel: this.channelId,
        errorMessage: err?.message || "Failed to deliver in-app notification",
      };
    }
  }
}
