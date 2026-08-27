/**
 * Date Range Service
 *
 * Resolves human-readable presets ("this_month", "last_week", etc.)
 * into concrete UTC Date boundaries for use in database queries.
 *
 * All boundary calculations respect the user's IANA timezone so that
 * "this month" means their local calendar month, not UTC.
 */

import type { DateRangePreset, ReportDateRange } from "./report.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function startOfDayInTz(date: Date, tz: string): Date {
  // Format: "2026-08-01" in the target timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localStr = formatter.format(date); // "2026-08-01"
  // Treat as midnight in that timezone → convert to UTC
  return new Date(`${localStr}T00:00:00`);
  // Note: Using local JS Date parse which treats the string as local time.
  // This gives us midnight in the server's local time which may differ.
  // We use the Intl approach below for correctness.
}

/**
 * Returns midnight (00:00:00) at the start of `date` in the given IANA timezone,
 * returned as a UTC Date suitable for database comparison.
 */
function tzMidnightStart(date: Date, tz: string): Date {
  // Get local date parts
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  const year = get("year");
  const month = get("month");
  const day = get("day");

  // Construct ISO string in that timezone using fixed offset isn't trivial;
  // instead we use the trick of offsetting from UTC.
  // Build the target local time using a Date constructor with offset compensation.
  const localNoon = new Date(
    Date.UTC(year, month - 1, day, 12, 0, 0)
  );

  // Find the offset: what UTC time corresponds to midnight local?
  // offsetMs = localNoon.getTime() - Date.UTC(y,m,d,h,min,s where h:min:s is the local time of localNoon)
  const noonParts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(localNoon);

  const noonGet = (type: string) =>
    parseInt(noonParts.find((p) => p.type === type)?.value ?? "0", 10);

  const h = noonGet("hour");
  const min = noonGet("minute");
  const sec = noonGet("second");

  // offsetMs: localNoon in UTC minus what the local clock shows
  const offsetMs =
    localNoon.getTime() - Date.UTC(year, month - 1, day, h, min, sec);

  // Midnight UTC = midnight local time minus offset
  const midnightUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMs);
  return midnightUtc;
}

/**
 * Returns end of day (23:59:59.999) for `date` in the given timezone, as UTC.
 */
function tzMidnightEnd(date: Date, tz: string): Date {
  const start = tzMidnightStart(date, tz);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Advance `date` by `days` calendar days in the given timezone.
 */
function addDaysInTz(date: Date, days: number, tz: string): Date {
  // Get local date parts of `date`
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const result = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return tzMidnightStart(result, tz);
}

/**
 * Returns the local calendar day-of-week for `date` in the given timezone (0=Sunday).
 */
function localDayOfWeek(date: Date, tz: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  });
  const day = formatter.format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}

/**
 * Returns start-of-month (1st day at 00:00) in the given timezone, as UTC.
 */
function tzStartOfMonth(date: Date, tz: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  const firstDay = new Date(Date.UTC(get("year"), get("month") - 1, 1, 12, 0, 0));
  return tzMidnightStart(firstDay, tz);
}

/**
 * Returns end-of-month (last day at 23:59:59.999) in the given timezone, as UTC.
 */
function tzEndOfMonth(date: Date, tz: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  const year = get("year");
  const month = get("month");
  // First day of NEXT month minus 1ms
  const firstOfNext = new Date(Date.UTC(year, month, 1, 12, 0, 0));
  const startOfNext = tzMidnightStart(firstOfNext, tz);
  return new Date(startOfNext.getTime() - 1);
}

/**
 * Get a human-readable month label: "August 2026"
 */
function monthLabel(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Get a human-readable date label: "August 25, 2026"
 */
export function formatLocalDate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Resolver
// ─────────────────────────────────────────────────────────────────────────────

export function resolveDateRange(
  preset: DateRangePreset,
  timezone: string,
  customStart?: string,
  customEnd?: string,
): ReportDateRange {
  const tz = timezone || "UTC";
  const now = new Date();

  switch (preset) {
    case "today": {
      const startAt = tzMidnightStart(now, tz);
      const endAt = tzMidnightEnd(now, tz);
      return { startAt, endAt, timezone: tz, label: "Today" };
    }

    case "yesterday": {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const startAt = tzMidnightStart(yesterday, tz);
      const endAt = tzMidnightEnd(yesterday, tz);
      return { startAt, endAt, timezone: tz, label: "Yesterday" };
    }

    case "this_week": {
      const dow = localDayOfWeek(now, tz);
      const weekStart = addDaysInTz(now, -dow, tz);
      const startAt = tzMidnightStart(weekStart, tz);
      const endAt = tzMidnightEnd(now, tz);
      return { startAt, endAt, timezone: tz, label: "This Week" };
    }

    case "last_week": {
      const dow = localDayOfWeek(now, tz);
      const thisWeekStart = addDaysInTz(now, -dow, tz);
      const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);
      return {
        startAt: tzMidnightStart(lastWeekStart, tz),
        endAt: lastWeekEnd,
        timezone: tz,
        label: "Last Week",
      };
    }

    case "this_month": {
      const startAt = tzStartOfMonth(now, tz);
      const endAt = tzMidnightEnd(now, tz);
      const label = monthLabel(now, tz);
      return { startAt, endAt, timezone: tz, label };
    }

    case "last_month": {
      // Go back one month
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "numeric",
      }).formatToParts(now);
      const get = (type: string) =>
        parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
      const year = get("year");
      const month = get("month");
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const mid = new Date(Date.UTC(prevYear, prevMonth - 1, 15, 12, 0, 0));
      const startAt = tzStartOfMonth(mid, tz);
      const endAt = tzEndOfMonth(mid, tz);
      return { startAt, endAt, timezone: tz, label: monthLabel(mid, tz) };
    }

    case "last_30_days": {
      const startAt = tzMidnightStart(
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        tz,
      );
      const endAt = tzMidnightEnd(now, tz);
      return { startAt, endAt, timezone: tz, label: "Last 30 Days" };
    }

    case "last_7_days": {
      const startAt = tzMidnightStart(
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        tz,
      );
      const endAt = tzMidnightEnd(now, tz);
      return { startAt, endAt, timezone: tz, label: "Last 7 Days" };
    }

    case "this_year": {
      const yearParts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "numeric",
      }).formatToParts(now);
      const year = parseInt(
        yearParts.find((p) => p.type === "year")?.value ?? "0",
        10,
      );
      const jan1 = new Date(Date.UTC(year, 0, 1, 12, 0, 0));
      return {
        startAt: tzMidnightStart(jan1, tz),
        endAt: tzMidnightEnd(now, tz),
        timezone: tz,
        label: `Year ${year}`,
      };
    }

    case "custom": {
      if (!customStart || !customEnd) {
        throw new Error(
          "Custom date range requires both startAt and endAt ISO strings",
        );
      }
      const startAt = new Date(customStart);
      const endAt = new Date(customEnd);
      if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
        throw new Error("Invalid custom date range: could not parse ISO strings");
      }
      if (startAt >= endAt) {
        throw new Error("Invalid date range: startAt must be before endAt");
      }
      return {
        startAt,
        endAt,
        timezone: tz,
        label: `${formatLocalDate(startAt, tz)} – ${formatLocalDate(endAt, tz)}`,
      };
    }

    default: {
      const _exhaustive: never = preset;
      throw new Error(`Unsupported date range preset: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Safely resolves a date range preset, returning null on error.
 * Useful for tool input validation.
 */
export function tryResolveDateRange(
  preset: DateRangePreset,
  timezone: string,
  customStart?: string,
  customEnd?: string,
): ReportDateRange | null {
  try {
    return resolveDateRange(preset, timezone, customStart, customEnd);
  } catch {
    return null;
  }
}
