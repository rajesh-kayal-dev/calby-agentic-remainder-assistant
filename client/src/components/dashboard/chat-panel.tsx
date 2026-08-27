"use client";

import {
  ArrowUp,
  Bell,
  Bot,
  Calendar,
  LoaderCircle,
  Menu,
  MessageSquarePlus,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
  ListTodo,
  Coins,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  connectCalendar,
  fetchCalendarConnection,
  refreshCalendarConnection,
} from "@/lib/connections";
import {
  listThreads,
  loadThread,
  streamAgentChat,
  deleteThreadApi,
  updateThreadApi,
  ThreadMessage,
  ThreadSummary,
} from "@/lib/agent";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./markdown-message";
import { CalendarPanel } from "./calendar-panel";
import { CalendarWorkspace } from "./calendar/calendar-workspace";
import { RemindersPanel } from "./reminders/reminders-panel";
import { ContactsPanel } from "./contacts/contacts-panel";
import { TasksPanel } from "./tasks/tasks-panel";
import { MoneyPanel } from "./money/money-panel";
import { DashboardAmbientBackground } from "./dashboard-ambient-background";
import { CalbyTooltip } from "../ui/calby-tooltip";
import { GoogleCalendarLogo } from "../ui/google-calendar-logo";
import { AccountPopover } from "./settings/account-popover";
import { SettingsView, SettingsTabId } from "./settings/settings-view";
import { ProfileModal } from "./settings/profile-modal";
import { NotificationBellPopover } from "./settings/notification-bell-popover";
import { LLMModelSwitcher } from "./llm-model-switcher";
import { AssistantMessageItem } from "./assistant-message-item";
import { UserMessageItem } from "./user-message-item";
import { ChatSidebarItem } from "./chat-sidebar-item";
import { AIComposer } from "./composer/ai-composer";
import { useUserProfile } from "@/context/user-profile-context";
import { useLLM } from "@/context/llm-context";
import { ConnectionInfo } from "@/lib/types";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";

const styles = {
  shell:
    "flex h-svh flex-col overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-lime-400 selection:text-zinc-950",

  /* Top Bar */
  topBar:
    "flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-[#0C0C0E]/95 px-4 backdrop-blur-md z-30",
  topBarLeft: "flex items-center gap-3",
  topBarMobileMenuBtn:
    "lg:hidden flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors",
  brandLogoWrap: "flex items-center gap-2.5",
  brandLogoImg: "h-7 w-auto object-contain",
  brandTitle:
    "text-base font-semibold tracking-tight text-white flex items-center gap-1.5",
  brandBadge:
    "rounded-md border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-lime-400 uppercase tracking-wider",
  topBarRight: "flex items-center gap-3",
  modelPill:
    "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 font-medium shadow-inner",
  modelDot: "size-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]",
  userChip:
    "flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300",
  userAvatar:
    "flex size-6 shrink-0 items-center justify-center rounded-full bg-lime-400/20 text-[11px] font-bold text-lime-400 border border-lime-400/30",

  /* 3-Column Main Body */
  bodyGrid: "flex min-h-0 flex-1 overflow-hidden",

  /* Left Sidebar */
  overlay:
    "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity",
  sidebar:
    "fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-zinc-800/80 bg-[#0C0C0E] shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
  sidebarOpen: "translate-x-0",
  sidebarClosed: "-translate-x-full",
  sidebarMobileHeader:
    "flex h-14 items-center justify-between border-b border-zinc-800/80 px-4 lg:hidden",
  sidebarActions: "space-y-3 p-3 pb-2",
  searchBox:
    "relative flex items-center rounded-xl border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 focus-within:border-zinc-700 transition-colors",
  searchIcon: "size-3.5 text-zinc-500 shrink-0",
  searchInput:
    "w-full bg-transparent px-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none",
  searchClearBtn: "text-zinc-500 hover:text-zinc-300 p-0.5",
  newChatBtn:
    "w-full justify-start gap-2.5 rounded-xl border border-zinc-800/90 bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:text-white transition-all text-xs font-semibold shadow-sm",
  newChatIcon: "size-4 text-lime-400",

  /* Connections Section */
  connectionsSection: "px-3 py-2",

  /* Chats Section */
  chatsSection: "flex min-h-0 flex-1 flex-col px-3 pt-2",
  chatsHeader:
    "mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500",
  chatsScroll: "min-h-0 flex-1 pr-1 pb-2",
  chatsEmpty: "px-2 py-4 text-center text-xs leading-relaxed text-zinc-500",
  threadList: "space-y-1",
  threadBtn:
    "group relative flex w-full flex-col rounded-xl px-3 py-2 text-left transition-all duration-150 disabled:opacity-50 border",
  threadBtnActive: "bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm",
  threadBtnIdle:
    "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
  threadActiveBar:
    "absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-lime-400",
  threadTitle: "line-clamp-1 text-xs font-medium leading-snug",
  threadTime: "mt-0.5 block text-[10px] text-zinc-500",

  /* Sidebar Footer */
  sidebarFooter: "mt-auto border-t border-zinc-800/80 bg-[#0C0C0E] p-3",

  /* Center: Assistant Area */
  assistantArea:
    "relative flex min-w-0 flex-1 flex-col bg-zinc-950 overflow-hidden",
  assistantHeader:
    "relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-zinc-800/60 bg-zinc-950/90 px-4 backdrop-blur-md sm:px-6",
  assistantHeaderText: "flex items-center gap-2",
  assistantTitle: "text-xs font-semibold tracking-tight text-white flex items-center gap-1.5",
  assistantPulseDot: "size-1.5 rounded-full bg-lime-400",
  assistantSubtitle: "hidden sm:inline text-xs text-zinc-400 font-light",

  messagesScroll: "h-full min-h-0 flex-1",
  messagesInner: "mx-auto w-full max-w-3xl px-4 py-6 sm:px-6",

  /* Empty State */
  emptyState:
    "relative flex min-h-[58vh] flex-col items-center justify-center text-center px-4 py-8 z-10",
  emptyLogoWrap:
    "mb-5 relative flex size-16 items-center justify-center rounded-2xl bg-zinc-900/90 border border-zinc-800/90 shadow-xl ring-1 ring-lime-400/20",
  emptyLogoImg: "h-9 w-auto object-contain",
  emptyTitle:
    "text-2xl font-bold tracking-tight text-white sm:text-3xl font-sans",
  emptyTagline:
    "mt-1.5 text-sm font-medium text-zinc-300",
  emptyCopy:
    "mt-2 max-w-md text-xs leading-relaxed text-zinc-400 font-light",
  suggestionsWrap: "mt-8 w-full max-w-lg",
  suggestionsLabel:
    "mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 text-center",
  suggestionsGrid:
    "grid grid-cols-1 sm:grid-cols-2 gap-2",
  suggestionBtn:
    "flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800/90 hover:text-white hover:border-zinc-700 transition-all shadow-sm group",
  suggestionDot:
    "size-1.5 rounded-full bg-lime-400/60 group-hover:bg-lime-400 shrink-0 transition-colors",

  /* Message List & Rows */
  messageList: "space-y-6 pb-4 relative z-10",
  messageRow: "message-enter flex w-full min-w-0 gap-3",
  messageRowUser: "justify-end",
  messageRowAssistant: "justify-start items-start",
  assistantAvatar:
    "flex size-7 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-lime-400 shadow-sm mt-0.5",
  bubbleUser:
    "rounded-2xl rounded-tr-none bg-zinc-800/90 border border-zinc-700/80 px-4 py-3 text-zinc-100 text-sm leading-relaxed max-w-[85%] sm:max-w-lg shadow-sm backdrop-blur-sm",
  bubbleAssistant:
    "rounded-2xl rounded-tl-none bg-zinc-900/90 border border-zinc-800/90 p-4 text-zinc-200 text-sm leading-relaxed max-w-full sm:max-w-2xl shadow-md min-w-0 flex-1 backdrop-blur-sm",
  bubbleSystem:
    "rounded-xl bg-red-950/30 border border-red-800/40 px-3.5 py-2 text-xs text-red-300",

  /* Tool Status Progress */
  toolStatusCard:
    "inline-flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800/90 px-3 py-1 text-xs text-zinc-300 shadow-sm",
  toolStatusDot: "size-2 rounded-full bg-lime-400 animate-pulse",

  /* Command Bar Input */
  composerWrap:
    "relative z-10 shrink-0 border-t border-zinc-800/80 bg-zinc-950/95 px-4 py-3 backdrop-blur-md sm:px-6",
  composerForm:
    "composer-glow mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-2 shadow-2xl focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-lime-400/20 transition-all",
  quickActionBtn:
    "mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors",
  composerInput:
    "max-h-40 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-none focus-visible:ring-0",
  sendBtn:
    "mb-0.5 size-9 shrink-0 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(163,230,53,0.25)] hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] transition-all flex items-center justify-center",
  composerHint:
    "mx-auto mt-2 max-w-3xl text-center text-[11px] text-zinc-500",
} as const;

type Props = {
  sessionToken: string;
  connections?: ReactNode;
  footer?: ReactNode;
  userLabel?: string;
  onLogout?: () => void;
  loggingOut?: boolean;
  initialView?: "assistant" | "calendar" | "settings" | "reminders" | "contacts";
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const WELCOME_PROMPT =
  "Connect Google Calendar, then ask Calby about your schedule.";

const SUGGESTIONS = [
  "What's on today?",
  "What does Rahul owe me?",
  "What is pending with Rahul?",
  "Who owes me money?",
  "Show my pending tasks",
  "Send Rahul his pending list",
  "Find a free slot tomorrow morning",
  "Create a meeting",
];

function formatRelativeDate(isoString: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      if (diffHour === 1) return "1 hour ago";
      return `${diffHour} hours ago`;
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Yesterday";

    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();

    if (year === now.getFullYear()) {
      return `${day} ${month}`;
    }

    return `${day} ${month} ${year}`;
  } catch {
    return isoString;
  }
}

function sanitizeProgressMessage(msg?: string): string {
  if (!msg) return "Checking your calendar...";
  const lower = msg.toLowerCase();
  if (
    lower.includes("intent classifier") ||
    lower.includes("prompt builder") ||
    lower.includes("memory store") ||
    lower.includes("tool router")
  ) {
    return "Analyzing calendar request...";
  }
  if (lower.includes("google") || lower.includes("calendar")) {
    return "Checking your calendar...";
  }
  if (lower.includes("event") || lower.includes("meet")) {
    return "Reviewing schedule...";
  }
  if (lower.includes("assistant") || lower.includes("summary") || lower.includes("pending")) {
    return "Gathering your pending items...";
  }
  if (lower.includes("money") || lower.includes("ledger") || lower.includes("payment")) {
    return "Checking money records...";
  }
  if (lower.includes("task")) {
    return "Checking tasks...";
  }
  if (lower.includes("contact")) {
    return "Looking up contact...";
  }
  return msg;
}

function WelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: WELCOME_PROMPT,
  };
}

function renderCalendarStatusPill(conn: ConnectionInfo | null) {}

function GoogleCalendarNavItem({
  sessionToken,
  onOpenOverlay,
}: {
  sessionToken: string;
  onOpenOverlay: () => void;
}) {
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const data = await fetchCalendarConnection(sessionToken);
      setConnection(data);
    } catch {
      setConnection(null);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSyncOrConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy || !sessionToken) return;

    setBusy(true);
    try {
      if (connection?.status === "connected") {
        await refreshCalendarConnection(sessionToken);
        await loadStatus();
      } else {
        await connectCalendar(sessionToken);
      }
    } catch {
      console.error("Calendar sync/connect failed");
    } finally {
      setBusy(false);
    }
  };

  const status = connection?.status || "disconnected";
  const connected = status === "connected";
  const pending = status === "pending" || loading;
  const isError = status === "error";

  let statusText = "Not connected";
  let statusClass = "text-zinc-500";
  let tooltipText = "Connect Google Calendar";

  if (connected) {
    statusText = "Connected";
    statusClass = "text-lime-400";
    tooltipText = "Sync Google Calendar";
  } else if (pending) {
    statusText = "Connecting...";
    statusClass = "text-zinc-400";
    tooltipText = "Connecting to Google Calendar";
  } else if (isError) {
    statusText = "Connection failed";
    statusClass = "text-red-400";
    tooltipText = "Retry Connection";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        onOpenOverlay();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenOverlay();
        }
      }}
      className="group flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 hover:border-zinc-700/60 active:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-400 transition-all duration-150 select-none cursor-pointer"
      aria-label="Open Google Calendar Workspace"
      title="Open Google Calendar Workspace"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <GoogleCalendarLogo className="size-5 shrink-0 transition-transform group-hover:scale-105" />
        <div className="flex flex-col text-left min-w-0">
          <span className="truncate leading-tight">Google Calendar</span>
          <span className={cn("text-[10px] font-medium leading-none mt-0.5", statusClass)}>
            {statusText}
          </span>
        </div>
      </div>

      <CalbyTooltip content={tooltipText} side="right">
        <button
          type="button"
          onClick={handleSyncOrConnect}
          disabled={busy}
          className="flex size-6 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label={tooltipText}
        >
          <RefreshCcw
            className={cn(
              "size-3.5 transition-all",
              busy
                ? "animate-spin text-lime-400"
                : connected
                ? "text-zinc-400 hover:text-lime-400"
                : "text-zinc-500 hover:text-lime-400"
            )}
          />
        </button>
      </CalbyTooltip>
    </div>
  );
}

function GoogleCalendarOverlay({
  isOpen,
  onClose,
  sessionToken,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
}) {
  const [connectionStatus, setConnectionStatus] = useState<string>("connected");

  useEffect(() => {
    if (sessionToken && isOpen) {
      fetchCalendarConnection(sessionToken)
        .then((conn) => setConnectionStatus(conn?.status || "connected"))
        .catch(() => {});
    }
  }, [sessionToken, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const connected = connectionStatus === "connected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in duration-200 p-0 sm:p-4 md:p-6 select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Large Application Workspace Window */}
      <div
        className="relative z-10 flex w-full sm:w-[94vw] max-w-[1450px] h-full sm:h-[90vh] max-h-[900px] flex-col overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border border-zinc-800/90 bg-[#0C0C0E] shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Google Calendar Workspace"
      >
        {/* Calby Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 sm:px-6 bg-[#0C0C0E]/95 z-20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
              <GoogleCalendarLogo className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                Google Calendar
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    connected
                      ? "border-lime-400/30 bg-lime-400/10 text-lime-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400"
                  )}
                >
                  {connected ? "Connected" : "Sync Active"}
                </span>
              </p>
              <p className="text-[11px] text-zinc-400">
                Calby Embedded Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalbyTooltip content="Close Calendar" side="bottom">
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all shadow-sm group"
                aria-label="Close Calendar"
              >
                <X className="size-4 group-hover:scale-110 transition-transform" />
              </button>
            </CalbyTooltip>
          </div>
        </header>

        {/* Embedded Google Calendar Workspace Body */}
        <div className="relative flex min-h-0 flex-1 flex-col bg-[#050505] overflow-hidden">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=primary"
            title="Google Calendar Workspace"
            className="size-full border-0 rounded-b-2xl bg-zinc-950"
            allow="fullscreen"
          />

          {/* Web Access Fallback Bar */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 rounded-xl border border-zinc-800/90 bg-zinc-900/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
            <span className="text-xs text-zinc-300">
              Need direct web view?
            </span>
            <a
              href="https://calendar.google.com/"
              target="_self"
              className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-lime-300 transition-colors shadow-sm"
            >
              <span>Open Google Calendar</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


function ChatPanel({
  sessionToken,
  connections,
  footer,
  userLabel = "Rajesh Kayal",
  onLogout,
  loggingOut = false,
  initialView = "assistant",
}: Props) {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([WelcomeMessage()]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeView, setActiveView] = useState<"assistant" | "calendar" | "settings" | "reminders" | "contacts" | "tasks" | "money">(initialView);
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>("ai-providers");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const { defaultConnection, providers, activeLLM } = useLLM();
  const [calendarWidth, setCalendarWidth] = useState<number>(380);
  const [calendarCollapsed, setCalendarCollapsed] = useState<boolean>(true);
  const [calendarFullscreen, setCalendarFullscreen] = useState<boolean>(false);
  const [isDraggingCalendar, setIsDraggingCalendar] = useState<boolean>(false);
  const [googleCalendarOverlayOpen, setGoogleCalendarOverlayOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [calendarConnection, setCalendarConnection] = useState<ConnectionInfo | null>(null);

  useEffect(() => {
    if (!sessionToken) return;
    fetchCalendarConnection(sessionToken)
      .then(setCalendarConnection)
      .catch(() => setCalendarConnection(null));
  }, [sessionToken]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const todayFormatted = useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return `${day} ${month}`;
  }, []);


  const handleCalendarResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDraggingCalendar(true);

      const startX = e.clientX;
      const startWidth = calendarWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = startX - moveEvent.clientX;
        const minW = 300;
        const maxW = Math.min(window.innerWidth * 0.65, 800);
        const newW = Math.min(Math.max(startWidth + deltaX, minW), maxW);
        setCalendarWidth(newW);
      };

      const handleMouseUp = () => {
        setIsDraggingCalendar(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [calendarWidth]
  );

  const showEmpty =
    messages.length === 1 && messages[0]?.id === "welcome" && !running;

  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshThreads = useCallback(async () => {
    try {
      const data = await listThreads(sessionToken);
      setThreads(data.threads);
    } catch {}
  }, [sessionToken]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, progress]);

  function startNewChat() {
    if (running) return;
    setThreadId(crypto.randomUUID());
    setMessages([WelcomeMessage()]);
    setPrompt("");
    setSidebarOpen(false);
  }

  async function resumeThread(nextThreadId: string) {
    if (running || loadingThread || nextThreadId === threadId) return;
    setLoadingThread(true);
    setProgress(null);
    setSidebarOpen(false);

    try {
      const data = await loadThread(sessionToken, nextThreadId);
      setThreadId(data.threadId);
      setMessages(
        data.messages.length > 0 ? data.messages : [WelcomeMessage()],
      );
      setPrompt("");
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Could not load the chat",
        },
      ]);
    } finally {
      setLoadingThread(false);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || running || loadingThread) return;
    const assistantId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      },
      {
        id: assistantId,
        role: "assistant",
        content: "",
      },
    ]);

    setPrompt("");
    setRunning(true);
    setProgress("Checking your calendar...");

    try {
      await streamAgentChat(
        sessionToken,
        {
          message: trimmed,
          threadId,
          llm: activeLLM
            ? { providerId: activeLLM.providerId, model: activeLLM.model }
            : undefined,
        },
        (event) => {
          if (event.type === "progress" && event.message) {
            setProgress(event.message);
          }
          if (event.type === "token" && event.token) {
            setProgress(null);
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: message.content + event.token,
                    }
                  : message,
              ),
            );
          }

          if (event.type === "error") {
            setProgress(null);
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: event.message ?? "Agent failed",
                    }
                  : message,
              ),
            );
          }
        },
      );

      refreshThreads();
    } catch (err: any) {
      const errMsg = err?.message || "Could not reach the agent API";
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                role: "system",
                content: errMsg,
              }
            : message,
        ),
      );
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  const handleRegenerate = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg && lastUserMsg.content) {
      sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  const handleResubmitUserMessage = useCallback(
    async (userMsgId: string, newContent: string) => {
      const trimmed = newContent.trim();
      if (!trimmed || running || loadingThread) return;

      const userIndex = messages.findIndex((m) => m.id === userMsgId);
      if (userIndex === -1) return;

      const nextMsg = messages[userIndex + 1];
      let targetAssistantId: string;

      if (nextMsg && nextMsg.role === "assistant") {
        targetAssistantId = nextMsg.id;
      } else {
        targetAssistantId = crypto.randomUUID();
      }

      setMessages((current) => {
        const updated = [...current];
        updated[userIndex] = { ...updated[userIndex], content: trimmed };

        if (nextMsg && nextMsg.role === "assistant") {
          updated[userIndex + 1] = { ...updated[userIndex + 1], content: "" };
        } else {
          updated.splice(userIndex + 1, 0, {
            id: targetAssistantId,
            role: "assistant",
            content: "",
          });
        }
        return updated;
      });

      setRunning(true);
      setProgress("Processing...");

      try {
        await streamAgentChat(
          sessionToken,
          {
            message: trimmed,
            threadId,
            llm: activeLLM
              ? { providerId: activeLLM.providerId, model: activeLLM.model }
              : undefined,
          },
          (event) => {
            if (event.type === "progress" && event.message) {
              setProgress(event.message);
            }
            if (event.type === "token" && event.token) {
              setProgress(null);
              setMessages((current) =>
                current.map((message) =>
                  message.id === targetAssistantId
                    ? {
                        ...message,
                        content: message.content + event.token,
                      }
                    : message,
                ),
              );
            }

            if (event.type === "error") {
              setProgress(null);
              setMessages((current) =>
                current.map((message) =>
                  message.id === targetAssistantId
                    ? {
                        ...message,
                        content: event.message ?? "Agent failed",
                      }
                    : message,
                ),
              );
            }
          },
        );

        refreshThreads();
      } catch (err: any) {
        const errMsg = err?.message || "Could not reach the agent API";
        setMessages((current) =>
          current.map((message) =>
            message.id === targetAssistantId
              ? {
                  ...message,
                  role: "system",
                  content: errMsg,
                }
              : message,
          ),
        );
      } finally {
        setRunning(false);
        setProgress(null);
      }
    },
    [messages, running, loadingThread, sessionToken, threadId, activeLLM, refreshThreads],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(prompt);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(prompt);
    }
  }

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  const currentDisplayUser = profile?.name || userLabel || "";
  const userInitial = currentDisplayUser ? currentDisplayUser.charAt(0).toUpperCase() : "U";

  if (activeView === "settings") {
    return (
      <div className={styles.shell}>
        <SettingsView
          sessionToken={sessionToken}
          userLabel={currentDisplayUser}
          initialTab={settingsTab}
          onBackToAssistant={() => setActiveView("assistant")}
          onOpenCalendarWorkspace={() => setGoogleCalendarOverlayOpen(true)}
        />
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={styles.topBarMobileMenuBtn}
            aria-label="Toggle Navigation Sidebar"
          >
            {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <div className={styles.brandLogoWrap}>
            <img
              src="/logo.png"
              alt="Calby logo"
              className={styles.brandLogoImg}
            />
            <span className={styles.brandTitle}>
              Calby
              <span className={styles.brandBadge}>Assistant</span>
            </span>
          </div>
        </div>

        <div className={styles.topBarRight}>
          <CalbyTooltip content={calendarOpen ? "Close Calendar" : "Open Calendar"} side="bottom">
            <button
              type="button"
              onClick={() => setCalendarOpen((prev) => !prev)}
              className={cn(
                "flex xl:hidden items-center gap-2 rounded-xl border border-zinc-800/90 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 shadow-sm group select-none",
                calendarOpen && "bg-zinc-800/90 border-lime-400/30 text-white"
              )}
              aria-label={calendarOpen ? "Close Calendar" : "Open Calendar"}
            >
              <span className="flex items-center gap-1 font-semibold text-zinc-200 group-hover:text-white">
                <span className="size-1.5 rounded-full bg-lime-400 animate-pulse" />
                <span>{todayFormatted}</span>
              </span>
              <span className="text-zinc-600">·</span>
              <Calendar className="size-4 text-lime-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
            </button>
          </CalbyTooltip>

          {/* LLM Provider + Model Switcher Popover (Matches Reference Screenshots) */}
          <LLMModelSwitcher
            onOpenSettings={(tab) => {
              setSettingsTab(tab);
              setActiveView("settings");
            }}
          />

          <NotificationBellPopover
            onOpenFullPage={() => {
              setSettingsTab("notifications");
              setActiveView("settings");
            }}
          />

          <div className={styles.userChip}>
            {isProfileLoading && !profile ? (
              <div className="h-5 w-20 rounded bg-zinc-800 animate-pulse" />
            ) : (
              <>
                <div className={styles.userAvatar}>{userInitial}</div>
                <span className="max-w-[120px] truncate font-medium hidden sm:inline">
                  {currentDisplayUser}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3-Column Body */}
      <div className={styles.bodyGrid}>
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className={styles.overlay}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={cn(
            styles.sidebar,
            sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed,
          )}
        >
          {/* Mobile Sidebar Close */}
          <div className={styles.sidebarMobileHeader}>
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Calby"
                className="h-6 w-auto object-contain"
              />
              <span className="text-sm font-semibold text-white">Calby</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
          {/* Primary Workspace Navigation */}
          <div className="px-3 pt-3 pb-1 space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveView("assistant");
                setSidebarOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 border",
                activeView === "assistant"
                  ? "bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <Bot
                className={cn(
                  "size-4",
                  activeView === "assistant" ? "text-lime-400" : "text-zinc-400"
                )}
              />
              <span>AI Assistant</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("calendar");
                setSidebarOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 border",
                activeView === "calendar"
                  ? "bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <Calendar
                className={cn(
                  "size-4",
                  activeView === "calendar" ? "text-lime-400" : "text-zinc-400"
                )}
              />
              <span>Calendar Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("reminders");
                setSidebarOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 border",
                activeView === "reminders"
                  ? "bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <Bell
                className={cn(
                  "size-4",
                  activeView === "reminders" ? "text-lime-400" : "text-zinc-400"
                )}
              />
              <span>Reminders</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("tasks");
                setSidebarOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 border",
                activeView === "tasks"
                  ? "bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <ListTodo
                className={cn(
                  "size-4",
                  activeView === "tasks" ? "text-lime-400" : "text-zinc-400"
                )}
              />
              <span>Tasks Manager</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("contacts");
                setSidebarOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 border",
                activeView === "contacts"
                  ? "bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <Users
                className={cn(
                  "size-4",
                  activeView === "contacts" ? "text-lime-400" : "text-zinc-400"
                )}
              />
              <span>Contacts Directory</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("money");
                setSidebarOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 border",
                activeView === "money"
                  ? "bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <Coins
                className={cn(
                  "size-4",
                  activeView === "money" ? "text-lime-400" : "text-zinc-400"
                )}
              />
              <span>Money Ledger</span>
            </button>

            {/* Unified Single Google Calendar Item */}
            <GoogleCalendarNavItem
              sessionToken={sessionToken}
              onOpenOverlay={() => setGoogleCalendarOverlayOpen(true)}
            />
          </div>

          <Separator className="bg-zinc-800/80" />

          {/* Search & New Chat */}
          <div className={styles.sidebarActions}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={styles.searchClearBtn}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <Button
              onClick={() => {
                startNewChat();
                setActiveView("assistant");
              }}
              variant="outline"
              className={styles.newChatBtn}
            >
              <MessageSquarePlus className={styles.newChatIcon} />
              New Chat
            </Button>
          </div>

          <Separator className="bg-zinc-800/80" />

          {/* Chats Section */}
          <div className={styles.chatsSection}>
            <ScrollArea className={styles.chatsScroll}>
              {threads.length === 0 ? (
                <div className="py-6 px-3 text-center space-y-1">
                  <p className="text-xs font-semibold text-zinc-300">No conversations yet</p>
                  <p className="text-[11px] text-zinc-500">Ask Calby about your calendar to get started.</p>
                </div>
              ) : filteredThreads.length === 0 ? (
                <p className={styles.chatsEmpty}>No chats matching search.</p>
              ) : (
                <div className="space-y-4">
                  {/* PINNED CHATS GROUP */}
                  {filteredThreads.filter((t) => t.isPinned).length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-1 text-[10px] font-bold tracking-wider text-lime-400 uppercase">
                        <span>Pinned</span>
                        <span>{filteredThreads.filter((t) => t.isPinned).length}</span>
                      </div>
                      <div className={styles.threadList}>
                        {filteredThreads
                          .filter((t) => t.isPinned)
                          .map((thread) => (
                            <ChatSidebarItem
                              key={thread.id}
                              thread={thread}
                              isActive={thread.id === threadId && activeView === "assistant"}
                              disabled={running || loadingThread}
                              onSelect={() => {
                                resumeThread(thread.id);
                                setActiveView("assistant");
                              }}
                              onPinToggle={async (tId, currentPinned) => {
                                const newPinned = !currentPinned;
                                setThreads((curr) =>
                                  curr.map((t) => (t.id === tId ? { ...t, isPinned: newPinned } : t)),
                                );
                                try {
                                  await updateThreadApi(sessionToken, tId, { isPinned: newPinned });
                                  setToastMessage(newPinned ? "Conversation pinned" : "Conversation unpinned");
                                } catch {
                                  setThreads((curr) =>
                                    curr.map((t) => (t.id === tId ? { ...t, isPinned: currentPinned } : t)),
                                  );
                                  setToastMessage("Couldn't update pin state.");
                                }
                              }}
                              onRename={async (tId, newTitle) => {
                                const oldTitle = threads.find((t) => t.id === tId)?.title || "";
                                setThreads((curr) =>
                                  curr.map((t) => (t.id === tId ? { ...t, title: newTitle } : t)),
                                );
                                try {
                                  await updateThreadApi(sessionToken, tId, { title: newTitle });
                                  setToastMessage("Conversation renamed");
                                } catch {
                                  setThreads((curr) =>
                                    curr.map((t) => (t.id === tId ? { ...t, title: oldTitle } : t)),
                                  );
                                  setToastMessage("Couldn't rename conversation.");
                                }
                              }}
                              onDelete={async (tId) => {
                                try {
                                  await deleteThreadApi(sessionToken, tId);
                                  setThreads((curr) => curr.filter((t) => t.id !== tId));
                                  if (threadId === tId) {
                                    startNewChat();
                                  }
                                  setToastMessage("Conversation deleted");
                                } catch {
                                  setToastMessage("Couldn't delete conversation.");
                                }
                              }}
                              formatDate={formatRelativeDate}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* REGULAR CHATS GROUP */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                      <span>Chats</span>
                      <span>{filteredThreads.filter((t) => !t.isPinned).length}</span>
                    </div>
                    <div className={styles.threadList}>
                      {filteredThreads
                        .filter((t) => !t.isPinned)
                        .map((thread) => (
                          <ChatSidebarItem
                            key={thread.id}
                            thread={thread}
                            isActive={thread.id === threadId && activeView === "assistant"}
                            disabled={running || loadingThread}
                            onSelect={() => {
                              resumeThread(thread.id);
                              setActiveView("assistant");
                            }}
                            onPinToggle={async (tId, currentPinned) => {
                              const newPinned = !currentPinned;
                              setThreads((curr) =>
                                curr.map((t) => (t.id === tId ? { ...t, isPinned: newPinned } : t)),
                              );
                              try {
                                await updateThreadApi(sessionToken, tId, { isPinned: newPinned });
                                setToastMessage(newPinned ? "Conversation pinned" : "Conversation unpinned");
                              } catch {
                                setThreads((curr) =>
                                  curr.map((t) => (t.id === tId ? { ...t, isPinned: currentPinned } : t)),
                                );
                                setToastMessage("Couldn't update pin state.");
                              }
                            }}
                            onRename={async (tId, newTitle) => {
                              const oldTitle = threads.find((t) => t.id === tId)?.title || "";
                              setThreads((curr) =>
                                curr.map((t) => (t.id === tId ? { ...t, title: newTitle } : t)),
                              );
                              try {
                                await updateThreadApi(sessionToken, tId, { title: newTitle });
                                setToastMessage("Conversation renamed");
                              } catch {
                                setThreads((curr) =>
                                  curr.map((t) => (t.id === tId ? { ...t, title: oldTitle } : t)),
                                );
                                setToastMessage("Couldn't rename conversation.");
                              }
                            }}
                            onDelete={async (tId) => {
                              try {
                                await deleteThreadApi(sessionToken, tId);
                                setThreads((curr) => curr.filter((t) => t.id !== tId));
                                if (threadId === tId) {
                                  startNewChat();
                                }
                                setToastMessage("Conversation deleted");
                              } catch {
                                setToastMessage("Couldn't delete conversation.");
                              }
                            }}
                            formatDate={formatRelativeDate}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          <Separator className="bg-zinc-800/80" />

          {/* User Account Profile Footer */}
          <div className={styles.sidebarFooter}>
            <PWAInstallButton variant="sidebar" className="mb-2.5" />
            <AccountPopover
              userLabel={currentDisplayUser}
              onOpenProfile={() => setProfileModalOpen(true)}
              onOpenSettings={() => {
                setSettingsTab("ai-providers");
                setActiveView("settings");
              }}
              onLogout={onLogout}
              loggingOut={loggingOut}
            />
          </div>
        </aside>

        {/* Dynamic View: Reminders vs Contacts vs Tasks vs Calendar Workspace vs AI Assistant View */}
        {activeView === "reminders" ? (
          <RemindersPanel sessionToken={sessionToken} />
        ) : activeView === "tasks" ? (
          <TasksPanel sessionToken={sessionToken} />
        ) : activeView === "contacts" ? (
          <ContactsPanel sessionToken={sessionToken} />
        ) : activeView === "money" ? (
          <MoneyPanel sessionToken={sessionToken} />
        ) : activeView === "calendar" ? (
          <div className="flex min-w-0 flex-1 overflow-hidden">
            <CalendarWorkspace
              sessionToken={sessionToken}
              userLabel={currentDisplayUser}
              onAskCalby={(calbyPrompt) => {
                setActiveView("assistant");
                if (calbyPrompt) {
                  sendMessage(calbyPrompt);
                }
              }}
            />
          </div>
        ) : calendarFullscreen ? (
          /* Calendar Fullscreen Workspace View */
          <div className="flex min-w-0 flex-1 overflow-hidden">
            <CalendarWorkspace
              sessionToken={sessionToken}
              userLabel={userLabel}
              isFullscreen={true}
              onExitFullscreen={() => setCalendarFullscreen(false)}
              onAskCalby={(calbyPrompt) => {
                setCalendarFullscreen(false);
                setActiveView("assistant");
                if (calbyPrompt) {
                  sendMessage(calbyPrompt);
                }
              }}
            />
          </div>
        ) : (
          <>
            {/* Center: Assistant Area */}
            <section className={styles.assistantArea}>
              {/* Subtle Animated AI Ambient Background */}
              <DashboardAmbientBackground opacity={0.55} showGlow={true} />

              <div className={styles.assistantHeader}>
                <div className={styles.assistantHeaderText}>
                  <span className={styles.assistantPulseDot} />
                  <p className={styles.assistantTitle}>Assistant</p>
                  <span className="text-zinc-600 hidden sm:inline">·</span>
                  <p className={styles.assistantSubtitle}>
                    Schedule, reschedule, and brief your day
                  </p>
                </div>

                {/* Right Side Calendar Date Toggle Button ("24 Aug" + moving toggle animation) */}
                <CalbyTooltip content={calendarCollapsed ? "Open Calendar" : "Close Calendar"} side="bottom">
                  <button
                    type="button"
                    onClick={() => setCalendarCollapsed((prev) => !prev)}
                    className={cn(
                      "hidden xl:flex items-center gap-2 rounded-xl border border-zinc-800/90 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 shadow-sm group relative overflow-hidden select-none",
                      !calendarCollapsed && "bg-zinc-800/90 border-lime-400/30 text-white shadow-[0_0_12px_rgba(163,230,53,0.15)]"
                    )}
                    aria-label={calendarCollapsed ? "Open Calendar" : "Close Calendar"}
                  >
                    {/* Animated Neon Lime Accent Edge */}
                    <span
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-0.5 bg-lime-400 transition-all duration-300 opacity-0 group-hover:opacity-100",
                        !calendarCollapsed && "opacity-100 w-1"
                      )}
                    />

                    {/* Live Date Badge ("24 Aug") */}
                    <span className="flex items-center gap-1.5 font-medium tracking-tight">
                      <span className="size-1.5 rounded-full bg-lime-400 animate-pulse shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                      <span className="text-zinc-200 group-hover:text-white font-semibold">
                        {todayFormatted}
                      </span>
                    </span>

                    <span className="text-zinc-600">·</span>

                    {/* Moving Calendar Toggle Icon */}
                    <div className="relative flex items-center justify-center">
                      <Calendar className="size-4 text-lime-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                      <PanelRightOpen
                        className={cn(
                          "size-3 text-lime-400 absolute -right-1 -bottom-1 transition-all duration-300 transform",
                          calendarCollapsed ? "rotate-0 opacity-75 group-hover:translate-x-0.5" : "rotate-180 opacity-100"
                        )}
                      />
                    </div>
                  </button>
                </CalbyTooltip>
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col z-10">
                <ScrollArea className={styles.messagesScroll}>
                  <div className={styles.messagesInner}>
                    {showEmpty ? (
                      /* Redesigned Clean Centered Empty State */
                      <div className={styles.emptyState}>

                        <div className={styles.emptyLogoWrap}>
                          <img
                            src="/logo.png"
                            alt="Calby logo"
                            className={styles.emptyLogoImg}
                          />
                        </div>
                        <h2 className={styles.emptyTitle}>Calby</h2>
                        <p className={styles.emptyTagline}>
                          Schedule, reschedule, and brief your day.
                        </p>
                        <p className={styles.emptyCopy}>
                          Connect Google Calendar, then ask Calby about your schedule.
                        </p>

                        {/* Prompt Suggestion Pills */}
                        <div className={styles.suggestionsWrap}>
                          <p className={styles.suggestionsLabel}>Suggested Prompts</p>
                          <div className={styles.suggestionsGrid}>
                            {SUGGESTIONS.map((currentSuggestionItem) => (
                              <button
                                key={currentSuggestionItem}
                                type="button"
                                onClick={() => sendMessage(currentSuggestionItem)}
                                className={styles.suggestionBtn}
                                disabled={running || loadingThread}
                              >
                                <span className={styles.suggestionDot} />
                                <span className="truncate">{currentSuggestionItem}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Chat Message History */
                      <div className={styles.messageList}>
                        {loadingThread ? (
                          <div className={styles.toolStatusCard}>
                            <LoaderCircle className="size-3.5 animate-spin text-lime-400" />
                            <span>Loading conversation...</span>
                          </div>
                        ) : (
                          messages.map((message, index) => {
                            if (message.id === "welcome" && messages.length > 1) {
                              return null;
                            }

                            if (message.role === "user") {
                              return (
                                <UserMessageItem
                                  key={message.id}
                                  messageId={message.id}
                                  content={message.content}
                                  onSave={(newContent) => {
                                    setMessages((current) =>
                                      current.map((m) =>
                                        m.id === message.id ? { ...m, content: newContent } : m,
                                      ),
                                    );
                                  }}
                                  onSubmit={(newContent) => {
                                    handleResubmitUserMessage(message.id, newContent);
                                  }}
                                />
                              );
                            }

                            const isLastAssistant =
                              message.role === "assistant" &&
                              index === messages.findLastIndex((m) => m.role === "assistant");

                            return (
                              <AssistantMessageItem
                                key={message.id}
                                messageId={message.id}
                                content={message.content}
                                isStreaming={!message.content && running}
                                isSystemError={message.role === "system"}
                                onRegenerate={isLastAssistant ? handleRegenerate : undefined}
                                onDeleteMessage={(id) => {
                                  setMessages((current) => current.filter((m) => m.id !== id));
                                }}
                                onConfirmAction={(toolId) => {
                                  sendMessage(`Confirm action for tool ${toolId}`);
                                }}
                                onOpenConnectCalendar={() => setGoogleCalendarOverlayOpen(true)}
                                onSendReport={(channel, _report, summaryLine) => {
                                  const channelLabel =
                                    channel === "gmail" ? "Gmail"
                                    : channel === "whatsapp" ? "WhatsApp"
                                    : "Telegram";
                                  sendMessage(
                                    `Yes, send the report via ${channelLabel}. confirmed=true, channel=${channel}`,
                                  );
                                }}
                              />
                            );
                          })
                        )}

                        {/* Subtle Tool Execution / Progress State */}
                        {progress && running ? (
                          <div className="flex items-center gap-2 pl-10">
                            <div className={styles.toolStatusCard}>
                              <span className={styles.toolStatusDot} />
                              <span>{sanitizeProgressMessage(progress)}</span>
                            </div>
                          </div>
                        ) : null}

                        <div ref={bottomRef} />
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Premium AI Command Bar Input */}
                <div className="relative z-30 p-4 border-t border-zinc-800/80 bg-[#0C0C0E]/95 overflow-visible">
                  <AIComposer
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onSubmit={onSubmit}
                    running={running}
                    calendarConnection={calendarConnection}
                    onConnectService={(serviceId) => {
                      if (serviceId === "google_calendar" || serviceId === "gmail") {
                        setGoogleCalendarOverlayOpen(true);
                      } else {
                        setActiveView("settings");
                      }
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Right: Resizable & Collapsible Calendar Panel (Desktop Persistent Column) */}
            <section
              className={cn(
                "hidden xl:flex shrink-0 flex-col overflow-hidden h-full border-l border-zinc-800/80 bg-[#0C0C0E] transition-all duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]",
                calendarCollapsed ? "w-0 border-l-0 opacity-0 pointer-events-none" : "opacity-100",
                isDraggingCalendar && "transition-none"
              )}
              style={{
                width: calendarCollapsed ? "0px" : `${calendarWidth}px`,
              }}
            >
              <div
                className="h-full flex flex-col"
                style={{ width: `${calendarWidth}px` }}
              >
                <CalendarPanel
                  sessionToken={sessionToken}
                  width={calendarWidth}
                  isCollapsed={calendarCollapsed}
                  onToggleCollapse={() => setCalendarCollapsed(true)}
                  isFullscreen={calendarFullscreen}
                  onToggleFullscreen={() => setCalendarFullscreen(true)}
                  onResizeStart={handleCalendarResizeStart}
                  isDragging={isDraggingCalendar}
                />
              </div>
            </section>
          </>
        )}
      </div>

      {/* Mobile / Tablet Slide-Over Calendar Drawer */}
      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end xl:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setCalendarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-full max-w-[340px] shadow-2xl animate-in slide-in-from-right duration-200">
            <CalendarPanel
              sessionToken={sessionToken}
              onClose={() => setCalendarOpen(false)}
              isMobileDrawer
            />
          </div>
        </div>
      )}

      {/* Google Calendar Native Workspace Overlay Window */}
      <GoogleCalendarOverlay
        isOpen={googleCalendarOverlayOpen}
        onClose={() => setGoogleCalendarOverlayOpen(false)}
        sessionToken={sessionToken}
      />

      {/* Profile Details Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Floating Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-[#14151B] px-4 py-2.5 text-xs text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="size-4 text-lime-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;
