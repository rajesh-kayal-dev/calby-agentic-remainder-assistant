export type ObligationType =
  | "custom"
  | "payment"
  | "subscription"
  | "free_trial"
  | "renewal"
  | "expiry"
  | "warranty"
  | "meeting"
  | "birthday"
  | "invoice";

export type OffsetUnit = "minutes" | "hours" | "days" | "weeks" | "months";

export interface RemindBeforeOffset {
  value: number;
  unit: OffsetUnit;
}

export interface ObligationMetadata {
  type: ObligationType;
  subject?: string;
  amount?: number;
  currency?: string;
  eventAt?: string;
  remindBefore?: RemindBeforeOffset;
  notes?: string;
  [key: string]: any;
}

export function calculateExecutionTimestamp(
  eventAt: Date | string,
  offset?: RemindBeforeOffset,
): Date {
  const eventDate = typeof eventAt === "string" ? new Date(eventAt) : new Date(eventAt.getTime());
  if (isNaN(eventDate.getTime())) {
    throw new Error("Invalid event date timestamp");
  }

  if (!offset || !offset.value || offset.value <= 0) {
    return eventDate;
  }

  const executionDate = new Date(eventDate.getTime());

  switch (offset.unit) {
    case "minutes":
      executionDate.setMinutes(executionDate.getMinutes() - offset.value);
      break;
    case "hours":
      executionDate.setHours(executionDate.getHours() - offset.value);
      break;
    case "days":
      executionDate.setDate(executionDate.getDate() - offset.value);
      break;
    case "weeks":
      executionDate.setDate(executionDate.getDate() - offset.value * 7);
      break;
    case "months":
      executionDate.setMonth(executionDate.getMonth() - offset.value);
      break;
    default:
      executionDate.setDate(executionDate.getDate() - offset.value);
  }

  return executionDate;
}

export function validateObligationInput(input: {
  type?: ObligationType;
  eventAt?: string | Date;
  remindBefore?: RemindBeforeOffset;
  amount?: number;
  currency?: string;
}): void {
  if (input.type && input.type !== "custom") {
    const requiresEventDate = [
      "subscription",
      "payment",
      "free_trial",
      "renewal",
      "expiry",
      "warranty",
      "meeting",
      "birthday",
      "invoice",
    ].includes(input.type);

    if (requiresEventDate && !input.eventAt) {
      throw new Error(`MISSING_REQUIRED_INFO: Event date is required for '${input.type}' obligation`);
    }
  }

  if (input.remindBefore) {
    if (input.remindBefore.value <= 0) {
      throw new Error("Reminder offset value must be greater than 0");
    }
    const validUnits: OffsetUnit[] = ["minutes", "hours", "days", "weeks", "months"];
    if (!validUnits.includes(input.remindBefore.unit)) {
      throw new Error(`Invalid offset unit '${input.remindBefore.unit}'`);
    }
  }

  if (input.amount !== undefined && input.amount < 0) {
    throw new Error("Obligation amount cannot be negative");
  }
}
