import { getValidGoogleAccessToken } from "./google-oauth.service.js";

export async function getCalendarAccessToken(
  authUserId: string,
): Promise<string> {
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
