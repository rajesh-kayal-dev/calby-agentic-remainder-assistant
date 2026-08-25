import nodemailer from "nodemailer";
import {
  EmailTransport,
  SendEmailOptions,
  SendEmailResult,
} from "./email-transport.interface.js";

export class NodemailerTransport implements EmailTransport {
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;
  private fromName: string;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === "true";
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || "noreply@calby.app";
    this.fromName = process.env.EMAIL_FROM_NAME || "Calby Assistant";

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    if (this.enabled && host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
      });
    }
  }

  isConfigured(): boolean {
    return this.enabled && Boolean(this.transporter || process.env.SMTP_HOST);
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.isConfigured() || !this.transporter) {
      return {
        success: false,
        errorMessage: "Email transport is not configured or disabled",
      };
    }

    const sender = options.from || `"${this.fromName}" <${this.fromAddress}>`;

    try {
      const info = await this.transporter.sendMail({
        from: sender,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err?.message || "Nodemailer transport error",
      };
    }
  }
}
