/**
 * report-telegram-renderer.ts
 *
 * Converts a structured Report into Telegram HTML-formatted text.
 * Uses Telegram's supported tags: <b>, <i>, <code>, <pre>.
 * All user-controlled content is HTML-escaped before insertion.
 * Zero business calculations — all numbers come from the Report.
 */

import type { Report } from "../report.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// HTML escaping for Telegram (same pattern as telegram-channel.service.ts)
// ─────────────────────────────────────────────────────────────────────────────

function esc(str: string | number | null | undefined): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmt(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const SECTION_ICONS: Record<string, string> = {
  money:           "💰",
  pending:         "💰",
  pending_money:   "💰",
  tasks:           "✅",
  pending_tasks:   "📋",
  completed_tasks: "✓",
  overdue_tasks:   "⚠️",
  reminders:       "🔔",
  top_contacts:    "👥",
  overdue_money:   "⚠️",
  overdue_reminders: "⏰",
};

const TYPE_ICONS: Record<string, string> = {
  pending_money:   "💰",
  money_summary:   "💰",
  task_summary:    "✅",
  contact_summary: "👤",
  monthly_summary: "📅",
  daily_summary:   "🌅",
  overdue_summary: "⚠️",
};

// ─────────────────────────────────────────────────────────────────────────────
// Section renderers
// ─────────────────────────────────────────────────────────────────────────────

function renderMoneySection(data: any): string {
  const s = data?.summary ?? {};
  const items: any[] = (data?.items ?? []).slice(0, 8);
  const lines: string[] = [
    `  Receivable: <b>${esc(fmt(s.totalReceivable ?? 0, s.currency))}</b>`,
    `  Payable: <b>${esc(fmt(s.totalPayable ?? 0, s.currency))}</b>`,
    `  Net: <b>${esc(fmt(s.netPending ?? 0, s.currency))}</b>`,
  ];

  if (items.length > 0) {
    lines.push("");
    for (const item of items) {
      const dir = item.direction === "receivable" ? "↑" : "↓";
      const overdue = item.isOverdue ? " ⚠️" : "";
      lines.push(`  ${dir} <code>${esc(item.title)}</code> — ${esc(fmt(item.remainingAmount ?? item.amount, item.currency))}${overdue}`);
    }
    if ((data?.items?.length ?? 0) > 8) {
      lines.push(`  <i>...and ${data.items.length - 8} more</i>`);
    }
  }
  return lines.join("\n");
}

function renderTaskSection(data: any): string {
  const s = data?.summary ?? {};
  const items: any[] = (data?.items ?? []).slice(0, 6);
  const lines = [
    `  Total: <b>${s.total ?? 0}</b> | Pending: <b>${s.pending ?? 0}</b> | Completed: <b>${s.completed ?? 0}</b>`,
    `  Overdue: <b>${s.overdue ?? 0}</b> | Completion: <b>${s.completionRatePercent ?? 0}%</b>`,
  ];

  if (items.length > 0) {
    lines.push("");
    for (const t of items) {
      const icon = t.status === "completed" ? "✓" : t.status === "cancelled" ? "✗" : "•";
      const due = t.due_at ? ` <i>(${esc(fmtDate(t.due_at))})</i>` : "";
      lines.push(`  ${icon} ${esc(t.title)}${due}`);
    }
  }
  return lines.join("\n");
}

function renderReminderSection(data: any): string {
  const s = data?.summary ?? {};
  const items: any[] = (data?.items ?? []).slice(0, 5);
  const lines = [
    `  Total: <b>${s.total ?? 0}</b> | Active: <b>${s.active ?? 0}</b> | Overdue: <b>${s.overdue ?? 0}</b>`,
  ];

  if (items.length > 0) {
    lines.push("");
    for (const r of items) {
      const due = r.due_at ? ` — <i>${esc(fmtDate(r.due_at))}</i>` : "";
      lines.push(`  🔔 ${esc(r.title)}${due}`);
    }
  }
  return lines.join("\n");
}

function renderTopContacts(data: any): string {
  const contacts: any[] = (data?.contacts ?? []).slice(0, 5);
  if (contacts.length === 0) return "  <i>No pending contacts.</i>";
  return contacts
    .map((c) => `  👤 <b>${esc(c.name)}</b> — ${esc(fmt(c.balance, c.currency))}`)
    .join("\n");
}

function renderSection(id: string, type: string, data: any): string {
  if (type === "money_summary" || type === "money_items") return renderMoneySection(data);
  if (type === "task_summary" || type === "task_items") return renderTaskSection(data);
  if (type === "reminder_summary") return renderReminderSection(data);
  if (type === "contact_list") return renderTopContacts(data);
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function renderReportTelegram(
  report: Report,
  recipientName: string,
): string {
  const { metadata, type } = report;
  const icon = TYPE_ICONS[type] ?? "📄";
  const periodLabel = metadata.dateRange ? ` — ${esc(metadata.dateRange.label)}` : "";
  const generatedAt = new Date(metadata.generatedAt).toLocaleString("en-IN", {
    timeZone: metadata.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  const parts: string[] = [
    `${icon} <b>Calby Report</b>`,
    ``,
    `<b>${esc(metadata.title)}</b>${periodLabel}`,
    `For: ${esc(recipientName)}`,
    `<i>${esc(generatedAt)}</i>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
  ];

  for (const section of report.sections) {
    const sectionIcon = SECTION_ICONS[section.id] ?? "📄";
    const body = renderSection(section.id, section.type, section.data);
    if (body) {
      parts.push(`${sectionIcon} <b>${esc(section.title)}</b>`);
      parts.push(body);
      parts.push("");
    }
  }

  parts.push(`━━━━━━━━━━━━━━━━━━━━`);
  parts.push(`<i>Sent via Calby AI</i>`);

  return parts.join("\n");
}
