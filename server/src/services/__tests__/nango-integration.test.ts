import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PROVIDER_TO_NANGO_INTEGRATION,
  NANGO_OAUTH_PROVIDERS,
} from "../nango/nango.types.js";

test("1. Nango types map all OAuth providers correctly", () => {
  assert.equal(PROVIDER_TO_NANGO_INTEGRATION["google-calendar"], "google-calendar");
  assert.equal(PROVIDER_TO_NANGO_INTEGRATION["gmail"], "google-mail");
  assert.equal(PROVIDER_TO_NANGO_INTEGRATION["google-drive"], "google-drive");
  assert.equal(PROVIDER_TO_NANGO_INTEGRATION["notion"], "notion");
  assert.equal(PROVIDER_TO_NANGO_INTEGRATION["slack"], "slack");
  assert.equal(PROVIDER_TO_NANGO_INTEGRATION["microsoft-teams"], "microsoft-teams");

  assert.equal(NANGO_OAUTH_PROVIDERS.has("google-calendar"), false);
  assert.equal(NANGO_OAUTH_PROVIDERS.has("gmail"), true);
  assert.equal(NANGO_OAUTH_PROVIDERS.has("notion"), true);
  assert.equal(NANGO_OAUTH_PROVIDERS.has("slack"), true);
  assert.equal(NANGO_OAUTH_PROVIDERS.has("microsoft-teams"), true);
});

test("2. Nango client throws when NANGO_SECRET_KEY is missing", async () => {
  const originalKey = process.env.NANGO_SECRET_KEY;
  delete process.env.NANGO_SECRET_KEY;

  try {
    const { getToken } = await import("../nango/nango.client.js");
    await assert.rejects(
      async () => getToken("google-calendar", "test-user"),
      /NANGO_SECRET_KEY is not set/,
    );
  } finally {
    if (originalKey) process.env.NANGO_SECRET_KEY = originalKey;
  }
});
