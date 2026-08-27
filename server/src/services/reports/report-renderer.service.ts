/**
 * Report Renderer Service
 *
 * Converts structured Report objects into human-readable plain text.
 * This is a pure transformation — no DB access, no business logic.
 *
 * Architecture:
 *   ReportEngine → Structured Report → ReportRenderer → Text
 *
 * Later renderers (Google Docs, Gmail, WhatsApp) will also consume
 * the same structured Report objects.
 */

import type {
  Report,
  ReportType,
  MoneyReportSection,
  TaskReportSection,
  ReminderReportSection,
  ContactReportData,
  MonthlySummaryData,
  DailySummaryData,
  OverdueReportData,
  CurrencyTotal,
} from "./report.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Formatting Utilities
// ─────────────────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
};

function formatCurrency(amount: number, currency: string = "INR"): string {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency + " ";
  return `${symbol}${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatCurrencyTotals(totals: CurrencyTotal[]): string {
  if (totals.length === 0) return formatCurrency(0, "INR");
  if (totals.length === 1) return formatCurrency(totals[0].amount, totals[0].currency);
  // Multi-currency: separate lines
  return totals.map((t) => formatCurrency(t.amount, t.currency)).join(", ");
}

function hr(char = "─", len = 40): string {
  return char.repeat(len);
}

function section(title: string): string {
  return `\n${title}\n${hr("-", title.length)}\n`;
}

function formatDate(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return "No due date";
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Renderers
// ─────────────────────────────────────────────────────────────────────────────

function renderMoneySection(data: MoneyReportSection, label?: string): string {
  const { summary, items } = data;
  let out = section(label ?? "Money");

  out += `Receivable:  ${formatCurrencyTotals(summary.receivableByCurrency)}\n`;
  out += `Payable:     ${formatCurrencyTotals(summary.payableByCurrency)}\n`;
  out += `Net Pending: ${formatCurrency(summary.netPending)}\n`;

  if (items.length > 0) {
    out += "\nItems:\n";
    for (const item of items) {
      const contact = item.contact_name ? ` (${item.contact_name})` : "";
      const due = item.due_at ? ` — due ${formatDate(item.due_at)}` : "";
      const currency = item.currency || "INR";
      out += `  • ${item.title}${contact} — ${formatCurrency(Number(item.remaining_amount), currency)}${due}\n`;
    }
  } else {
    out += "\nNo pending items.\n";
  }

  return out;
}

function renderTaskSection(data: TaskReportSection, label?: string): string {
  const { summary, items } = data;
  let out = section(label ?? "Tasks");

  out += `Total:      ${summary.total}\n`;
  out += `Pending:    ${summary.pending}\n`;
  out += `In Progress: ${summary.inProgress}\n`;
  out += `Completed:  ${summary.completed}\n`;
  out += `Cancelled:  ${summary.cancelled}\n`;
  out += `Overdue:    ${summary.overdue}\n`;
  out += `Completion: ${summary.completionRatePercent}%\n`;

  if (items.length > 0) {
    out += "\nItems:\n";
    for (const task of items) {
      const statusIcon =
        task.status === "completed" ? "✓" : task.status === "cancelled" ? "✗" : "•";
      const due = task.due_at ? ` (due ${formatDate(task.due_at)})` : "";
      out += `  ${statusIcon} ${task.title}${due}\n`;
    }
  }

  return out;
}

function renderReminderSection(data: ReminderReportSection, label?: string): string {
  const { summary, items } = data;
  let out = section(label ?? "Reminders");

  out += `Total:    ${summary.total}\n`;
  out += `Active:   ${summary.active}\n`;
  out += `Upcoming: ${summary.upcoming}\n`;
  out += `Completed: ${summary.completed}\n`;

  if (items.length > 0) {
    out += "\nItems:\n";
    for (const r of items) {
      out += `  • ${r.title} — ${formatDate(r.next_run_at)}\n`;
    }
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Report-Type Renderers
// ─────────────────────────────────────────────────────────────────────────────

function renderPendingMoneyReport(report: Report): string {
  const { metadata } = report;
  const section0 = report.sections[0];
  if (!section0) return `${metadata.title}\n\nNo data available.`;
  const data = section0.data as MoneyReportSection;

  let out = `${hr("═")}\n`;
  out += `CALBY — ${metadata.title.toUpperCase()}\n`;
  out += `${hr("═")}\n`;
  out += `Generated: ${new Date(metadata.generatedAt).toLocaleString("en-IN", { timeZone: metadata.timezone })}\n`;
  out += renderMoneySection(data, "Pending Money");
  return out.trim();
}

function renderTaskSummaryReport(report: Report): string {
  const { metadata } = report;
  const allTasksSection = report.sections.find((s) => s.id === "pending_tasks");
  const completedSection = report.sections.find((s) => s.id === "completed_tasks");
  const overdueSection = report.sections.find((s) => s.id === "overdue_tasks");

  let out = `${hr("═")}\n`;
  out += `CALBY — ${metadata.title.toUpperCase()}\n`;
  out += `${hr("═")}\n`;
  if (metadata.dateRange) {
    out += `Period: ${metadata.dateRange.label}\n`;
  }
  out += `Generated: ${new Date(metadata.generatedAt).toLocaleString("en-IN", { timeZone: metadata.timezone })}\n`;

  const pending = (allTasksSection?.data as TaskReportSection) ?? { items: [], summary: { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0, overdue: 0, completionRatePercent: 0 } };
  out += renderTaskSection(pending, "Task Summary");

  if (overdueSection && (overdueSection.data as TaskReportSection).items.length > 0) {
    out += renderTaskSection(overdueSection.data as TaskReportSection, "Overdue Tasks");
  }

  return out.trim();
}

function renderContactReport(report: Report): string {
  const data = report.summary as ContactReportData;
  const { metadata } = report;

  let out = `${hr("═")}\n`;
  out += `CALBY — ${data.contact.name.toUpperCase()} REPORT\n`;
  out += `${hr("═")}\n`;
  out += `Generated: ${new Date(metadata.generatedAt).toLocaleString("en-IN", { timeZone: metadata.timezone })}\n`;

  const moneySection = report.sections.find((s) => s.id === "money");
  const taskSection = report.sections.find((s) => s.id === "tasks");
  const reminderSection = report.sections.find((s) => s.id === "reminders");

  if (moneySection) out += renderMoneySection(moneySection.data as MoneyReportSection, "Money");
  if (taskSection) out += renderTaskSection(taskSection.data as TaskReportSection, "Tasks");
  if (reminderSection) out += renderReminderSection(reminderSection.data as ReminderReportSection, "Reminders");

  return out.trim();
}

function renderMonthlySummaryReport(report: Report): string {
  const data = report.summary as MonthlySummaryData;
  const { metadata } = report;

  let out = `${hr("═")}\n`;
  out += `CALBY — ${(metadata.dateRange?.label ?? metadata.title).toUpperCase()} SUMMARY\n`;
  out += `${hr("═")}\n`;
  out += `Generated: ${new Date(metadata.generatedAt).toLocaleString("en-IN", { timeZone: metadata.timezone })}\n`;

  out += renderMoneySection(data.money, "Money");
  out += renderTaskSection(data.tasks, "Tasks");
  out += renderReminderSection(data.reminders, "Reminders");

  if (data.topContacts.length > 0) {
    out += section("Pending Contacts");
    for (const c of data.topContacts) {
      const parts: string[] = [];
      if (c.moneyPending > 0) parts.push(`₹${c.moneyPending.toLocaleString()} pending`);
      if (c.tasksPending > 0) parts.push(`${c.tasksPending} task${c.tasksPending > 1 ? "s" : ""}`);
      out += `  • ${c.contact.name} — ${parts.join(", ")}\n`;
    }
  }

  return out.trim();
}

function renderDailySummaryReport(report: Report): string {
  const data = report.summary as DailySummaryData;
  const { metadata } = report;

  let out = `${hr("═")}\n`;
  out += `CALBY — DAILY SUMMARY\n`;
  if (metadata.dateRange) out += `${metadata.dateRange.label}\n`;
  out += `${hr("═")}\n`;
  out += `Generated: ${new Date(metadata.generatedAt).toLocaleString("en-IN", { timeZone: metadata.timezone })}\n`;

  out += renderTaskSection(data.tasks, "Today's Tasks");
  out += renderReminderSection(data.reminders, "Today's Reminders");

  if (data.pendingMoney.summary.itemCount > 0) {
    out += renderMoneySection(data.pendingMoney, "Pending Money");
  }

  return out.trim();
}

function renderOverdueSummaryReport(report: Report): string {
  const data = report.summary as OverdueReportData;
  const { metadata } = report;

  let out = `${hr("═")}\n`;
  out += `CALBY — OVERDUE SUMMARY\n`;
  out += `${hr("═")}\n`;
  out += `Generated: ${new Date(metadata.generatedAt).toLocaleString("en-IN", { timeZone: metadata.timezone })}\n`;
  out += `\nTotal overdue items: ${data.totalOverdueItems}\n`;

  if (data.money.count > 0) {
    out += section("Overdue Money");
    for (const item of data.money.items) {
      const contact = item.contact_name ? ` (${item.contact_name})` : "";
      out += `  • ${item.title}${contact} — ${formatCurrency(Number(item.remaining_amount), item.currency)} — due ${formatDate(item.due_at)}\n`;
    }
  } else {
    out += "\nNo overdue money. ✓\n";
  }

  if (data.tasks.count > 0) {
    out += section("Overdue Tasks");
    for (const task of data.tasks.items) {
      out += `  • ${task.title} — due ${formatDate(task.due_at)}\n`;
    }
  } else {
    out += "\nNo overdue tasks. ✓\n";
  }

  if (data.reminders.count > 0) {
    out += section("Overdue Reminders");
    for (const r of data.reminders.items) {
      out += `  • ${r.title} — ${formatDate(r.next_run_at)}\n`;
    }
  } else {
    out += "\nNo overdue reminders. ✓\n";
  }

  return out.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert any structured Report into human-readable plain text.
 *
 * @param report - structured report from ReportEngine
 * @returns formatted plain-text string
 */
export function renderReport(report: Report): string {
  switch (report.type as ReportType) {
    case "pending_money":
    case "money_summary":
      return renderPendingMoneyReport(report);
    case "task_summary":
      return renderTaskSummaryReport(report);
    case "contact_summary":
      return renderContactReport(report);
    case "monthly_summary":
      return renderMonthlySummaryReport(report);
    case "daily_summary":
      return renderDailySummaryReport(report);
    case "overdue_summary":
      return renderOverdueSummaryReport(report);
    default:
      return `Report: ${report.metadata.title}\n\n${JSON.stringify(report.summary, null, 2)}`;
  }
}

/**
 * Render a concise one-liner summary for chat responses.
 */
export function renderReportSummaryLine(report: Report): string {
  switch (report.type as ReportType) {
    case "pending_money":
    case "money_summary": {
      const s = report.summary as { totalReceivable: number; totalPayable: number; netPending: number; itemCount: number };
      return `₹${s.totalReceivable.toLocaleString()} receivable, ₹${s.totalPayable.toLocaleString()} payable (${s.itemCount} items)`;
    }
    case "task_summary": {
      const s = report.summary as { total: number; completed: number; pending: number; overdue: number; completionRatePercent: number };
      return `${s.total} tasks — ${s.completed} completed, ${s.pending} pending, ${s.overdue} overdue (${s.completionRatePercent}% done)`;
    }
    case "monthly_summary": {
      const s = report.summary as MonthlySummaryData;
      return `${s.tasks.summary.completed} tasks completed, ₹${s.money.summary.netPending.toLocaleString()} money pending`;
    }
    case "daily_summary": {
      const s = report.summary as DailySummaryData;
      return `${s.tasks.summary.total} tasks, ${s.reminders.summary.upcoming} reminders today`;
    }
    case "overdue_summary": {
      const s = report.summary as OverdueReportData;
      return `${s.totalOverdueItems} overdue items (${s.money.count} money, ${s.tasks.count} tasks, ${s.reminders.count} reminders)`;
    }
    case "contact_summary": {
      const s = report.summary as ContactReportData;
      return `${s.contact.name}: ₹${s.money.summary.totalReceivable.toLocaleString()} receivable, ${s.tasks.summary.total} tasks`;
    }
    default:
      return report.metadata.title;
  }
}
