import test from "node:test";
import assert from "node:assert";
import { computeNextRunAt } from "../reports/scheduled-report.service.js";

test("Scheduled report computes next run", () => {
  const baseDate = new Date("2026-08-26T00:00:00Z");
  const schedule = {
    frequency: "daily" as const,
    timeOfDay: "14:00"
  };
  const next = computeNextRunAt(schedule, "UTC", baseDate);
  assert.ok(next instanceof Date);
});
