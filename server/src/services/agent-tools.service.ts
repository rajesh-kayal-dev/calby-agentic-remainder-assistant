import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  cancelMeeting,
  checkCalendarBusy,
  createMeeting,
  listUpcomingMeetings,
  rescheduleMeeting,
} from "./calendar.service.js";

export function createCalendarTools(authUserId: string) {
  return {
    listUpcomingMeetings: createTool({
      id: "listUpcomingMeetings",
      description:
        "List Google Calendar events. Set todayOnly=true for today's agenda only.",
      inputSchema: z.object({
        maxResults: z.number().int().min(1).max(20).optional(),
        todayOnly: z
          .boolean()
          .optional()
          .describe("If true, only return events for today"),
      }),
      execute: async ({ maxResults, todayOnly }) => {
        try {
          const events = await listUpcomingMeetings({
            authUserId,
            maxResults,
            todayOnly,
          });
          return { success: true, events };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to list upcoming meetings";
          return { success: false, error: message };
        }
      },
    }),

    checkCalendarBusy: createTool({
      id: "checkCalendarBusy",
      description:
        "Check if the user is busy between two ISO datetimes using Google freebusy.",
      inputSchema: z.object({
        startIso: z.string().describe("Start time as ISO-8601 datetime"),
        endIso: z.string().describe("End time as ISO-8601 datetime"),
      }),
      execute: async ({ startIso, endIso }) => {
        try {
          const availability = await checkCalendarBusy({
            authUserId,
            startIso,
            endIso,
          });
          return { success: true, ...availability };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to check calendar availability";
          return { success: false, error: message };
        }
      },
    }),

    createMeeting: createTool({
      id: "createMeeting",
      description:
        "Create a Google Calendar event. Adds a Google Meet link by default. Emails invitees when attendeeEmails are set.",
      inputSchema: z.object({
        title: z.string().min(1),
        startIso: z.string().describe("Start time as ISO-8601 datetime"),
        endIso: z.string().describe("End time as ISO-8601 datetime"),
        attendeeEmails: z
          .array(z.string())
          .optional()
          .describe("Invite these emails; Google sends calendar invites"),
        description: z.string().optional(),
        addGoogleMeet: z
          .boolean()
          .optional()
          .describe("Default true. Set false to skip Google Meet link"),
      }),
      execute: async (input) => {
        try {
          const meeting = await createMeeting({
            authUserId,
            ...input,
          });
          return { success: true, meeting };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to create meeting";
          return { success: false, error: message };
        }
      },
    }),

    rescheduleMeeting: createTool({
      id: "rescheduleMeeting",
      description:
        "Move an existing event to a new start/end time and email invitees.",
      inputSchema: z.object({
        eventId: z.string().min(1),
        startIso: z.string().describe("Start time as ISO-8601 datetime"),
        endIso: z.string().describe("End time as ISO-8601 datetime"),
      }),
      execute: async (input) => {
        try {
          const updatedEvent = await rescheduleMeeting({ authUserId, ...input });
          return { success: true, meeting: updatedEvent };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to reschedule meeting";
          return { success: false, error: message };
        }
      },
    }),

    cancelMeeting: createTool({
      id: "cancelMeeting",
      description:
        "Cancel a Google Calendar event by id and email attendees about the cancellation.",
      inputSchema: z.object({
        eventId: z.string().min(1),
      }),
      execute: async (input) => {
        try {
          const result = await cancelMeeting({
            authUserId,
            ...input,
          });
          return { success: true, ...result };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to cancel meeting";
          return { success: false, error: message };
        }
      },
    }),
  };
}

