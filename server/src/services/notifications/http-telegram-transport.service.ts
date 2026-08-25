import {
  TelegramTransport,
  SendTelegramMessageResult,
} from "./telegram-transport.interface.js";

export class HttpTelegramTransport implements TelegramTransport {
  private botToken: string | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.TELEGRAM_ENABLED === "true";
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
  }

  isConfigured(): boolean {
    return this.enabled && Boolean(this.botToken);
  }

  async sendMessage(chatId: string, text: string): Promise<SendTelegramMessageResult> {
    if (!this.isConfigured() || !this.botToken) {
      return {
        success: false,
        errorMessage: "Telegram transport is disabled or bot token is missing",
      };
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        result?: { message_id?: number };
        description?: string;
        error_code?: number;
        parameters?: { retry_after?: number };
      };

      if (!res.ok || !data.ok) {
        const isRateLimited = data.error_code === 429;
        return {
          success: false,
          errorMessage: data.description || `Telegram API error (${res.status})`,
          isRateLimited,
          retryAfterSeconds: data.parameters?.retry_after,
        };
      }

      return {
        success: true,
        messageId: data.result?.message_id,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err?.message || "HTTP network request failed for Telegram API",
      };
    }
  }
}
