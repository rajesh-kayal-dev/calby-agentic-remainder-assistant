import { NotificationChannel } from "./notification-channel.interface.js";
import { InAppNotificationChannel } from "./in-app-channel.service.js";
import { EmailNotificationChannel } from "./email-channel.service.js";
import { TelegramNotificationChannel } from "./telegram-channel.service.js";
import { WhatsAppNotificationChannel } from "./whatsapp-channel.service.js";

export class NotificationChannelRegistry {
  private channels = new Map<string, NotificationChannel>();

  constructor() {
    // Default pre-registered channels
    const inApp = new InAppNotificationChannel();
    this.registerChannel(inApp);

    const email = new EmailNotificationChannel();
    this.registerChannel(email);

    const telegram = new TelegramNotificationChannel();
    this.registerChannel(telegram);

    const whatsapp = new WhatsAppNotificationChannel();
    this.registerChannel(whatsapp);
  }

  registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.channelId, channel);
  }

  getChannel(channelId: string): NotificationChannel | undefined {
    return this.channels.get(channelId);
  }

  hasChannel(channelId: string): boolean {
    return this.channels.has(channelId);
  }

  getAvailableChannels(): { id: string; name: string; enabled: boolean }[] {
    return Array.from(this.channels.values()).map((ch) => {
      const isConfigured = (ch as any).isConfigured ? (ch as any).isConfigured() : true;
      return {
        id: ch.channelId,
        name: ch.name,
        enabled: Boolean(isConfigured),
      };
    });
  }
}

export const defaultChannelRegistry = new NotificationChannelRegistry();
