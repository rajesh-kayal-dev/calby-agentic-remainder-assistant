import type { LedgerItem } from "../../repositories/money.repository.js";
import type { Task } from "../../repositories/task.repository.js";
import type { ReminderRow } from "../../repositories/reminder.repository.js";
import type { ContactRecord } from "../../repositories/contact.repository.js";

// ─────────────────────────────────────────────────────────────────────────────
// Report Type Enum
// ─────────────────────────────────────────────────────────────────────────────

export type ReportType =
  | "pending_money"
  | "money_summary"
  | "task_summary"
  | "contact_summary"
  | "monthly_summary"
  | "daily_summary"
  | "overdue_summary";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_30_days"
  | "last_7_days"
  | "custom";

// ─────────────────────────────────────────────────────────────────────────────
// Date Range
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportDateRange {
  /** UTC timestamp for DB queries */
  startAt: Date;
  /** UTC timestamp for DB queries */
  endAt: Date;
  /** IANA timezone used to resolve the range */
  timezone: string;
  /** Human-readable label */
  label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Report Metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportMetadata {
  title: string;
  generatedAt: string; // ISO string
  timezone: string;
  dateRange?: {
    label: string;
    startAt: string; // ISO string
    endAt: string;   // ISO string
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency Total (multi-currency safe)
// ─────────────────────────────────────────────────────────────────────────────

export interface CurrencyTotal {
  currency: string;
  amount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Money Report Data
// ─────────────────────────────────────────────────────────────────────────────

export interface MoneyReportSummary {
  totalReceivable: number;
  totalPayable: number;
  netPending: number;
  /** Separate totals per currency (for multi-currency safety) */
  receivableByCurrency: CurrencyTotal[];
  payableByCurrency: CurrencyTotal[];
  itemCount: number;
}

export interface MoneyReportSection {
  items: LedgerItem[];
  summary: MoneyReportSummary;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Report Data
// ─────────────────────────────────────────────────────────────────────────────

export interface TaskReportSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  /** Rounded to 1 decimal, 0 if no tasks */
  completionRatePercent: number;
}

export interface TaskReportSection {
  items: Task[];
  summary: TaskReportSummary;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reminder Report Data
// ─────────────────────────────────────────────────────────────────────────────

export interface ReminderReportSummary {
  total: number;
  active: number;
  completed: number;
  upcoming: number;
}

export interface ReminderReportSection {
  items: ReminderRow[];
  summary: ReminderReportSummary;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Report Data
// ─────────────────────────────────────────────────────────────────────────────

export interface ContactReportData {
  contact: Pick<ContactRecord, "id" | "name" | "email" | "phone_number">;
  money: MoneyReportSection;
  tasks: TaskReportSection;
  reminders: ReminderReportSection;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overdue Report Data
// ─────────────────────────────────────────────────────────────────────────────

export interface OverdueReportData {
  money: { items: LedgerItem[]; count: number };
  tasks: { items: Task[]; count: number };
  reminders: { items: ReminderRow[]; count: number };
  totalOverdueItems: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly Summary Data
// ─────────────────────────────────────────────────────────────────────────────

export interface MonthlySummaryData {
  money: MoneyReportSection;
  tasks: TaskReportSection;
  reminders: ReminderReportSection;
  topContacts: Array<{
    contact: Pick<ContactRecord, "id" | "name">;
    moneyPending: number;
    tasksPending: number;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Summary Data
// ─────────────────────────────────────────────────────────────────────────────

export interface DailySummaryData {
  tasks: TaskReportSection;
  reminders: ReminderReportSection;
  pendingMoney: MoneyReportSection;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic Report Section
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportSection<T = unknown> {
  id: string;
  title: string;
  type: string;
  data: T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Base Report
// ─────────────────────────────────────────────────────────────────────────────

export interface Report<S = unknown> {
  type: ReportType;
  metadata: ReportMetadata;
  summary: S;
  sections: ReportSection[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Concrete Report Types
// ─────────────────────────────────────────────────────────────────────────────

export type PendingMoneyReport = Report<MoneyReportSummary>;
export type TaskSummaryReport = Report<TaskReportSummary>;
export type ContactSummaryReport = Report<ContactReportData>;
export type MonthlySummaryReport = Report<MonthlySummaryData>;
export type DailySummaryReport = Report<DailySummaryData>;
export type OverdueSummaryReport = Report<OverdueReportData>;

// ─────────────────────────────────────────────────────────────────────────────
// Report Generate Input
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportGenerateInput {
  type: ReportType;
  /** Resolved contact ID (set server-side, never from LLM) */
  contactId?: string;
  dateRangePreset?: DateRangePreset;
  /** ISO string — only used when preset is "custom" */
  startAt?: string;
  /** ISO string — only used when preset is "custom" */
  endAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error types
// ─────────────────────────────────────────────────────────────────────────────

export type ReportError =
  | { status: "REPORT_NOT_FOUND"; message: string }
  | { status: "INVALID_DATE_RANGE"; message: string }
  | { status: "AMBIGUOUS_CONTACT"; message: string; matches: Array<{ id: string; name: string }> }
  | { status: "CONTACT_NOT_FOUND"; message: string }
  | { status: "UNSUPPORTED_REPORT_TYPE"; message: string }
  | { status: "INVALID_CURRENCY_RANGE"; message: string };
