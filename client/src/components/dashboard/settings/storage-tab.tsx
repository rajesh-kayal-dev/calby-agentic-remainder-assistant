"use client";

import { useState, useEffect, useMemo } from "react";
import {
  HardDrive,
  Trash2,
  Check,
  AlertTriangle,
  LoaderCircle,
  Database,
  RefreshCw,
  X,
  Smartphone,
  Server,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@descope/nextjs-sdk/client";
import { fetchUserStorageApi, clearServerCacheApi, StorageStats } from "@/lib/storage";

export function StorageTab() {
  const { sessionToken } = useSession();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local Browser Cache Stats
  const [localCacheBytes, setLocalCacheBytes] = useState<number>(0);

  // Modal State
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const calculateLocalBrowserCache = () => {
    if (typeof window === "undefined") return;
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || "";
          totalBytes += (key.length + val.length) * 2; // UTF-16 approximation
        }
      }
      setLocalCacheBytes(totalBytes);
    } catch {
      setLocalCacheBytes(0);
    }
  };

  const loadStorage = async () => {
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserStorageApi(sessionToken);
      setStats(data);
      calculateLocalBrowserCache();
    } catch (err: any) {
      setError(err?.message || "Failed to calculate storage usage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, [sessionToken]);

  const handleConfirmClearCache = async () => {
    if (!sessionToken) return;
    setClearing(true);
    try {
      // Clear non-auth localStorage keys
      if (typeof window !== "undefined") {
        const keepPrefixes = ["descope", "session", "token"];
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !keepPrefixes.some((p) => key.toLowerCase().includes(p))) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }

      await clearServerCacheApi(sessionToken);
      await loadStorage();

      setClearModalOpen(false);
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to clear cache");
    } finally {
      setClearing(false);
    }
  };

  const formattedBrowserCache = useMemo(() => {
    if (localCacheBytes < 1024) return `${localCacheBytes} B`;
    if (localCacheBytes < 1024 * 1024) return `${(localCacheBytes / 1024).toFixed(1)} KB`;
    return `${(localCacheBytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [localCacheBytes]);

  if (loading) {
    return (
      <div className="space-y-4 w-full max-w-3xl select-none" role="status" aria-label="Loading storage stats">
        <div className="space-y-1.5">
          <div className="h-5 w-44 rounded bg-zinc-800 animate-pulse" />
          <div className="h-3 w-64 rounded bg-zinc-800/60 animate-pulse" />
        </div>

        <div className="rounded-2xl border border-zinc-800/90 bg-[#12131A] p-5 space-y-4">
          <div className="h-10 rounded-xl bg-zinc-800/60 animate-pulse" />
          <div className="h-3 rounded-full bg-zinc-800/60 animate-pulse" />
          <div className="space-y-2 pt-3">
            <div className="h-8 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-8 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-8 rounded-xl bg-zinc-800/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const usagePct = stats?.usagePercentage || 0;
  const isHigh = stats?.isHighUsage || usagePct >= 85;

  return (
    <div className="space-y-6 w-full select-none max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            Data & Storage
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitor real database storage usage, plan limits, and manage temporary browser cache.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadStorage}
          className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold px-3 cursor-pointer"
        >
          <RefreshCw className="size-3 mr-1 text-lime-400" />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {clearSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 p-3 text-xs font-semibold text-lime-400 animate-in fade-in duration-150">
          <Check className="size-4 shrink-0 stroke-[3]" />
          <span>Cache cleared successfully! Saved database records were preserved intact.</span>
        </div>
      )}

      {/* High Storage Warning Banner */}
      {isHigh && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 shadow-md">
          <AlertTriangle className="size-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-bold text-white">Storage limit nearly reached ({usagePct}%)</p>
            <p className="text-[11px] text-amber-200/80 mt-0.5">
              You are approaching your plan storage limit of {stats?.formattedLimit}. Clear temporary cache or upgrade your plan.
            </p>
          </div>
        </div>
      )}

      {/* 1. Main Workspace Storage Card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#12131A] p-5 space-y-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
              <HardDrive className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cloud Workspace Storage</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {stats?.formattedUsed} used of {stats?.formattedLimit} ({stats?.formattedRemaining} remaining)
              </p>
            </div>
          </div>

          <span
            className={`text-lg font-black ${
              usagePct >= 90 ? "text-rose-400" : usagePct >= 75 ? "text-amber-400" : "text-lime-400"
            }`}
          >
            {usagePct}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usagePct >= 90
                ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                : usagePct >= 75
                ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                : "bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.5)]"
            }`}
            style={{ width: `${Math.max(2, usagePct)}%` }}
          />
        </div>

        {/* Real Storage Category Breakdown */}
        <div className="space-y-3 pt-3 border-t border-zinc-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Database className="size-3.5 text-lime-400" />
            <span>Database Storage Breakdown</span>
          </span>

          <div className="space-y-2">
            {stats?.categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2 text-xs"
              >
                <span className="font-medium text-zinc-300">{cat.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{cat.formattedSize}</span>
                  <span className="text-[11px] font-semibold text-zinc-500 w-12 text-right">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Local Browser Cache Card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#12131A] p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Smartphone className="size-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Local Browser Cache</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Temporary offline data & UI states ({formattedBrowserCache})
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setClearModalOpen(true)}
            className="h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 font-bold text-xs px-3.5 shrink-0 cursor-pointer shadow-sm"
          >
            <Trash2 className="size-3.5 mr-1.5 text-rose-400" />
            <span>Clear Cache</span>
          </Button>
        </div>
      </div>

      {/* Clear Cache Confirmation Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#12131A] p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trash2 className="size-4 text-lime-400" />
                Clear Local Cache
              </h3>
              <button onClick={() => setClearModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This action will clear non-essential browser cache and temporary session files.
            </p>

            <div className="rounded-xl border border-lime-400/20 bg-lime-400/5 p-3 text-[11px] text-zinc-300 space-y-1">
              <p className="font-bold text-lime-400">What will NOT be deleted:</p>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                <li>Tasks, reminders & calendar events</li>
                <li>Money ledger entries & contact directory</li>
                <li>AI chat history & account preferences</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCache}
                disabled={clearing}
                className="rounded-xl bg-lime-400 px-5 py-2 text-xs font-bold text-black hover:bg-lime-300 disabled:opacity-50 cursor-pointer shadow-lg shadow-lime-400/20"
              >
                {clearing ? "Clearing..." : "Clear Cache Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
