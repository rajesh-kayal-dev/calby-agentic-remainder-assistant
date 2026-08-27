/**
 * report-whatsapp-renderer.ts
 *
 * Converts a structured Report into a concise WhatsApp-friendly plain-text message.
 * Max ~1500 chars to stay readable on mobile.
 * All user-controlled content is sanitized (no HTML — WhatsApp uses plain text).
 * Zero business calculations — all numbers come from the Report.
 */

import type { Report } from "../report.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function safe(str: string | number | null | undefined): string {
  if (str == null) return "";
  // Strip any markdown/HTML that could be misread on WhatsApp
  return String(str).replace(/[<>&"']/g, "").trim();
}

function fmt(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const TYPE_EMOJI: Record<string, string> = {
  pending_money:   "💰",
  money_summary:   "💰",
  task_summary:    "✅",
  contact_summary: "👤",
  monthly_summary: "📅",
  daily_summary:   "🌅",
  overdue_summary: "⚠️",
};

const SECTION_EMOJI: Record<string, string> = {
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

// ─────────────────────────────────────────────────────────────────────────────
// Section renderers
// ─────────────────────────────────────────────────────────────────────────────

function renderMoneySection(data: any): string {
  const s = data?.summary ?? {};
  const items: any[] = (data?.items ?? []).slice(0, 5);
  const lines: string[] = [
    `  • Receivable: *${safe(fmt(s.totalReceivable ?? 0, s.currency))}*`,
    `  • Payable: ${safe(fmt(s.totalPayable ?? 0, s.currency))}`,
    `  • Net: *${safe(fmt(s.netPending ?? 0, s.currency))}*`,
    `  • Items: ${s.itemCount ?? 0}`,
  ];

  if (items.length > 0) {
    lines.push("");
    for (const item of items) {
      const dir = item.direction === "receivable" ? "↑" : "↓";
      lines.push(`  ${dir} ${safe(item.title)} — ${safe(fmt(item.remainingAmount ?? item.amount, item.currency))}`);
    }
    if ((data?.items?.length ?? 0) > 5) {
      lines.push(`  ...and ${(data.items.length - 5)} more`);
    }
  }
  return lines.join("\n");
}

function renderTaskSection(data: any): string {
  const s = data?.summary ?? {};
  const items: any[] = (data?.items ?? []).slice(0, 5);
  const lines = [
    `  • Total: ${s.total ?? 0} | Done: ${s.completed ?? 0} | Pending: ${s.pending ?? 0}`,
    `  • Overdue: ${s.overdue ?? 0} | Completion: ${s.completionRatePercent ?? 0}%`,
  ];

  if (items.length > 0) {
    lines.push("");
    for (const t of items) {
      const icon = t.status === "completed" ? "✓" : "•";
      lines.push(`  ${icon} ${safe(t.title)}`);
    }
  }
  return lines.join("\n");
}

function renderReminderSection(data: any): string {
  const s = data?.summary ?? {};
  return [
    `  • Total: ${s.total ?? 0} | Active: ${s.active ?? 0}`,
    `  • Completed: ${s.completed ?? 0} | Overdue: ${s.overdue ?? 0}`,
  ].join("\n");
}

function renderTopContacts(data: any): string {
  const contacts: any[] = (data?.contacts ?? []).slice(0, 5);
  if (contacts.length === 0) return "  No pending contacts.";
  return contacts
    .map((c) => `  • ${safe(c.name)} — ${safe(fmt(c.balance, c.currency))}`)
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

const MAX_CHARS = 1500;

export function renderReportWhatsApp(
  report: Report,
  recipientName: string,
): string {
  const { metadata, type } = report;
  const emoji = TYPE_EMOJI[type] ?? "📄";
  const periodLabel = metadata.dateRange ? ` (${metadata.dateRange.label})` : "";

  const parts: string[] = [
    `${emoji} *Calby Report*`,
    `*${safe(metadata.title)}*${safe(periodLabel)}`,
    `For: ${safe(recipientName)}`,
    `─────────────────────`,
  ];

  for (const section of report.sections) {
    const icon = SECTION_EMOJI[section.id] ?? "📄";
    const body = renderSection(section.id, section.type, section.data);
    if (body) {
      parts.push(`${icon} *${safe(section.title)}*`);
      parts.push(body);
    }
  }

  parts.push(`─────────────────────`);
  parts.push(`_Sent via Calby AI_`);

  let result = parts.join("\n");

  // Trim to mobile-safe length
  if (result.length > MAX_CHARS) {
    result = result.slice(0, MAX_CHARS - 30) + "\n\n..._(report truncated)_";
  }

  return result;
}
