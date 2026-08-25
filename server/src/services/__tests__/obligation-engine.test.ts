import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calculateExecutionTimestamp,
  validateObligationInput,
  ObligationType,
} from "../obligation.service.js";

test("1. calculateExecutionTimestamp subtracts days, weeks, and months correctly", () => {
  const eventDate = new Date("2026-09-10T10:00:00Z");

  // 5 days before
  const resDays = calculateExecutionTimestamp(eventDate, { value: 5, unit: "days" });
  assert.equal(resDays.toISOString(), "2026-09-05T10:00:00.000Z");

  // 2 weeks before
  const resWeeks = calculateExecutionTimestamp(eventDate, { value: 2, unit: "weeks" });
  assert.equal(resWeeks.toISOString(), "2026-08-27T10:00:00.000Z");

  // 1 month before
  const resMonths = calculateExecutionTimestamp(eventDate, { value: 1, unit: "months" });
  assert.equal(resMonths.toISOString(), "2026-08-10T10:00:00.000Z");
});

test("2. validateObligationInput throws MISSING_REQUIRED_INFO for subscription without event date", () => {
  assert.throws(
    () => {
      validateObligationInput({
        type: "subscription",
      });
    },
    { message: "MISSING_REQUIRED_INFO: Event date is required for 'subscription' obligation" },
  );
});

test("3. validateObligationInput rejects negative amounts and invalid offset values", () => {
  assert.throws(
    () => {
      validateObligationInput({
        type: "payment",
        eventAt: "2026-09-15T00:00:00Z",
        amount: -100,
      });
    },
    { message: "Obligation amount cannot be negative" },
  );

  assert.throws(
    () => {
      validateObligationInput({
        remindBefore: { value: 0, unit: "days" },
      });
    },
    { message: "Reminder offset value must be greater than 0" },
  );
});

test("4. Obligation engine preserves backward compatibility with custom reminders", () => {
  const eventDate = new Date("2026-09-10T10:00:00Z");
  const execDate = calculateExecutionTimestamp(eventDate, undefined);
  assert.equal(execDate.toISOString(), eventDate.toISOString());
});
