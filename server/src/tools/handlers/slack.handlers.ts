/**
 * Slack AI tool handlers.
 */

import {
  sendMessage,
  searchMessages,
} from "../../services/slack/slack.service.js";

export async function handleSendSlackMessage(
  authUserId: string,
  input: { channel: string; text: string },
) {
  return sendMessage(authUserId, input.channel, input.text);
}

export async function handleSearchSlackMessages(
  authUserId: string,
  input: { query: string; maxResults?: number },
) {
  return searchMessages(authUserId, input.query, input.maxResults);
}
