/**
 * Google Drive service — search and file metadata/content retrieval.
 *
 * Uses Nango-managed OAuth tokens.
 */

import { getProviderAccessToken } from "../integrations/integration.service.js";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

async function getDriveToken(authUserId: string): Promise<string> {
  return getProviderAccessToken(authUserId, "google-drive");
}

async function driveRequest<T>(
  authUserId: string,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const token = await getDriveToken(authUserId);
  const qp = new URLSearchParams(params || {});
  const queryStr = qp.toString();
  const url = `${DRIVE_API_BASE}${path}${queryStr ? `?${queryStr}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Drive API ${path} failed (${res.status}): ${errText}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DriveFileResult {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
}

export interface DriveSearchResult {
  files: DriveFileResult[];
  totalResults: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search files in Google Drive.
 * Uses the Drive API `files.list` with a free-text query.
 */
export async function searchFiles(
  authUserId: string,
  query: string,
  maxResults = 10,
): Promise<DriveSearchResult> {
  // Build Drive query — fullText contains is the free-text search
  const driveQuery = `fullText contains '${query.replace(/'/g, "\\'")}'`;

  const result = await driveRequest<{
    files?: Array<{
      id: string;
      name: string;
      mimeType: string;
      webViewLink?: string;
      modifiedTime?: string;
      size?: string;
      owners?: Array<{ displayName: string; emailAddress: string }>;
    }>;
  }>(authUserId, "/files", {
    q: driveQuery,
    pageSize: String(maxResults),
    fields: "files(id,name,mimeType,webViewLink,modifiedTime,size,owners)",
    orderBy: "modifiedTime desc",
  });

  const files: DriveFileResult[] = (result.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    webViewLink: f.webViewLink,
    modifiedTime: f.modifiedTime,
    size: f.size,
    owners: f.owners,
  }));

  return { files, totalResults: files.length };
}

/**
 * Get detailed metadata for a single file.
 */
export async function getFileMetadata(
  authUserId: string,
  fileId: string,
): Promise<DriveFileResult> {
  const file = await driveRequest<{
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    modifiedTime?: string;
    size?: string;
    owners?: Array<{ displayName: string; emailAddress: string }>;
    description?: string;
  }>(authUserId, `/files/${encodeURIComponent(fileId)}`, {
    fields: "id,name,mimeType,webViewLink,modifiedTime,size,owners,description",
  });

  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    webViewLink: file.webViewLink,
    modifiedTime: file.modifiedTime,
    size: file.size,
    owners: file.owners,
  };
}

/**
 * Export a Google Workspace file (Docs, Sheets, Slides) as plain text.
 * For binary files, returns a download link instead.
 */
export async function getFileContent(
  authUserId: string,
  fileId: string,
): Promise<{ content: string; mimeType: string }> {
  const meta = await getFileMetadata(authUserId, fileId);

  // Google Workspace files must be exported
  const exportMimeTypes: Record<string, string> = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
  };

  const exportMime = exportMimeTypes[meta.mimeType];

  if (exportMime) {
    const token = await getDriveToken(authUserId);
    const url = `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(exportMime)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`Drive export failed (${res.status})`);
    }

    const content = await res.text();
    return { content, mimeType: exportMime };
  }

  // Non-exportable file — return link
  return {
    content: meta.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    mimeType: meta.mimeType,
  };
}
