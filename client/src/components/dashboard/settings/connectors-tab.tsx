"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, Calendar, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GoogleCalendarLogo } from "@/components/ui/google-calendar-logo";
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
import { Send, Copy, CheckCircle2, MessageSquare } from "lucide-react";

interface ConnectorsTabProps {
  sessionToken: string;
  onOpenWorkspace?: () => void;
}

export function ConnectorsTab({
  sessionToken,
  onOpenWorkspace,
}: ConnectorsTabProps) {
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
  const [tgLoading, setTgLoading] = useState(true);
  const [tgModalOpen, setTgModalOpen] = useState(false);
  const [tgIntent, setTgIntent] = useState<{ token: string; botUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [waConnection, setWaConnection] = useState<{
    connected: boolean;
    status: "connected" | "disconnected" | "error";
    phoneNumberId?: string | null;
    displayPhoneNumber?: string | null;
    businessAccountId?: string | null;
  }>({ connected: false, status: "disconnected" });
  const [waLoading, setWaLoading] = useState(true);
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
  const [gmailLoading, setGmailLoading] = useState(true);
  const [gmailBusy, setGmailBusy] = useState(false);

  const loadStatus = async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const data = await fetchCalendarConnection(sessionToken);
      setConnection(data);
    } catch {
      setConnection(null);
    } finally {
      setLoading(false);
    }
  };

  const loadGmailStatus = async () => {
    if (!sessionToken) return;
    setGmailLoading(true);
    try {
      const res = await fetchGmailStatusApi(sessionToken);
      setGmailConnection(res.connection);
    } catch {
      setGmailConnection({ connected: false });
    } finally {
      setGmailLoading(false);
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
      await loadGmailStatus();
    } catch (err: any) {
      alert(err?.message || "Failed to disconnect Gmail");
    } finally {
      setGmailBusy(false);
    }
  };

  const loadTgStatus = async () => {
    if (!sessionToken) return;
    setTgLoading(true);
    try {
      const res = await fetchTelegramStatusApi(sessionToken);
      setTgConnection(res.connection);
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
      setWaConnection(res.connection);
      if (res.connection.phoneNumberId) {
        setWaPhoneNumberId(res.connection.phoneNumberId);
      }
      if (res.connection.businessAccountId) {
        setWaBusinessAccountId(res.connection.businessAccountId);
      }
      if (res.connection.displayPhoneNumber) {
        setWaDisplayPhoneNumber(res.connection.displayPhoneNumber);
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
  }, [sessionToken]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectCalendar(sessionToken);
    } catch {
      // Connect error handled gracefully
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setBusy(true);
    try {
      await refreshCalendarConnection(sessionToken);
      await loadStatus();
      setSyncFeedback("Google Calendar synchronized successfully.");
      setTimeout(() => setSyncFeedback(""), 3000);
    } catch {
      // Refresh error handled gracefully
    } finally {
      setBusy(false);
    }
  };

  const handleStartTgConnect = async () => {
    try {
      const res = await createTelegramIntentApi(sessionToken);
      setTgIntent(res);
      setTgModalOpen(true);
    } catch {
      // Start telegram connection failure handled
    }
  };

  const handleTgDisconnect = async () => {
    try {
      await disconnectTelegramApi(sessionToken);
      await loadTgStatus();
    } catch {
      // Disconnect error handled
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
      await loadWaStatus();
      setWaModalOpen(false);
      setWaAccessToken("");
    } catch (err: any) {
      setWaError(err?.message || "Failed to configure WhatsApp");
    } finally {
      setWaBusy(false);
    }
  };

  const handleWaDisconnect = async () => {
    try {
      await disconnectWhatsAppApi(sessionToken);
      await loadWaStatus();
    } catch {
      // Disconnect error handled
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connected = connection?.status === "connected";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Connectors & Integrations
          <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-xs font-semibold text-lime-400 uppercase">
            Calendar & Messaging
          </span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Link external calendar and messaging channels to enable automated scheduling and alerts.
        </p>
      </div>

      {/* Connectors List */}
      <div className="space-y-4">
        {/* Google Calendar Card */}
        <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <GoogleCalendarLogo className="size-6" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Google Calendar
                  </h3>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-lime-400/30 bg-lime-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-lime-400">
                      <span className="size-1.5 rounded-full bg-lime-400 animate-pulse" />
                      Connected {connection?.email ? `• ${connection.email}` : ""}
                    </span>
                  ) : connection?.requiresUpgrade ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                      Needs Permission {connection?.email ? `• ${connection.email}` : ""}
                    </span>
                  ) : connection?.status === "error" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400">
                      Connection Error {connection?.email ? `• ${connection.email}` : ""}
                    </span>
                  ) : loading ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      <RefreshCcw className="size-3 animate-spin text-zinc-400" />
                      Checking status...
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Direct two-way synchronization for events, availability checks, and AI scheduling.
                </p>
              </div>
            </div>

            {/* Main Connection Action */}
            <div className="flex items-center gap-2 shrink-0">
              {connected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={handleRefresh}
                    className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium px-3"
                  >
                    <RefreshCcw
                      className={cn("size-3.5 mr-1.5", busy && "animate-spin text-lime-400")}
                    />
                    <span>{busy ? "Syncing..." : "Sync Now"}</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleConnect}
                    className="h-8 rounded-xl border border-zinc-700/80 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white text-xs font-medium px-3"
                  >
                    <span>Reconnect</span>
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={handleConnect}
                  className="h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs px-4"
                >
                  <span>Connect Google Calendar</span>
                </Button>
              )}
            </div>
          </div>

          {syncFeedback && (
            <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs font-medium text-lime-400 flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="size-4 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Quick Actions Footer */}
          {connected && onOpenWorkspace && (
            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-medium">
                Primary Calendar Workspace
              </span>
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-400 hover:text-lime-300 transition-colors"
              >
                <span>Open Calendar Workspace</span>
                <ExternalLink className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Gmail Notifications Card */}
        <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm">
                M
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Gmail Notifications
                  </h3>
                  {gmailConnection.connected ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-lime-400/30 bg-lime-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-lime-400">
                      <span className="size-1.5 rounded-full bg-lime-400 animate-pulse" />
                      Connected • {gmailConnection.email}
                    </span>
                  ) : gmailLoading ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      <RefreshCcw className="size-3 animate-spin text-zinc-400" />
                      Checking...
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Send Calby reminder notifications through your connected Gmail account via Google OAuth 2.0.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {gmailConnection.connected ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={gmailBusy}
                  onClick={handleDisconnectGmail}
                  className="h-8 rounded-xl border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs font-semibold px-3"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={gmailBusy}
                  onClick={handleConnectGmail}
                  className="h-8 rounded-xl bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 text-xs px-3 shadow-[0_0_15px_rgba(163,230,53,0.2)]"
                >
                  <ExternalLink className="size-3.5 mr-1.5" />
                  <span>Connect Gmail</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Send className="size-6" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Telegram Bot Notifications
                  </h3>
                  {tgConnection.connected ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-lime-400/30 bg-lime-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-lime-400">
                      <span className="size-1.5 rounded-full bg-lime-400 animate-pulse" />
                      Connected {tgConnection.username ? `(@${tgConnection.username})` : ""}
                    </span>
                  ) : tgLoading ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      <RefreshCcw className="size-3 animate-spin text-zinc-400" />
                      Checking status...
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Receive instant reminder alerts directly in your personal Telegram app via Calby Bot.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {tgConnection.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTgDisconnect}
                  className="h-8 rounded-xl border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium px-3"
                >
                  Disconnect Telegram
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleStartTgConnect}
                  className="h-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs px-4"
                >
                  <span>Connect Telegram</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Business API Card */}
        <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <MessageSquare className="size-6" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    WhatsApp Business API
                  </h3>
                  {waConnection.connected ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-lime-400/30 bg-lime-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-lime-400">
                      <span className="size-1.5 rounded-full bg-lime-400 animate-pulse" />
                      Configured (ID: {waConnection.phoneNumberId})
                    </span>
                  ) : waLoading ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      <RefreshCcw className="size-3 animate-spin text-zinc-400" />
                      Checking status...
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      Not Configured
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure WhatsApp Cloud API credentials to prepare your account for WhatsApp reminder dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {waConnection.connected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWaModalOpen(true)}
                    className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-medium px-3"
                  >
                    Edit Config
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWaDisconnect}
                    className="h-8 rounded-xl border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium px-3"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setWaModalOpen(true)}
                  className="h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs px-4"
                >
                  Configure WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Telegram Connection Modal */}
      {tgModalOpen && tgIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Send className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Connect Telegram Bot</h3>
              </div>
              <button
                onClick={() => setTgModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-medium"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Open the Calby Telegram Bot and press <strong>Start</strong> to complete pairing:
            </p>

            <div className="space-y-3">
              <a
                href={tgIntent.botUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs py-2.5 transition-colors"
              >
                <span>Open in Telegram</span>
                <ExternalLink className="size-3.5" />
              </a>

              <div className="relative flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-300">
                <code className="font-mono text-lime-400">/start {tgIntent.token}</code>
                <button
                  onClick={() => handleCopy(`/start ${tgIntent.token}`)}
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
              <span>Token expires in 10 minutes</span>
              <button
                onClick={() => {
                  loadTgStatus();
                  setTgModalOpen(false);
                }}
                className="text-lime-400 hover:underline"
              >
                I&apos;ve pressed Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Configuration Modal */}
      {waModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveWaConfig}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <MessageSquare className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Configure WhatsApp Cloud API</h3>
              </div>
              <button
                type="button"
                onClick={() => setWaModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-medium"
              >
                Cancel
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
                  Stored securely using AES-256-GCM encryption. Never returned over APIs.
                </p>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Business Account ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 102938475610293"
                  value={waBusinessAccountId}
                  onChange={(e) => setWaBusinessAccountId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Display Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1 555 019 2831"
                  value={waDisplayPhoneNumber}
                  onChange={(e) => setWaDisplayPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWaModalOpen(false)}
                className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-400 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={waBusy}
                className="h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs px-4"
              >
                {waBusy ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
