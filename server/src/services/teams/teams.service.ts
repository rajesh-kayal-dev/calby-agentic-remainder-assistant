/**
 * Microsoft Teams service — create online meetings, send channel messages.
 *
 * Uses Nango-managed OAuth tokens via Microsoft Graph API.
 */

import { getProviderAccessToken } from "../integrations/integration.service.js";

const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

async function getTeamsToken(authUserId: string): Promise<string> {
  return getProviderAccessToken(authUserId, "microsoft-teams");
}

async function graphRequest<T>(
  authUserId: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getTeamsToken(authUserId);
  const url = `${GRAPH_API_BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Microsoft Graph ${method} ${path} failed (${res.status}): ${errText}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamsMeetingResult {
  id: string;
  subject: string;
  joinUrl: string;
  startDateTime: string;
  endDateTime: string;
  organizer?: string;
}

export interface TeamsMessageResult {
  id: string;
  body: string;
  createdDateTime: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a Microsoft Teams online meeting.
 */
export async function createMeeting(
  authUserId: string,
  subject: string,
  startIso: string,
  endIso: string,
  attendees?: string[],
): Promise<TeamsMeetingResult> {
  const meetingPayload: Record<string, unknown> = {
    subject,
    startDateTime: startIso,
    endDateTime: endIso,
  };

  if (attendees && attendees.length > 0) {
    meetingPayload.participants = {
      attendees: attendees.map((email) => ({
        upn: email,
        role: "attendee",
      })),
    };
  }

  const result = await graphRequest<{
    id: string;
    subject: string;
    joinUrl?: string;
    joinWebUrl?: string;
    startDateTime: string;
    endDateTime: string;
    organizer?: { upn?: string };
  }>(authUserId, "POST", "/me/onlineMeetings", meetingPayload);

  return {
    id: result.id,
    subject: result.subject,
    joinUrl: result.joinWebUrl || result.joinUrl || "",
    startDateTime: result.startDateTime,
    endDateTime: result.endDateTime,
    organizer: result.organizer?.upn,
  };
}

/**
 * Send a message to a Teams channel.
 */
export async function sendChannelMessage(
  authUserId: string,
  teamId: string,
  channelId: string,
  message: string,
): Promise<TeamsMessageResult> {
  const result = await graphRequest<{
    id: string;
    body: { content: string };
    createdDateTime: string;
  }>(authUserId, "POST", `/teams/${teamId}/channels/${channelId}/messages`, {
    body: {
      content: message,
      contentType: "text",
    },
  });

  return {
    id: result.id,
    body: result.body?.content || message,
    createdDateTime: result.createdDateTime,
  };
}

/**
 * Send a chat message to a user via Teams.
 */
export async function sendChatMessage(
  authUserId: string,
  userEmail: string,
  message: string,
): Promise<TeamsMessageResult> {
  // First, create or get the 1:1 chat
  const chat = await graphRequest<{
    id: string;
  }>(authUserId, "POST", "/chats", {
    chatType: "oneOnOne",
    members: [
      {
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${userEmail}')`,
        roles: ["owner"],
      },
    ],
  });

  // Then send the message
  const result = await graphRequest<{
    id: string;
    body: { content: string };
    createdDateTime: string;
  }>(authUserId, "POST", `/chats/${chat.id}/messages`, {
    body: {
      content: message,
      contentType: "text",
    },
  });

  return {
    id: result.id,
    body: result.body?.content || message,
    createdDateTime: result.createdDateTime,
  };
}
