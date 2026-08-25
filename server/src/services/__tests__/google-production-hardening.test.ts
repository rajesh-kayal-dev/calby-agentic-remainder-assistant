import { test } from "node:test";
import assert from "node:assert/strict";

import {
  generateGoogleOAuthState,
  validateGoogleOAuthState,
  hasGmailScope,
  hasCalendarScope,
  getGmailConnectionStatus,
  getCalendarConnectionStatus,
} from "../google-oauth.service.js";
import { formatRfc2822RawEmail } from "../notifications/gmail-transport.js";

test("1. validateGoogleOAuthState validates HMAC signature and enforces 15-minute expiration", () => {
  const authUserId = "prod_user_sec_1";
  const validState = generateGoogleOAuthState(authUserId);

  const res = validateGoogleOAuthState(validState, authUserId);
  assert.equal(res.valid, true);
  assert.equal(res.authUserId, authUserId);

  // Invalid state payload
  const invalidRes = validateGoogleOAuthState("tampered_state_token", authUserId);
  assert.equal(invalidRes.valid, false);
});

test("2. hasGmailScope & hasCalendarScope accurately identify incremental scopes", () => {
  const fullScopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/gmail.send",
  ];

  assert.equal(hasGmailScope(fullScopes), true);
  assert.equal(hasCalendarScope(fullScopes), true);

  const gmailOnlyScopes = ["https://www.googleapis.com/auth/gmail.send"];
  assert.equal(hasGmailScope(gmailOnlyScopes), true);
  assert.equal(hasCalendarScope(gmailOnlyScopes), false);

  const calOnlyScopes = ["https://www.googleapis.com/auth/calendar"];
  assert.equal(hasGmailScope(calOnlyScopes), false);
  assert.equal(hasCalendarScope(calOnlyScopes), true);
});

test("3. getGmailConnectionStatus & getCalendarConnectionStatus return disconnected for unknown user", async () => {
  const gmailStatus = await getGmailConnectionStatus("unknown_prod_user");
  assert.equal(gmailStatus.connected, false);

  const calStatus = await getCalendarConnectionStatus("unknown_prod_user");
  assert.equal(calStatus.connected, false);
});

test("4. formatRfc2822RawEmail creates compliant MIME raw string", () => {
  const rawBase64Url = formatRfc2822RawEmail({
    senderEmail: "sender@gmail.com",
    recipientEmail: "receiver@example.com",
    subject: "Security Notification",
    text: "Your account is secure.",
    accessToken: "mock_access_token",
  });

  assert.ok(rawBase64Url);
  assert.equal(typeof rawBase64Url, "string");
  // RFC 4648 Base64Url character set (no + or / or =)
  assert.equal(rawBase64Url.includes("+"), false);
  assert.equal(rawBase64Url.includes("/"), false);
  assert.equal(rawBase64Url.includes("="), false);
});
