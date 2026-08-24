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
} from "@/lib/connections";
import { ConnectionInfo } from "@/lib/types";

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

  useEffect(() => {
    loadStatus();
  }, [sessionToken]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectCalendar(sessionToken);
    } catch {
      console.error("Connect failed");
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
      console.error("Sync failed");
    } finally {
      setBusy(false);
    }
  };

  const connected = connection?.status === "connected";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Connectors & Integrations
          <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-xs font-semibold text-lime-400 uppercase">
            Calendar OAuth
          </span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Link your external calendar services to enable automated scheduling, conflict detection, and event syncing.
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
                      Connected
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

        {/* Outlook / Office 365 Connector (Placeholder) */}
        <div className="rounded-2xl border border-zinc-800/60 bg-[#101012]/60 p-5 opacity-75">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Calendar className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Microsoft Outlook / 365
                  </h3>
                  <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Office 365 Enterprise & Personal Outlook integration.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-500 text-xs font-medium px-3"
            >
              Unavailable
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
