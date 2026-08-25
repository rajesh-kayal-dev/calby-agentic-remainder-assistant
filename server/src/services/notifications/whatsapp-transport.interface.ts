export interface SendWhatsAppMessageOptions {
  phoneNumberId: string;
  recipientPhoneNumber: string;
  accessToken: string;
  messageText: string;
  templateName?: string;
}

export interface SendWhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
  isRateLimited?: boolean;
}

export interface WhatsAppTransport {
  sendMessage(options: SendWhatsAppMessageOptions): Promise<SendWhatsAppMessageResult>;
  isConfigured(): boolean;
}
