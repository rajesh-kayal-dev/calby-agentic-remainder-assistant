/**
 * Notion service — search pages, read pages, create pages.
 *
 * Uses Nango-managed OAuth tokens via the Notion API.
 */

import { getProviderAccessToken } from "../integrations/integration.service.js";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

async function getNotionToken(authUserId: string): Promise<string> {
  return getProviderAccessToken(authUserId, "notion");
}

async function notionRequest<T>(
  authUserId: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getNotionToken(authUserId);
  const url = `${NOTION_API_BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Notion API ${method} ${path} failed (${res.status}): ${errText}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotionPageResult {
  id: string;
  title: string;
  url: string;
  lastEditedTime?: string;
  icon?: string;
  type: "page" | "database";
}

export interface NotionPageContent {
  id: string;
  title: string;
  url: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTitle(page: any): string {
  // Notion page title can be in different property formats
  const props = page.properties || {};
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop?.type === "title" && Array.isArray(prop.title)) {
      return prop.title.map((t: any) => t.plain_text || "").join("");
    }
  }
  // Database items might have Name property
  if (props.Name?.title) {
    return props.Name.title.map((t: any) => t.plain_text || "").join("");
  }
  return "Untitled";
}

function extractIcon(page: any): string | undefined {
  if (page.icon?.type === "emoji") return page.icon.emoji;
  return undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search Notion pages and databases.
 */
export async function searchPages(
  authUserId: string,
  query: string,
  maxResults = 10,
): Promise<NotionPageResult[]> {
  const result = await notionRequest<{
    results: any[];
  }>(authUserId, "POST", "/search", {
    query,
    page_size: maxResults,
    sort: { direction: "descending", timestamp: "last_edited_time" },
  });

  return result.results.map((item) => ({
    id: item.id,
    title: extractTitle(item),
    url: item.url || "",
    lastEditedTime: item.last_edited_time,
    icon: extractIcon(item),
    type: item.object === "database" ? "database" as const : "page" as const,
  }));
}

/**
 * Get a Notion page with its block content rendered as plain text.
 */
export async function getPage(
  authUserId: string,
  pageId: string,
): Promise<NotionPageContent> {
  // 1. Get page metadata
  const page = await notionRequest<any>(authUserId, "GET", `/pages/${pageId}`);

  // 2. Get page blocks (content)
  const blocks = await notionRequest<{
    results: any[];
  }>(authUserId, "GET", `/blocks/${pageId}/children?page_size=100`);

  // 3. Render blocks to plain text
  const contentParts: string[] = [];
  for (const block of blocks.results) {
    const text = extractBlockText(block);
    if (text) contentParts.push(text);
  }

  return {
    id: page.id,
    title: extractTitle(page),
    url: page.url || "",
    content: contentParts.join("\n"),
  };
}

/**
 * Create a new Notion page in the user's workspace.
 */
export async function createPage(
  authUserId: string,
  title: string,
  content: string,
  parentPageId?: string,
): Promise<NotionPageResult> {
  // If no parent is specified, we need a parent — use the search to find a workspace page
  const parent: Record<string, unknown> = parentPageId
    ? { page_id: parentPageId }
    : { page_id: parentPageId }; // Notion requires a parent

  if (!parentPageId) {
    throw new Error(
      "A parent page or database ID is required to create a Notion page. " +
      "Ask the user where they'd like the page created."
    );
  }

  const result = await notionRequest<any>(authUserId, "POST", "/pages", {
    parent,
    properties: {
      title: {
        title: [{ text: { content: title } }],
      },
    },
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content } }],
        },
      },
    ],
  });

  return {
    id: result.id,
    title,
    url: result.url || "",
    lastEditedTime: result.last_edited_time,
    type: "page",
  };
}

// ---------------------------------------------------------------------------
// Block text extraction
// ---------------------------------------------------------------------------

function extractRichText(richText: any[]): string {
  if (!Array.isArray(richText)) return "";
  return richText.map((t) => t.plain_text || "").join("");
}

function extractBlockText(block: any): string {
  const type = block.type;
  if (!type) return "";

  const blockData = block[type];
  if (!blockData) return "";

  if (blockData.rich_text) {
    const text = extractRichText(blockData.rich_text);
    switch (type) {
      case "heading_1": return `# ${text}`;
      case "heading_2": return `## ${text}`;
      case "heading_3": return `### ${text}`;
      case "bulleted_list_item": return `• ${text}`;
      case "numbered_list_item": return `- ${text}`;
      case "to_do": return `[${blockData.checked ? "x" : " "}] ${text}`;
      case "toggle": return `▸ ${text}`;
      case "quote": return `> ${text}`;
      case "callout": return `💡 ${text}`;
      default: return text;
    }
  }

  if (type === "divider") return "---";
  if (type === "code" && blockData.rich_text) {
    return `\`\`\`\n${extractRichText(blockData.rich_text)}\n\`\`\``;
  }

  return "";
}
