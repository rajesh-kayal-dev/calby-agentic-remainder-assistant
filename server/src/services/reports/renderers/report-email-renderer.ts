/**
 * report-email-renderer.ts
 *
 * Converts a structured Report into Gmail-appropriate email content.
 * Uses the same Report object from the Report Engine — zero business calculations here.
 * All user-controlled content is HTML-escaped before insertion.
 */

import type { Report, ReportSection } from "../report.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Output type
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportEmailContent {
  subject: string;
  text: string;  // plain-text fallback
  html: string;  // rich HTML body
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function esc(str: string | number | null | undefined): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const SECTION_ICONS: Record<string, string> = {
  money: "💰",
  pending: "💰",
  pending_money: "💰",
  tasks: "✅",
  pending_tasks: "📋",
  completed_tasks: "✓",
  overdue_tasks: "⚠️",
  reminders: "🔔",
  top_contacts: "👥",
  overdue_money: "⚠️",
  overdue_reminders: "⏰",
};

// ─────────────────────────────────────────────────────────────────────────────
// Section HTML renderers
// ─────────────────────────────────────────────────────────────────────────────

function renderMoneySectionHtml(data: any, label: string): string {
  const s = data?.summary ?? {};
  const items: any[] = data?.items ?? [];

  let html = `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">`;
  html += `<tr><td style="padding:4px 0;color:#71717a;font-size:13px;">Receivable</td>
           <td style="text-align:right;font-weight:600;color:#16a34a;">${esc(fmt(s.totalReceivable ?? 0, s.currency))}</td></tr>`;
  html += `<tr><td style="padding:4px 0;color:#71717a;font-size:13px;">Payable</td>
           <td style="text-align:right;font-weight:600;color:#dc2626;">${esc(fmt(s.totalPayable ?? 0, s.currency))}</td></tr>`;
  html += `<tr style="border-top:1px solid #e4e4e7;"><td style="padding:6px 0;font-weight:700;font-size:13px;">Net Pending</td>
           <td style="text-align:right;font-weight:700;">${esc(fmt(s.netPending ?? 0, s.currency))}</td></tr>`;
  html += `</table>`;

  if (items.length > 0) {
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;">`;
    html += `<thead><tr style="background:#f4f4f5;">
      <th style="text-align:left;padding:4px 6px;font-weight:600;">Item</th>
      <th style="text-align:left;padding:4px 6px;font-weight:600;">Contact</th>
      <th style="text-align:right;padding:4px 6px;font-weight:600;">Amount</th>
      <th style="text-align:center;padding:4px 6px;font-weight:600;">Type</th>
      <th style="text-align:right;padding:4px 6px;font-weight:600;">Due</th>
    </tr></thead><tbody>`;
    for (const item of items.slice(0, 20)) {
      const overdueStyle = item.isOverdue ? "color:#dc2626;" : "";
      html += `<tr style="border-bottom:1px solid #f4f4f5;${overdueStyle}">
        <td style="padding:4px 6px;">${esc(item.title)}</td>
        <td style="padding:4px 6px;">${esc(item.contactName ?? "—")}</td>
        <td style="text-align:right;padding:4px 6px;">${esc(fmt(item.remainingAmount ?? item.amount, item.currency))}</td>
        <td style="text-align:center;padding:4px 6px;">${item.direction === "receivable" ? "↑ Receivable" : "↓ Payable"}</td>
        <td style="text-align:right;padding:4px 6px;">${esc(fmtDate(item.due_at))}</td>
      </tr>`;
    }
    html += `</tbody></table>`;
    if (items.length > 20) {
      html += `<p style="font-size:11px;color:#71717a;margin-top:4px;">+${items.length - 20} more items</p>`;
    }
  }

  return html;
}

function renderTaskSectionHtml(data: any): string {
  const s = data?.summary ?? {};
  const items: any[] = data?.items ?? [];

  let html = `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">`;
  html += `<tr><td style="padding:3px 0;color:#71717a;font-size:13px;">Total</td><td style="text-align:right;font-weight:600;">${esc(s.total ?? 0)}</td></tr>`;
  html += `<tr><td style="padding:3px 0;color:#71717a;font-size:13px;">Pending</td><td style="text-align:right;">${esc(s.pending ?? 0)}</td></tr>`;
  html += `<tr><td style="padding:3px 0;color:#71717a;font-size:13px;">Completed</td><td style="text-align:right;color:#16a34a;">${esc(s.completed ?? 0)}</td></tr>`;
  html += `<tr><td style="padding:3px 0;color:#71717a;font-size:13px;">Overdue</td><td style="text-align:right;color:#dc2626;">${esc(s.overdue ?? 0)}</td></tr>`;
  html += `<tr><td style="padding:3px 0;color:#71717a;font-size:13px;">Completion</td><td style="text-align:right;">${esc(s.completionRatePercent ?? 0)}%</td></tr>`;
  html += `</table>`;

  if (items.length > 0) {
    html += `<ul style="margin:4px 0;padding-left:20px;font-size:12px;">`;
    for (const t of items.slice(0, 10)) {
      const icon = t.status === "completed" ? "✓" : t.status === "cancelled" ? "✗" : "•";
      const lineStyle = t.status === "completed" ? "text-decoration:line-through;color:#71717a;" : "";
      html += `<li style="${lineStyle}margin-bottom:3px;">${icon} ${esc(t.title)}${t.due_at ? ` <span style="color:#71717a;">(${esc(fmtDate(t.due_at))})</span>` : ""}</li>`;
    }
    html += `</ul>`;
  }
  return html;
}

function renderReminderSectionHtml(data: any): string {
  const s = data?.summary ?? {};
  const items: any[] = data?.items ?? [];

  let html = `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">`;
  html += `<tr><td style="padding:3px 0;color:#71717a;font-size:13px;">Total</td><td style="text-align:right;">${esc(s.total ?? 0)}</td></tr>`;
  html += `<tr><td style="padding:3px 0;color:#71717a;font-size:13px;">Active</td><td style="text-align:right;color:#16a34a;">${esc(s.active ?? 0)}</td></tr>`;
  html += `<tr><td style="padding:3px 0;color:#71717a;font-size:13px;">Completed</td><td style="text-align:right;">${esc(s.completed ?? 0)}</td></tr>`;
  html += `<tr><td style="padding:3px 0;color:#71717a;font-size:13px;">Overdue</td><td style="text-align:right;color:#dc2626;">${esc(s.overdue ?? 0)}</td></tr>`;
  html += `</table>`;

  if (items.length > 0) {
    html += `<ul style="margin:4px 0;padding-left:20px;font-size:12px;">`;
    for (const r of items.slice(0, 8)) {
      html += `<li style="margin-bottom:3px;">🔔 ${esc(r.title)}${r.due_at ? ` — ${esc(fmtDate(r.due_at))}` : ""}</li>`;
    }
    html += `</ul>`;
  }
  return html;
}

function renderSectionHtml(section: ReportSection): string {
  const data = section.data as any;
  const t = section.type;

  if (t === "money_summary" || t === "money_items") return renderMoneySectionHtml(data, section.title);
  if (t === "task_summary" || t === "task_items") return renderTaskSectionHtml(data);
  if (t === "reminder_summary") return renderReminderSectionHtml(data);
  if (t === "contact_list") {
    const contacts: any[] = data?.contacts ?? [];
    if (contacts.length === 0) return `<p style="font-size:13px;color:#71717a;">No pending contacts.</p>`;
    let html = `<ul style="margin:4px 0;padding-left:20px;font-size:13px;">`;
    for (const c of contacts.slice(0, 10)) {
      html += `<li>👤 ${esc(c.name)} — ${esc(fmt(c.balance, c.currency))}</li>`;
    }
    html += `</ul>`;
    return html;
  }
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Plain-text fallback (reuses existing report-renderer logic minimally)
// ─────────────────────────────────────────────────────────────────────────────

function buildPlainText(report: Report, recipientName: string): string {
  const { metadata } = report;
  const lines: string[] = [
    `CALBY REPORT — ${metadata.title.toUpperCase()}`,
    `Generated: ${new Date(metadata.generatedAt).toLocaleString("en-IN", { timeZone: metadata.timezone })}`,
    metadata.dateRange ? `Period: ${metadata.dateRange.label}` : "",
    `Prepared for: ${recipientName}`,
    "",
  ].filter((l): l is string => typeof l === "string" || typeof l === "number");

  for (const section of report.sections) {
    lines.push(`── ${section.title.toUpperCase()} ──`);
    const data = section.data as any;
    const s = data?.summary;
    if (s) {
      if (s.totalReceivable !== undefined) {
        lines.push(`  Receivable: ${fmt(s.totalReceivable, s.currency)}`);
        lines.push(`  Payable:    ${fmt(s.totalPayable, s.currency)}`);
        lines.push(`  Net:        ${fmt(s.netPending, s.currency)}`);
      }
      if (s.total !== undefined && s.completionRatePercent !== undefined) {
        lines.push(`  Total: ${s.total} | Pending: ${s.pending} | Completed: ${s.completed} | Overdue: ${s.overdue}`);
        lines.push(`  Completion: ${s.completionRatePercent}%`);
      }
      if (s.active !== undefined && s.total !== undefined) {
        lines.push(`  Total: ${s.total} | Active: ${s.active} | Completed: ${s.completed}`);
      }
    }
    lines.push("");
  }

  lines.push("──────────────────────────────");
  lines.push("Sent via Calby AI Assistant");
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function renderReportEmail(
  report: Report,
  recipientName: string,
): ReportEmailContent {
  const { metadata } = report;
  const periodLabel = metadata.dateRange ? ` — ${metadata.dateRange.label}` : "";
  const subject = `Calby Report: ${metadata.title}${periodLabel}`;

  // HTML body
  const generatedAt = new Date(metadata.generatedAt).toLocaleString("en-IN", {
    timeZone: metadata.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  let bodyHtml = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#18181b,#27272a);padding:24px 28px;">
    <h1 style="color:#ffffff;font-size:20px;margin:0 0 4px;">${esc(metadata.title)}</h1>
    ${metadata.dateRange ? `<p style="color:#a1a1aa;margin:0;font-size:13px;">Period: ${esc(metadata.dateRange.label)}</p>` : ""}
    <p style="color:#a1a1aa;margin:4px 0 0;font-size:12px;">Generated ${esc(generatedAt)}</p>
  </div>

  <!-- Recipient -->
  <div style="padding:16px 28px;background:#fafafa;border-bottom:1px solid #e4e4e7;">
    <p style="margin:0;font-size:13px;color:#52525b;">Prepared for: <strong>${esc(recipientName)}</strong></p>
  </div>

  <!-- Sections -->
  <div style="padding:20px 28px;">
`;

  for (const section of report.sections) {
    const icon = SECTION_ICONS[section.id] ?? "📄";
    bodyHtml += `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:14px;font-weight:700;color:#18181b;margin:0 0 10px;padding-bottom:6px;border-bottom:2px solid #f4f4f5;">
        ${icon} ${esc(section.title)}
      </h2>
      ${renderSectionHtml(section)}
    </div>`;
  }

  bodyHtml += `
  </div>

  <!-- Footer -->
  <div style="padding:16px 28px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
    <p style="margin:0;font-size:11px;color:#a1a1aa;">Sent via <strong>Calby AI Assistant</strong></p>
  </div>
</div>
`;

  const text = buildPlainText(report, recipientName);

  return { subject, text, html: bodyHtml };
}
