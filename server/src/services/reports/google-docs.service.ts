import { google, docs_v1 } from "googleapis";
import { getValidGoogleAccessToken, getDocsConnectionStatus } from "../google-oauth.service.js";
import { Report } from "./report.types.js";
import { renderReport } from "./report-renderer.service.js";

export interface GoogleDocsExportResult {
  docId: string;
  url: string;
}

export async function exportReportToGoogleDoc(
  authUserId: string,
  report: Report<any>
): Promise<GoogleDocsExportResult> {
  const status = await getDocsConnectionStatus(authUserId);
  if (!status.connected) {
    throw new Error("Google Docs connection not authorized or missing scopes.");
  }

  const { accessToken } = await getValidGoogleAccessToken(authUserId);

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: "v1", auth });

  const title = `${report.metadata.title} - ${report.metadata.generatedAt}`;

  // Create a new document
  const createRes = await docs.documents.create({
    requestBody: {
      title,
    },
  });

  const docId = createRes.data.documentId;
  if (!docId) {
    throw new Error("Failed to create Google Doc: no documentId returned");
  }

  // Generate plain text or markdown to insert
  // We'll use the existing report renderer and strip markdown for simple insertion
  // Or just insert the markdown text. Google Docs API requires structured updates.
  // For simplicity, we insert the text as a single string.
  const markdownText = renderReport(report);
  const plainText = markdownText.replace(/\*\*/g, "").replace(/#/g, ""); // basic strip

  const requests: docs_v1.Schema$Request[] = [
    {
      insertText: {
        location: {
          index: 1, // 1 is the start of the document
        },
        text: plainText,
      },
    },
  ];

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests,
    },
  });

  return {
    docId,
    url: `https://docs.google.com/document/d/${docId}/edit`,
  };
}
