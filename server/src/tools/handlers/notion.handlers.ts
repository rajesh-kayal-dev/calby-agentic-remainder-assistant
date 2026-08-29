/**
 * Notion AI tool handlers.
 */

import {
  searchPages,
  getPage,
  createPage,
} from "../../services/notion/notion.service.js";

export async function handleSearchNotionPages(
  authUserId: string,
  input: { query: string; maxResults?: number },
) {
  return searchPages(authUserId, input.query, input.maxResults);
}

export async function handleGetNotionPage(
  authUserId: string,
  input: { pageId: string },
) {
  return getPage(authUserId, input.pageId);
}

export async function handleCreateNotionPage(
  authUserId: string,
  input: { title: string; content: string; parentPageId?: string },
) {
  return createPage(authUserId, input.title, input.content, input.parentPageId);
}
