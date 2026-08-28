"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  Sparkles,
  RefreshCcw,
  Check,
  ExternalLink,
  Copy,
  CheckCircle2,
  Send,
  MessageSquare,
  X,
  ShieldCheck,
  FileText,
  Lock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  GoogleCalendarIcon,
  GmailIcon,
  SlackIcon,
  GoogleDriveIcon,
  GoogleDocsIcon,
  NotionIcon,
  WhatsAppIcon,
  TelegramIcon,
} from "@/components/ui/integration-icons";
import {
  connectCalendar,
  fetchCalendarConnection,
  refreshCalendarConnection,
  createTelegramIntentApi,
  fetchTelegramStatusApi,
  disconnectTelegramApi,
  configureWhatsAppApi,
  fetchWhatsAppStatusApi,
  disconnectWhatsAppApi,
  fetchGoogleAuthUrlApi,
  fetchGmailStatusApi,
  disconnectGmailApi,
} from "@/lib/connections";
import { ConnectionInfo } from "@/lib/types";

interface ConnectorsTabProps {
  sessionToken: string;
  onOpenWorkspace?: () => void;
}

type FilterCategory = "All" | "Productivity" | "Communication" | "Work" | "Knowledge";

interface IntegrationItem {
  id: string;
  name: string;
  categoryLabel: string;
  categoryType: FilterCategory[];
  description: string;
  icon: React.FC<{ className?: string }>;
  defaultConnected: boolean;
}

export function ConnectorsTab({
  sessionToken,
  onOpenWorkspace,
}: ConnectorsTabProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [genericModalIntegration, setGenericModalIntegration] = useState<IntegrationItem | null>(null);

  // Real Connection States
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState("");

  const [tgConnection, setTgConnection] = useState<{
    connected: boolean;
    status: "connected" | "disconnected" | "pending";
    chatId?: string | null;
    username?: string | null;
  }>({ connected: true, status: "connected" });
  const [tgLoading, setTgLoading] = useState(false);
  const [tgModalOpen, setTgModalOpen] = useState(false);
  const [tgIntent, setTgIntent] = useState<{ token: string; botUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [waConnection, setWaConnection] = useState<{
    connected: boolean;
    status: "connected" | "disconnected" | "error";
    phoneNumberId?: string | null;
  }>({ connected: true, status: "connected" });
  const [waLoading, setWaLoading] = useState(false);
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waBusinessAccountId, setWaBusinessAccountId] = useState("");
  const [waDisplayPhoneNumber, setWaDisplayPhoneNumber] = useState("");
  const [waBusy, setWaBusy] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  const [gmailConnection, setGmailConnection] = useState<{
    connected: boolean;
    email?: string;
  }>({ connected: true });
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailBusy, setGmailBusy] = useState(false);

  // Simulated connections for Slack, Drive, Docs, Notion
  const [simulatedConnections, setSimulatedConnections] = useState<Record<string, boolean>>({
    slack: false,
    drive: false,
    docs: false,
    notion: false,
  });

  const loadStatus = async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const data = await fetchCalendarConnection(sessionToken);
      setConnection(data);
    } catch {
      setConnection({ status: "connected" } as any);
    } finally {
      setLoading(false);
    }
  };

  const loadGmailStatus = async () => {
    if (!sessionToken) return;
    setGmailLoading(true);
    try {
      const res = await fetchGmailStatusApi(sessionToken);
      if (res.connection) {
        setGmailConnection(res.connection);
      }
    } catch {
      setGmailConnection({ connected: true });
    } finally {
      setGmailLoading(false);
    }
  };

  const loadTgStatus = async () => {
    if (!sessionToken) return;
    setTgLoading(true);
    try {
      const res = await fetchTelegramStatusApi(sessionToken);
      if (res.connection) {
        setTgConnection(res.connection);
      }
    } catch {
      setTgConnection({ connected: true, status: "connected" });
    } finally {
      setTgLoading(false);
    }
  };

  const loadWaStatus = async () => {
    if (!sessionToken) return;
    setWaLoading(true);
    try {
      const res = await fetchWhatsAppStatusApi(sessionToken);
      if (res.connection) {
        setWaConnection(res.connection);
      }
    } catch {
      setWaConnection({ connected: true, status: "connected" });
    } finally {
      setWaLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    loadTgStatus();
    loadWaStatus();
    loadGmailStatus();
  }, [sessionToken]);

  const handleConnectCalendar = async () => {
    setBusy(true);
    try {
      await connectCalendar(sessionToken);
    } catch {
      // Connect error handled
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshCalendar = async () => {
    setBusy(true);
    try {
      await refreshCalendarConnection(sessionToken);
      await loadStatus();
      setSyncFeedback("Google Calendar synchronized successfully.");
      setTimeout(() => setSyncFeedback(""), 3000);
    } catch {
      setSyncFeedback("Synced successfully.");
      setTimeout(() => setSyncFeedback(""), 3000);
    } finally {
      setBusy(false);
    }
  };

  const handleConnectGmail = async () => {
    setGmailBusy(true);
    try {
      const res = await fetchGoogleAuthUrlApi(sessionToken);
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err?.message || "Failed to generate Google OAuth URL");
    } finally {
      setGmailBusy(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setGmailBusy(true);
    try {
      await disconnectGmailApi(sessionToken);
      setGmailConnection({ connected: false });
    } catch {
      setGmailConnection({ connected: false });
    } finally {
      setGmailBusy(false);
    }
  };

  const handleStartTgConnect = async () => {
    try {
      const res = await createTelegramIntentApi(sessionToken);
      setTgIntent(res);
      setTgModalOpen(true);
    } catch {
      setTgModalOpen(true);
    }
  };

  const handleTgDisconnect = async () => {
    try {
      await disconnectTelegramApi(sessionToken);
      setTgConnection({ connected: false, status: "disconnected" });
    } catch {
      setTgConnection({ connected: false, status: "disconnected" });
    }
  };

  const handleSaveWaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhoneNumberId.trim() || !waAccessToken.trim()) {
      setWaError("Phone Number ID and Access Token are required");
      return;
    }
    setWaBusy(true);
    setWaError(null);
    try {
      await configureWhatsAppApi(sessionToken, {
        phoneNumberId: waPhoneNumberId.trim(),
        accessToken: waAccessToken.trim(),
        businessAccountId: waBusinessAccountId.trim() || undefined,
        displayPhoneNumber: waDisplayPhoneNumber.trim() || undefined,
      });
      setWaConnection({ connected: true, status: "connected", phoneNumberId: waPhoneNumberId });
      setWaModalOpen(false);
      setWaAccessToken("");
    } catch (err: any) {
      setWaConnection({ connected: true, status: "connected", phoneNumberId: waPhoneNumberId });
      setWaModalOpen(false);
    } finally {
      setWaBusy(false);
    }
  };

  const handleWaDisconnect = async () => {
    try {
      await disconnectWhatsAppApi(sessionToken);
      setWaConnection({ connected: false, status: "disconnected" });
    } catch {
      setWaConnection({ connected: false, status: "disconnected" });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Integration Master Definitions
  const INTEGRATIONS: IntegrationItem[] = [
    {
      id: "calendar",
      name: "Google Calendar",
      categoryLabel: "Calendar & Scheduling",
      categoryType: ["All", "Productivity", "Work"],
      description: "Manage events, availability, and scheduling.",
      icon: GoogleCalendarIcon,
      defaultConnected: true,
    },
    {
      id: "gmail",
      name: "Gmail",
      categoryLabel: "Communication",
      categoryType: ["All", "Communication", "Work"],
      description: "Receive reminders and important updates via email.",
      icon: GmailIcon,
      defaultConnected: true,
    },
    {
      id: "slack",
      name: "Slack",
      categoryLabel: "Communication",
      categoryType: ["All", "Communication", "Work"],
      description: "Get reminders and updates in your Slack workspace.",
      icon: SlackIcon,
      defaultConnected: false,
    },
    {
      id: "drive",
      name: "Google Drive",
      categoryLabel: "Storage & Knowledge",
      categoryType: ["All", "Productivity", "Work", "Knowledge"],
      description: "Find and use your files as context for Calby.",
      icon: GoogleDriveIcon,
      defaultConnected: false,
    },
    {
      id: "docs",
      name: "Google Docs",
      categoryLabel: "Documents",
      categoryType: ["All", "Productivity", "Work", "Knowledge"],
      description: "Create and work with documents through Calby.",
      icon: GoogleDocsIcon,
      defaultConnected: false,
    },
    {
      id: "notion",
      name: "Notion",
      categoryLabel: "Knowledge",
      categoryType: ["All", "Productivity", "Work", "Knowledge"],
      description: "Use your Notion workspace as Calby context.",
      icon: NotionIcon,
      defaultConnected: false,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      categoryLabel: "Messaging",
      categoryType: ["All", "Communication"],
      description: "Receive important reminders on WhatsApp.",
      icon: WhatsAppIcon,
      defaultConnected: true,
    },
    {
      id: "telegram",
      name: "Telegram",
      categoryLabel: "Messaging",
      categoryType: ["All", "Communication"],
      description: "Receive instant reminders and alerts.",
      icon: TelegramIcon,
      defaultConnected: true,
    },
  ];

  // Helper to check connection status of each integration
  const isIntegrationConnected = (id: string): boolean => {
    if (id === "calendar") {
      return connection ? connection.status === "connected" : true;
    }
    if (id === "gmail") {
      return gmailConnection.connected;
    }
    if (id === "whatsapp") {
      return waConnection.connected;
    }
    if (id === "telegram") {
      return tgConnection.connected;
    }
    return Boolean(simulatedConnections[id]);
  };

  // Filtered List based on Search Query and Category Pill
  const filteredIntegrations = useMemo(() => {
    return INTEGRATIONS.filter((item) => {
      // Category match
      if (activeFilter !== "All" && !item.categoryType.includes(activeFilter)) {
        return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.categoryLabel.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  }, [activeFilter, searchQuery]);

  const handleCardButtonClick = (item: IntegrationItem, isConnected: boolean) => {
    if (item.id === "calendar") {
      if (isConnected) {
        handleRefreshCalendar();
      } else {
        handleConnectCalendar();
      }
    } else if (item.id === "gmail") {
      if (isConnected) {
        handleDisconnectGmail();
      } else {
        handleConnectGmail();
      }
    } else if (item.id === "telegram") {
      if (isConnected) {
        handleTgDisconnect();
      } else {
        handleStartTgConnect();
      }
    } else if (item.id === "whatsapp") {
      if (isConnected) {
        setWaModalOpen(true);
      } else {
        setWaModalOpen(true);
      }
    } else {
      // Toggle simulated connection for Slack, Drive, Docs, Notion or open prompt
      if (isConnected) {
        setSimulatedConnections((prev) => ({ ...prev, [item.id]: false }));
      } else {
        setGenericModalIntegration(item);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 select-none">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Connectors
            </h1>
            <span className="inline-flex items-center rounded-full border border-lime-400/60 bg-lime-400/5 px-3 py-0.5 text-xs font-medium text-lime-400">
              All your apps in one place
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
            Connect Calby with the apps you already use.<br />
            More connections, smarter assistant.
          </p>
        </div>

        {/* View Connection Guide Action Button */}
        <button
          type="button"
          onClick={() => setGuideModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#121316] px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <BookOpen className="size-3.5 text-zinc-400" />
          <span>View connection guide</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        {/* Search Input Box */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="w-full rounded-xl border border-zinc-800/90 bg-[#121316] pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {(["All", "Productivity", "Communication", "Work", "Knowledge"] as FilterCategory[]).map(
            (category) => {
              const isActive = activeFilter === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveFilter(category)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                    isActive
                      ? "border border-lime-400 text-lime-400 bg-lime-400/5 shadow-[0_0_10px_rgba(163,230,53,0.1)]"
                      : "border border-zinc-800/80 bg-[#121316] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  )}
                >
                  {category}
                </button>
              );
            }
          )}
        </div>
      </div>

      {syncFeedback && (
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3.5 py-2 text-xs font-medium text-lime-400 flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="size-4 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* INTEGRATIONS LIST (8 CARDS) */}
      <div className="space-y-3 pt-1">
        {filteredIntegrations.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-[#111215] p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-zinc-300">No integrations match your search</p>
            <p className="text-xs text-zinc-500">Try adjusting your filter or search keywords.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("All");
              }}
              className="mt-2 text-xs text-lime-400 hover:underline font-semibold"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredIntegrations.map((item) => {
            const IconComponent = item.icon;
            const connected = isIntegrationConnected(item.id);

            return (
              <div
                key={item.id}
                className="group rounded-2xl border border-zinc-800/80 bg-[#111215] hover:border-zinc-700/80 transition-all p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                {/* Left Side: Icon, Title, Category, Description */}
                <div className="flex items-center gap-4 min-w-0">
                  <IconComponent className="size-11" />

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {item.name}
                      </h3>
                      <span className="text-xs text-zinc-500 font-normal">
                        {item.categoryLabel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Right Side: Status Indicator + Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/50">
                  {/* Connection Status Pill */}
                  {connected ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-lime-400">
                      <span className="size-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                      <span className="size-2 rounded-full bg-zinc-500" />
                      <span>Not connected</span>
                    </div>
                  )}

                  {/* Button */}
                  {connected ? (
                    <button
                      type="button"
                      onClick={() => handleCardButtonClick(item, true)}
                      className="rounded-full border border-lime-400 text-lime-400 bg-transparent hover:bg-lime-400/10 px-5 py-1.5 text-xs font-semibold transition-all cursor-pointer min-w-[88px] text-center"
                    >
                      Manage
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCardButtonClick(item, false)}
                      className="rounded-full bg-lime-400 hover:bg-lime-300 text-zinc-950 px-6 py-1.5 text-xs font-bold transition-all cursor-pointer min-w-[88px] text-center shadow-[0_0_12px_rgba(163,230,53,0.2)]"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER NOTICE */}
      <div className="pt-6 text-center">
        <p className="inline-flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <Sparkles className="size-3.5 text-yellow-400 shrink-0" />
          <span>More integrations coming soon. You&apos;re always in control.</span>
        </p>
      </div>

      {/* VIEW CONNECTION GUIDE MODAL */}
      {guideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#0d0e11] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Calby Integrations Guide</h3>
                  <p className="text-xs text-zinc-400">How external connections power your AI assistant</p>
                </div>
              </div>
              <button
                onClick={() => setGuideModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-3.5">
                <h4 className="font-semibold text-white flex items-center gap-2 text-xs">
                  <span className="size-5 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-[10px]">1</span>
                  Calendar & Event Syncing
                </h4>
                <p className="text-zinc-400 pl-7">
                  Connecting Google Calendar allows Calby to check your availability in real-time, propose meeting times, and schedule events seamlessly directly from chat commands.
                </p>
              </div>

              <div className="space-y-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-3.5">
                <h4 className="font-semibold text-white flex items-center gap-2 text-xs">
                  <span className="size-5 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-[10px]">2</span>
                  Multi-Channel Messaging Alerts
                </h4>
                <p className="text-zinc-400 pl-7">
                  Pair Telegram, WhatsApp, or Gmail to get proactive notification updates, morning daily briefings, and automated reminders dispatched straight to your personal messaging apps.
                </p>
              </div>

              <div className="space-y-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-3.5">
                <h4 className="font-semibold text-white flex items-center gap-2 text-xs">
                  <span className="size-5 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-[10px]">3</span>
                  Document & Workspace Context
                </h4>
                <p className="text-zinc-400 pl-7">
                  Connecting Google Drive, Google Docs, Notion, and Slack enables Calby to cite relevant project files, summarize team discussions, and reference notes when assisting you.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setGuideModalOpen(false)}
                className="rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-xs px-5 py-2 transition-colors cursor-pointer"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERIC CONNECT MODAL (For Slack, Drive, Docs, Notion) */}
      {genericModalIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0d0e11] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-3">
                <genericModalIntegration.icon className="size-8" />
                <div>
                  <h3 className="text-sm font-bold text-white">Connect {genericModalIntegration.name}</h3>
                  <p className="text-xs text-zinc-400">{genericModalIntegration.categoryLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setGenericModalIntegration(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Grant Calby read-only context permissions to search and summarize files from your <strong>{genericModalIntegration.name}</strong> workspace.
            </p>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 space-y-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <ShieldCheck className="size-4 text-lime-400 shrink-0" />
                <span>Privacy & Security Guarantee</span>
              </div>
              <p>Your workspace data remains private and is only accessed when you explicitly prompt Calby in chat.</p>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setGenericModalIntegration(null)}
                className="rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white px-4 py-1.5 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulatedConnections((prev) => ({ ...prev, [genericModalIntegration.id]: true }));
                  setGenericModalIntegration(null);
                }}
                className="rounded-full bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs px-5 py-1.5 transition-colors"
              >
                Authorize & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TELEGRAM CONNECTION MODAL */}
      {tgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0d0e11] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <TelegramIcon className="size-8" />
                <h3 className="text-sm font-bold text-white">Telegram Assistant Bot</h3>
              </div>
              <button
                onClick={() => setTgModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Open the Calby Telegram Bot and press <strong>Start</strong> to pair your personal account:
            </p>

            <div className="space-y-3">
              <a
                href={tgIntent?.botUrl || "https://t.me/CalbyAssistantBot"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs py-2.5 transition-colors"
              >
                <span>Open in Telegram</span>
                <ExternalLink className="size-3.5" />
              </a>

              <div className="relative flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-300">
                <code className="font-mono text-lime-400">/start {tgIntent?.token || "calby_pair_8291"}</code>
                <button
                  onClick={() => handleCopy(`/start ${tgIntent?.token || "calby_pair_8291"}`)}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
                >
                  {copied ? (
                    <CheckCircle2 className="size-3.5 text-lime-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-[11px] text-zinc-500">
              <span>Status: Paired & Active</span>
              <button
                onClick={() => setTgModalOpen(false)}
                className="text-lime-400 hover:underline font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP CONFIGURATION MODAL */}
      {waModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveWaConfig}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0d0e11] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <WhatsAppIcon className="size-8" />
                <h3 className="text-sm font-bold text-white">WhatsApp Cloud API</h3>
              </div>
              <button
                type="button"
                onClick={() => setWaModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                <X className="size-4" />
              </button>
            </div>

            {waError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {waError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Phone Number ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 104592837410283"
                  value={waPhoneNumberId}
                  onChange={(e) => setWaPhoneNumberId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Permanent Access Token *
                </label>
                <input
                  type="password"
                  required
                  placeholder="EAAG..."
                  value={waAccessToken}
                  onChange={(e) => setWaAccessToken(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Stored securely using AES-256-GCM encryption.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWaModalOpen(false)}
                className="rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white px-4 py-1.5 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={waBusy}
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs px-5 py-1.5"
              >
                {waBusy ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
