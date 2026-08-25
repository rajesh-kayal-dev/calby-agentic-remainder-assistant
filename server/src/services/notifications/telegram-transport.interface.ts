export interface SendTelegramMessageResult {
  success: boolean;
  messageId?: number;
  errorMessage?: string;
  isRateLimited?: boolean;
  retryAfterSeconds?: number;
}

export interface TelegramTransport {
  sendMessage(chatId: string, text: string): Promise<SendTelegramMessageResult>;
  isConfigured(): boolean;
}
