import {
  NotificationChannel,
  NotificationPayload,
  NotificationDeliveryResult,
} from "./notification-channel.interface.js";
import { EmailTransport } from "./email-transport.interface.js";
import { NodemailerTransport } from "./nodemailer-transport.service.js";
import { getUserByAuthId } from "../../repositories/user.repository.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export class EmailNotificationChannel implements NotificationChannel {
  channelId = "email";
  name = "Email Notification";
  private transport: EmailTransport;

  constructor(transport?: EmailTransport) {
    this.transport = transport || new NodemailerTransport();
  }

  isConfigured(): boolean {
    return this.transport.isConfigured();
  }

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    try {
      // 1. Resolve recipient email from authenticated user account record
      const user = await getUserByAuthId(payload.authUserId);
      if (!user || !user.email) {
        return {
          success: false,
          channel: this.channelId,
          errorMessage: "Recipient user email address not found in account",
        };
      }

      // 2. Format subject & body
      const rawTitle = payload.title.replace(/^Reminder:\s*/i, "");
      const cleanTitle = escapeHtml(rawTitle);
      const subject = `Reminder: ${rawTitle}`;
      const userName = escapeHtml(user.name || "there");
      const cleanMessage = payload.message ? escapeHtml(payload.message) : "";

      const text = [
        `Hi ${user.name || "there"},`,
        ``,
        `This is your Calby reminder:`,
        `${rawTitle}`,
        payload.message && payload.message !== rawTitle ? `\n${payload.message}` : ``,
        ``,
        `You can manage your reminders anytime in the Calby app.`,
      ].join("\n");

      const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; margin: 0;">
    <div style="max-width: 480px; margin: 0 auto; background-color: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 24px; shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-weight: 700; font-size: 16px; color: #ffffff;">Calby</span>
        <span style="font-size: 10px; font-weight: 600; color: #a3e635; background-color: rgba(163,230,53,0.1); border: 1px solid rgba(163,230,53,0.3); padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Reminder</span>
      </div>
      <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin: 12px 0 8px 0; line-height: 1.3;">
        ${cleanTitle}
      </h2>
      ${
        cleanMessage && cleanMessage !== cleanTitle
          ? `<p style="font-size: 14px; color: #a1a1aa; line-height: 1.5; margin: 0 0 16px 0;">${cleanMessage}</p>`
          : ""
      }
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #27272a; font-size: 12px; color: #71717a;">
        Sent automatically by Calby AI Assistant
      </div>
    </div>
  </body>
</html>
      `.trim();

      // 3. Dispatch via EmailTransport
      const result = await this.transport.sendEmail({
        to: user.email,
        subject,
        text,
        html,
      });

      if (!result.success) {
        return {
          success: false,
          channel: this.channelId,
          errorMessage: result.errorMessage || "Email transport failure",
        };
      }

      return {
        success: true,
        channel: this.channelId,
        metadata: {
          messageId: result.messageId,
          recipientEmail: user.email,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        channel: this.channelId,
        errorMessage: err?.message || "Unexpected exception during email delivery",
      };
    }
  }
}
