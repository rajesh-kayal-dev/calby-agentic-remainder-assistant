import { getValidGoogleAccessToken } from "./google-oauth.service.js";
import { getProviderAccessToken } from "./integrations/integration.service.js";

export async function getCalendarAccessToken(
  authUserId: string,
): Promise<string> {
  // Strategy 1: Try Nango-managed connection first
  if (process.env.NANGO_SECRET_KEY) {
    try {
      const token = await getProviderAccessToken(authUserId, "google-calendar");
      if (token) return token;
    } catch {
      // Nango connection not found or failed — fall through to legacy path
    }
  }

  // Strategy 2: Fall back to direct Google OAuth (legacy/migration path)
  try {
    const { accessToken } = await getValidGoogleAccessToken(authUserId);
    return accessToken;
  } catch (error: any) {
    const errMsg = error?.message || "Google Calendar is not connected. Please connect Google Calendar in Calby Settings.";
    if (!errMsg.includes("CONNECTION_REQUIRED")) {
      throw new Error(`CONNECTION_REQUIRED: ${errMsg}`);
    }
    throw new Error(errMsg);
  }
}
