import { z } from "zod";
import {
  handleGetEvents,
  handleFindFreeSlots,
  handleCreateEvent,
  handleUpdateEvent,
  handleDeleteEvent,
} from "./handlers/calendar.handlers.js";
import {
  createReminder,
  getUserReminders,
  cancelReminder,
} from "../services/reminder.service.js";
import { findContactsByName, listContacts } from "../services/contact.service.js";
import {
  createTaskList,
  listTaskLists,
  createTask,
  listTasks,
  completeTask,
  cancelTask,
  searchTasksByTitle,
  getTask,
  updateTask,
} from "../services/task.service.js";
import {
  createLedgerItem,
  listLedgerItems,
  getLedgerItem,
  recordPayment,
  markLedgerItemPaid,
  cancelLedgerItem,
  getContactBalance,
} from "../services/money.service.js";
import {
  getContactSummary,
  getUserPendingSummary,
  formatPendingSummary,
} from "../services/personal-assistant.service.js";
import {
  handleSearchEmails,
  handleGetMessage,
  handleSendEmail,
} from "./handlers/gmail.handlers.js";
import {
  handleSearchFiles,
  handleGetFile,
} from "./handlers/drive.handlers.js";
import {
  handleSearchNotionPages,
  handleGetNotionPage,
  handleCreateNotionPage,
} from "./handlers/notion.handlers.js";
import {
  handleSendSlackMessage,
  handleSearchSlackMessages,
} from "./handlers/slack.handlers.js";
import {
  handleCreateTeamsMeeting,
} from "./handlers/teams.handlers.js";
import {
  generateReport,
  resolveContactByName,
} from "../services/reports/report-engine.service.js";
import { renderReport, renderReportSummaryLine } from "../services/reports/report-renderer.service.js";
import type { ReportType, DateRangePreset } from "../services/reports/report.types.js";
import {
  prepareReportDelivery,
  executeReportDelivery,
  type DeliveryChannel,
} from "../services/reports/report-delivery.service.js";

export interface ToolExecutionContext {
  conversationId?: string;
}

export interface BackendToolDefinition<TInput = any, TResult = any> {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredConnection?: "google_calendar" | "gmail" | "whatsapp" | "telegram";
  confirmationRequired: boolean;
  inputSchema: z.ZodType<TInput>;
  execute: (
    authUserId: string,
    input: TInput,
    context?: ToolExecutionContext,
  ) => Promise<TResult>;
}

export const TOOLS_REGISTRY: Record<string, BackendToolDefinition> = {
  "calendar.get_events": {
    id: "calendar.get_events",
    name: "Get Calendar Events",
    description: "Fetch upcoming meetings and events from calendar",
    category: "CALENDAR",
    confirmationRequired: false,
    inputSchema: z.object({
      maxResults: z.number().min(1).max(50).optional().default(10),
      todayOnly: z.boolean().optional().default(false),
    }),
    execute: async (authUserId, input) => handleGetEvents(authUserId, input),
  },

  "calendar.find_free_slots": {
    id: "calendar.find_free_slots",
    name: "Find Free Time",
    description: "Check free/busy time slots in calendar",
    category: "CALENDAR",
    confirmationRequired: false,
    inputSchema: z.object({
      startIso: z.string().optional(),
      endIso: z.string().optional(),
    }),
    execute: async (authUserId, input) => handleFindFreeSlots(authUserId, input),
  },

  "calendar.create_event": {
    id: "calendar.create_event",
    name: "Create Calendar Event",
    description: "Create a new meeting or event on calendar",
    category: "CALENDAR",
    requiredConnection: "google_calendar",
    confirmationRequired: false,
    inputSchema: z.object({
      title: z.string().min(1),
      startIso: z.string(),
      endIso: z.string(),
      attendees: z.array(z.string().email()).optional(),
      description: z.string().optional(),
      addGoogleMeet: z.boolean().optional(),
    }),
    execute: async (authUserId, input) => handleCreateEvent(authUserId, input),
  },

  "calendar.update_event": {
    id: "calendar.update_event",
    name: "Update Calendar Event",
    description: "Reschedule an existing calendar event",
    category: "CALENDAR",
    requiredConnection: "google_calendar",
    confirmationRequired: false,
    inputSchema: z.object({
      eventId: z.string().min(1),
      startIso: z.string(),
      endIso: z.string(),
    }),
    execute: async (authUserId, input) => handleUpdateEvent(authUserId, input),
  },

  "calendar.delete_event": {
    id: "calendar.delete_event",
    name: "Delete Calendar Event",
    description: "Cancel and remove a calendar event",
    category: "CALENDAR",
    requiredConnection: "google_calendar",
    confirmationRequired: true,
    inputSchema: z.object({
      eventId: z.string().min(1),
    }),
    execute: async (authUserId, input) => handleDeleteEvent(authUserId, input),
  },

  "meeting.create": {
    id: "meeting.create",
    name: "Create Meeting",
    description: "Create a team video meeting",
    category: "MEETINGS",
    requiredConnection: "google_calendar",
    confirmationRequired: false,
    inputSchema: z.object({
      title: z.string().min(1),
      startIso: z.string(),
      endIso: z.string(),
      attendees: z.array(z.string().email()).optional(),
      description: z.string().optional(),
    }),
    execute: async (authUserId, input) =>
      handleCreateEvent(authUserId, { ...input, addGoogleMeet: true }),
  },

  "gmail.send": {
    id: "gmail.send",
    name: "Send Email",
    description: "Send an email via Gmail on behalf of the user",
    category: "COMMUNICATION",
    requiredConnection: "gmail" as any,
    confirmationRequired: true,
    inputSchema: z.object({
      to: z.string().min(1).describe("Recipient email address"),
      subject: z.string().min(1).describe("Email subject line"),
      body: z.string().min(1).describe("Email body text"),
    }),
    execute: async (authUserId, input) => handleSendEmail(authUserId, input),
  },

  "whatsapp.send": {
    id: "whatsapp.send",
    name: "Send WhatsApp Message",
    description: "Send a WhatsApp message",
    category: "COMMUNICATION",
    requiredConnection: "whatsapp",
    confirmationRequired: true,
    inputSchema: z.object({
      recipient: z.string().min(1),
      message: z.string().min(1),
    }),
    execute: async () => {
      throw new Error("WhatsApp connector required");
    },
  },

  "telegram.send": {
    id: "telegram.send",
    name: "Send Telegram Message",
    description: "Send a Telegram message via Nango to a specified recipient or the user's linked Telegram chat.",
    category: "COMMUNICATION",
    requiredConnection: "telegram",
    confirmationRequired: true,
    inputSchema: z.object({
      recipient: z.string().optional().describe("Phone number, contact name, @username, or Chat ID. If omitted, sends to the user's own linked Telegram chat."),
      chatId: z.string().optional().describe("Alias for recipient/chatId"),
      message: z.string().min(1).describe("Text message to send"),
    }),
    execute: async (authUserId, input) => {
      const rawRecipient = (input.recipient || input.chatId || "").trim();
      let targetChatId: string | null = null;
      let displayRecipient = "your Telegram account";

      if (rawRecipient.length > 0) {
        displayRecipient = rawRecipient;

        // 1. If rawRecipient starts with @ or is a pure numeric ID (e.g. 123456789), use directly
        if (rawRecipient.startsWith("@") || /^-?\d{5,15}$/.test(rawRecipient)) {
          targetChatId = rawRecipient;
        } else {
          // 2. Search contacts by phone number or name
          const { listContacts } = await import("../services/contact.service.js");
          const contacts = await listContacts(authUserId, { search: rawRecipient });
          const matched = contacts.find((c) => Boolean(c.telegram_id));

          if (matched && matched.telegram_id) {
            targetChatId = matched.telegram_id;
            displayRecipient = matched.name || rawRecipient;
          }
        }
      }

      // 3. Fallback to user's own linked Telegram chat if no recipient specified
      if (!targetChatId) {
        const { getUserTelegramConnection } = await import("../services/notifications/telegram-connection.service.js");
        const tgConn = await getUserTelegramConnection(authUserId);
        if (tgConn.chatId) {
          targetChatId = tgConn.chatId;
          displayRecipient = "your linked Telegram chat";
        } else {
          const { getIntegrationRow } = await import("../services/integrations/integration.service.js");
          const row = await getIntegrationRow(authUserId, "telegram");
          if (row?.metadata && (row.metadata as any).chatId) {
            targetChatId = (row.metadata as any).chatId;
            displayRecipient = "your linked Telegram chat";
          }
        }
      }

      // 4. Handle unresolved phone number gracefully without erroring or asking redundant questions
      if (!targetChatId || /^\+?\d{7,15}$/.test(targetChatId.replace(/\s+/g, ""))) {
        return {
          success: false,
          error: `Telegram Bot API requires a numeric Chat ID or @username to initiate messages. To send messages to ${displayRecipient}, ask them to open @CalbyAssistantBot and press Start, or add their Telegram username to your Calby contacts.`,
          actionRequired: "LINK_RECIPIENT",
        };
      }

      const { proxyRequest } = await import("../services/nango/nango.client.js");
      const res = await proxyRequest<any>({
        integrationId: "telegram",
        connectionId: authUserId,
        method: "POST",
        endpoint: "/sendMessage",
        data: {
          chat_id: targetChatId,
          text: input.message,
        },
      });

      const messageId = res?.result?.message_id || res?.message_id || "sent";

      return {
        success: true,
        message: `Message sent successfully to ${displayRecipient}.`,
        messageId,
        recipient: displayRecipient,
      };
    },
  },

  "contact.search": {
    id: "contact.search",
    name: "Search Contacts",
    description: "Search user's contacts by name or keyword to resolve recipients",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      query: z.string().describe("Search query for contact name, email, or phone"),
    }),
    execute: async (authUserId, input) => {
      const contacts = await listContacts(authUserId, { search: input.query });
      return {
        count: contacts.length,
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phoneNumber: c.phone_number,
          telegramId: c.telegram_id,
        })),
      };
    },
  },

  "reminder.create": {
    id: "reminder.create",
    name: "Create Reminder",
    description: "Create a time-based reminder or structured obligation (subscription, payment, renewal, etc.)",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      title: z.string().min(1, "Reminder title is required"),
      dueAtIso: z.string().optional().describe("Direct execution timestamp ISO (if no offset)"),
      obligationType: z
        .enum([
          "custom",
          "payment",
          "subscription",
          "free_trial",
          "renewal",
          "expiry",
          "warranty",
          "meeting",
          "birthday",
          "invoice",
        ])
        .optional()
        .default("custom"),
      eventAtIso: z.string().optional().describe("Event, renewal, or due date ISO timestamp"),
      remindBeforeValue: z.number().optional().describe("Number of minutes/hours/days/weeks/months before event date to remind"),
      remindBeforeUnit: z.enum(["minutes", "hours", "days", "weeks", "months"]).optional().default("days"),
      amount: z.number().optional().describe("Payment or renewal amount"),
      currency: z.string().optional().default("INR"),
      subject: z.string().optional().describe("Obligation subject (e.g. Netflix, Passport)"),
      recipientName: z.string().optional().describe("Recipient contact name (e.g. 'Rahul', 'Sarah')"),
      recipientId: z.string().optional().describe("Contact UUID if already resolved"),
      channel: z.enum(["in_app", "email", "telegram", "whatsapp"]).optional().default("in_app"),
      description: z.string().optional(),
      timezone: z.string().optional().default("Asia/Kolkata"),
      recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional().default("none"),
      taskId: z.string().optional().describe("Task UUID to associate this reminder with"),
      taskTitle: z.string().optional().describe("Title of existing task to search and link"),
    }),
    execute: async (authUserId, input) => {
      // 1. Missing Required Info Check for Obligations
      if (
        input.obligationType &&
        input.obligationType !== "custom" &&
        !input.eventAtIso
      ) {
        return {
          status: "MISSING_REQUIRED_INFO",
          missingField: "eventAtIso",
          message: `When is the renewal or due date for your ${input.obligationType} reminder?`,
        };
      }

      // 2. Missing Required Info Check for Reminder Time
      if (!input.dueAtIso && !input.eventAtIso) {
        return {
          status: "MISSING_REQUIRED_INFO",
          missingField: "dueAtIso",
          message: "When would you like to be reminded?",
        };
      }

      let resolvedRecipientId = input.recipientId;

      // 3. Ambiguity Resolution Logic for recipientName
      if (!resolvedRecipientId && input.recipientName && input.recipientName.trim().length > 0) {
        const matches = await findContactsByName(authUserId, input.recipientName);
        if (matches.length === 1) {
          resolvedRecipientId = matches[0].id;
        } else if (matches.length > 1) {
          return {
            status: "AMBIGUOUS_RECIPIENT",
            message: `Multiple contacts match '${input.recipientName}'. Please ask the user which contact they mean.`,
            matches: matches.map((m) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              phoneNumber: m.phone_number,
            })),
          };
        }
      }

      // 4. Resolve Task
      let resolvedTaskId = input.taskId;
      if (!resolvedTaskId && input.taskTitle && input.taskTitle.trim().length > 0) {
        const matches = await searchTasksByTitle(authUserId, input.taskTitle);
        if (matches.length === 1) {
          resolvedTaskId = matches[0].id;
        } else if (matches.length > 1) {
          return {
            status: "AMBIGUOUS_TASK",
            message: `Multiple tasks match '${input.taskTitle}'. Please clarify which task you mean.`,
            matches: matches.map((m) => ({
              id: m.id,
              title: m.title,
              status: m.status,
            })),
          };
        }
      }

      if (resolvedTaskId) {
        const task = await getTask(authUserId, resolvedTaskId);
        if (!task) {
          return {
            status: "ERROR",
            message: "Task not found or access denied.",
          };
        }
      }

      const remindBefore =
        input.remindBeforeValue && input.remindBeforeValue > 0
          ? {
              value: input.remindBeforeValue,
              unit: input.remindBeforeUnit,
            }
          : undefined;

      const res = await createReminder({
        authUserId,
        recipientId: resolvedRecipientId,
        title: input.title,
        description: input.description,
        obligationType: input.obligationType,
        eventAt: input.eventAtIso,
        remindBefore,
        amount: input.amount,
        currency: input.currency,
        subject: input.subject,
        dueAt: input.dueAtIso || input.eventAtIso || new Date().toISOString(),
        channel: input.channel,
        timezone: input.timezone,
        recurrence: input.recurrence,
        taskId: resolvedTaskId,
      });

      return {
        id: res.id,
        title: res.title,
        obligationType: res.obligation_type,
        obligationMetadata: res.obligation_metadata,
        recipientId: res.recipient_id,
        recipientName: res.recipient_name,
        channel: res.channel,
        dueAt: res.due_at instanceof Date ? res.due_at.toISOString() : new Date(res.due_at || Date.now()).toISOString(),
        recurrence: res.recurrence,
        status: res.status,
        taskId: res.task_id,
        created: true,
      };
    },
  },

  "reminder.list": {
    id: "reminder.list",
    name: "List Reminders",
    description: "List active or upcoming reminders for the user",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
    }),
    execute: async (authUserId, input) => {
      const list = await getUserReminders(authUserId, input.status);
      return {
        reminders: list.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          dueAt: r.due_at.toISOString(),
          recurrence: r.recurrence,
          status: r.status,
        })),
      };
    },
  },

  "reminder.cancel": {
    id: "reminder.cancel",
    name: "Cancel Reminder",
    description: "Cancel an existing active reminder",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      reminderId: z.string().min(1),
    }),
    execute: async (authUserId, input) => {
      const res = await cancelReminder(authUserId, input.reminderId);
      return {
        id: input.reminderId,
        cancelled: Boolean(res),
      };
    },
  },

  "task_list.create": {
    id: "task_list.create",
    name: "Create Task List",
    description: "Create a new task list or category to group tasks",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      name: z.string().min(1, "List name is required"),
      description: z.string().optional(),
    }),
    execute: async (authUserId, input) => {
      const res = await createTaskList(authUserId, input.name, input.description);
      return {
        id: res.id,
        name: res.name,
        description: res.description,
        status: res.status,
        created: true,
      };
    },
  },

  "task_list.list": {
    id: "task_list.list",
    name: "List Task Lists",
    description: "List all task lists for the user",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({}),
    execute: async (authUserId) => {
      const list = await listTaskLists(authUserId);
      return {
        taskLists: list.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          status: l.status,
        })),
      };
    },
  },

  "task.create": {
    id: "task.create",
    name: "Create Task",
    description: "Add a new task to a task list. Can specify due date, priority, or associate with a contact.",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      title: z.string().min(1, "Task title is required"),
      taskListId: z.string().optional().describe("UUID of the task list"),
      taskListName: z.string().optional().describe("Name of the task list (will resolve or create if not found)"),
      description: z.string().optional(),
      recipientName: z.string().optional().describe("Name of contact to associate with the task"),
      recipientId: z.string().optional().describe("Contact UUID if already known"),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
      dueAtIso: z.string().optional().describe("ISO timestamp for when the task is due"),
      reminderDueAtIso: z.string().optional().describe("ISO timestamp to set a linked reminder for this task"),
      reminderChannel: z.enum(["in_app", "email", "telegram", "whatsapp"]).optional().default("in_app").describe("Channel for the linked reminder"),
    }),
    execute: async (authUserId, input) => {
      let resolvedRecipientId = input.recipientId;

      // 1. Resolve contact/recipient name
      if (!resolvedRecipientId && input.recipientName && input.recipientName.trim().length > 0) {
        const matches = await findContactsByName(authUserId, input.recipientName);
        if (matches.length === 1) {
          resolvedRecipientId = matches[0].id;
        } else if (matches.length > 1) {
          return {
            status: "AMBIGUOUS_RECIPIENT",
            message: `Multiple contacts match '${input.recipientName}'. Please clarify which contact you mean.`,
            matches: matches.map((m) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              phoneNumber: m.phone_number,
            })),
          };
        }
      }

      // 2. Resolve task list
      let targetTaskListId = input.taskListId;
      if (!targetTaskListId) {
        const lists = await listTaskLists(authUserId);
        if (input.taskListName && input.taskListName.trim().length > 0) {
          const cleanName = input.taskListName.trim().toLowerCase();
          const matches = lists.filter((l) => l.name.toLowerCase() === cleanName);
          if (matches.length === 1) {
            targetTaskListId = matches[0].id;
          } else if (matches.length > 1) {
            return {
              status: "AMBIGUOUS_TASK_LIST",
              message: `Multiple task lists match '${input.taskListName}'. Please clarify which list you mean.`,
              matches: matches.map((m) => ({ id: m.id, name: m.name })),
            };
          } else {
            // Create list automatically
            const newList = await createTaskList(authUserId, input.taskListName);
            targetTaskListId = newList.id;
          }
        } else {
          // Default to "Tasks" or "Inbox" list
          const defaultList = lists.find((l) => l.name.toLowerCase() === "tasks" || l.name.toLowerCase() === "inbox");
          if (defaultList) {
            targetTaskListId = defaultList.id;
          } else {
            const newList = await createTaskList(authUserId, "Tasks");
            targetTaskListId = newList.id;
          }
        }
      }

      const task = await createTask(authUserId, targetTaskListId, {
        title: input.title,
        description: input.description,
        contactId: resolvedRecipientId,
        priority: input.priority,
        dueAt: input.dueAtIso,
      });

      let reminder = null;
      if (input.reminderDueAtIso) {
        reminder = await createReminder({
          authUserId,
          recipientId: resolvedRecipientId,
          title: input.title,
          description: input.description,
          dueAt: input.reminderDueAtIso,
          channel: input.reminderChannel,
          taskId: task.id,
        });
      }

      return {
        id: task.id,
        title: task.title,
        taskListId: task.task_list_id,
        contactId: task.contact_id,
        status: task.status,
        priority: task.priority,
        dueAt: task.due_at?.toISOString() || null,
        reminder: reminder ? {
          id: reminder.id,
          dueAt: reminder.due_at.toISOString(),
          channel: reminder.channel,
        } : null,
        created: true,
      };
    },
  },

  "task.list": {
    id: "task.list",
    name: "List Tasks",
    description: "List tasks for the user with optional filters.",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      taskListId: z.string().optional().describe("UUID of the task list"),
      taskListName: z.string().optional().describe("Name of the task list (will resolve or search)"),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      overdue: z.boolean().optional().describe("Filter to show only overdue tasks"),
      dueBeforeIso: z.string().optional().describe("Filter tasks due on/before this ISO timestamp"),
      dueAfterIso: z.string().optional().describe("Filter tasks due on/after this ISO timestamp"),
      search: z.string().optional().describe("Query to search task titles/descriptions"),
      recipientName: z.string().optional().describe("Name of contact to filter by"),
      recipientId: z.string().optional().describe("Contact UUID to filter by"),
    }),
    execute: async (authUserId, input) => {
      let resolvedRecipientId = input.recipientId;

      if (!resolvedRecipientId && input.recipientName && input.recipientName.trim().length > 0) {
        const matches = await findContactsByName(authUserId, input.recipientName);
        if (matches.length === 1) {
          resolvedRecipientId = matches[0].id;
        } else if (matches.length > 1) {
          return {
            status: "AMBIGUOUS_RECIPIENT",
            message: `Multiple contacts match '${input.recipientName}'. Please clarify which contact you mean.`,
            matches: matches.map((m) => ({
              id: m.id,
              name: m.name,
            })),
          };
        }
      }

      let targetTaskListId = input.taskListId;
      if (!targetTaskListId && input.taskListName && input.taskListName.trim().length > 0) {
        const lists = await listTaskLists(authUserId);
        const cleanName = input.taskListName.trim().toLowerCase();
        const matches = lists.filter((l) => l.name.toLowerCase() === cleanName);
        if (matches.length === 1) {
          targetTaskListId = matches[0].id;
        } else if (matches.length > 1) {
          return {
            status: "AMBIGUOUS_TASK_LIST",
            message: `Multiple task lists match '${input.taskListName}'. Please clarify which list you mean.`,
            matches: matches.map((m) => ({ id: m.id, name: m.name })),
          };
        }
      }

      const tasks = await listTasks(authUserId, {
        taskListId: targetTaskListId,
        status: input.status,
        contactId: resolvedRecipientId,
        priority: input.priority,
        overdue: input.overdue,
        dueBefore: input.dueBeforeIso ? new Date(input.dueBeforeIso) : undefined,
        dueAfter: input.dueAfterIso ? new Date(input.dueAfterIso) : undefined,
        search: input.search,
      });

      return {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueAt: t.due_at?.toISOString() || null,
          completedAt: t.completed_at?.toISOString() || null,
          recurrenceRule: t.recurrence_rule,
          nextOccurrenceAt: t.next_occurrence_at?.toISOString() || null,
        })),
      };
    },
  },

  "task.complete": {
    id: "task.complete",
    name: "Complete Task",
    description: "Mark a task as completed. Specify the task by ID or by title query.",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      taskId: z.string().optional().describe("UUID of the task to complete"),
      title: z.string().optional().describe("Title search query of the task to complete"),
    }),
    execute: async (authUserId, input) => {
      let targetTaskId = input.taskId;

      if (!targetTaskId) {
        if (!input.title || input.title.trim().length === 0) {
          return {
            status: "MISSING_REQUIRED_INFO",
            message: "Which task would you like to complete? Please specify a title or ID.",
          };
        }

        const matches = await searchTasksByTitle(authUserId, input.title);
        const activeMatches = matches.filter((t) => t.status === "pending" || t.status === "in_progress");

        if (activeMatches.length === 1) {
          targetTaskId = activeMatches[0].id;
        } else if (activeMatches.length > 1) {
          return {
            status: "AMBIGUOUS_TASK",
            message: `Multiple active tasks match '${input.title}'. Please clarify which task you mean.`,
            matches: activeMatches.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
            })),
          };
        } else {
          return {
            status: "TASK_NOT_FOUND",
            message: `No pending task matches title '${input.title}'.`,
          };
        }
      }

      const task = await completeTask(authUserId, targetTaskId);
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        completedAt: task.completed_at?.toISOString(),
        completed: true,
      };
    },
  },

  "task.cancel": {
    id: "task.cancel",
    name: "Cancel Task",
    description: "Mark a task as cancelled. Specify the task by ID or by title query.",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      taskId: z.string().optional().describe("UUID of the task to cancel"),
      title: z.string().optional().describe("Title search query of the task to cancel"),
    }),
    execute: async (authUserId, input) => {
      let targetTaskId = input.taskId;

      if (!targetTaskId) {
        if (!input.title || input.title.trim().length === 0) {
          return {
            status: "MISSING_REQUIRED_INFO",
            message: "Which task would you like to cancel? Please specify a title or ID.",
          };
        }

        const matches = await searchTasksByTitle(authUserId, input.title);
        const activeMatches = matches.filter((t) => t.status === "pending" || t.status === "in_progress");

        if (activeMatches.length === 1) {
          targetTaskId = activeMatches[0].id;
        } else if (activeMatches.length > 1) {
          return {
            status: "AMBIGUOUS_TASK",
            message: `Multiple active tasks match '${input.title}'. Please clarify which task you mean.`,
            matches: activeMatches.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
            })),
          };
        } else {
          return {
            status: "TASK_NOT_FOUND",
            message: `No pending task matches title '${input.title}'.`,
          };
        }
      }

      const task = await cancelTask(authUserId, targetTaskId);
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        cancelled: true,
      };
    },
  },

  "task.update": {
    id: "task.update",
    name: "Update Task",
    description: "Update a task's title, description, priority, due date, list, or recipient contact.",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      taskId: z.string().optional().describe("UUID of the task to update"),
      title: z.string().optional().describe("Title search query of the task to update"),
      newTitle: z.string().optional().describe("New title for the task"),
      description: z.string().nullable().optional().describe("New description (pass null to clear)"),
      taskListId: z.string().optional().describe("New list UUID"),
      taskListName: z.string().optional().describe("New list name (will resolve or create)"),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      dueAtIso: z.string().nullable().optional().describe("New ISO due date (pass null to clear)"),
      recipientId: z.string().nullable().optional().describe("New contact UUID (pass null to clear)"),
      recipientName: z.string().optional().describe("New contact name"),
    }),
    execute: async (authUserId, input) => {
      let targetTaskId = input.taskId;
      if (!targetTaskId) {
        if (!input.title || input.title.trim().length === 0) {
          return {
            status: "MISSING_REQUIRED_INFO",
            message: "Which task would you like to update? Please specify a title or ID.",
          };
        }
        const matches = await searchTasksByTitle(authUserId, input.title);
        const activeMatches = matches.filter((t) => t.status === "pending" || t.status === "in_progress");
        if (activeMatches.length === 1) {
          targetTaskId = activeMatches[0].id;
        } else if (activeMatches.length > 1) {
          return {
            status: "AMBIGUOUS_TASK",
            message: `Multiple active tasks match '${input.title}'. Please clarify which task you mean.`,
            matches: activeMatches.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
            })),
          };
        } else {
          return {
            status: "TASK_NOT_FOUND",
            message: `No pending task matches title '${input.title}'.`,
          };
        }
      }

      // Check task ownership
      const existing = await getTask(authUserId, targetTaskId);
      if (!existing) {
        return {
          status: "ERROR",
          message: "Task not found or access denied.",
        };
      }

      let resolvedRecipientId = input.recipientId;
      if (input.recipientName && input.recipientName.trim().length > 0) {
        const matches = await findContactsByName(authUserId, input.recipientName);
        if (matches.length === 1) {
          resolvedRecipientId = matches[0].id;
        } else if (matches.length > 1) {
          return {
            status: "AMBIGUOUS_RECIPIENT",
            message: `Multiple contacts match '${input.recipientName}'. Please clarify which contact you mean.`,
            matches: matches.map((m) => ({ id: m.id, name: m.name })),
          };
        }
      }

      let targetTaskListId = input.taskListId;
      if (!targetTaskListId && input.taskListName && input.taskListName.trim().length > 0) {
        const lists = await listTaskLists(authUserId);
        const cleanName = input.taskListName.trim().toLowerCase();
        const matches = lists.filter((l) => l.name.toLowerCase() === cleanName);
        if (matches.length === 1) {
          targetTaskListId = matches[0].id;
        } else if (matches.length > 1) {
          return {
            status: "AMBIGUOUS_TASK_LIST",
            message: `Multiple task lists match '${input.taskListName}'. Please clarify which list you mean.`,
            matches: matches.map((m) => ({ id: m.id, name: m.name })),
          };
        } else {
          const newList = await createTaskList(authUserId, input.taskListName);
          targetTaskListId = newList.id;
        }
      }

      const updated = await updateTask(authUserId, targetTaskId, {
        title: input.newTitle,
        description: input.description,
        contactId: resolvedRecipientId,
        taskListId: targetTaskListId,
        priority: input.priority,
        dueAt: input.dueAtIso === null ? null : input.dueAtIso ? new Date(input.dueAtIso) : undefined,
      });

      return {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        priority: updated.priority,
        dueAt: updated.due_at?.toISOString() || null,
        taskListId: updated.task_list_id,
        contactId: updated.contact_id,
        updated: true,
      };
    },
  },

  "task.schedule_overdue_reminders": {
    id: "task.schedule_overdue_reminders",
    name: "Schedule Overdue Reminders",
    description: "Preview or schedule reminders for all overdue tasks at a specific time.",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      reminderTimeIso: z.string().describe("ISO timestamp when reminders should be sent"),
      channel: z.enum(["in_app", "email", "telegram", "whatsapp"]).optional().default("in_app"),
      confirmed: z.boolean().optional().default(false).describe("Set to true to confirm preview and schedule"),
    }),
    execute: async (authUserId, input) => {
      const overdueTasks = await listTasks(authUserId, { overdue: true });
      if (overdueTasks.length === 0) {
        return {
          status: "SUCCESS",
          message: "No overdue tasks found.",
          count: 0,
        };
      }

      if (overdueTasks.length === 1) {
        const task = overdueTasks[0];
        const res = await createReminder({
          authUserId,
          recipientId: task.contact_id,
          title: `Reminder: ${task.title}`,
          description: task.description || undefined,
          dueAt: new Date(input.reminderTimeIso),
          channel: input.channel,
          taskId: task.id,
        });
        return {
          status: "SUCCESS",
          message: `Successfully scheduled reminder for task '${task.title}' at ${input.reminderTimeIso}.`,
          count: 1,
          reminders: [{ id: res.id, taskTitle: task.title, dueAt: res.due_at.toISOString() }],
        };
      }

      if (!input.confirmed) {
        return {
          status: "REQUIRES_CONFIRMATION",
          message: `You have ${overdueTasks.length} overdue tasks. Would you like to schedule reminders for all of them at ${input.reminderTimeIso} via ${input.channel}?`,
          preview: {
            reminderTime: input.reminderTimeIso,
            channel: input.channel,
            count: overdueTasks.length,
            tasks: overdueTasks.map((t) => ({
              id: t.id,
              title: t.title,
              dueAt: t.due_at?.toISOString() || null,
            })),
          },
        };
      }

      const reminders = [];
      for (const task of overdueTasks) {
        const res = await createReminder({
          authUserId,
          recipientId: task.contact_id,
          title: `Reminder: ${task.title}`,
          description: task.description || undefined,
          dueAt: new Date(input.reminderTimeIso),
          channel: input.channel,
          taskId: task.id,
        });
        reminders.push({ id: res.id, taskTitle: task.title, dueAt: res.due_at.toISOString() });
      }

      return {
        status: "SUCCESS",
        message: `Successfully scheduled ${overdueTasks.length} reminders for overdue tasks.`,
        count: overdueTasks.length,
        reminders,
      };
    },
  },

  "money.create": {
    id: "money.create",
    name: "Create Ledger Item",
    description: "Record a new amount owed to the user (receivable) or owed by the user (payable).",
    category: "MONEY",
    confirmationRequired: false,
    inputSchema: z.object({
      contactId: z.string().uuid().optional().describe("UUID of the contact"),
      contactName: z.string().optional().describe("Name of the contact to resolve"),
      direction: z.enum(["receivable", "payable"]).optional().describe("Receivable (owed to user) or payable (owed by user)"),
      amount: z.number().positive().describe("Amount of money"),
      currency: z.string().optional().default("INR"),
      title: z.string().describe("Title or purpose (e.g., 'Book', 'Dinner')"),
      description: z.string().optional().describe("Detailed description"),
      notes: z.string().optional().describe("Payment notes"),
      dueAtIso: z.string().optional().describe("Optional ISO date when this should be paid"),
      createTask: z.boolean().optional().default(false).describe("Set to true to create a follow-up task"),
      createReminder: z.boolean().optional().default(false).describe("Set to true to schedule a reminder notification"),
      reminderTimeIso: z.string().optional().describe("ISO date when reminder should fire"),
      reminderChannel: z.enum(["in_app", "email", "telegram", "whatsapp"]).optional().default("in_app"),
    }),
    execute: async (authUserId, input) => {
      let resolvedContactId = input.contactId;

      // 1. Resolve Contact
      if (!resolvedContactId) {
        if (!input.contactName || input.contactName.trim().length === 0) {
          return {
            status: "MISSING_REQUIRED_INFO",
            message: "Who is this ledger transaction with? Please specify a contact name.",
          };
        }
        const matches = await findContactsByName(authUserId, input.contactName);
        if (matches.length === 0) {
          return {
            status: "CONTACT_NOT_FOUND",
            message: `Could not find any contact matching '${input.contactName}'.`,
          };
        } else if (matches.length === 1) {
          resolvedContactId = matches[0].id;
        } else {
          return {
            status: "AMBIGUOUS_CONTACT",
            message: `Multiple contacts match '${input.contactName}'. Please specify who you mean.`,
            matches: matches.map((m) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              phoneNumber: m.phone_number,
            })),
          };
        }
      }

      // 2. Validate Direction
      if (!input.direction) {
        return {
          status: "AMBIGUOUS_DIRECTION",
          message: `Is ${input.contactName || "the contact"} supposed to pay you, or do you need to pay them? Please specify if this is a 'receivable' or a 'payable'.`,
        };
      }

      // 3. Create Linked Task if requested
      let resolvedTaskId: string | null = null;
      if (input.createTask) {
        const lists = await listTaskLists(authUserId);
        let targetListId = "";
        const defaultList = lists.find((l) => l.name.toLowerCase() === "tasks" || l.name.toLowerCase() === "inbox");
        if (defaultList) {
          targetListId = defaultList.id;
        } else {
          const newList = await createTaskList(authUserId, "Tasks");
          targetListId = newList.id;
        }

        const task = await createTask(authUserId, targetListId, {
          title: `Follow up: ${input.title} (${input.direction === "receivable" ? "collect" : "pay"} ${input.currency || "INR"} ${input.amount})`,
          description: input.description || `Ledger item for ${input.title}`,
          contactId: resolvedContactId,
          dueAt: input.dueAtIso ? new Date(input.dueAtIso) : undefined,
        });
        resolvedTaskId = task.id;
      }

      // 4. Create Linked Reminder if requested
      let resolvedReminderId: string | null = null;
      if (input.createReminder || input.reminderTimeIso) {
        let reminderTime: Date;
        if (input.reminderTimeIso) {
          reminderTime = new Date(input.reminderTimeIso);
        } else if (input.dueAtIso) {
          reminderTime = new Date(input.dueAtIso);
        } else {
          return {
            status: "MISSING_REQUIRED_INFO",
            message: "Please specify when the reminder should fire using reminderTimeIso.",
          };
        }

        const reminder = await createReminder({
          authUserId,
          recipientId: resolvedContactId,
          title: `${input.direction === "receivable" ? "Collect" : "Pay"} ${input.currency || "INR"} ${input.amount} for ${input.title}`,
          description: input.description || `Ledger reminder`,
          dueAt: reminderTime,
          channel: input.reminderChannel,
          taskId: resolvedTaskId,
        });
        resolvedReminderId = reminder.id;
      }

      // 5. Create Ledger Item
      const item = await createLedgerItem(authUserId, {
        contactId: resolvedContactId,
        direction: input.direction,
        amount: input.amount,
        currency: input.currency,
        title: input.title,
        description: input.description,
        taskId: resolvedTaskId,
        reminderId: resolvedReminderId,
        dueAt: input.dueAtIso ? new Date(input.dueAtIso) : null,
        notes: input.notes,
      });

      return {
        id: item.id,
        title: item.title,
        direction: item.direction,
        amount: item.amount,
        remainingAmount: item.remaining_amount,
        status: item.status,
        taskId: item.task_id,
        reminderId: item.reminder_id,
        created: true,
      };
    },
  },

  "money.list": {
    id: "money.list",
    name: "List Ledger Items",
    description: "List outstanding ledger transactions (receivables/payables) for the user.",
    category: "MONEY",
    confirmationRequired: false,
    inputSchema: z.object({
      status: z.enum(["pending", "partially_paid", "paid", "cancelled"]).optional(),
      direction: z.enum(["receivable", "payable"]).optional(),
      contactName: z.string().optional().describe("Filter by contact name"),
      search: z.string().optional().describe("Search keyword"),
    }),
    execute: async (authUserId, input) => {
      let resolvedContactId: string | undefined;

      if (input.contactName && input.contactName.trim().length > 0) {
        const matches = await findContactsByName(authUserId, input.contactName);
        if (matches.length === 1) {
          resolvedContactId = matches[0].id;
        } else if (matches.length > 1) {
          return {
            status: "AMBIGUOUS_CONTACT",
            message: `Multiple contacts match '${input.contactName}'. Please specify who you mean.`,
            matches: matches.map((m) => ({ id: m.id, name: m.name })),
          };
        } else {
          return {
            ledgerItems: [],
          };
        }
      }

      const items = await listLedgerItems(authUserId, {
        status: input.status,
        direction: input.direction,
        contactId: resolvedContactId,
        search: input.search,
      });

      return {
        ledgerItems: items.map((item) => ({
          id: item.id,
          title: item.title,
          direction: item.direction,
          amount: item.amount,
          remainingAmount: item.remaining_amount,
          status: item.status,
          contactName: item.contact_name,
          dueAt: item.due_at?.toISOString() || null,
        })),
      };
    },
  },

  "money.get_balance": {
    id: "money.get_balance",
    name: "Get Ledger Balance",
    description: "Get summary of outstanding receivables, payables, and net balance globally or for a contact.",
    category: "MONEY",
    confirmationRequired: false,
    inputSchema: z.object({
      contactName: z.string().optional().describe("Optional contact name to get specific balance"),
    }),
    execute: async (authUserId, input) => {
      let resolvedContactId: string | undefined;

      if (input.contactName && input.contactName.trim().length > 0) {
        const matches = await findContactsByName(authUserId, input.contactName);
        if (matches.length === 0) {
          return {
            status: "CONTACT_NOT_FOUND",
            message: `Could not find any contact matching '${input.contactName}'.`,
          };
        } else if (matches.length === 1) {
          resolvedContactId = matches[0].id;
        } else {
          return {
            status: "AMBIGUOUS_CONTACT",
            message: `Multiple contacts match '${input.contactName}'. Please specify who you mean.`,
            matches: matches.map((m) => ({ id: m.id, name: m.name })),
          };
        }
      }

      if (resolvedContactId) {
        const balance = await getContactBalance(authUserId, resolvedContactId);
        return {
          contactId: resolvedContactId,
          contactName: input.contactName,
          receivables: balance.receivables,
          payables: balance.payables,
          net: balance.net,
          currency: balance.currency,
        };
      }

      // Calculate global balance aggregate
      const pending = await listLedgerItems(authUserId, { status: "pending" });
      const partial = await listLedgerItems(authUserId, { status: "partially_paid" });
      const allItems = [...pending, ...partial];

      let receivables = 0;
      let payables = 0;

      for (const item of allItems) {
        if (item.direction === "receivable") {
          receivables += Number(item.remaining_amount);
        } else {
          payables += Number(item.remaining_amount);
        }
      }

      return {
        receivables,
        payables,
        net: receivables - payables,
        currency: "INR",
      };
    },
  },

  "money.record_payment": {
    id: "money.record_payment",
    name: "Record Ledger Payment",
    description: "Record a partial or full payment against an outstanding ledger item.",
    category: "MONEY",
    confirmationRequired: false,
    inputSchema: z.object({
      ledgerItemId: z.string().uuid().optional().describe("UUID of the ledger item"),
      ledgerItemTitle: z.string().optional().describe("Title search query of the ledger item"),
      contactName: z.string().optional().describe("Name of contact involved"),
      amount: z.number().positive().describe("Payment amount"),
      currency: z.string().optional().default("INR"),
      notes: z.string().optional().describe("Payment notes or description"),
      paidAtIso: z.string().optional().describe("ISO timestamp when payment was made"),
    }),
    execute: async (authUserId, input) => {
      const resolved = await resolveLedgerItem(authUserId, {
        ledgerItemId: input.ledgerItemId,
        ledgerItemTitle: input.ledgerItemTitle,
        contactName: input.contactName,
      });

      if (resolved.status) {
        return resolved;
      }

      const result = await recordPayment(authUserId, resolved.id!, {
        amount: input.amount,
        currency: input.currency || "INR",
        notes: input.notes,
        paidAt: input.paidAtIso ? new Date(input.paidAtIso) : undefined,
      });

      return {
        paymentId: result.payment.id,
        ledgerItemId: result.ledgerItem.id,
        title: result.ledgerItem.title,
        amountPaid: result.payment.amount,
        remainingAmount: result.ledgerItem.remaining_amount,
        status: result.ledgerItem.status,
        success: true,
      };
    },
  },

  "money.mark_paid": {
    id: "money.mark_paid",
    name: "Mark Ledger Item Fully Paid",
    description: "Mark an outstanding ledger item as fully paid directly.",
    category: "MONEY",
    confirmationRequired: false,
    inputSchema: z.object({
      ledgerItemId: z.string().uuid().optional().describe("UUID of the ledger item"),
      ledgerItemTitle: z.string().optional().describe("Title search query of the ledger item"),
      contactName: z.string().optional().describe("Name of contact involved"),
      notes: z.string().optional().describe("Optional completion notes"),
    }),
    execute: async (authUserId, input) => {
      const resolved = await resolveLedgerItem(authUserId, {
        ledgerItemId: input.ledgerItemId,
        ledgerItemTitle: input.ledgerItemTitle,
        contactName: input.contactName,
      });

      if (resolved.status) {
        return resolved;
      }

      const item = await markLedgerItemPaid(authUserId, resolved.id!, input.notes);
      return {
        id: item.id,
        title: item.title,
        status: item.status,
        remainingAmount: item.remaining_amount,
        success: true,
      };
    },
  },

  "money.cancel": {
    id: "money.cancel",
    name: "Cancel Ledger Item",
    description: "Cancel an outstanding ledger transaction.",
    category: "MONEY",
    confirmationRequired: false,
    inputSchema: z.object({
      ledgerItemId: z.string().uuid().optional().describe("UUID of the ledger item"),
      ledgerItemTitle: z.string().optional().describe("Title search query of the ledger item"),
      contactName: z.string().optional().describe("Name of contact involved"),
    }),
    execute: async (authUserId, input) => {
      const resolved = await resolveLedgerItem(authUserId, {
        ledgerItemId: input.ledgerItemId,
        ledgerItemTitle: input.ledgerItemTitle,
        contactName: input.contactName,
      });

      if (resolved.status) {
        return resolved;
      }

      const item = await cancelLedgerItem(authUserId, resolved.id!);
      return {
        id: item.id,
        title: item.title,
        status: item.status,
        cancelled: true,
      };
    },
  },

  "money.search": {
    id: "money.search",
    name: "Search Ledger Items",
    description: "Search for ledger transactions by keyword or title.",
    category: "MONEY",
    confirmationRequired: false,
    inputSchema: z.object({
      search: z.string().describe("Search text query"),
    }),
    execute: async (authUserId, input) => {
      const items = await listLedgerItems(authUserId, { search: input.search });
      return {
        ledgerItems: items.map((item) => ({
          id: item.id,
          title: item.title,
          amount: item.amount,
          remainingAmount: item.remaining_amount,
          status: item.status,
          contactName: item.contact_name,
        })),
      };
    },
  },

  "assistant.contact_summary": {
    id: "assistant.contact_summary",
    name: "Get Contact Summary",
    description: "Get a comprehensive summary of a contact, including their pending money, tasks, and upcoming reminders.",
    category: "ASSISTANT",
    confirmationRequired: false,
    inputSchema: z.object({
      contactName: z.string().min(1).describe("Name of the contact to summarize"),
    }),
    execute: async (authUserId, input) => {
      const matches = await findContactsByName(authUserId, input.contactName);
      if (matches.length === 0) {
        return {
          status: "CONTACT_NOT_FOUND",
          message: `Could not find any contact matching '${input.contactName}'.`,
        };
      } else if (matches.length > 1) {
        return {
          status: "AMBIGUOUS_CONTACT",
          message: `Multiple contacts match '${input.contactName}'. Please clarify which contact you mean.`,
          matches: matches.map((m) => ({ id: m.id, name: m.name })),
        };
      }
      
      const summary = await getContactSummary(authUserId, matches[0].id);
      return {
        status: "SUCCESS",
        summary,
      };
    },
  },

  "assistant.pending_summary": {
    id: "assistant.pending_summary",
    name: "Get User Pending Summary",
    description: "Get a global summary of the user's pending money and tasks.",
    category: "ASSISTANT",
    confirmationRequired: false,
    inputSchema: z.object({
      category: z.enum(["money", "tasks", "all"]).optional().default("all"),
    }),
    execute: async (authUserId, input) => {
      const summary = await getUserPendingSummary(authUserId);
      
      // Filter out if specific category requested
      if (input.category === "money") {
        return { money: summary.money };
      } else if (input.category === "tasks") {
        return { tasks: summary.tasks };
      }
      
      return summary;
    },
  },

  "assistant.prepare_pending_list": {
    id: "assistant.prepare_pending_list",
    name: "Prepare Pending List Message",
    description: "Resolve a contact, format their pending money and tasks into a message, and return it. This does NOT send the message; use it to prepare the message before sending via a communication tool.",
    category: "ASSISTANT",
    confirmationRequired: false,
    inputSchema: z.object({
      contactName: z.string().min(1).describe("Name of the contact"),
    }),
    execute: async (authUserId, input) => {
      const matches = await findContactsByName(authUserId, input.contactName);
      if (matches.length === 0) {
        return {
          status: "CONTACT_NOT_FOUND",
          message: `Could not find any contact matching '${input.contactName}'.`,
        };
      } else if (matches.length > 1) {
        return {
          status: "AMBIGUOUS_CONTACT",
          message: `Multiple contacts match '${input.contactName}'. Please clarify which contact you mean.`,
          matches: matches.map((m) => ({ id: m.id, name: m.name })),
        };
      }
      
      const contactId = matches[0].id;
      const contactName = matches[0].name;
      const summary = await getContactSummary(authUserId, contactId);
      const messagePreview = formatPendingSummary(summary, contactName);
      
      return {
        status: "READY_TO_SEND",
        contact: summary.contact,
        summary,
        messagePreview,
      };
    },
  },

  "report.generate": {
    id: "report.generate",
    name: "Generate Report",
    description: `Generate a structured report about money, tasks, contacts, or overall summary.

Use this tool when the user asks for:
- Pending money report: type=pending_money
- Task summary: type=task_summary
- Monthly/weekly summary: type=monthly_summary with dateRangePreset
- Today's overview: type=daily_summary
- What's overdue: type=overdue_summary
- A specific contact's report: type=contact_summary with contactName

NEVER calculate totals, balances, or percentages yourself. This tool does all calculations server-side.
NEVER provide authUserId, SQL, or database IDs.`,
    category: "REPORTS",
    confirmationRequired: false,
    inputSchema: z.object({
      type: z.enum([
        "pending_money",
        "money_summary",
        "task_summary",
        "contact_summary",
        "monthly_summary",
        "daily_summary",
        "overdue_summary",
      ]).describe("Type of report to generate"),
      contactName: z.string().optional().describe("Contact name for contact_summary reports"),
      dateRangePreset: z.enum([
        "today",
        "yesterday",
        "this_week",
        "last_week",
        "this_month",
        "last_month",
        "this_year",
        "last_30_days",
        "last_7_days",
        "custom",
      ]).optional().describe("Date range preset for time-bounded reports"),
      startAt: z.string().optional().describe("ISO start date for custom range"),
      endAt: z.string().optional().describe("ISO end date for custom range"),
    }),
    execute: async (authUserId, input) => {
      // Contact resolution — server-side only
      let contactId: string | undefined;
      if (input.contactName) {
        const resolution = await resolveContactByName(authUserId, input.contactName);
        if (!resolution.resolved) {
          return resolution; // CONTACT_NOT_FOUND or AMBIGUOUS_CONTACT
        }
        contactId = resolution.contactId;
      } else if (input.type === "contact_summary") {
        return {
          status: "CONTACT_NOT_FOUND",
          message: "Please specify a contact name for a contact report.",
        };
      }

      try {
        const report = await generateReport({
          type: input.type as ReportType,
          authUserId,
          contactId,
          dateRangePreset: input.dateRangePreset as DateRangePreset | undefined,
          customStartAt: input.startAt,
          customEndAt: input.endAt,
        });

        const renderedText = renderReport(report);
        const summaryLine = renderReportSummaryLine(report);

        return {
          status: "SUCCESS",
          report,
          renderedText,
          summaryLine,
        };
      } catch (err: any) {
        if (err?.message === "CONTACT_NOT_FOUND") {
          return { status: "CONTACT_NOT_FOUND", message: "Contact not found." };
        }
        if (err?.message?.includes("Invalid date range") || err?.message?.includes("Custom date range")) {
          return { status: "INVALID_DATE_RANGE", message: err.message };
        }
        throw err;
      }
    },
  },

  "report.send": {
    id: "report.send",
    name: "Send Report",
    description: `Send a generated report to a recipient via Gmail, WhatsApp, Telegram, or In-App.

Use this tool when the user asks to:
- Send their own report: "Send me my August report on Gmail"
- Send a contact's report: "Send Rahul his pending report on WhatsApp"
- Share a report: "Send Rahul the payment report on Telegram"

FLOW:
1. First call (confirmed=false or not set): generates report + resolves recipient/channel → returns CONFIRMATION_REQUIRED with preview
2. User confirms
3. Second call (confirmed=true, with report/channel/recipientName from previous result): executes delivery

Status codes:
- CONFIRMATION_REQUIRED: show preview to user, ask confirmation
- AMBIGUOUS_CONTACT: ask user to clarify which contact
- AMBIGUOUS_CHANNEL: ask user which channel to use
- CONNECTION_REQUIRED: tell user to connect the channel
- RECIPIENT_CHANNEL_UNAVAILABLE: contact doesn't have info for that channel
- SUCCESS: delivery succeeded
- DELIVERY_FAILED: provider error (sanitized, no credentials)

NEVER provide email addresses, phone numbers, Telegram IDs, or API tokens.
NEVER skip confirmation for external delivery.
ALL recipient and channel resolution is server-side.`,
    category: "REPORTS",
    confirmationRequired: false,
    inputSchema: z.object({
      type: z.enum([
        "pending_money",
        "money_summary",
        "task_summary",
        "contact_summary",
        "monthly_summary",
        "daily_summary",
        "overdue_summary",
      ]).describe("Report type to generate and send"),
      contactName: z.string().optional().describe("Contact name to send report to/about. Omit for own report."),
      channel: z.enum(["gmail", "whatsapp", "telegram", "in_app"]).optional().describe("Delivery channel. Omit to auto-select or trigger AMBIGUOUS_CHANNEL."),
      dateRangePreset: z.enum([
        "today", "yesterday", "this_week", "last_week",
        "this_month", "last_month", "this_year",
        "last_30_days", "last_7_days", "custom",
      ]).optional().describe("Date range preset for time-bounded reports"),
      startAt: z.string().optional().describe("ISO start date for custom range"),
      endAt: z.string().optional().describe("ISO end date for custom range"),
      confirmed: z.boolean().optional().describe("Set true only after the user has explicitly confirmed the send action"),
      // These are passed back from CONFIRMATION_REQUIRED result — the LLM echoes them for the confirmed send
      confirmedChannel: z.enum(["gmail", "whatsapp", "telegram", "in_app"]).optional().describe("Channel echoed from CONFIRMATION_REQUIRED result"),
      confirmedContactId: z.string().optional().describe("contactId echoed from CONFIRMATION_REQUIRED result"),
      confirmedRecipientName: z.string().optional().describe("recipientName echoed from CONFIRMATION_REQUIRED result"),
      confirmedRecipientIsOwner: z.boolean().optional().describe("recipientIsOwner echoed from CONFIRMATION_REQUIRED result"),
    }),
    execute: async (authUserId, input) => {
      // ── STEP 1: Resolve contact server-side (never trust LLM-provided IDs directly) ──
      let contactId: string | undefined;
      if (input.contactName) {
        const resolution = await resolveContactByName(authUserId, input.contactName);
        if (!resolution.resolved) {
          return resolution; // AMBIGUOUS_CONTACT or CONTACT_NOT_FOUND
        }
        contactId = resolution.contactId;
      }

      // ── STEP 2: Post-confirmation execute ──
      if (input.confirmed === true && input.confirmedChannel) {
        // On the confirmed call, use the channel/contact from the original resolution
        // The LLM echoes confirmedContactId back for us to use server-side
        const resolvedContactId = input.confirmedContactId || contactId;
        const recipientName = input.confirmedRecipientName || (contactId ? "Contact" : "You");
        const recipientIsOwner = input.confirmedRecipientIsOwner ?? !resolvedContactId;

        // Re-generate report (idempotent — report engine always reads live data)
        let report: any;
        try {
          report = await generateReport({
            type: input.type as ReportType,
            authUserId,
            contactId: resolvedContactId,
            dateRangePreset: input.dateRangePreset as DateRangePreset | undefined,
            customStartAt: input.startAt,
            customEndAt: input.endAt,
          });
        } catch (err: any) {
          return { status: "DELIVERY_FAILED", channel: input.confirmedChannel, recipientName, message: "Report generation failed." };
        }

        return executeReportDelivery({
          authUserId,
          type: input.type as ReportType,
          dateRangePreset: input.dateRangePreset as DateRangePreset | undefined,
          customStartAt: input.startAt,
          customEndAt: input.endAt,
          contactId: resolvedContactId,
          channel: input.confirmedChannel as DeliveryChannel,
          report,
          recipientName,
          recipientIsOwner,
        });
      }

      // ── STEP 3: Pre-confirmation prepare ──
      return prepareReportDelivery({
        authUserId,
        type: input.type as ReportType,
        dateRangePreset: input.dateRangePreset as DateRangePreset | undefined,
        customStartAt: input.startAt,
        customEndAt: input.endAt,
        contactId,
        channel: input.channel as DeliveryChannel | undefined,
      });
    },
  },
  "money.create_entry": {
    id: "money.create_entry",
    name: "Create Money Ledger Entry",
    description: "Record money lent to someone (receivable) or money borrowed from someone (payable)",
    category: "MONEY",
    confirmationRequired: false,
    inputSchema: z.object({
      personName: z.string().describe("Name of person involved, e.g., 'Rahul', 'Amit'"),
      direction: z.enum(["receivable", "payable"]).describe("'receivable' if user lent money or others owe user; 'payable' if user borrowed money"),
      amount: z.number().positive().describe("Amount in currency units, e.g. 350"),
      title: z.string().optional().describe("Short description, e.g., 'Lunch money'"),
      notes: z.string().optional().describe("Optional extra notes"),
      dueAt: z.string().optional().describe("Optional ISO date string or date description"),
      reminderAt: z.string().optional().describe("Optional ISO date string for reminder trigger"),
    }),
    execute: async (authUserId, input) => {
      const title = input.title?.trim() || `${input.direction === "receivable" ? "Lent to" : "Borrowed from"} ${input.personName}`;
      const item = await createLedgerItem(authUserId, {
        personName: input.personName,
        direction: input.direction,
        amount: input.amount,
        title,
        notes: input.notes,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        reminderAt: input.reminderAt ? new Date(input.reminderAt) : null,
      });
      return {
        success: true,
        message: `Recorded: ${input.direction === "receivable" ? "Lent" : "Borrowed"} ₹${input.amount} ${input.direction === "receivable" ? "to" : "from"} ${input.personName}.`,
        ledgerItem: item,
      };
    },
  },
  "money.list_entries": {
    id: "money.list_entries",
    name: "List Money Ledger Entries",
    description: "Fetch receivables, payables, or balance summary for the user",
    category: "MONEY",
    confirmationRequired: false,
    inputSchema: z.object({
      status: z.enum(["pending", "partially_paid", "paid", "cancelled"]).optional(),
      direction: z.enum(["receivable", "payable"]).optional(),
      personName: z.string().optional(),
    }),
    execute: async (authUserId, input) => {
      let contactId: string | undefined;
      if (input.personName) {
        const matches = await findContactsByName(authUserId, input.personName);
        if (matches.length > 0) contactId = matches[0].id;
      }
      const items = await listLedgerItems(authUserId, {
        status: input.status,
        direction: input.direction,
        contactId,
      });
      return { items };
    },
  },

  // ========================================================================
  // GMAIL TOOLS
  // ========================================================================

  "gmail.search": {
    id: "gmail.search",
    name: "Search Emails",
    description: "Search the user's Gmail inbox using a query string (e.g. from:rahul, subject:invoice, is:unread)",
    category: "GMAIL",
    requiredConnection: "gmail" as any,
    confirmationRequired: false,
    inputSchema: z.object({
      query: z.string().min(1).describe("Gmail search query"),
      maxResults: z.number().min(1).max(20).optional().default(10),
    }),
    execute: async (authUserId, input) => handleSearchEmails(authUserId, input),
  },

  "gmail.get_message": {
    id: "gmail.get_message",
    name: "Get Email Message",
    description: "Retrieve the full content of a specific email by message ID",
    category: "GMAIL",
    requiredConnection: "gmail" as any,
    confirmationRequired: false,
    inputSchema: z.object({
      messageId: z.string().min(1).describe("Gmail message ID"),
    }),
    execute: async (authUserId, input) => handleGetMessage(authUserId, input),
  },

  // ========================================================================
  // GOOGLE DRIVE TOOLS
  // ========================================================================

  "drive.search": {
    id: "drive.search",
    name: "Search Drive Files",
    description: "Search files in the user's Google Drive by name or content",
    category: "DRIVE",
    requiredConnection: "google-drive" as any,
    confirmationRequired: false,
    inputSchema: z.object({
      query: z.string().min(1).describe("Search query for Drive files"),
      maxResults: z.number().min(1).max(20).optional().default(10),
    }),
    execute: async (authUserId, input) => handleSearchFiles(authUserId, input),
  },

  "drive.get_file": {
    id: "drive.get_file",
    name: "Get Drive File",
    description: "Retrieve metadata and content of a specific file from Google Drive",
    category: "DRIVE",
    requiredConnection: "google-drive" as any,
    confirmationRequired: false,
    inputSchema: z.object({
      fileId: z.string().min(1).describe("Google Drive file ID"),
    }),
    execute: async (authUserId, input) => handleGetFile(authUserId, input),
  },

  // ========================================================================
  // NOTION TOOLS
  // ========================================================================

  "notion.search": {
    id: "notion.search",
    name: "Search Notion Pages",
    description: "Search the user's Notion workspace for pages and databases",
    category: "NOTION",
    requiredConnection: "notion" as any,
    confirmationRequired: false,
    inputSchema: z.object({
      query: z.string().min(1).describe("Search query for Notion"),
      maxResults: z.number().min(1).max(20).optional().default(10),
    }),
    execute: async (authUserId, input) => handleSearchNotionPages(authUserId, input),
  },

  "notion.get_page": {
    id: "notion.get_page",
    name: "Get Notion Page",
    description: "Retrieve the content of a specific Notion page",
    category: "NOTION",
    requiredConnection: "notion" as any,
    confirmationRequired: false,
    inputSchema: z.object({
      pageId: z.string().min(1).describe("Notion page ID"),
    }),
    execute: async (authUserId, input) => handleGetNotionPage(authUserId, input),
  },

  "notion.create_page": {
    id: "notion.create_page",
    name: "Create Notion Page",
    description: "Create a new page in the user's Notion workspace under a specified parent page",
    category: "NOTION",
    requiredConnection: "notion" as any,
    confirmationRequired: true,
    inputSchema: z.object({
      title: z.string().min(1).describe("Page title"),
      content: z.string().min(1).describe("Page content text"),
      parentPageId: z.string().optional().describe("Parent page ID (required)"),
    }),
    execute: async (authUserId, input) => handleCreateNotionPage(authUserId, input),
  },

  // ========================================================================
  // SLACK TOOLS
  // ========================================================================

  "slack.send_message": {
    id: "slack.send_message",
    name: "Send Slack Message",
    description: "Send a message to a Slack channel or user",
    category: "SLACK",
    requiredConnection: "slack" as any,
    confirmationRequired: true,
    inputSchema: z.object({
      channel: z.string().min(1).describe("Slack channel name (e.g. #general) or channel ID"),
      text: z.string().min(1).describe("Message text"),
    }),
    execute: async (authUserId, input) => handleSendSlackMessage(authUserId, input),
  },

  "slack.search_messages": {
    id: "slack.search_messages",
    name: "Search Slack Messages",
    description: "Search messages across the user's Slack workspace",
    category: "SLACK",
    requiredConnection: "slack" as any,
    confirmationRequired: false,
    inputSchema: z.object({
      query: z.string().min(1).describe("Slack search query"),
      maxResults: z.number().min(1).max(20).optional().default(10),
    }),
    execute: async (authUserId, input) => handleSearchSlackMessages(authUserId, input),
  },

  // ========================================================================
  // MICROSOFT TEAMS TOOLS
  // ========================================================================

  "teams.create_meeting": {
    id: "teams.create_meeting",
    name: "Create Teams Meeting",
    description: "Create a Microsoft Teams online meeting with optional attendees",
    category: "TEAMS",
    requiredConnection: "microsoft-teams" as any,
    confirmationRequired: true,
    inputSchema: z.object({
      subject: z.string().min(1).describe("Meeting subject/title"),
      startIso: z.string().describe("Start time as ISO-8601 datetime"),
      endIso: z.string().describe("End time as ISO-8601 datetime"),
      attendees: z.array(z.string().email()).optional().describe("Attendee email addresses"),
    }),
    execute: async (authUserId, input) => handleCreateTeamsMeeting(authUserId, input),
  },
};

async function resolveLedgerItem(
  authUserId: string,
  input: {
    ledgerItemId?: string;
    ledgerItemTitle?: string;
    contactName?: string;
  },
): Promise<{ id?: string; status?: string; message?: string; matches?: any[] }> {
  if (input.ledgerItemId) {
    return { id: input.ledgerItemId };
  }

  let resolvedContactId: string | undefined;
  if (input.contactName && input.contactName.trim().length > 0) {
    const matches = await findContactsByName(authUserId, input.contactName);
    if (matches.length === 1) {
      resolvedContactId = matches[0].id;
    } else if (matches.length > 1) {
      return {
        status: "AMBIGUOUS_CONTACT",
        message: `Multiple contacts match '${input.contactName}'. Please clarify which contact you mean.`,
        matches: matches.map((m) => ({ id: m.id, name: m.name })),
      };
    }
  }

  // Fetch pending and partially_paid items for this user/contact
  const itemsPending = await listLedgerItems(authUserId, { status: "pending", contactId: resolvedContactId });
  const itemsPartial = await listLedgerItems(authUserId, { status: "partially_paid", contactId: resolvedContactId });
  const activeItems = [...itemsPending, ...itemsPartial];

  let matches = activeItems;

  if (input.ledgerItemTitle && input.ledgerItemTitle.trim().length > 0) {
    const searchTitle = input.ledgerItemTitle.trim().toLowerCase();
    matches = activeItems.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTitle) ||
        (item.description && item.description.toLowerCase().includes(searchTitle)),
    );
  } else if (!resolvedContactId) {
    return {
      status: "MISSING_REQUIRED_INFO",
      message: "Which transaction are we referring to? Please specify a title or contact.",
    };
  }

  if (matches.length === 1) {
    return { id: matches[0].id };
  } else if (matches.length > 1) {
    return {
      status: "AMBIGUOUS_LEDGER_ITEM",
      message: input.ledgerItemTitle
        ? `Multiple pending ledger items match '${input.ledgerItemTitle}'. Please specify which item:`
        : `Multiple pending ledger items exist for ${input.contactName}. Please specify which item:`,
      matches: matches.map((item) => ({
        id: item.id,
        title: item.title,
        amount: item.amount,
        remainingAmount: item.remaining_amount,
        contactName: item.contact_name,
      })),
    };
  } else {
    return {
      status: "LEDGER_ITEM_NOT_FOUND",
      message: input.ledgerItemTitle
        ? `Could not find any pending ledger item matching '${input.ledgerItemTitle}'.`
        : `Could not find any pending ledger item for ${input.contactName}.`,
    };
  }
}

import {
  backendToolToNormalizedDefinition,
  zodSchemaToJsonSchema,
  formatToolResultToChatMessage,
} from "./tool-serializer.js";
import { NormalizedToolDefinition } from "../services/llm/llm-provider.interface.js";

export function getNormalizedToolsRegistry(): NormalizedToolDefinition[] {
  return Object.values(TOOLS_REGISTRY).map(backendToolToNormalizedDefinition);
}

export { backendToolToNormalizedDefinition, zodSchemaToJsonSchema, formatToolResultToChatMessage };

