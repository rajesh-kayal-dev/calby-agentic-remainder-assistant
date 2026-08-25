export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
}

export interface EmailTransport {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
  isConfigured(): boolean;
}
