export interface GmailSendEmailInput {
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  text: string;
  html?: string;
  accessToken: string;
}

export interface GmailSendResult {
  messageId: string;
}

export interface GmailTransport {
  sendEmail(input: GmailSendEmailInput): Promise<GmailSendResult>;
}

export function formatRfc2822RawEmail(input: GmailSendEmailInput): string {
  const lines = [
    `From: ${input.senderEmail}`,
    `To: ${input.recipientEmail}`,
    `Subject: =?utf-8?B?${Buffer.from(input.subject).toString("base64")}?=`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    "",
    input.html || `<p>${input.text}</p>`,
  ];

  const rawString = lines.join("\r\n");
  return Buffer.from(rawString)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export class GoogleGmailTransport implements GmailTransport {
  async sendEmail(input: GmailSendEmailInput): Promise<GmailSendResult> {
    const rawBase64Url = formatRfc2822RawEmail(input);

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: rawBase64Url,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 401) {
        throw new Error(`CONNECTION_REQUIRED: Gmail access unauthorized or token expired (401): ${errorText}`);
      }
      if (res.status === 403) {
        throw new Error(`CONNECTION_REQUIRED: Gmail scope or permission denied (403): ${errorText}`);
      }
      if (res.status === 429) {
        throw new Error(`GMAIL_RATE_LIMIT: Gmail API rate limit exceeded (429): ${errorText}`);
      }
      throw new Error(`Gmail API send failed (${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as { id: string };
    return { messageId: data.id };
  }
}

export class MockGmailTransport implements GmailTransport {
  public dispatchedEmails: GmailSendEmailInput[] = [];

  async sendEmail(input: GmailSendEmailInput): Promise<GmailSendResult> {
    this.dispatchedEmails.push(input);
    return { messageId: `msg_gmail_mock_${Date.now()}` };
  }
}
