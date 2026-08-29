export interface IntegrationSuggestionConfig {
  provider: string;
  name: string;
  badge: string;
  readyMessage: string;
  suggestions: string[];
}

export const INTEGRATION_SUGGESTIONS: Record<string, IntegrationSuggestionConfig> = {
  "google-calendar": {
    provider: "google-calendar",
    name: "Google Calendar",
    badge: "Calendar",
    readyMessage: "You're ready to use your calendar.",
    suggestions: [
      "What's on my calendar today?",
      "Find my free time tomorrow",
      "Schedule a meeting",
    ],
  },
  calendar: {
    provider: "google-calendar",
    name: "Google Calendar",
    badge: "Calendar",
    readyMessage: "You're ready to use your calendar.",
    suggestions: [
      "What's on my calendar today?",
      "Find my free time tomorrow",
      "Schedule a meeting",
    ],
  },
  gmail: {
    provider: "gmail",
    name: "Gmail",
    badge: "Gmail",
    readyMessage: "You're ready to manage your inbox.",
    suggestions: [
      "Show my unread emails",
      "Find emails from Rahul",
      "Draft a reply to my latest email",
    ],
  },
  "google-mail": {
    provider: "gmail",
    name: "Gmail",
    badge: "Gmail",
    readyMessage: "You're ready to manage your inbox.",
    suggestions: [
      "Show my unread emails",
      "Find emails from Rahul",
      "Draft a reply to my latest email",
    ],
  },
  "google-drive": {
    provider: "google-drive",
    name: "Google Drive",
    badge: "Drive",
    readyMessage: "You're ready to search and access your files.",
    suggestions: [
      "Find my recent documents",
      "Search my Drive for project files",
    ],
  },
  drive: {
    provider: "google-drive",
    name: "Google Drive",
    badge: "Drive",
    readyMessage: "You're ready to search and access your files.",
    suggestions: [
      "Find my recent documents",
      "Search my Drive for project files",
    ],
  },
  "google-docs": {
    provider: "google-docs",
    name: "Google Docs",
    badge: "Docs",
    readyMessage: "You're ready to create and search documents.",
    suggestions: [
      "Find my latest document",
      "Create a new document",
    ],
  },
  docs: {
    provider: "google-docs",
    name: "Google Docs",
    badge: "Docs",
    readyMessage: "You're ready to create and search documents.",
    suggestions: [
      "Find my latest document",
      "Create a new document",
    ],
  },
  notion: {
    provider: "notion",
    name: "Notion",
    badge: "Notion",
    readyMessage: "You're ready to search your workspace.",
    suggestions: [
      "Search my Notion",
      "Find my project notes",
    ],
  },
  slack: {
    provider: "slack",
    name: "Slack",
    badge: "Slack",
    readyMessage: "You're ready to check channels and send messages.",
    suggestions: [
      "Show my recent Slack messages",
      "Send a message to my team",
    ],
  },
  "microsoft-teams": {
    provider: "microsoft-teams",
    name: "Microsoft Teams",
    badge: "Teams",
    readyMessage: "You're ready to manage Teams meetings and chats.",
    suggestions: [
      "Create a Teams meeting",
      "Show my recent Teams messages",
    ],
  },
  teams: {
    provider: "microsoft-teams",
    name: "Microsoft Teams",
    badge: "Teams",
    readyMessage: "You're ready to manage Teams meetings and chats.",
    suggestions: [
      "Create a Teams meeting",
      "Show my recent Teams messages",
    ],
  },
  whatsapp: {
    provider: "whatsapp",
    name: "WhatsApp",
    badge: "WhatsApp",
    readyMessage: "You're ready to send WhatsApp reminders.",
    suggestions: [
      "Send a WhatsApp message",
      "Show my WhatsApp messages",
    ],
  },
  telegram: {
    provider: "telegram",
    name: "Telegram",
    badge: "Telegram",
    readyMessage: "You're ready to send instant Telegram alerts.",
    suggestions: [
      "Send a Telegram message",
    ],
  },
};

export function getIntegrationConfig(key: string): IntegrationSuggestionConfig {
  const normalized = key.toLowerCase().trim();
  return (
    INTEGRATION_SUGGESTIONS[normalized] || {
      provider: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      badge: "App",
      readyMessage: `You're ready to use ${key}.`,
      suggestions: [`Ask Calby about ${key}`],
    }
  );
}
