/**
 * Google Drive AI tool handlers.
 */

import {
  searchFiles,
  getFileMetadata,
  getFileContent,
} from "../../services/drive/drive.service.js";

export async function handleSearchFiles(
  authUserId: string,
  input: { query: string; maxResults?: number },
) {
  const result = await searchFiles(authUserId, input.query, input.maxResults);
  return result;
}

export async function handleGetFile(
  authUserId: string,
  input: { fileId: string },
) {
  const meta = await getFileMetadata(authUserId, input.fileId);
  const content = await getFileContent(authUserId, input.fileId);
  return { ...meta, content: content.content };
}
