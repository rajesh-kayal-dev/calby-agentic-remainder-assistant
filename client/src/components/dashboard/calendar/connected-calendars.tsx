"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  connectCalendar,
  fetchCalendarConnection,
  refreshCalendarConnection,
} from "@/lib/connections";
import { ConnectionInfo } from "@/lib/types";

type Props = {
  sessionToken: string;
  className?: string;
};

export function ConnectedCalendars({ sessionToken, className }: Props) {
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCalendarConnection(sessionToken);
      setConnection(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectCalendar(sessionToken);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setBusy(true);
    try {
      await refreshCalendarConnection(sessionToken);
      await loadStatus();
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  const isConnected = connection?.status === "connected";

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Connected Calendars
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={busy || loading}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md"
          title="Refresh connection status"
        >
          <RefreshCw
            className={cn("size-3", busy && "animate-spin text-lime-400")}
          />
        </button>
      </div>

      {loading ? (
        <div className="h-14 w-full animate-pulse rounded-xl bg-zinc-900/80 border border-zinc-800" />
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={cn(
                  "size-2.5 rounded-full shrink-0",
                  isConnected
                    ? "bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]"
                    : connection?.status === "pending"
                    ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                    : "bg-zinc-600"
                )}
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  Google Calendar
                </p>
                <p className="text-[11px] text-zinc-400">
                  {isConnected
                    ? "Live 2-Way Sync"
                    : connection?.status === "pending"
                    ? "Authorization Pending"
                    : "Not Connected"}
                </p>
              </div>
            </div>

            {/* Toggle / Connect Button */}
            {isConnected ? (
              <button
                type="button"
                onClick={handleConnect}
                disabled={busy}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-lime-400/40 bg-lime-400/20 transition-colors duration-200 ease-in-out focus:outline-none"
                title="Google Calendar is connected (Click to re-authenticate)"
              >
                <span className="translate-x-4 inline-block h-4 w-4 transform rounded-full bg-lime-400 shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={busy}
                className="rounded-lg bg-lime-400 px-2.5 py-1 text-[11px] font-semibold text-zinc-950 hover:bg-lime-300 transition-colors shadow-sm"
              >
                Connect
              </button>
            )}
          </div>

          {isConnected && (
            <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5 text-[10px] text-zinc-400">
              <CheckCircle2 className="size-3 text-lime-400" />
              <span>Events syncing with Calby AI</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
