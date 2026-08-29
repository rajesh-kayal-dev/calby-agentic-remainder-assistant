/**
 * Gmail service — search, read, and send via Nango-managed OAuth tokens.
 *
 * Falls back to existing Google OAuth for users who haven't migrated to Nango.
 */

import { getProviderAccessToken } from "../integrations/integration.service.js";
import { getValidGoogleAccessToken } from "../google-oauth.service.js";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

// ---------------------------------------------------------------------------
// Token resolution — Nango first, legacy fallback
// ---------------------------------------------------------------------------

async function getGmailToken(authUserId: string): Promise<string> {
  // Try Nango-managed 'gmail' integration
  if (process.env.NANGO_SECRET_KEY) {
    try {
      return await getProviderAccessToken(authUserId, "gmail");
    } catch {
      // Fall through to legacy path
    }
  }

  // Fall back to existing Google OAuth (shares refresh token with Calendar)
  const { accessToken } = await getValidGoogleAccessToken(authUserId);
  return accessToken;
}

async function gmailRequest<T>(
  authUserId: string,
  path: string,
  options?: { method?: string; body?: unknown; params?: Record<string, string> },
): Promise<T> {
  const token = await getGmailToken(authUserId);
  const params = new URLSearchParams(options?.params || {});
  const queryStr = params.toString();
  const url = `${GMAIL_API_BASE}${path}${queryStr ? `?${queryStr}` : ""}`;

  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gmail API ${path} failed (${res.status}): ${errText}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GmailSearchResult {
  messages: Array<{
    id: string;
    threadId: string;
    snippet: string;
    subject: string;
    from: string;
    date: string;
  }>;
  totalResults: number;
}

/**
 * Search emails using Gmail's search syntax.
 */
export async function searchEmails(
  authUserId: string,
  query: string,
  maxResults = 10,
): Promise<GmailSearchResult> {
  const listRes = await gmailRequest<{
    messages?: Array<{ id: string; threadId: string }>;
    resultSizeEstimate?: number;
  }>(authUserId, "/messages", {
    params: { q: query, maxResults: String(maxResults) },
  });

  const messageRefs = listRes.messages || [];

  // Fetch message headers in parallel (max 10)
  const messages = await Promise.all(
    messageRefs.slice(0, 10).map(async (ref) => {
      try {
        const msg = await gmailRequest<{
          id: string;
          threadId: string;
          snippet: string;
          payload?: {
            headers?: Array<{ name: string; value: string }>;
          };
          internalDate?: string;
        }>(authUserId, `/messages/${ref.id}`, {
          params: { format: "metadata", metadataHeaders: "Subject,From,Date" },
        });

        const getHeader = (name: string) =>
          msg.payload?.headers?.find(
            (h) => h.name.toLowerCase() === name.toLowerCase(),
          )?.value || "";

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: msg.snippet || "",
          subject: getHeader("Subject"),
          from: getHeader("From"),
          date: getHeader("Date"),
        };
      } catch {
        return {
          id: ref.id,
          threadId: ref.threadId,
          snippet: "",
          subject: "(could not load)",
          from: "",
          date: "",
        };
      }
    }),
  );

  return {
    messages,
    totalResults: listRes.resultSizeEstimate || messages.length,
  };
}

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
}

/**
 * Get a single email message with body content.
 */
export async function getMessage(
  authUserId: string,
  messageId: string,
): Promise<GmailMessageDetail> {
  const msg = await gmailRequest<{
    id: string;
    threadId: string;
    snippet: string;
    payload?: {
      headers?: Array<{ name: string; value: string }>;
      body?: { data?: string };
      parts?: Array<{
        mimeType: string;
        body?: { data?: string };
      }>;
    };
  }>(authUserId, `/messages/${messageId}`, {
    params: { format: "full" },
  });

  const getHeader = (name: string) =>
    msg.payload?.headers?.find(
      (h) => h.name.toLowerCase() === name.toLowerCase(),
    )?.value || "";

  // Decode body — prefer text/plain, then text/html
  let body = "";
  const parts = msg.payload?.parts || [];
  const textPart = parts.find((p) => p.mimeType === "text/plain");
  const htmlPart = parts.find((p) => p.mimeType === "text/html");

  const rawData =
    textPart?.body?.data || htmlPart?.body?.data || msg.payload?.body?.data;

  if (rawData) {
    try {
      body = Buffer.from(rawData, "base64url").toString("utf-8");
    } catch {
      body = "(Could not decode message body)";
    }
  }

  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: getHeader("Subject"),
    from: getHeader("From"),
    to: getHeader("To"),
    date: getHeader("Date"),
    snippet: msg.snippet || "",
    body,
  };
}

/**
 * Send an email via Gmail API (RFC 2822 format).
 */
export async function sendEmail(
  authUserId: string,
  to: string,
  subject: string,
  body: string,
): Promise<{ messageId: string; threadId: string }> {
  const token = await getGmailToken(authUserId);

  // Build RFC 2822 MIME message
  const mimeMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const encodedMessage = Buffer.from(mimeMessage)
    .toString("base64url");

  const res = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gmail send failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { id: string; threadId: string };
  return { messageId: data.id, threadId: data.threadId };
}
