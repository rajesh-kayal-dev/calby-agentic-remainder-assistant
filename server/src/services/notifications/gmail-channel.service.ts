import {
  NotificationChannel,
  NotificationPayload,
  NotificationDeliveryResult,
} from "./notification-channel.interface.js";
import { defaultChannelRegistry } from "./channel-registry.js";
import { getValidGoogleAccessToken } from "../google-oauth.service.js";
import { resolveRecipientDestination } from "./recipient-resolver.service.js";
import { GmailTransport, GoogleGmailTransport } from "./gmail-transport.js";

export class GmailNotificationChannel implements NotificationChannel {
  public readonly channelId = "gmail";
  public readonly name = "Gmail";

  constructor(private transport: GmailTransport = new GoogleGmailTransport()) {}

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    try {
      // 1. Resolve fresh Google access token & sender email for authenticated user
      const { accessToken, senderEmail } = await getValidGoogleAccessToken(payload.authUserId);

      // 2. Resolve recipient email address
      const recipientId = (payload.metadata?.recipientId as string) || undefined;
      const resolvedRecipient = await resolveRecipientDestination(
        payload.authUserId,
        "email",
        recipientId,
      );

      const recipientEmail = resolvedRecipient.destination;
      const subject = payload.title || "Calby Reminder";
      const bodyText = payload.message || payload.title || "You have a Calby reminder.";
      const bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
          <h2 style="color: #18181b; margin-top: 0;">${payload.title}</h2>
          <p style="color: #52525b; font-size: 14px; line-height: 1.5;">${payload.message || ""}</p>
          <p style="color: #71717a; font-size: 12px; margin-top: 20px;">Sent via Calby AI Assistant</p>
        </div>
      `;

      // 3. Dispatch raw RFC 2822 email via Gmail REST API
      const result = await this.transport.sendEmail({
        senderEmail,
        recipientEmail,
        subject,
        text: bodyText,
        html: bodyHtml,
        accessToken,
      });

      return {
        success: true,
        channel: "gmail",
        metadata: { providerMessageId: result.messageId },
      };
    } catch (error: any) {
      const errorMessage = error?.message || "Gmail delivery failed";

      return {
        success: false,
        channel: "gmail",
        errorMessage,
      };
    }
  }
}

// Auto-register Gmail channel in global registry
defaultChannelRegistry.registerChannel(new GmailNotificationChannel());
