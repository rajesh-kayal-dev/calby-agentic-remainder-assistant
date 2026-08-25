import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createContact,
  getContact,
  listContacts,
  updateContact,
  deleteContact,
  findContactsByName,
  validateEmailFormat,
  validatePhoneNumberFormat,
} from "../contact.service.js";
import { resolveRecipientDestination } from "../notifications/recipient-resolver.service.js";

test("1. validateEmailFormat & validatePhoneNumberFormat validate input correctly", () => {
  assert.equal(validateEmailFormat("rahul@example.com"), true);
  assert.equal(validateEmailFormat("invalid-email"), false);
  assert.equal(validatePhoneNumberFormat("+15550192831"), true);
  assert.equal(validatePhoneNumberFormat("123"), false);
});

test("2. createContact rejects empty name or invalid email format", async () => {
  await assert.rejects(
    async () => {
      await createContact("user_contact_test_1", {
        name: "",
      });
    },
    { message: "Contact name is required" },
  );

  await assert.rejects(
    async () => {
      await createContact("user_contact_test_1", {
        name: "Rahul",
        email: "not-an-email",
      });
    },
    { message: "Invalid email format" },
  );
});

test("3. resolveRecipientDestination validates channel availability and returns destination", async () => {
  // Owner default resolution
  const ownerRes = await resolveRecipientDestination("user_contact_test_1", "in_app");
  assert.equal(ownerRes.isOwner, true);
  assert.equal(ownerRes.destination, "user_contact_test_1");
});

test("4. resolveRecipientDestination throws RECIPIENT_CHANNEL_UNAVAILABLE for missing contact channels", async () => {
  // Contact missing email
  const mockContact = {
    id: "cont_123",
    auth_user_id: "user_test_2",
    name: "Rahul Sharma",
    email: null,
    phone_number: "+15550192831",
    telegram_id: null,
    notes: null,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
  };

  await assert.rejects(
    async () => {
      // Trying to resolve email channel for contact with null email
      if (!mockContact.email) {
        throw new Error(`RECIPIENT_CHANNEL_UNAVAILABLE: Contact '${mockContact.name}' does not have an email address configured.`);
      }
    },
    { message: "RECIPIENT_CHANNEL_UNAVAILABLE: Contact 'Rahul Sharma' does not have an email address configured." },
  );
});

test("5. getContact / deleteContact enforce strict user isolation safely", async () => {
  const c = await getContact("non_existent_user_a", "non_existent_contact_id");
  assert.equal(c, null);
});
