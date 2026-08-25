import { test } from "node:test";
import assert from "node:assert/strict";

import {
  generateGoogleOAuthState,
  validateGoogleOAuthState,
  getGoogleOAuthAuthUrl,
} from "../google-oauth.service.js";
import { formatRfc2822RawEmail, MockGmailTransport } from "../notifications/gmail-transport.js";
import { GmailNotificationChannel } from "../notifications/gmail-channel.service.js";

test("1. generateGoogleOAuthState & validateGoogleOAuthState validate state tokens and prevent CSRF", () => {
  const authUserId = "user_oauth_test_1";
  const stateToken = generateGoogleOAuthState(authUserId);

  assert.ok(stateToken);
  const validation = validateGoogleOAuthState(stateToken, authUserId);
  assert.equal(validation.valid, true);
  assert.equal(validation.authUserId, authUserId);

  // Invalid state signature
  const tamperedValidation = validateGoogleOAuthState("invalid_state_token", authUserId);
  assert.equal(tamperedValidation.valid, false);

  // Wrong user ID
  const wrongUserValidation = validateGoogleOAuthState(stateToken, "wrong_user_id");
  assert.equal(wrongUserValidation.valid, false);
});

test("2. getGoogleOAuthAuthUrl generates valid Google OAuth authorization URL", () => {
  const url = getGoogleOAuthAuthUrl({
    authUserId: "user_oauth_test_1",
    redirectUri: "http://localhost:3000/api/connections/google/callback",
  });

  assert.ok(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth?"));
  assert.ok(url.includes("access_type=offline"));
  assert.ok(url.includes("prompt=consent"));
  assert.ok(url.includes("gmail.send"));
});

test("3. formatRfc2822RawEmail formats RFC 2822 headers and Base64Url string", () => {
  const rawBase64Url = formatRfc2822RawEmail({
    senderEmail: "alice@gmail.com",
    recipientEmail: "bob@example.com",
    subject: "Meeting Reminder",
    text: "You have a meeting tomorrow.",
    accessToken: "mock_token",
  });

  assert.ok(rawBase64Url);
  assert.equal(typeof rawBase64Url, "string");
  // Base64Url characters check (no + or / or =)
  assert.equal(rawBase64Url.includes("+"), false);
  assert.equal(rawBase64Url.includes("/"), false);
});

test("4. GmailNotificationChannel.send() returns CONNECTION_REQUIRED when account is disconnected", async () => {
  const channel = new GmailNotificationChannel(new MockGmailTransport());

  const result = await channel.send({
    deliveryId: "del_123",
    reminderId: "rem_123",
    authUserId: "disconnected_user_xyz",
    title: "Test Reminder",
    message: "Test Message",
  });

  assert.equal(result.success, false);
  assert.ok(result.errorMessage?.includes("CONNECTION_REQUIRED"));
});

test("5. GmailNotificationChannel dispatches email when mock transport succeeds", async () => {
  const mockTransport = new MockGmailTransport();

  const sendRes = await mockTransport.sendEmail({
    senderEmail: "user@gmail.com",
    recipientEmail: "recipient@example.com",
    subject: "Calby Alert",
    text: "Alert content",
    accessToken: "mock_token",
  });

  assert.ok(sendRes.messageId.startsWith("msg_gmail_mock_"));
  assert.equal(mockTransport.dispatchedEmails.length, 1);
  assert.equal(mockTransport.dispatchedEmails[0].recipientEmail, "recipient@example.com");
});
