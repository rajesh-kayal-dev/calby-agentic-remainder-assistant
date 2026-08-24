import { z } from "zod";
import {
  handleGetEvents,
  handleFindFreeSlots,
  handleCreateEvent,
  handleUpdateEvent,
  handleDeleteEvent,
} from "./handlers/calendar.handlers.js";

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

  "reminder.create": {
    id: "reminder.create",
    name: "Create Reminder",
    description: "Set a quick reminder",
    category: "PRODUCTIVITY",
    confirmationRequired: false,
    inputSchema: z.object({
      title: z.string().min(1),
      remindAtIso: z.string().optional(),
    }),
    execute: async (_authUserId, input) => {
      return {
        id: `rem_${Date.now()}`,
        title: input.title,
        remindAt: input.remindAtIso || new Date().toISOString(),
        created: true,
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
