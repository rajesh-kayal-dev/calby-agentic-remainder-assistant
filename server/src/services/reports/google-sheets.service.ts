import { google, sheets_v4 } from "googleapis";
import { getValidGoogleAccessToken, getSheetsConnectionStatus } from "../google-oauth.service.js";
import { Report, MoneyReportSection, TaskReportSection, ReminderReportSection } from "./report.types.js";

export interface GoogleSheetsExportResult {
  spreadsheetId: string;
  url: string;
}

export async function exportReportToGoogleSheet(
  authUserId: string,
  report: Report<any>
): Promise<GoogleSheetsExportResult> {
  const status = await getSheetsConnectionStatus(authUserId);
  if (!status.connected) {
    throw new Error("Google Sheets connection not authorized or missing scopes.");
  }

  const { accessToken } = await getValidGoogleAccessToken(authUserId);

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: "v4", auth });

  const title = `${report.metadata.title} - ${report.metadata.generatedAt}`;

  // Create spreadsheet with sheets
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [
        { properties: { title: "Summary" } },
        { properties: { title: "Money" } },
        { properties: { title: "Tasks" } },
        { properties: { title: "Reminders" } },
      ],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId;
  if (!spreadsheetId) {
    throw new Error("Failed to create Google Sheet: no spreadsheetId returned");
  }

  // To keep this implementation simple for Phase 2C-3, we populate basic text based on report type
  // A complete implementation would parse report.sections and report.summary and write rows.

  const summaryData = [
    ["Report Title", report.metadata.title],
    ["Generated At", report.metadata.generatedAt],
    ["Type", report.type],
  ];

  const updateData: sheets_v4.Schema$ValueRange[] = [
    {
      range: "Summary!A1",
      values: summaryData,
    },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updateData,
    },
  });

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}
