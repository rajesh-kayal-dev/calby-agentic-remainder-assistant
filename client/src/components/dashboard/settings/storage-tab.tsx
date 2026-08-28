"use client";

import { useState, useEffect } from "react";
import { HardDrive, Trash2, Check, RefreshCcw, Database, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

export function StorageTab() {
  const [usedMb, setUsedMb] = useState(42.8);
  const totalMb = 500;
  const [clearing, setClearing] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Calculate remaining and percentage
  const remainingMb = (totalMb - usedMb).toFixed(1);
  const percentage = Math.min(100, Math.max(0, (usedMb / totalMb) * 100)).toFixed(1);

  // Small Usage Breakdown
  const breakdown = [
    { label: "Chat & AI Conversation History", sizeMb: "24.2 MB", pct: "56.5%" },
    { label: "Connected Apps Metadata & Cache", sizeMb: "12.6 MB", pct: "29.4%" },
    { label: "Tasks & Reminders Storage", sizeMb: "6.0 MB", pct: "14.1%" },
  ];

  const handleClearCache = () => {
    setClearing(true);
    setTimeout(() => {
      // Clear localStorage items if present
      try {
        if (typeof window !== "undefined") {
          const keysToKeep = ["user", "token", "session"];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !keysToKeep.includes(key)) {
              localStorage.removeItem(key);
            }
          }
        }
      } catch {
        // Fallback
      }
      setUsedMb(6.0);
      setClearing(false);
      setFeedback("Local cache cleared successfully.");
      setTimeout(() => setFeedback(""), 3000);
    }, 600);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 select-none">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Data & Storage
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
          Manage local cache and workspace storage context.
        </p>
      </div>

      {/* STORAGE USAGE CARD */}
      <div className="rounded-3xl border border-zinc-800 bg-[#111215] p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-400">
              <HardDrive className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Workspace Storage</h2>
              <p className="text-xs text-zinc-400">
                {usedMb.toFixed(1)} MB of {totalMb} MB used ({remainingMb} MB remaining)
              </p>
            </div>
          </div>

          <span className="text-lg font-black text-lime-400">{percentage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.6)] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Usage Breakdown */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Storage Breakdown
          </span>
          <div className="space-y-2 text-xs">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-zinc-300">
                <span className="font-medium text-zinc-400">{item.label}</span>
                <span className="font-semibold text-white">{item.sizeMb} ({item.pct})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            Clearing cache removes temporary offline data without deleting your saved account data.
          </p>

          <button
            type="button"
            onClick={handleClearCache}
            disabled={clearing}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#16171c] hover:bg-zinc-800 hover:text-white px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer shrink-0"
          >
            {clearing ? (
              <RefreshCcw className="size-3.5 animate-spin text-lime-400" />
            ) : (
              <Trash2 className="size-3.5 text-zinc-400" />
            )}
            <span>{clearing ? "Clearing..." : "Clear Cache"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2.5 text-xs font-semibold text-lime-400 flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="size-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
