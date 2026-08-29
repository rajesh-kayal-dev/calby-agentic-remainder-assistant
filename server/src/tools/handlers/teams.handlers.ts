/**
 * Microsoft Teams AI tool handlers.
 */

import { createMeeting } from "../../services/teams/teams.service.js";

export async function handleCreateTeamsMeeting(
  authUserId: string,
  input: {
    subject: string;
    startIso: string;
    endIso: string;
    attendees?: string[];
  },
) {
  return createMeeting(
    authUserId,
    input.subject,
    input.startIso,
    input.endIso,
    input.attendees,
  );
}
