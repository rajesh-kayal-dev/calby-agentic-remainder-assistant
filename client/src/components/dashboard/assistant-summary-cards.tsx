"use client";

import React from "react";
import {
  User,
  Banknote,
  ListTodo,
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MoneyItem {
  id: string;
  title: string;
  remaining_amount: number | string;
  direction: "receivable" | "payable";
  contact_name?: string;
}

interface TaskItem {
  id: string;
  title: string;
  due_at?: string | null;
  status: string;
}

interface ReminderItem {
  id: string;
  title: string;
  next_run_at: string;
}

interface ContactSummaryData {
  contact: {
    id: string;
    name: string;
    email?: string | null;
    phoneNumber?: string | null;
  };
  money: {
    totalReceivables: number;
    totalPayables: number;
    net: number;
    items: MoneyItem[];
  };
  tasks: {
    pendingCount: number;
    overdueCount: number;
    items: TaskItem[];
  };
  reminders: {
    upcomingCount: number;
    items: ReminderItem[];
  };
}

interface UserPendingSummaryData {
  money: {
    totalReceivables: number;
    totalPayables: number;
    net: number;
    items: MoneyItem[];
  };
  tasks: {
    pendingCount: number;
    overdueCount: number;
    items: TaskItem[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Pill
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  label,
  count,
  accentColor = "lime",
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
  accentColor?: "lime" | "amber" | "blue" | "violet";
}) {
  const colorMap = {
    lime: "text-lime-400 bg-lime-400/10 border-lime-400/20",
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    violet: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  };

  return (
    <div className="flex items-center gap-2 mb-2">
      <div
        className={cn(
          "flex items-center justify-center size-5 rounded-md border",
          colorMap[accentColor]
        )}
      >
        <Icon className="size-3" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      {count !== undefined && (
        <span className="ml-auto text-[10px] font-medium text-zinc-500">
          {count} item{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Money Summary Section
// ─────────────────────────────────────────────────────────────────────────────

function MoneySummarySection({
  money,
  showContact = false,
}: {
  money: ContactSummaryData["money"] | UserPendingSummaryData["money"];
  showContact?: boolean;
}) {
  if (!money.items || money.items.length === 0) return null;

  return (
    <div>
      <SectionLabel
        icon={Banknote}
        label="Money"
        count={money.items.length}
        accentColor="lime"
      />
      <div className="space-y-1.5">
        {money.items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-200">
                {item.title}
              </p>
              {showContact && item.contact_name && (
                <p className="text-[10px] text-zinc-500">{item.contact_name}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.direction === "receivable" ? (
                <TrendingUp className="size-3 text-lime-400" />
              ) : (
                <TrendingDown className="size-3 text-red-400" />
              )}
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  item.direction === "receivable"
                    ? "text-lime-400"
                    : "text-red-400"
                )}
              >
                ₹{Number(item.remaining_amount).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {money.items.length > 5 && (
          <p className="text-center text-[10px] text-zinc-500 py-1">
            +{money.items.length - 5} more
          </p>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-900/30 px-3 py-2">
        <span className="text-[11px] text-zinc-400">
          {money.totalReceivables > 0 && money.totalPayables > 0
            ? "Net balance"
            : money.totalReceivables > 0
            ? "Total to collect"
            : "Total to pay"}
        </span>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            money.net >= 0 ? "text-lime-400" : "text-red-400"
          )}
        >
          ₹{Math.abs(money.net).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tasks Summary Section
// ─────────────────────────────────────────────────────────────────────────────

function TasksSummarySection({
  tasks,
}: {
  tasks: ContactSummaryData["tasks"] | UserPendingSummaryData["tasks"];
}) {
  if (!tasks.items || tasks.items.length === 0) return null;

  return (
    <div>
      <SectionLabel
        icon={ListTodo}
        label="Tasks"
        count={tasks.pendingCount}
        accentColor="blue"
      />
      <div className="space-y-1.5">
        {tasks.items.slice(0, 5).map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-1.5"
          >
            <div className="size-1.5 rounded-full bg-blue-400/60 shrink-0" />
            <span className="flex-1 truncate text-xs text-zinc-300">
              {task.title}
            </span>
            {task.due_at && (
              <span className="shrink-0 text-[10px] text-zinc-500">
                {new Date(task.due_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        ))}
        {tasks.items.length > 5 && (
          <p className="text-center text-[10px] text-zinc-500 py-1">
            +{tasks.items.length - 5} more
          </p>
        )}
      </div>
      {tasks.overdueCount > 0 && (
        <p className="mt-1.5 text-[11px] text-amber-400">
          ⚠ {tasks.overdueCount} overdue
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Summary Card
// ─────────────────────────────────────────────────────────────────────────────

export function ContactSummaryCard({
  summary,
}: {
  summary: ContactSummaryData;
}) {
  const hasData =
    summary.money.items.length > 0 ||
    summary.tasks.items.length > 0 ||
    summary.reminders.items.length > 0;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-sm space-y-4 mt-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
          <User className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {summary.contact.name}
          </p>
          {summary.contact.email && (
            <p className="text-[11px] text-zinc-500">{summary.contact.email}</p>
          )}
        </div>
      </div>

      {!hasData && (
        <p className="text-xs text-zinc-500 text-center py-2">
          Nothing pending with {summary.contact.name}.
        </p>
      )}

      <MoneySummarySection money={summary.money} />
      <TasksSummarySection tasks={summary.tasks} />

      {summary.reminders.items.length > 0 && (
        <div>
          <SectionLabel
            icon={Bell}
            label="Upcoming Reminders"
            count={summary.reminders.upcomingCount}
            accentColor="violet"
          />
          <div className="space-y-1.5">
            {summary.reminders.items.slice(0, 3).map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-1.5"
              >
                <Bell className="size-3 text-violet-400 shrink-0" />
                <span className="flex-1 truncate text-xs text-zinc-300">
                  {reminder.title}
                </span>
                <span className="shrink-0 text-[10px] text-zinc-500">
                  {new Date(reminder.next_run_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Pending Summary Card
// ─────────────────────────────────────────────────────────────────────────────

export function UserPendingSummaryCard({
  summary,
}: {
  summary: UserPendingSummaryData;
}) {
  const hasData =
    summary.money.items.length > 0 || summary.tasks.items.length > 0;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-sm space-y-4 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-lg bg-lime-400/10 border border-lime-400/20 text-lime-400">
          <TrendingUp className="size-3.5" />
        </div>
        <p className="text-sm font-semibold text-white">Your Pending Summary</p>
      </div>

      {!hasData && (
        <p className="text-xs text-zinc-500 text-center py-2">
          Nothing pending. You&apos;re all caught up! 🎉
        </p>
      )}

      <MoneySummarySection money={summary.money} showContact />
      <TasksSummarySection tasks={summary.tasks} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pending List Preview Card (before sending)
// ─────────────────────────────────────────────────────────────────────────────

export function PendingListPreviewCard({
  contactName,
  messagePreview,
}: {
  contactName: string;
  messagePreview: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-4 backdrop-blur-sm mt-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex size-6 items-center justify-center rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
          <ArrowRight className="size-3.5" />
        </div>
        <p className="text-sm font-semibold text-white">
          Ready to send to {contactName}
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-3">
        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
          {messagePreview}
        </pre>
      </div>
    </div>
  );
}
