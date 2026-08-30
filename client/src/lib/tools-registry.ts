export type ToolCategory =
  | "CALENDAR"
  | "MEETINGS"
  | "COMMUNICATION"
  | "PRODUCTIVITY"
  | "TOOLS";

export interface ToolDefinition {
  id: string;
  category: ToolCategory;
  name: string;
  description: string;
  iconName: string;
  connectorId?: "google_calendar" | "gmail" | "whatsapp" | "telegram";
  promptTemplate: string;
  templatePrompt?: string;
  placeholder?: string;
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  CALENDAR: "Calendar",
  MEETINGS: "Meetings",
  COMMUNICATION: "Communication",
  PRODUCTIVITY: "Productivity",
  TOOLS: "Tools",
};

export const TOOLS_REGISTRY: ToolDefinition[] = [
  // CALENDAR
  {
    id: "view_schedule",
    category: "CALENDAR",
    name: "View schedule",
    description: "Check your upcoming events and schedule",
    iconName: "Calendar",
    promptTemplate: "What's on my schedule?",
    templatePrompt: "What's on my schedule for today?",
    placeholder: "Ask Calby about your schedule...",
  },
  {
    id: "find_free_time",
    category: "CALENDAR",
    name: "Find free time",
    description: "Locate open slots in your agenda",
    iconName: "Clock",
    promptTemplate: "Find a free time",
    templatePrompt: "Find a free slot tomorrow morning for 30 minutes",
    placeholder: "Tell Calby when you need a free slot...",
  },
  {
    id: "create_event",
    category: "CALENDAR",
    name: "Create event",
    description: "Schedule a new event on your calendar",
    iconName: "CalendarPlus",
    connectorId: "google_calendar",
    promptTemplate: "Create a calendar event",
    templatePrompt: "Create a meeting tomorrow at 10 AM titled ",
    placeholder: "Describe the event you want to create...",
  },
  {
    id: "reschedule_event",
    category: "CALENDAR",
    name: "Reschedule event",
    description: "Move an existing meeting to a new time",
    iconName: "CalendarRange",
    connectorId: "google_calendar",
    promptTemplate: "Reschedule a calendar event",
    templatePrompt: "Reschedule my afternoon meeting to ",
    placeholder: "Tell Calby which event you want to reschedule...",
  },
  {
    id: "cancel_event",
    category: "CALENDAR",
    name: "Cancel event",
    description: "Remove an event from your calendar",
    iconName: "CalendarX",
    connectorId: "google_calendar",
    promptTemplate: "Cancel a calendar event",
    templatePrompt: "Cancel my upcoming meeting titled ",
    placeholder: "Tell Calby which event you want to cancel...",
  },

  // MEETINGS
  {
    id: "create_meeting",
    category: "MEETINGS",
    name: "Create meeting",
    description: "Set up a team meeting link",
    iconName: "Video",
    connectorId: "google_calendar",
    promptTemplate: "Create a meeting",
    templatePrompt: "Create a 30-minute team sync meeting",
    placeholder: "Describe the meeting you want to create...",
  },
  {
    id: "join_meeting",
    category: "MEETINGS",
    name: "Join meeting",
    description: "Get the link for your next scheduled call",
    iconName: "VideoOff",
    connectorId: "google_calendar",
    promptTemplate: "Get my next meeting link",
    templatePrompt: "Get the video link for my next meeting",
    placeholder: "Ask for your next meeting link...",
  },
  {
    id: "meeting_details",
    category: "MEETINGS",
    name: "Meeting details",
    description: "View attendee list and meeting agenda",
    iconName: "Users",
    connectorId: "google_calendar",
    promptTemplate: "Show meeting details",
    templatePrompt: "Who is attending my next meeting?",
    placeholder: "Which meeting details would you like to check?",
  },

  // COMMUNICATION
  {
    id: "gmail",
    category: "COMMUNICATION",
    name: "Gmail",
    description: "Send and manage emails",
    iconName: "Mail",
    connectorId: "gmail",
    promptTemplate: "Draft an email",
    templatePrompt: "Draft an email regarding ",
    placeholder: "Tell Calby what email to send or search...",
  },
  {
    id: "whatsapp",
    category: "COMMUNICATION",
    name: "WhatsApp",
    description: "Send WhatsApp messages to contacts",
    iconName: "MessageCircle",
    connectorId: "whatsapp",
    promptTemplate: "Send a WhatsApp message",
    templatePrompt: "Send a WhatsApp message saying ",
    placeholder: "What WhatsApp message would you like to send?",
  },
  {
    id: "telegram",
    category: "COMMUNICATION",
    name: "Telegram",
    description: "Send updates via Telegram bot",
    iconName: "Send",
    connectorId: "telegram",
    promptTemplate: "Post a Telegram update",
    templatePrompt: "Post a Telegram update about ",
    placeholder: "What Telegram message would you like to post?",
  },

  // PRODUCTIVITY
  {
    id: "reminders",
    category: "PRODUCTIVITY",
    name: "Reminders",
    description: "Set quick time-based alerts",
    iconName: "Bell",
    promptTemplate: "Set a reminder",
    templatePrompt: "Remind me to ",
    placeholder: "What reminder would you like to set?",
  },
  {
    id: "tasks",
    category: "PRODUCTIVITY",
    name: "Tasks",
    description: "Add items to your to-do list",
    iconName: "CheckSquare",
    promptTemplate: "Add a task",
    templatePrompt: "Add task to my list: ",
    placeholder: "What task would you like to add?",
  },

  // TOOLS
  {
    id: "web_search",
    category: "TOOLS",
    name: "Web Search",
    description: "Search current information on the web",
    iconName: "Globe",
    promptTemplate: "Search the web",
    templatePrompt: "Search the web for ",
    placeholder: "What would you like to search on the web?",
  },
  {
    id: "attach_file",
    category: "TOOLS",
    name: "Attach file",
    description: "Upload a document or image context",
    iconName: "Paperclip",
    promptTemplate: "Analyze attached file",
    templatePrompt: "Analyze the attached document for ",
    placeholder: "Describe how to analyze the document...",
  },
];

export function buildToolPrompt(
  existingText: string,
  newTool: ToolDefinition,
  previousTool?: ToolDefinition,
): string {
  const current = existingText.trim();
  const template = newTool.promptTemplate;

  // 1. If composer is empty, return promptTemplate directly
  if (!current) return template;

  // 2. If current text starts with or contains previous tool's promptTemplate, replace it
  if (previousTool && previousTool.promptTemplate) {
    if (current.toLowerCase().startsWith(previousTool.promptTemplate.toLowerCase())) {
      const userAddition = current.slice(previousTool.promptTemplate.length).trim();
      return userAddition ? `${template} ${userAddition}` : template;
    }
  }

  // 3. If current text already starts with the new tool's promptTemplate, keep it as is
  if (current.toLowerCase().startsWith(template.toLowerCase())) {
    return current;
  }

  // 4. Combine new template with existing text intelligently
  return `${template} ${current}`;
}
