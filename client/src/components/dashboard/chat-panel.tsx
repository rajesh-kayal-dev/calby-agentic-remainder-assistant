"use client";

import {
  ArrowUp,
  Bot,
  Calendar,
  LoaderCircle,
  Menu,
  MessageSquarePlus,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  listThreads,
  loadThread,
  streamAgentChat,
  ThreadSummary,
} from "@/lib/agent";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./markdown-message";
import { CalendarPanel } from "./calendar-panel";
import { CalendarWorkspace } from "./calendar/calendar-workspace";

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
    "flex h-12 shrink-0 items-center justify-between border-b border-zinc-800/60 bg-zinc-950/90 px-4 backdrop-blur-md sm:px-6",
  assistantHeaderText: "flex items-center gap-2",
  assistantTitle: "text-xs font-semibold tracking-tight text-white flex items-center gap-1.5",
  assistantPulseDot: "size-1.5 rounded-full bg-lime-400",
  assistantSubtitle: "hidden sm:inline text-xs text-zinc-400 font-light",

  messagesScroll: "h-full min-h-0 flex-1",
  messagesInner: "mx-auto w-full max-w-3xl px-4 py-6 sm:px-6",

  /* Empty State */
  emptyState:
    "flex min-h-[58vh] flex-col items-center justify-center text-center px-4 py-8",
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
  messageList: "space-y-6 pb-4",
  messageRow: "message-enter flex w-full min-w-0 gap-3",
  messageRowUser: "justify-end",
  messageRowAssistant: "justify-start items-start",
  assistantAvatar:
    "flex size-7 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-lime-400 shadow-sm mt-0.5",
  bubbleUser:
    "rounded-2xl rounded-tr-none bg-zinc-800/90 border border-zinc-700/80 px-4 py-3 text-zinc-100 text-sm leading-relaxed max-w-[85%] sm:max-w-lg shadow-sm",
  bubbleAssistant:
    "rounded-2xl rounded-tl-none bg-zinc-900/90 border border-zinc-800/90 p-4 text-zinc-200 text-sm leading-relaxed max-w-full sm:max-w-2xl shadow-md min-w-0 flex-1",
  bubbleSystem:
    "rounded-xl bg-red-950/30 border border-red-800/40 px-3.5 py-2 text-xs text-red-300",

  /* Tool Status Progress */
  toolStatusCard:
    "inline-flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800/90 px-3 py-1 text-xs text-zinc-300 shadow-sm",
  toolStatusDot: "size-2 rounded-full bg-lime-400 animate-pulse",

  /* Command Bar Input */
  composerWrap:
    "shrink-0 border-t border-zinc-800/80 bg-zinc-950/95 px-4 py-3 backdrop-blur-md sm:px-6",
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
  initialView?: "assistant" | "calendar";
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
  "What's on tomorrow?",
  "Find a free slot tomorrow morning",
  "Create a meeting",
];

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
  return msg;
}

function WelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: WELCOME_PROMPT,
  };
}

function ChatPanel({
  sessionToken,
  connections,
  footer,
  userLabel = "Rajesh",
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
  const [activeView, setActiveView] = useState<"assistant" | "calendar">(initialView);
  const [calendarWidth, setCalendarWidth] = useState<number>(380);
  const [calendarCollapsed, setCalendarCollapsed] = useState<boolean>(false);
  const [calendarFullscreen, setCalendarFullscreen] = useState<boolean>(false);
  const [isDraggingCalendar, setIsDraggingCalendar] = useState<boolean>(false);

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
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Could not reach the agent API",
        },
      ]);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

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

  const userInitial = userLabel ? userLabel.charAt(0).toUpperCase() : "U";

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
          <button
            type="button"
            onClick={() => setCalendarOpen((prev) => !prev)}
            className="flex xl:hidden items-center gap-1.5 px-2.5 py-1 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Toggle Calendar View"
          >
            <Calendar className="size-3.5 text-lime-400" />
            <span className="hidden sm:inline font-medium">Calendar</span>
          </button>

          <div className={styles.modelPill}>
            <span className={styles.modelDot} />
            <span>OpenAI · GPT-4o-mini</span>
          </div>

          <div className={styles.userChip}>
            <div className={styles.userAvatar}>{userInitial}</div>
            <span className="max-w-[120px] truncate font-medium hidden sm:inline">
              {userLabel}
            </span>
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

          {/* Connections Section */}
          <div className={styles.connectionsSection}>{connections}</div>

          <Separator className="bg-zinc-800/80" />

          {/* Chats Section */}
          <div className={styles.chatsSection}>
            <div className={styles.chatsHeader}>
              <span>Chats</span>
              <span className="text-[10px] text-zinc-500">
                {threads.length} {threads.length === 1 ? "chat" : "chats"}
              </span>
            </div>

            <ScrollArea className={styles.chatsScroll}>
              {threads.length === 0 ? (
                <p className={styles.chatsEmpty}>
                  No chats yet. Start one and it will show up here.
                </p>
              ) : filteredThreads.length === 0 ? (
                <p className={styles.chatsEmpty}>No chats matching search.</p>
              ) : (
                <div className={styles.threadList}>
                  {filteredThreads.map((thread) => {
                    const active = thread.id === threadId && activeView === "assistant";
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        disabled={running || loadingThread}
                        onClick={() => {
                          resumeThread(thread.id);
                          setActiveView("assistant");
                        }}
                        className={cn(
                          styles.threadBtn,
                          active ? styles.threadBtnActive : styles.threadBtnIdle,
                        )}
                      >
                        {active && <span className={styles.threadActiveBar} />}
                        <span
                          className={cn(
                            styles.threadTitle,
                            active && "pl-2 font-semibold text-white",
                          )}
                        >
                          {thread.title}
                        </span>
                        <span
                          className={cn(
                            styles.threadTime,
                            active && "pl-2 text-zinc-400",
                          )}
                        >
                          {thread.updatedAt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <Separator className="bg-zinc-800/80" />

          {/* User Footer */}
          <div className={styles.sidebarFooter}>{footer}</div>
        </aside>

        {/* Dynamic View: Calendar Workspace vs AI Assistant View */}
        {activeView === "calendar" ? (
          <div className="flex min-w-0 flex-1 overflow-hidden">
            <CalendarWorkspace
              sessionToken={sessionToken}
              userLabel={userLabel}
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
              <div className={styles.assistantHeader}>
                <div className={styles.assistantHeaderText}>
                  <span className={styles.assistantPulseDot} />
                  <p className={styles.assistantTitle}>Assistant</p>
                  <span className="text-zinc-600 hidden sm:inline">·</span>
                  <p className={styles.assistantSubtitle}>
                    Schedule, reschedule, and brief your day
                  </p>
                </div>

                {/* Reopen Calendar Button when collapsed on desktop */}
                {calendarCollapsed && (
                  <button
                    type="button"
                    onClick={() => setCalendarCollapsed(false)}
                    className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-zinc-800 bg-zinc-900/90 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all shadow-sm group animate-in fade-in duration-200"
                    aria-label="Open calendar"
                    title="Open calendar"
                  >
                    <PanelRightOpen className="size-3.5 text-lime-400 group-hover:scale-110 transition-transform" />
                    <span>Open Calendar</span>
                  </button>
                )}
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col">
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
                          messages.map((message) => {
                            if (message.id === "welcome" && messages.length > 1) {
                              return null;
                            }

                            if (message.role === "user") {
                              return (
                                <div
                                  key={message.id}
                                  className={cn(styles.messageRow, styles.messageRowUser)}
                                >
                                  <div className={styles.bubbleUser}>
                                    <p className="whitespace-pre-wrap">
                                      {message.content}
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  styles.messageRow,
                                  styles.messageRowAssistant,
                                )}
                              >
                                <div className={styles.assistantAvatar}>
                                  <Sparkles className="size-3.5 text-lime-400" />
                                </div>
                                <div
                                  className={cn(
                                    styles.bubbleAssistant,
                                    message.role === "system" && styles.bubbleSystem,
                                  )}
                                >
                                  {!message.content && running ? (
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                      <LoaderCircle className="size-3.5 animate-spin text-lime-400" />
                                      <span>Thinking...</span>
                                    </div>
                                  ) : (
                                    <MarkdownMessage
                                      content={message.content}
                                      tone={
                                        message.role === "system"
                                          ? "system"
                                          : "assistant"
                                      }
                                    />
                                  )}
                                </div>
                              </div>
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
                <div className={styles.composerWrap}>
                  <form onSubmit={onSubmit} className={styles.composerForm}>
                    <button
                      type="button"
                      onClick={() => {
                        if (SUGGESTIONS[0]) setPrompt(SUGGESTIONS[0]);
                      }}
                      className={styles.quickActionBtn}
                      title="Quick prompt"
                    >
                      <Plus className="size-4 text-zinc-400" />
                    </button>

                    <Textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      rows={1}
                      onKeyDown={onKeyDown}
                      disabled={running}
                      placeholder="Ask Calby about your calendar..."
                      className={styles.composerInput}
                    />

                    <Button
                      type="submit"
                      size="icon"
                      disabled={!prompt.trim() || running}
                      className={styles.sendBtn}
                      aria-label="Send Text Message"
                    >
                      {running ? (
                        <LoaderCircle className="size-4 animate-spin text-zinc-950" />
                      ) : (
                        <ArrowUp className="size-4 text-zinc-950 stroke-[2.5]" />
                      )}
                    </Button>
                  </form>
                  <p className={styles.composerHint}>
                    Ask about events, free slots, or schedule a Google Calendar meeting.
                  </p>
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
    </div>
  );
}

export default ChatPanel;
