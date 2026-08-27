/**
 * ReportSummaryCard — renders a structured Calby report inside the dashboard.
 * Accepts a `Report` object (from the report.generate tool) and renders it
 * visually with sections, metrics, and item lists.
 */

import React, { useState } from "react";
import { Mail, MessageCircle, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { Report, ReportSection } from "../../../lib/report.types";
import "./report-summary-card.css";

// ─────────────────────────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`report-metric-row${highlight ? " report-metric-highlight" : ""}`}
    >
      <span className="report-metric-label">{label}</span>
      <span className="report-metric-value">{value}</span>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="report-section-header">
      <span className="report-section-title">{title}</span>
      {count !== undefined && (
        <span className="report-section-badge">{count}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section renderers
// ─────────────────────────────────────────────────────────────────────────────

function MoneySection({ data }: { data: any }) {
  const { summary, items = [] } = data;
  return (
    <div className="report-section-body">
      <MetricRow label="Total Receivable" value={formatMoney(summary.totalReceivable, summary.currency)} highlight />
      <MetricRow label="Total Payable" value={formatMoney(summary.totalPayable, summary.currency)} />
      <MetricRow label="Net Pending" value={formatMoney(summary.netPending, summary.currency)} highlight />
      <MetricRow label="Items" value={summary.itemCount} />
      {summary.receivableByCurrency?.length > 0 && (
        <div className="report-currency-breakdown">
          <span className="report-currency-label">By Currency:</span>
          {summary.receivableByCurrency.map((c: any) => (
            <span key={c.currency} className="report-currency-chip">
              {c.currency} {c.amount.toLocaleString("en-IN")}
            </span>
          ))}
        </div>
      )}
      {items.slice(0, 5).map((item: any, i: number) => (
        <div key={i} className={`report-item-row${item.isOverdue ? " overdue" : ""}`}>
          <span className="report-item-title">{item.title}</span>
          <span className="report-item-amount">{formatMoney(item.remainingAmount ?? item.amount, item.currency)}</span>
          <span className={`report-item-dir ${item.direction}`}>
            {item.direction === "receivable" ? "↑" : "↓"}
          </span>
        </div>
      ))}
      {items.length > 5 && (
        <p className="report-more">+{items.length - 5} more</p>
      )}
    </div>
  );
}

function TaskSection({ data }: { data: any }) {
  const { summary, items = [] } = data;
  const pct = summary?.completionRatePercent ?? 0;
  return (
    <div className="report-section-body">
      {summary && (
        <>
          <MetricRow label="Total" value={summary.total} />
          <MetricRow label="Pending" value={summary.pending} />
          <MetricRow label="Completed" value={summary.completed} highlight />
          <MetricRow label="Overdue" value={summary.overdue} />
          <div className="report-progress-bar-wrap">
            <div className="report-progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <span className="report-progress-label">{pct}% complete</span>
        </>
      )}
      {items.slice(0, 5).map((task: any, i: number) => (
        <div key={i} className={`report-item-row${task.status === "completed" ? " done" : ""}`}>
          <span className="report-item-icon">
            {task.status === "completed" ? "✓" : task.status === "cancelled" ? "✗" : "•"}
          </span>
          <span className="report-item-title">{task.title}</span>
          {task.due_at && (
            <span className="report-item-due">{formatDate(task.due_at)}</span>
          )}
        </div>
      ))}
      {items.length > 5 && (
        <p className="report-more">+{items.length - 5} more</p>
      )}
    </div>
  );
}

function ReminderSection({ data }: { data: any }) {
  const { summary, items = [] } = data;
  return (
    <div className="report-section-body">
      {summary && (
        <>
          <MetricRow label="Total" value={summary.total} />
          <MetricRow label="Active" value={summary.active} highlight />
          <MetricRow label="Completed" value={summary.completed} />
          <MetricRow label="Overdue" value={summary.overdue} />
        </>
      )}
      {items.slice(0, 4).map((r: any, i: number) => (
        <div key={i} className="report-item-row">
          <span className="report-item-icon">🔔</span>
          <span className="report-item-title">{r.title}</span>
          {r.due_at && (
            <span className="report-item-due">{formatDate(r.due_at)}</span>
          )}
        </div>
      ))}
      {items.length > 4 && (
        <p className="report-more">+{items.length - 4} more</p>
      )}
    </div>
  );
}

function TopContactsSection({ data }: { data: any }) {
  const contacts = data?.contacts ?? [];
  return (
    <div className="report-section-body">
      {contacts.slice(0, 5).map((c: any, i: number) => (
        <div key={i} className="report-item-row">
          <span className="report-item-icon">👤</span>
          <span className="report-item-title">{c.name}</span>
          <span className="report-item-amount">{formatMoney(c.balance, c.currency)}</span>
        </div>
      ))}
      {contacts.length === 0 && (
        <p className="report-empty">No pending contacts</p>
      )}
    </div>
  );
}

function OverdueSummarySection({ summary }: { summary: any }) {
  return (
    <div className="report-section-body">
      <MetricRow label="Overdue Money Items" value={summary.money.count} highlight />
      <MetricRow label="Overdue Tasks" value={summary.tasks.count} />
      <MetricRow label="Overdue Reminders" value={summary.reminders.count} />
      <MetricRow label="Total Overdue" value={summary.totalOverdueItems} highlight />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section dispatcher
// ─────────────────────────────────────────────────────────────────────────────

function renderSection(section: ReportSection) {
  const { type, data } = section;
  if (type === "money_summary" || type === "money_items") return <MoneySection data={data} />;
  if (type === "task_summary" || type === "task_items") return <TaskSection data={data} />;
  if (type === "reminder_summary") return <ReminderSection data={data} />;
  if (type === "contact_list") return <TopContactsSection data={data} />;
  return <pre className="report-raw">{JSON.stringify(data, null, 2)}</pre>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface ReportSummaryCardProps {
  report: Report;
  /** Optional summary line from renderReportSummaryLine */
  summaryLine?: string;
  /** Whether to start collapsed (default: false) */
  collapsed?: boolean;
  /**
   * Called when the user clicks a delivery channel button.
   * The parent (chat panel / page) is responsible for injecting the
   * `report.send` tool call with confirmed=true via the chat pipeline.
   */
  onSendViaChannel?: (channel: "gmail" | "whatsapp" | "telegram") => void;
  /** Delivery state — set by parent after send completes */
  deliveryState?: {
    status: "sending" | "sent" | "failed";
    channel: string;
    message?: string;
  };
}

export function ReportSummaryCard({
  report,
  summaryLine,
  collapsed = false,
  onSendViaChannel,
  deliveryState,
}: ReportSummaryCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(report.sections.map((s) => s.id)),
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { metadata, type } = report;
  const typeLabel = REPORT_TYPE_LABELS[type] ?? type;

  return (
    <div className="report-card">
      {/* Card header */}
      <div className="report-card-header">
        <div className="report-card-title-row">
          <span className="report-card-icon">{REPORT_TYPE_ICONS[type] ?? "📄"}</span>
          <div>
            <h3 className="report-card-title">{metadata.title}</h3>
            {metadata.dateRange && (
              <span className="report-card-period">{metadata.dateRange.label}</span>
            )}
          </div>
          <span className="report-card-type-badge">{typeLabel}</span>
        </div>
        {summaryLine && (
          <p className="report-card-summary-line">{summaryLine}</p>
        )}
        <span className="report-card-generated">
          Generated {new Date(metadata.generatedAt).toLocaleString("en-IN", {
            timeZone: metadata.timezone,
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      </div>

      {/* Overdue summary shown at top for overdue_summary type */}
      {type === "overdue_summary" && (
        <OverdueSummarySection summary={(report as any).summary} />
      )}

      {/* Sections */}
      <div className="report-sections">
        {report.sections.map((section) => (
          <div key={section.id} className="report-section">
            <button
              className="report-section-toggle"
              onClick={() => toggleSection(section.id)}
              aria-expanded={expandedSections.has(section.id)}
            >
              <SectionHeader
                title={section.title}
                count={getSectionItemCount(section)}
              />
              <span className="report-section-chevron">
                {expandedSections.has(section.id) ? "▲" : "▼"}
              </span>
            </button>
            {expandedSections.has(section.id) && (
              <div className="report-section-content">
                {renderSection(section)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delivery action row */}
      {onSendViaChannel && (
        <div className="report-delivery-row">
          {deliveryState ? (
            <div className={`report-delivery-status report-delivery-status--${deliveryState.status}`}>
              {deliveryState.status === "sending" && (
                <><Loader2 className="report-delivery-icon report-delivery-icon--spin" size={14} />
                <span>Sending via {deliveryState.channel}…</span></>
              )}
              {deliveryState.status === "sent" && (
                <><CheckCircle2 className="report-delivery-icon" size={14} />
                <span>{deliveryState.message ?? `Sent via ${deliveryState.channel}`}</span></>
              )}
              {deliveryState.status === "failed" && (
                <><XCircle className="report-delivery-icon" size={14} />
                <span>{deliveryState.message ?? `Failed to send via ${deliveryState.channel}`}</span></>
              )}
            </div>
          ) : (
            <div className="report-delivery-actions">
              <span className="report-delivery-label">Send via</span>
              <button
                type="button"
                className="report-delivery-btn"
                onClick={() => onSendViaChannel("gmail")}
                title="Send via Gmail"
                aria-label="Send report via Gmail"
              >
                <Mail size={13} />
                <span>Gmail</span>
              </button>
              <button
                type="button"
                className="report-delivery-btn"
                onClick={() => onSendViaChannel("whatsapp")}
                title="Send via WhatsApp"
                aria-label="Send report via WhatsApp"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                className="report-delivery-btn"
                onClick={() => onSendViaChannel("telegram")}
                title="Send via Telegram"
                aria-label="Send report via Telegram"
              >
                <Send size={13} />
                <span>Telegram</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const REPORT_TYPE_LABELS: Record<string, string> = {
  pending_money: "Pending Money",
  money_summary: "Money Summary",
  task_summary: "Tasks",
  contact_summary: "Contact",
  monthly_summary: "Monthly",
  daily_summary: "Daily",
  overdue_summary: "Overdue",
};

const REPORT_TYPE_ICONS: Record<string, string> = {
  pending_money: "💰",
  money_summary: "💰",
  task_summary: "✅",
  contact_summary: "👤",
  monthly_summary: "📅",
  daily_summary: "🌅",
  overdue_summary: "⚠️",
};

function formatMoney(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getSectionItemCount(section: ReportSection): number | undefined {
  const data = section.data as any;
  if (Array.isArray(data?.items)) return data.items.length;
  if (Array.isArray(data?.contacts)) return data.contacts.length;
  return undefined;
}
