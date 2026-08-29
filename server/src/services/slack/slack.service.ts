/**
 * Slack service — send messages, search messages, list channels.
 *
 * Uses Nango-managed OAuth tokens via the Slack Web API.
 */

import { getProviderAccessToken } from "../integrations/integration.service.js";

const SLACK_API_BASE = "https://slack.com/api";

async function getSlackToken(authUserId: string): Promise<string> {
  return getProviderAccessToken(authUserId, "slack");
}

async function slackRequest<T>(
  authUserId: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const token = await getSlackToken(authUserId);
  const url = `${SLACK_API_BASE}/${method}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Slack API ${method} failed (${res.status})`);
  }

  const data = (await res.json()) as any;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error || "unknown error"}`);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount?: number;
}

export interface SlackMessageResult {
  channel: string;
  ts: string;
  text: string;
}

export interface SlackSearchResult {
  messages: Array<{
    text: string;
    username: string;
    channel: string;
    channelName: string;
    ts: string;
    permalink: string;
  }>;
  totalResults: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a message to a Slack channel.
 */
export async function sendMessage(
  authUserId: string,
  channel: string,
  text: string,
): Promise<SlackMessageResult> {
  const result = await slackRequest<{
    channel: string;
    ts: string;
    message: { text: string };
  }>(authUserId, "chat.postMessage", { channel, text });

  return {
    channel: result.channel,
    ts: result.ts,
    text: result.message?.text || text,
  };
}

/**
 * Search messages across the user's Slack workspace.
 */
export async function searchMessages(
  authUserId: string,
  query: string,
  maxResults = 10,
): Promise<SlackSearchResult> {
  const result = await slackRequest<{
    messages: {
      matches: Array<{
        text: string;
        username: string;
        channel: { id: string; name: string };
        ts: string;
        permalink: string;
      }>;
      total: number;
    };
  }>(authUserId, "search.messages", {
    query,
    count: maxResults,
    sort: "timestamp",
    sort_dir: "desc",
  });

  return {
    messages: (result.messages?.matches || []).map((m) => ({
      text: m.text,
      username: m.username,
      channel: m.channel?.id || "",
      channelName: m.channel?.name || "",
      ts: m.ts,
      permalink: m.permalink,
    })),
    totalResults: result.messages?.total || 0,
  };
}

/**
 * List accessible channels in the user's Slack workspace.
 */
export async function listChannels(
  authUserId: string,
  maxResults = 50,
): Promise<SlackChannel[]> {
  const result = await slackRequest<{
    channels: Array<{
      id: string;
      name: string;
      is_private: boolean;
      num_members?: number;
    }>;
  }>(authUserId, "conversations.list", {
    limit: maxResults,
    exclude_archived: true,
    types: "public_channel,private_channel",
  });

  return (result.channels || []).map((c) => ({
    id: c.id,
    name: c.name,
    isPrivate: c.is_private,
    memberCount: c.num_members,
  }));
}
