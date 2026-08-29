/**
 * Gmail AI tool handlers.
 */

import {
  searchEmails,
  getMessage,
  sendEmail,
} from "../../services/gmail/gmail.service.js";

export async function handleSearchEmails(
  authUserId: string,
  input: { query: string; maxResults?: number },
) {
  const result = await searchEmails(authUserId, input.query, input.maxResults);
  return result;
}

export async function handleGetMessage(
  authUserId: string,
  input: { messageId: string },
) {
  const result = await getMessage(authUserId, input.messageId);
  return result;
}

export async function handleSendEmail(
  authUserId: string,
  input: { to: string; subject: string; body: string },
) {
  const result = await sendEmail(authUserId, input.to, input.subject, input.body);
  return result;
}
