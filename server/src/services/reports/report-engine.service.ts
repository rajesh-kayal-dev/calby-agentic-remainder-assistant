/**
 * Report Engine Service
 *
 * Orchestrates existing domain services/repositories to produce
 * provider-independent structured Report objects.
 *
 * IMPORTANT:
 * - This service NEVER duplicates Money/Task/Reminder business logic.
 * - All data comes from the domain services via their existing methods.
 * - All calculations (totals, rates, balances) happen here, never in the LLM.
 * - Every query is scoped to authUserId.
 */

import { listLedgerItemsFromDb } from "../../repositories/money.repository.js";
import {
  listTasksFromDb,
  listPendingTasksFromDb,
  listTasksForContactFromDb,
} from "../../repositories/task.repository.js";
import {
  getUserRemindersFromDb,
} from "../../repositories/reminder.repository.js";
import {
  listContactsFromDb,
  findContactsByNameFromDb,
  getContactByIdFromDb,
} from "../../repositories/contact.repository.js";
import { getUserPreferences } from "../../repositories/preferences.repository.js";
import { resolveDateRange } from "./date-range.service.js";
import type {
  ReportType,
  ReportDateRange,
  ReportMetadata,
  ReportSection,
  Report,
  MoneyReportSummary,
  MoneyReportSection,
  TaskReportSummary,
  TaskReportSection,
  ReminderReportSummary,
  ReminderReportSection,
  ContactReportData,
  MonthlySummaryData,
  DailySummaryData,
  OverdueReportData,
  PendingMoneyReport,
  TaskSummaryReport,
  ContactSummaryReport,
  MonthlySummaryReport,
  DailySummaryReport,
  OverdueSummaryReport,
  CurrencyTotal,
  DateRangePreset,
} from "./report.types.js";
import type { LedgerItem } from "../../repositories/money.repository.js";
import type { Task } from "../../repositories/task.repository.js";
import type { ReminderRow } from "../../repositories/reminder.repository.js";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getUserTimezone(authUserId: string): Promise<string> {
  try {
    const prefs = await getUserPreferences(authUserId);
    return prefs?.timezone || "UTC";
  } catch {
    return "UTC";
  }
}

function makeMetadata(
  title: string,
  timezone: string,
  dateRange?: ReportDateRange,
): ReportMetadata {
  return {
    title,
    generatedAt: new Date().toISOString(),
    timezone,
    dateRange: dateRange
      ? {
          label: dateRange.label,
          startAt: dateRange.startAt.toISOString(),
          endAt: dateRange.endAt.toISOString(),
        }
      : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Money aggregation helpers
// ─────────────────────────────────────────────────────────────────────────────

function aggregateMoneyItems(items: LedgerItem[]): MoneyReportSummary {
  const receivableByCurrency = new Map<string, number>();
  const payableByCurrency = new Map<string, number>();
  let totalReceivable = 0;
  let totalPayable = 0;

  for (const item of items) {
    const currency = item.currency || "INR";
    const amount = Number(item.remaining_amount) || 0;

    if (item.direction === "receivable") {
      totalReceivable += amount;
      receivableByCurrency.set(
        currency,
        (receivableByCurrency.get(currency) || 0) + amount,
      );
    } else {
      totalPayable += amount;
      payableByCurrency.set(
        currency,
        (payableByCurrency.get(currency) || 0) + amount,
      );
    }
  }

  const toArr = (map: Map<string, number>): CurrencyTotal[] =>
    Array.from(map.entries()).map(([currency, amount]) => ({ currency, amount }));

  return {
    totalReceivable,
    totalPayable,
    netPending: totalReceivable - totalPayable,
    receivableByCurrency: toArr(receivableByCurrency),
    payableByCurrency: toArr(payableByCurrency),
    itemCount: items.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Task aggregation helpers
// ─────────────────────────────────────────────────────────────────────────────

function aggregateTasks(items: Task[]): TaskReportSummary {
  const now = new Date();
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let cancelled = 0;
  let overdue = 0;

  for (const task of items) {
    switch (task.status) {
      case "pending":
        pending++;
        break;
      case "in_progress":
        inProgress++;
        break;
      case "completed":
        completed++;
        break;
      case "cancelled":
        cancelled++;
        break;
    }
    if (
      (task.status === "pending" || task.status === "in_progress") &&
      task.due_at &&
      new Date(task.due_at) < now
    ) {
      overdue++;
    }
  }

  const total = items.length;
  const completionRatePercent =
    total === 0
      ? 0
      : Math.round(((completed / total) * 100 + Number.EPSILON) * 10) / 10;

  return {
    total,
    pending,
    inProgress,
    completed,
    cancelled,
    overdue,
    completionRatePercent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reminder aggregation helpers
// ─────────────────────────────────────────────────────────────────────────────

function aggregateReminders(items: ReminderRow[]): ReminderReportSummary {
  const now = new Date();
  let active = 0;
  let completed = 0;
  let upcoming = 0;

  for (const r of items) {
    if (r.status === "active") {
      active++;
      if (new Date(r.next_run_at) >= now) upcoming++;
    } else if (r.status === "completed") {
      completed++;
    }
  }

  return { total: items.length, active, completed, upcoming };
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact resolution
// ─────────────────────────────────────────────────────────────────────────────

export type ContactResolutionResult =
  | { resolved: true; contactId: string; contactName: string }
  | { resolved: false; status: "CONTACT_NOT_FOUND" | "AMBIGUOUS_CONTACT"; message: string; matches?: Array<{ id: string; name: string }> };

export async function resolveContactByName(
  authUserId: string,
  contactName: string,
): Promise<ContactResolutionResult> {
  const matches = await findContactsByNameFromDb(authUserId, contactName);

  if (matches.length === 0) {
    return {
      resolved: false,
      status: "CONTACT_NOT_FOUND",
      message: `No contact named "${contactName}" was found.`,
    };
  }

  if (matches.length === 1) {
    return { resolved: true, contactId: matches[0].id, contactName: matches[0].name };
  }

  // Multiple — exact match wins
  const exact = matches.find(
    (m) => m.name.toLowerCase() === contactName.toLowerCase(),
  );
  if (exact) {
    return { resolved: true, contactId: exact.id, contactName: exact.name };
  }

  return {
    resolved: false,
    status: "AMBIGUOUS_CONTACT",
    message: `Multiple contacts match "${contactName}". Please be more specific.`,
    matches: matches.map((m) => ({ id: m.id, name: m.name })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Pending Money Report
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePendingMoneyReport(
  authUserId: string,
  contactId?: string,
): Promise<PendingMoneyReport> {
  const tz = await getUserTimezone(authUserId);

  const [pendingItems, partialItems] = await Promise.all([
    listLedgerItemsFromDb(authUserId, {
      status: "pending",
      ...(contactId ? { contactId } : {}),
    }),
    listLedgerItemsFromDb(authUserId, {
      status: "partially_paid",
      ...(contactId ? { contactId } : {}),
    }),
  ]);

  const allItems = [...pendingItems, ...partialItems];
  const summary = aggregateMoneyItems(allItems);

  const metadata = makeMetadata("Pending Money Report", tz);

  const sections: ReportSection<MoneyReportSection>[] = [
    {
      id: "pending",
      title: "Pending Items",
      type: "money_items",
      data: { items: allItems, summary },
    },
  ];

  return {
    type: "pending_money",
    metadata,
    summary,
    sections,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Task Summary Report
// ─────────────────────────────────────────────────────────────────────────────

export async function generateTaskSummaryReport(
  authUserId: string,
  dateRange?: ReportDateRange,
  contactId?: string,
): Promise<TaskSummaryReport> {
  const tz = await getUserTimezone(authUserId);

  const tasks = await listTasksFromDb(authUserId, {
    ...(contactId ? { contactId } : {}),
    ...(dateRange ? { dueAfter: dateRange.startAt, dueBefore: dateRange.endAt } : {}),
  });

  const summary = aggregateTasks(tasks);
  const metadata = makeMetadata("Task Summary Report", tz, dateRange);

  const pending = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress",
  );
  const completed = tasks.filter((t) => t.status === "completed");
  const overdueTasks = tasks.filter((t) => {
    const now = new Date();
    return (
      (t.status === "pending" || t.status === "in_progress") &&
      t.due_at &&
      new Date(t.due_at) < now
    );
  });

  const sections: ReportSection[] = [
    {
      id: "pending_tasks",
      title: "Pending Tasks",
      type: "task_items",
      data: { items: pending, summary } as TaskReportSection,
    },
    {
      id: "completed_tasks",
      title: "Completed Tasks",
      type: "task_items",
      data: { items: completed, summary } as TaskReportSection,
    },
    {
      id: "overdue_tasks",
      title: "Overdue Tasks",
      type: "task_items",
      data: { items: overdueTasks, summary } as TaskReportSection,
    },
  ];

  return { type: "task_summary", metadata, summary, sections };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Contact Report
// ─────────────────────────────────────────────────────────────────────────────

export async function generateContactReport(
  authUserId: string,
  contactId: string,
): Promise<ContactSummaryReport> {
  const tz = await getUserTimezone(authUserId);

  const contact = await getContactByIdFromDb(authUserId, contactId);
  if (!contact) {
    throw new Error("CONTACT_NOT_FOUND");
  }

  const [pendingMoney, partialMoney, tasks, allReminders] = await Promise.all([
    listLedgerItemsFromDb(authUserId, { status: "pending", contactId }),
    listLedgerItemsFromDb(authUserId, { status: "partially_paid", contactId }),
    listTasksForContactFromDb(authUserId, contactId),
    getUserRemindersFromDb(authUserId, "active"),
  ]);

  const moneyItems = [...pendingMoney, ...partialMoney];
  const contactReminders = allReminders.filter((r) => r.recipient_id === contactId);

  const moneySection: MoneyReportSection = {
    items: moneyItems,
    summary: aggregateMoneyItems(moneyItems),
  };

  const taskSection: TaskReportSection = {
    items: tasks,
    summary: aggregateTasks(tasks),
  };

  const reminderSection: ReminderReportSection = {
    items: contactReminders,
    summary: aggregateReminders(contactReminders),
  };

  const contactData: ContactReportData = {
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone_number: contact.phone_number,
    },
    money: moneySection,
    tasks: taskSection,
    reminders: reminderSection,
  };

  const metadata = makeMetadata(`${contact.name} — Contact Report`, tz);

  const sections: ReportSection[] = [
    {
      id: "money",
      title: "Money",
      type: "money_summary",
      data: moneySection,
    },
    {
      id: "tasks",
      title: "Tasks",
      type: "task_summary",
      data: taskSection,
    },
    {
      id: "reminders",
      title: "Reminders",
      type: "reminder_summary",
      data: reminderSection,
    },
  ];

  return { type: "contact_summary", metadata, summary: contactData, sections };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Monthly Summary Report
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMonthlySummaryReport(
  authUserId: string,
  preset: DateRangePreset = "this_month",
  customStart?: string,
  customEnd?: string,
): Promise<MonthlySummaryReport> {
  const tz = await getUserTimezone(authUserId);
  const dateRange = resolveDateRange(preset, tz, customStart, customEnd);

  // Parallel queries
  const [pendingMoney, partialMoney, tasks, allReminders, contacts] =
    await Promise.all([
      listLedgerItemsFromDb(authUserId, { status: "pending" }),
      listLedgerItemsFromDb(authUserId, { status: "partially_paid" }),
      listTasksFromDb(authUserId, {
        dueAfter: dateRange.startAt,
        dueBefore: dateRange.endAt,
      }),
      getUserRemindersFromDb(authUserId),
      listContactsFromDb(authUserId),
    ]);

  const moneyItems = [...pendingMoney, ...partialMoney];
  const moneySection: MoneyReportSection = {
    items: moneyItems,
    summary: aggregateMoneyItems(moneyItems),
  };

  const taskSection: TaskReportSection = {
    items: tasks,
    summary: aggregateTasks(tasks),
  };

  // Filter reminders in range
  const rangeReminders = allReminders.filter((r) => {
    const nextRun = new Date(r.next_run_at);
    return nextRun >= dateRange.startAt && nextRun <= dateRange.endAt;
  });

  const reminderSection: ReminderReportSection = {
    items: rangeReminders,
    summary: aggregateReminders(rangeReminders),
  };

  // Top contacts by pending money
  const contactPendingMap = new Map<string, { moneyPending: number; tasksPending: number }>();
  for (const item of moneyItems) {
    const cur = contactPendingMap.get(item.contact_id) || { moneyPending: 0, tasksPending: 0 };
    cur.moneyPending += Number(item.remaining_amount) || 0;
    contactPendingMap.set(item.contact_id, cur);
  }
  for (const task of tasks) {
    if (task.contact_id && (task.status === "pending" || task.status === "in_progress")) {
      const cur = contactPendingMap.get(task.contact_id) || { moneyPending: 0, tasksPending: 0 };
      cur.tasksPending++;
      contactPendingMap.set(task.contact_id, cur);
    }
  }

  const topContacts = Array.from(contactPendingMap.entries())
    .filter(([, v]) => v.moneyPending > 0 || v.tasksPending > 0)
    .sort(([, a], [, b]) => b.moneyPending - a.moneyPending)
    .slice(0, 10)
    .map(([contactId, stats]) => {
      const contact = contacts.find((c) => c.id === contactId);
      return {
        contact: { id: contactId, name: contact?.name ?? "Unknown" },
        ...stats,
      };
    });

  const summaryData: MonthlySummaryData = {
    money: moneySection,
    tasks: taskSection,
    reminders: reminderSection,
    topContacts,
  };

  const metadata = makeMetadata(
    `${dateRange.label} Summary`,
    tz,
    dateRange,
  );

  const sections: ReportSection[] = [
    { id: "money", title: "Money", type: "money_summary", data: moneySection },
    { id: "tasks", title: "Tasks", type: "task_summary", data: taskSection },
    { id: "reminders", title: "Reminders", type: "reminder_summary", data: reminderSection },
    { id: "top_contacts", title: "Pending Contacts", type: "contact_list", data: topContacts },
  ];

  return { type: "monthly_summary", metadata, summary: summaryData, sections };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Daily Summary Report
// ─────────────────────────────────────────────────────────────────────────────

export async function generateDailySummaryReport(
  authUserId: string,
): Promise<DailySummaryReport> {
  const tz = await getUserTimezone(authUserId);
  const dateRange = resolveDateRange("today", tz);

  const [todayTasks, allReminders, pendingMoney, partialMoney] = await Promise.all([
    listTasksFromDb(authUserId, {
      dueAfter: dateRange.startAt,
      dueBefore: dateRange.endAt,
    }),
    getUserRemindersFromDb(authUserId, "active"),
    listLedgerItemsFromDb(authUserId, { status: "pending" }),
    listLedgerItemsFromDb(authUserId, { status: "partially_paid" }),
  ]);

  // Filter reminders due today
  const todayReminders = allReminders.filter((r) => {
    const nextRun = new Date(r.next_run_at);
    return nextRun >= dateRange.startAt && nextRun <= dateRange.endAt;
  });

  const taskSection: TaskReportSection = {
    items: todayTasks,
    summary: aggregateTasks(todayTasks),
  };

  const reminderSection: ReminderReportSection = {
    items: todayReminders,
    summary: aggregateReminders(todayReminders),
  };

  const allPending = [...pendingMoney, ...partialMoney];
  const pendingSection: MoneyReportSection = {
    items: allPending,
    summary: aggregateMoneyItems(allPending),
  };

  const summaryData: DailySummaryData = {
    tasks: taskSection,
    reminders: reminderSection,
    pendingMoney: pendingSection,
  };

  const metadata = makeMetadata("Daily Summary", tz, dateRange);

  const sections: ReportSection[] = [
    { id: "tasks", title: "Today's Tasks", type: "task_summary", data: taskSection },
    { id: "reminders", title: "Today's Reminders", type: "reminder_summary", data: reminderSection },
    { id: "pending_money", title: "Pending Money", type: "money_summary", data: pendingSection },
  ];

  return { type: "daily_summary", metadata, summary: summaryData, sections };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Overdue Summary Report
// ─────────────────────────────────────────────────────────────────────────────

export async function generateOverdueReport(
  authUserId: string,
): Promise<OverdueSummaryReport> {
  const tz = await getUserTimezone(authUserId);
  const now = new Date();

  const [overdueTasks, allReminders, pendingMoney, partialMoney] = await Promise.all([
    listTasksFromDb(authUserId, { overdue: true }),
    getUserRemindersFromDb(authUserId, "active"),
    listLedgerItemsFromDb(authUserId, { status: "pending" }),
    listLedgerItemsFromDb(authUserId, { status: "partially_paid" }),
  ]);

  // Money overdue = has due_at in the past
  const allMoney = [...pendingMoney, ...partialMoney];
  const overdueMoney = allMoney.filter(
    (item) => item.due_at && new Date(item.due_at) < now,
  );

  // Reminders overdue = next_run_at in the past
  const overdueReminders = allReminders.filter(
    (r) => new Date(r.next_run_at) < now,
  );

  const summaryData: OverdueReportData = {
    money: { items: overdueMoney, count: overdueMoney.length },
    tasks: { items: overdueTasks, count: overdueTasks.length },
    reminders: { items: overdueReminders, count: overdueReminders.length },
    totalOverdueItems:
      overdueMoney.length + overdueTasks.length + overdueReminders.length,
  };

  const metadata = makeMetadata("Overdue Report", tz);

  const sections: ReportSection[] = [
    {
      id: "overdue_money",
      title: "Overdue Money",
      type: "money_items",
      data: overdueMoney,
    },
    {
      id: "overdue_tasks",
      title: "Overdue Tasks",
      type: "task_items",
      data: overdueTasks,
    },
    {
      id: "overdue_reminders",
      title: "Overdue Reminders",
      type: "reminder_items",
      data: overdueReminders,
    },
  ];

  return { type: "overdue_summary", metadata, summary: summaryData, sections };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic dispatcher
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateReportInput {
  type: ReportType;
  authUserId: string;
  contactId?: string;
  dateRangePreset?: DateRangePreset;
  customStartAt?: string;
  customEndAt?: string;
}

export async function generateReport(
  input: GenerateReportInput,
): Promise<Report> {
  const {
    type,
    authUserId,
    contactId,
    dateRangePreset,
    customStartAt,
    customEndAt,
  } = input;

  switch (type) {
    case "pending_money":
      return generatePendingMoneyReport(authUserId, contactId);

    case "task_summary": {
      let dateRange: ReportDateRange | undefined;
      if (dateRangePreset) {
        const tz = await getUserTimezone(authUserId);
        dateRange = resolveDateRange(dateRangePreset, tz, customStartAt, customEndAt);
      }
      return generateTaskSummaryReport(authUserId, dateRange, contactId);
    }

    case "contact_summary":
      if (!contactId) throw new Error("contact_summary requires contactId");
      return generateContactReport(authUserId, contactId);

    case "monthly_summary":
      return generateMonthlySummaryReport(
        authUserId,
        dateRangePreset || "this_month",
        customStartAt,
        customEndAt,
      );

    case "daily_summary":
      return generateDailySummaryReport(authUserId);

    case "overdue_summary":
      return generateOverdueReport(authUserId);

    case "money_summary": {
      // Alias for pending money report (may be extended later)
      return generatePendingMoneyReport(authUserId, contactId);
    }

    default: {
      const _exhaustive: never = type;
      throw new Error(`Unsupported report type: ${String(_exhaustive)}`);
    }
  }
}
