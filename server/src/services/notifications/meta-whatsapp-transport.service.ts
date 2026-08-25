import {
  WhatsAppTransport,
  SendWhatsAppMessageOptions,
  SendWhatsAppMessageResult,
} from "./whatsapp-transport.interface.js";

export class MetaWhatsAppTransport implements WhatsAppTransport {
  private apiVersion: string;

  constructor() {
    this.apiVersion = process.env.WHATSAPP_API_VERSION || "v18.0";
  }

  isConfigured(): boolean {
    return true;
  }

  async sendMessage(options: SendWhatsAppMessageOptions): Promise<SendWhatsAppMessageResult> {
    if (!options.phoneNumberId || !options.accessToken) {
      return {
        success: false,
        errorMessage: "WhatsApp Phone Number ID and Access Token are required",
      };
    }

    if (!options.recipientPhoneNumber) {
      return {
        success: false,
        errorMessage: "Recipient phone number is required for WhatsApp delivery",
      };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${options.phoneNumberId}/messages`;

    // Construct Meta Graph API Payload (Template-first or Text fallback)
    const payload = options.templateName
      ? {
          messaging_product: "whatsapp",
          to: options.recipientPhoneNumber,
          type: "template",
          template: {
            name: options.templateName,
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: options.messageText },
                ],
              },
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          to: options.recipientPhoneNumber,
          type: "text",
          text: {
            body: options.messageText,
          },
        };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as {
        messaging_product?: string;
        messages?: Array<{ id: string }>;
        error?: {
          message?: string;
          type?: string;
          code?: number;
          error_subcode?: number;
        };
      };

      if (!response.ok || data.error) {
        const isRateLimited = response.status === 429 || data.error?.code === 130429;
        const errorMessage =
          data.error?.message || `Meta Graph API error (${response.status})`;

        return {
          success: false,
          errorMessage,
          isRateLimited,
        };
      }

      const messageId = data.messages?.[0]?.id;
      return {
        success: true,
        messageId,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err?.message || "HTTP network dispatch failed for Meta Graph API",
      };
    }
  }
}
