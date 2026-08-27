/**
 * Client-side mirror of server report types.
 * These must stay in sync with server/src/services/reports/report.types.ts
 */

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

export interface ReportDateRange {
  startAt: string; // ISO
  endAt: string;   // ISO
  label: string;
  preset: DateRangePreset;
  timezone: string;
}

export interface ReportMetadata {
  title: string;
  generatedAt: string; // ISO
  timezone: string;
  dateRange?: ReportDateRange;
}

export interface ReportSection {
  id: string;
  title: string;
  type: string;
  data: unknown;
}

// ─── Money ───────────────────────────────────────────────────────────────────

export interface CurrencyAmount {
  currency: string;
  amount: number;
}

export interface MoneyReportSummary {
  totalReceivable: number;
  totalPayable: number;
  netPending: number;
  itemCount: number;
  currency: string;
  receivableByCurrency: CurrencyAmount[];
  payableByCurrency: CurrencyAmount[];
}

export interface MoneyLedgerItem {
  id: string;
  title: string;
  amount: number;
  remainingAmount: number;
  direction: "receivable" | "payable";
  currency: string;
  contactName?: string;
  due_at?: string;
  isOverdue?: boolean;
}

export interface MoneyReportSection {
  summary: MoneyReportSummary;
  items: MoneyLedgerItem[];
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface TaskReportSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  completionRatePercent: number;
}

export interface TaskItem {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_at?: string;
  contactName?: string;
}

export interface TaskReportSection {
  summary: TaskReportSummary;
  items: TaskItem[];
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export interface ReminderReportSummary {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  status: string;
  due_at?: string;
}

export interface ReminderReportSection {
  summary: ReminderReportSummary;
  items: ReminderItem[];
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export interface ContactSummaryData {
  contact: { id: string; name: string };
  money: { summary: MoneyReportSummary };
  tasks: { summary: TaskReportSummary };
  reminders: { summary: ReminderReportSummary };
}

// ─── Monthly ─────────────────────────────────────────────────────────────────

export interface MonthlySummaryData {
  money: MoneyReportSummary;
  tasks: TaskReportSummary;
  reminders: ReminderReportSummary;
  topContacts: Array<{ id: string; name: string; balance: number; currency: string }>;
}

// ─── Daily ───────────────────────────────────────────────────────────────────

export interface DailySummaryData {
  tasks: TaskReportSection;
  reminders: ReminderReportSection;
  pendingMoney: MoneyReportSection;
}

// ─── Overdue ─────────────────────────────────────────────────────────────────

export interface OverdueSummaryData {
  totalOverdueItems: number;
  money: { count: number; items: MoneyLedgerItem[] };
  tasks: { count: number; items: TaskItem[] };
  reminders: { count: number; items: ReminderItem[] };
}

// ─── Top-level Report ─────────────────────────────────────────────────────────

export interface Report {
  type: ReportType;
  metadata: ReportMetadata;
  summary:
    | MoneyReportSummary
    | TaskReportSummary
    | ContactSummaryData
    | MonthlySummaryData
    | DailySummaryData
    | OverdueSummaryData;
  sections: ReportSection[];
}

// ─── Tool Response ────────────────────────────────────────────────────────────

export interface ReportToolResponse {
  status: "SUCCESS" | "CONTACT_NOT_FOUND" | "AMBIGUOUS_CONTACT" | "INVALID_DATE_RANGE";
  report?: Report;
  renderedText?: string;
  summaryLine?: string;
  message?: string;
  matches?: Array<{ id: string; name: string }>;
}
