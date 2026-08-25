import { test } from "node:test";
import assert from "node:assert/strict";

import {
  hasCalendarScope,
  getCalendarConnectionStatus,
} from "../google-oauth.service.js";
import { getCalendarAccessToken } from "../token.service.js";
import {
  listUpcomingMeetings,
  createMeeting,
  cancelMeeting,
  rescheduleMeeting,
  checkCalendarBusy,
} from "../calendar.service.js";

test("1. hasCalendarScope identifies Google Calendar permissions correctly", () => {
  assert.equal(
    hasCalendarScope(["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/gmail.send"]),
    true,
  );

  assert.equal(
    hasCalendarScope(["https://www.googleapis.com/auth/calendar.events"]),
    true,
  );

  assert.equal(
    hasCalendarScope(["https://www.googleapis.com/auth/gmail.send"]),
    false,
  );
});

test("2. getCalendarAccessToken throws CONNECTION_REQUIRED for disconnected user", async () => {
  await assert.rejects(
    async () => {
      await getCalendarAccessToken("disconnected_user_abc");
    },
    (err: any) => {
      assert.ok(err.message.includes("CONNECTION_REQUIRED"));
      return true;
    },
  );
});

test("3. getCalendarConnectionStatus returns disconnected state when user has no active Google OAuth connection", async () => {
  const status = await getCalendarConnectionStatus("non_existent_user");
  assert.equal(status.connected, false);
});
