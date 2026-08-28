export interface FeatureItem {
  id: string;
  name: string;
  iconName: string;
}

export interface PlanConfig {
  badge: string;
  title: string;
  description: string;
  originalPrice: string;
  launchPrice: string;
  discountTag: string;
  duration: string;
  paymentNote: string;
  ctaText: string;
  features: FeatureItem[];
}

export const CALBY_PRO_PLAN: PlanConfig = {
  badge: "SPECIAL LAUNCH OFFER",
  title: "Calby Pro — Everything unlocked",
  description: "Connect all your apps and get unlimited AI assistance.",
  originalPrice: "₹199",
  launchPrice: "₹99",
  discountTag: "50% OFF",
  duration: "6 months",
  paymentNote: "One-time payment • No recurring charge",
  ctaText: "Get Calby Pro for ₹99",
  features: [
    { id: "ai", name: "All AI features", iconName: "sparkles" },
    { id: "tasks", name: "Unlimited tasks & reminders", iconName: "check" },
    { id: "gcal", name: "Google Calendar", iconName: "calendar" },
    { id: "gmail", name: "Gmail", iconName: "gmail" },
    { id: "whatsapp", name: "WhatsApp", iconName: "whatsapp" },
    { id: "telegram", name: "Telegram", iconName: "telegram" },
    { id: "slack", name: "Slack", iconName: "slack" },
    { id: "drive", name: "Google Drive & Docs", iconName: "drive" },
    { id: "notion", name: "Notion", iconName: "notion" },
    { id: "notifications", name: "Notifications & follow-ups", iconName: "bell" },
  ],
};

export const CALBY_FREE_PLAN = {
  title: "Currently using Calby for free",
  description: "You can continue using Calby without upgrading.",
  ctaText: "Continue with Free Plan",
};
