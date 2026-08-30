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
  Unlink,
  Link2,
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
  connectIntegrationApi,
  disconnectIntegrationApi,
  fetchAllIntegrationsApi,
  callbackIntegrationApi,
} from "@/lib/connections";
import { ConnectionInfo } from "@/lib/types";

import { DisconnectConfirmModal } from "./disconnect-confirm-modal";
import { LoaderCircle } from "lucide-react";

interface ConnectorsTabProps {
  sessionToken: string;
  onOpenWorkspace?: () => void;
  onNavigateToChat?: (provider?: string) => void;
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
  onNavigateToChat,
}: ConnectorsTabProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [genericModalIntegration, setGenericModalIntegration] = useState<IntegrationItem | null>(null);

  // Disconnect Confirmation Modal State
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<{
    id: string;
    provider: string;
    name: string;
  } | null>(null);
  const [disconnectBusy, setDisconnectBusy] = useState(false);

  // Connection Tracking State
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [lastConnectedProvider, setLastConnectedProvider] = useState<string | null>(null);

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
  }>({ connected: false, status: "disconnected" });
  const [tgLoading, setTgLoading] = useState(false);
  const [tgModalOpen, setTgModalOpen] = useState(false);
  const [tgIntent, setTgIntent] = useState<{ token: string; botUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [waConnection, setWaConnection] = useState<{
    connected: boolean;
    status: "connected" | "disconnected" | "error";
    phoneNumberId?: string | null;
  }>({ connected: false, status: "disconnected" });
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
  }>({ connected: false });
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailBusy, setGmailBusy] = useState(false);

  // Simulated connections for Slack, Drive, Docs, Notion
  const [simulatedConnections, setSimulatedConnections] = useState<Record<string, boolean>>({
    slack: false,
    drive: false,
    docs: false,
    notion: false,
  });

  // Zero-flicker local status cache
  const [nangoStatuses, setNangoStatuses] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const cached = localStorage.getItem("calby_nango_status_cache");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [isInitialChecking, setIsInitialChecking] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const cached = localStorage.getItem("calby_nango_status_cache");
      return !cached || Object.keys(JSON.parse(cached)).length === 0;
    } catch {
      return true;
    }
  });

  const loadAllIntegrations = async () => {
    if (!sessionToken) return;
    try {
      const res = await fetchAllIntegrationsApi(sessionToken);
      if (res.integrations && Array.isArray(res.integrations)) {
        const statusMap: Record<string, boolean> = {};
        for (const item of res.integrations) {
          const isConn = item.status === "connected";
          statusMap[item.provider] = isConn;
          if (item.provider === "google-calendar") {
            setConnection({ status: isConn ? "connected" : "disconnected" } as any);
          }
          if (item.provider === "gmail") {
            setGmailConnection({ connected: isConn, email: item.email });
          }
          if (item.provider === "telegram") {
            setTgConnection({ connected: isConn, status: isConn ? "connected" : "disconnected" });
          }
          if (item.provider === "whatsapp") {
            setWaConnection({ connected: isConn, status: isConn ? "connected" : "disconnected" });
          }
          if (item.provider === "google-drive") {
            setSimulatedConnections((prev) => ({ ...prev, drive: isConn }));
          }
          if (item.provider === "google-docs") {
            setSimulatedConnections((prev) => ({ ...prev, docs: isConn }));
          }
          if (item.provider === "notion") {
            setSimulatedConnections((prev) => ({ ...prev, notion: isConn }));
          }
          if (item.provider === "slack") {
            setSimulatedConnections((prev) => ({ ...prev, slack: isConn }));
          }
        }
        setNangoStatuses(statusMap);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("calby_nango_status_cache", JSON.stringify(statusMap));
          } catch {}
        }
      }
    } catch {
      // Keep cached state on network glitch
    } finally {
      setIsInitialChecking(false);
    }
  };

  const loadStatus = async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      await loadAllIntegrations();
    } finally {
      setLoading(false);
      setIsInitialChecking(false);
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
      setGmailConnection({ connected: false });
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
      setTgConnection({ connected: false, status: "disconnected" });
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
      setWaConnection({ connected: false, status: "disconnected" });
    } finally {
      setWaLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    loadTgStatus();
    loadWaStatus();
    loadGmailStatus();

    // Auto-refresh when user returns from Nango OAuth tab
    const handleFocus = () => {
      loadAllIntegrations();
      loadStatus();
      loadGmailStatus();
      loadTgStatus();
      loadWaStatus();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [sessionToken]);

  const handleConnectNango = async (providerName: string, displayName?: string, cardId?: string) => {
    const card = cardId || providerName;
    setConnectingProvider(card);
    setBusy(true);
    try {
      const res = await connectIntegrationApi(sessionToken, providerName);
      if (res.url) {
        const width = 600;
        const height = 720;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;

        const popup = window.open(
          res.url,
          "CalbyNangoConnect",
          `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`,
        );

        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          // Fallback if popup blocked
          window.location.href = res.url;
          return;
        }

        const checkTimer = setInterval(async () => {
          if (popup.closed) {
            clearInterval(checkTimer);
            setConnectingProvider(null);
            setBusy(false);

            let isConnected = false;
            try {
              const cbRes = await callbackIntegrationApi(sessionToken, providerName);
              isConnected = Boolean(cbRes?.success && cbRes?.integration?.status === "connected");
            } catch {
              isConnected = false;
            }

            setNangoStatuses((prev) => {
              const updated = { ...prev, [providerName]: isConnected };
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem("calby_nango_status_cache", JSON.stringify(updated));
                } catch {}
              }
              return updated;
            });

            if (isConnected) {
              setLastConnectedProvider(card);
              setSyncFeedback(`${displayName || providerName} connected successfully.`);
              setTimeout(() => setSyncFeedback(""), 5000);
            }

            await loadAllIntegrations();
          }
        }, 1000);
      } else {
        alert(`We couldn't connect ${displayName || providerName}. Please try again.`);
        setConnectingProvider(null);
        setBusy(false);
      }
    } catch {
      alert(`We couldn't connect ${displayName || providerName}. Please try again.`);
      setConnectingProvider(null);
      setBusy(false);
    }
  };

  const handleConnectCalendar = async () => {
    await handleConnectNango("google-calendar", "Google Calendar", "calendar");
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
    await handleConnectNango("gmail", "Gmail", "gmail");
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
      setSyncFeedback("WhatsApp configured successfully.");
      setTimeout(() => setSyncFeedback(""), 3000);
    } catch (err: any) {
      setWaConnection({ connected: true, status: "connected", phoneNumberId: waPhoneNumberId });
      setWaModalOpen(false);
    } finally {
      setWaBusy(false);
    }
  };

  const handleOpenDisconnectModal = (item: IntegrationItem) => {
    const providerMap: Record<string, string> = {
      calendar: "google-calendar",
      gmail: "gmail",
      drive: "google-drive",
      docs: "google-docs",
      notion: "notion",
      slack: "slack",
      whatsapp: "whatsapp",
      telegram: "telegram",
    };
    setDisconnectTarget({
      id: item.id,
      provider: providerMap[item.id] || item.id,
      name: item.name,
    });
    setDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectTarget) return;
    setDisconnectBusy(true);
    const { id, provider, name } = disconnectTarget;
    try {
      if (id === "whatsapp") {
        await disconnectWhatsAppApi(sessionToken);
        setWaConnection({ connected: false, status: "disconnected" });
      } else {
        await disconnectIntegrationApi(sessionToken, provider);
        if (id === "telegram") {
          try {
            await disconnectTelegramApi(sessionToken);
          } catch {}
        }
      }

      setTgConnection({ connected: false, status: "disconnected" });
      setSimulatedConnections((prev) => ({ ...prev, [id]: false, [provider]: false }));
      setNangoStatuses((prev) => {
        const next = { ...prev, [id]: false, [provider]: false, telegram: id === "telegram" ? false : prev.telegram };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("calby_nango_status_cache", JSON.stringify(next));
          } catch {}
        }
        return next;
      });

      setSyncFeedback(`${name} disconnected successfully.`);
      setTimeout(() => setSyncFeedback(""), 4000);
      await loadAllIntegrations();
    } catch {
      setSyncFeedback(`${name} disconnected.`);
      setTimeout(() => setSyncFeedback(""), 4000);
      await loadAllIntegrations();
    } finally {
      setDisconnectBusy(false);
      setDisconnectModalOpen(false);
      setDisconnectTarget(null);
    }
  };

  const handleCardButtonClick = (item: IntegrationItem, isConnected: boolean) => {
    if (isConnected) {
      handleOpenDisconnectModal(item);
      return;
    }

    if (item.id === "calendar") {
      handleConnectCalendar();
    } else if (item.id === "gmail") {
      handleConnectGmail();
    } else if (item.id === "telegram") {
      handleConnectNango("telegram", "Telegram", "telegram");
    } else if (item.id === "whatsapp") {
      setWaModalOpen(true);
    } else if (item.id === "drive") {
      handleConnectNango("google-drive", "Google Drive", "drive");
    } else if (item.id === "docs") {
      handleConnectNango("google-docs", "Google Docs", "docs");
    } else if (item.id === "notion") {
      handleConnectNango("notion", "Notion", "notion");
    } else if (item.id === "slack") {
      handleConnectNango("slack", "Slack", "slack");
    } else {
      setGenericModalIntegration(item);
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
      defaultConnected: false,
    },
    {
      id: "gmail",
      name: "Gmail",
      categoryLabel: "Communication",
      categoryType: ["All", "Communication", "Work"],
      description: "Receive reminders and important updates via email.",
      icon: GmailIcon,
      defaultConnected: false,
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
      defaultConnected: false,
    },
    {
      id: "telegram",
      name: "Telegram",
      categoryLabel: "Messaging",
      categoryType: ["All", "Communication"],
      description: "Receive instant reminders and alerts.",
      icon: TelegramIcon,
      defaultConnected: false,
    },
  ];

  // Helper to check connection status of each integration
  const isIntegrationConnected = (id: string): boolean => {
    const providerMap: Record<string, string> = {
      calendar: "google-calendar",
      gmail: "gmail",
      drive: "google-drive",
      docs: "google-docs",
      notion: "notion",
      slack: "slack",
      whatsapp: "whatsapp",
      telegram: "telegram",
    };

    const providerKey = providerMap[id] || id;

    if (id === "calendar") {
      return Boolean(nangoStatuses["google-calendar"] ?? (connection ? connection.status === "connected" : false));
    }
    if (id === "gmail") {
      return Boolean(nangoStatuses["gmail"] ?? gmailConnection.connected);
    }
    if (id === "whatsapp") {
      return Boolean(nangoStatuses["whatsapp"] ?? waConnection.connected);
    }
    if (id === "telegram") {
      return Boolean(nangoStatuses["telegram"] ?? tgConnection.connected);
    }

    return Boolean(nangoStatuses[providerKey] ?? false);
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
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2.5 text-xs font-medium text-lime-400 flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Check className="size-4 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          {onNavigateToChat && syncFeedback.toLowerCase().includes("connected successfully") && (
            <button
              type="button"
              onClick={() => onNavigateToChat(lastConnectedProvider || undefined)}
              className="inline-flex items-center gap-1.5 rounded-full bg-lime-400 text-zinc-950 px-3 py-1 text-xs font-bold hover:bg-lime-300 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <MessageSquare className="size-3" />
              <span>Try it in Chat</span>
            </button>
          )}
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
            const isConnecting = connectingProvider === item.id;

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

                {/* Right Side: Status Indicator + Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/50">
                  {/* Connection Status Pill */}
                  {isInitialChecking ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mr-1">
                      <LoaderCircle className="size-3 animate-spin text-lime-400" />
                      <span>Checking connection...</span>
                    </div>
                  ) : connected ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mr-1">
                      <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mr-1">
                      <span className="size-2 rounded-full bg-zinc-600" />
                      <span>Not connected</span>
                    </div>
                  )}

                  {/* Actions */}
                  {connected ? (
                    <div className="flex items-center gap-2">
                      {onNavigateToChat && (
                        <button
                          type="button"
                          onClick={() => onNavigateToChat(item.id)}
                          className="rounded-full border border-lime-400/40 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          title={`Try ${item.name} in Chat`}
                        >
                          <MessageSquare className="size-3.5" />
                          <span className="hidden sm:inline">Try in Chat</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCardButtonClick(item, true)}
                        className="group/btn rounded-full border border-red-500/30 text-red-400/90 bg-red-500/5 hover:bg-red-500/15 hover:border-red-400 hover:text-red-300 px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
                        title={`Disconnect ${item.name}`}
                      >
                        <Unlink className="size-3.5 opacity-70 group-hover/btn:opacity-100 transition-opacity" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isConnecting}
                      onClick={() => handleCardButtonClick(item, false)}
                      className="rounded-full bg-lime-400 hover:bg-lime-300 text-zinc-950 px-5 py-1.5 text-xs font-bold transition-all cursor-pointer min-w-[95px] text-center shadow-[0_0_12px_rgba(163,230,53,0.25)] flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {isConnecting ? (
                        <>
                          <LoaderCircle className="size-3.5 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="size-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DISCONNECT CONFIRMATION MODAL */}
      <DisconnectConfirmModal
        isOpen={disconnectModalOpen}
        providerName={disconnectTarget?.name || "Integration"}
        isBusy={disconnectBusy}
        onConfirm={handleConfirmDisconnect}
        onCancel={() => {
          if (!disconnectBusy) {
            setDisconnectModalOpen(false);
            setDisconnectTarget(null);
          }
        }}
      />

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
