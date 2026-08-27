import { getContact, listContacts } from "./contact.service.js";
import { getContactBalance, listLedgerItems } from "./money.service.js";
import { listTasks, listTasksForContact } from "./task.service.js";
import { getUserReminders } from "./reminder.service.js";

export interface PendingMoneySummary {
  totalReceivables: number;
  totalPayables: number;
  net: number;
  items: any[];
}

export interface PendingTasksSummary {
  pendingCount: number;
  overdueCount: number;
  items: any[];
}

export interface ContactSummary {
  contact: {
    id: string;
    name: string;
    email?: string | null;
    phoneNumber?: string | null;
  };
  money: PendingMoneySummary;
  tasks: PendingTasksSummary;
  reminders: {
    upcomingCount: number;
    items: any[];
  };
}

export interface UserPendingSummary {
  money: PendingMoneySummary;
  tasks: PendingTasksSummary;
}

export async function getContactSummary(
  authUserId: string,
  contactId: string,
): Promise<ContactSummary> {
  const contact = await getContact(authUserId, contactId);
  if (!contact) {
    throw new Error("Contact not found or access denied");
  }

  // Money
  const balance = await getContactBalance(authUserId, contactId);
  const pendingMoneyItems = await listLedgerItems(authUserId, { status: "pending", contactId });
  const partialMoneyItems = await listLedgerItems(authUserId, { status: "partially_paid", contactId });
  
  // Tasks
  const pendingTasks = await listTasks(authUserId, { contactId, status: "pending" });
  const inProgressTasks = await listTasks(authUserId, { contactId, status: "in_progress" });
  const allActiveTasks = [...pendingTasks, ...inProgressTasks];
  
  const now = new Date();
  const overdueTasks = allActiveTasks.filter((t: any) => t.due_at && new Date(t.due_at) < now);

  // Reminders
  const allReminders = await getUserReminders(authUserId, "active");
  const contactReminders = allReminders.filter((r: any) => r.recipient_id === contactId);

  return {
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phoneNumber: contact.phone_number,
    },
    money: {
      totalReceivables: Number(balance.receivables) || 0,
      totalPayables: Number(balance.payables) || 0,
      net: Number(balance.net) || 0,
      items: [...pendingMoneyItems, ...partialMoneyItems],
    },
    tasks: {
      pendingCount: allActiveTasks.length,
      overdueCount: overdueTasks.length,
      items: allActiveTasks,
    },
    reminders: {
      upcomingCount: contactReminders.length,
      items: contactReminders,
    }
  };
}

export async function getUserPendingSummary(authUserId: string): Promise<UserPendingSummary> {
  // Money
  const pendingMoneyItems = await listLedgerItems(authUserId, { status: "pending" });
  const partialMoneyItems = await listLedgerItems(authUserId, { status: "partially_paid" });
  const allMoneyItems = [...pendingMoneyItems, ...partialMoneyItems];
  
  let totalReceivables = 0;
  let totalPayables = 0;
  
  for (const item of allMoneyItems) {
    if (item.direction === "receivable") {
      totalReceivables += Number(item.remaining_amount);
    } else {
      totalPayables += Number(item.remaining_amount);
    }
  }

  // Tasks
  const pendingTasks = await listTasks(authUserId, { status: "pending" });
  const inProgressTasks = await listTasks(authUserId, { status: "in_progress" });
  const allActiveTasks = [...pendingTasks, ...inProgressTasks];
  
  const now = new Date();
  const overdueTasks = allActiveTasks.filter((t: any) => t.due_at && new Date(t.due_at) < now);

  return {
    money: {
      totalReceivables,
      totalPayables,
      net: totalReceivables - totalPayables,
      items: allMoneyItems,
    },
    tasks: {
      pendingCount: allActiveTasks.length,
      overdueCount: overdueTasks.length,
      items: allActiveTasks,
    },
  };
}

export function formatPendingSummary(
  summary: Partial<ContactSummary> & Partial<UserPendingSummary>,
  contextName?: string
): string {
  let output = "";
  
  const header = contextName ? `${contextName}'s pending list:\n\n` : "Your pending list:\n\n";
  output += header;
  
  if (summary.money && summary.money.items.length > 0) {
    output += "Money:\n";
    for (const item of summary.money.items) {
      const type = item.direction === "receivable" ? "owes you" : "you owe";
      const contactStr = !contextName && item.contact_name ? ` (${item.contact_name})` : "";
      output += `- ${item.title}${contactStr} — ₹${item.remaining_amount}\n`;
    }
    
    if (contextName) {
      if (summary.money.net > 0) {
        output += `Total pending to collect: ₹${summary.money.net}\n\n`;
      } else if (summary.money.net < 0) {
        output += `Total pending to pay: ₹${Math.abs(summary.money.net)}\n\n`;
      } else {
        output += `Total pending: ₹0\n\n`;
      }
    } else {
      output += `Total Receivables: ₹${summary.money.totalReceivables}\n`;
      output += `Total Payables: ₹${summary.money.totalPayables}\n\n`;
    }
  }
  
  if (summary.tasks && summary.tasks.items.length > 0) {
    output += "Tasks:\n";
    for (const task of summary.tasks.items) {
      const contactStr = !contextName && task.contactId ? ` (related to contact)` : "";
      const dueStr = task.due_at ? ` (due: ${new Date(task.due_at).toLocaleDateString()})` : "";
      output += `- ${task.title}${contactStr}${dueStr}\n`;
    }
    output += "\n";
  }
  
  if (summary.reminders && summary.reminders.items.length > 0) {
    output += "Upcoming Reminders:\n";
    for (const reminder of summary.reminders.items) {
      output += `- ${reminder.title} (due: ${new Date(reminder.next_run_at).toLocaleDateString()})\n`;
    }
    output += "\n";
  }
  
  if (output.trim() === header.trim()) {
    output += "Nothing is currently pending.\n";
  }

  return output.trim();
}
