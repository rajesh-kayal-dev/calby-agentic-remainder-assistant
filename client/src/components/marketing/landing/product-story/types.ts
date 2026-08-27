export type StorySceneId =
  | "chaos"
  | "intro"
  | "conversation"
  | "connected"
  | "followup"
  | "reports"
  | "payoff";

export interface StorySceneConfig {
  id: StorySceneId;
  index: number;
  label: string;
  durationMs: number;
  badge: string;
  title: string;
  subtitle: string;
}

export const STORY_SCENES: StorySceneConfig[] = [
  {
    id: "chaos",
    index: 0,
    label: "01. Mental Load",
    durationMs: 3200,
    badge: "The Problem",
    title: "Trying to remember everything?",
    subtitle: "Notes, mental reminders, scattered tasks, split bills...",
  },
  {
    id: "intro",
    index: 1,
    label: "02. Talk to Calby",
    durationMs: 2600,
    badge: "The Shift",
    title: "Hand it off in one sentence.",
    subtitle: "Stop maintaining six separate apps in your mind.",
  },
  {
    id: "conversation",
    index: 2,
    label: "03. Natural Chat",
    durationMs: 3800,
    badge: "Conversational Speed",
    title: "Say it like you'd tell a person.",
    subtitle: "Calby resolves dates, contacts, amounts, and meeting slots.",
  },
  {
    id: "connected",
    index: 3,
    label: "04. Connected Flow",
    durationMs: 3600,
    badge: "Cross-Domain Intelligence",
    title: "One conversation → Every system updated.",
    subtitle: "Ledger, tasks, reminders, and calendar work as one unit.",
  },
  {
    id: "followup",
    index: 4,
    label: "05. Proactive Follow-Up",
    durationMs: 3200,
    badge: "Closing The Loop",
    title: "Calby follows up so nothing slips.",
    subtitle: "Dispatches reminders and pending summaries via Telegram & WhatsApp.",
  },
  {
    id: "reports",
    index: 5,
    label: "06. Reports & Sync",
    durationMs: 2600,
    badge: "Automated Digests",
    title: "Turn weekly progress into structured reports.",
    subtitle: "Auto-exported to Google Docs, Sheets, and email schedules.",
  },
  {
    id: "payoff",
    index: 6,
    label: "07. Peace of Mind",
    durationMs: 3000,
    badge: "Your Day, Organized",
    title: "Stop remembering everything. Just tell Calby.",
    subtitle: "Focus on the work that matters.",
  },
];

export const TOTAL_STORY_DURATION_MS = STORY_SCENES.reduce(
  (acc, s) => acc + s.durationMs,
  0
);
