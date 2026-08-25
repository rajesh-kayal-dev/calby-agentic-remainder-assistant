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
    requiredConnection: "google_calendar",
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
    requiredConnection: "google_calendar",
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
    description: "Send an email via Gmail",
    category: "COMMUNICATION",
    requiredConnection: "gmail",
    confirmationRequired: true,
    inputSchema: z.object({
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
    }),
    execute: async () => {
      throw new Error("Gmail connector required");
    },
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
    description: "Send a Telegram message",
    category: "COMMUNICATION",
    requiredConnection: "telegram",
    confirmationRequired: true,
    inputSchema: z.object({
      chatId: z.string().min(1),
      message: z.string().min(1),
    }),
    execute: async () => {
      throw new Error("Telegram connector required");
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
    }),
    execute: async (authUserId, input) => {
      // 1. Missing Required Info Check for Obligations
      if (
        input.obligationType &&
        input.obligationType !== "custom" &&
        !input.eventAtIso &&
        !input.dueAtIso
      ) {
        return {
          status: "MISSING_REQUIRED_INFO",
          missingField: "eventAtIso",
          message: `When is the renewal or due date for your ${input.obligationType} reminder?`,
        };
      }

      let resolvedRecipientId = input.recipientId;

      // 2. Ambiguity Resolution Logic for recipientName
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
      });

      return {
        id: res.id,
        title: res.title,
        obligationType: res.obligation_type,
        obligationMetadata: res.obligation_metadata,
        recipientId: res.recipient_id,
        recipientName: res.recipient_name,
        channel: res.channel,
        dueAt: res.due_at.toISOString(),
        recurrence: res.recurrence,
        status: res.status,
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

  "task.create": {
    id: "task.create",
    name: "Create Task",
    description: "Add a new task to your list",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      title: z.string().min(1),
      dueDateIso: z.string().optional(),
    }),
    execute: async (_authUserId, input) => {
      return {
        id: `task_${Date.now()}`,
        title: input.title,
        dueDate: input.dueDateIso || null,
        created: true,
      };
    },
  },
};

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

