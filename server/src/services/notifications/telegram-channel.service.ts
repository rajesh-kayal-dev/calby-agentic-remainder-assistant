import {
  NotificationChannel,
  NotificationPayload,
  NotificationDeliveryResult,
} from "./notification-channel.interface.js";
import { TelegramTransport } from "./telegram-transport.interface.js";
import { HttpTelegramTransport } from "./http-telegram-transport.service.js";
import { getUserTelegramConnection } from "./telegram-connection.service.js";

function escapeTelegramHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export class TelegramNotificationChannel implements NotificationChannel {
  channelId = "telegram";
  name = "Telegram Notification";
  private transport: TelegramTransport;

  constructor(transport?: TelegramTransport) {
    this.transport = transport || new HttpTelegramTransport();
  }

  isConfigured(): boolean {
    return this.transport.isConfigured();
  }

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    try {
      // 1. Resolve user's connected Telegram chat_id
      const connection = await getUserTelegramConnection(payload.authUserId);
      if (!connection.connected || !connection.chatId) {
        return {
          success: false,
          channel: this.channelId,
          errorMessage: "Telegram notification channel is not connected for this user account",
        };
      }

      // 2. Format concise Telegram HTML message
      const rawTitle = payload.title.replace(/^Reminder:\s*/i, "");
      const cleanTitle = escapeTelegramHtml(rawTitle);
      const cleanMessage = payload.message ? escapeTelegramHtml(payload.message) : "";

      const text = [
        `<b>🔔 Calby Reminder</b>`,
        ``,
        `<b>${cleanTitle}</b>`,
        cleanMessage && cleanMessage !== cleanTitle ? `${cleanMessage}` : ``,
      ]
        .filter(Boolean)
        .join("\n");

      // 3. Dispatch via TelegramTransport
      const result = await this.transport.sendMessage(connection.chatId, text);

      if (!result.success) {
        return {
          success: false,
          channel: this.channelId,
          errorMessage: result.errorMessage || "Telegram transport delivery failure",
        };
      }

      return {
        success: true,
        channel: this.channelId,
        metadata: {
          telegramMessageId: result.messageId,
          chatId: connection.chatId,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        channel: this.channelId,
        errorMessage: err?.message || "Unexpected exception during Telegram notification delivery",
      };
    }
  }
}
