import {
  NotificationChannel,
  NotificationPayload,
  NotificationDeliveryResult,
} from "./notification-channel.interface.js";
import { WhatsAppTransport } from "./whatsapp-transport.interface.js";
import { MetaWhatsAppTransport } from "./meta-whatsapp-transport.service.js";
import { getDecryptedWhatsAppCredentials } from "./whatsapp-connection.service.js";
import { getUserByAuthId } from "../../repositories/user.repository.js";
import { getPool } from "../../db/pool.js";

export function normalizeE164PhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return null;
  }
  return digitsOnly;
}

export class WhatsAppNotificationChannel implements NotificationChannel {
  channelId = "whatsapp";
  name = "WhatsApp Notification";
  private transport: WhatsAppTransport;

  constructor(transport?: WhatsAppTransport) {
    this.transport = transport || new MetaWhatsAppTransport();
  }

  isConfigured(): boolean {
    return this.transport.isConfigured();
  }

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    try {
      // 1. Resolve decrypted user WhatsApp credentials (phoneNumberId, accessToken)
      const creds = await getDecryptedWhatsAppCredentials(payload.authUserId);
      if (!creds || !creds.accessToken || !creds.phoneNumberId) {
        return {
          success: false,
          channel: this.channelId,
          errorMessage: "WhatsApp Business credentials are not configured or active for this user account",
        };
      }

      // 2. Resolve recipient phone number
      const user = await getUserByAuthId(payload.authUserId);
      const recipientPhone = normalizeE164PhoneNumber((user as any)?.phone_number || (payload.metadata as any)?.recipientPhoneNumber);

      if (!recipientPhone) {
        return {
          success: false,
          channel: this.channelId,
          errorMessage: "Recipient WhatsApp phone number is missing or invalid in account record",
        };
      }

      // 3. Format mobile-optimized text message
      const rawTitle = payload.title.replace(/^Reminder:\s*/i, "");
      const messageText = payload.message && payload.message !== rawTitle
        ? `🔔 Calby Reminder: ${rawTitle}\n\n${payload.message}`
        : `🔔 Calby Reminder: ${rawTitle}`;

      // 4. Dispatch via WhatsAppTransport
      const result = await this.transport.sendMessage({
        phoneNumberId: creds.phoneNumberId,
        recipientPhoneNumber: recipientPhone,
        accessToken: creds.accessToken,
        messageText,
      });

      if (!result.success) {
        return {
          success: false,
          channel: this.channelId,
          errorMessage: result.errorMessage || "WhatsApp delivery failed",
        };
      }

      // 5. Persist provider message ID for webhook status correlation
      if (result.messageId) {
        try {
          await getPool().query(
            `
            UPDATE notification_deliveries
            SET provider_message_id = $1, whatsapp_status = 'sent'
            WHERE id = $2
            `,
            [result.messageId, payload.deliveryId],
          );
        } catch {}
      }

      return {
        success: true,
        channel: this.channelId,
        metadata: {
          whatsappMessageId: result.messageId,
          phoneNumberId: creds.phoneNumberId,
          recipientPhone,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        channel: this.channelId,
        errorMessage: err?.message || "Unexpected exception during WhatsApp notification dispatch",
      };
    }
  }
}
