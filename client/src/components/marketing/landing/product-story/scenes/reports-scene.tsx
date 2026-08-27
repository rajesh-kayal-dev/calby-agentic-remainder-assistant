"use client";

import {
  FileText,
  FileSpreadsheet,
  Mail,
  Send,
  MessageCircle,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";

export function ReportsScene() {
  const exports = [
    { label: "Docs", icon: FileText },
    { label: "Sheets", icon: FileSpreadsheet },
    { label: "Gmail", icon: Mail },
    { label: "Telegram", icon: Send },
    { label: "WhatsApp", icon: MessageCircle },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-center p-4 sm:p-6 select-none overflow-hidden">
      <div className="w-full max-w-xl mx-auto space-y-4">
        {/* Monthly Summary Card */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 bg-zinc-900/80 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-lime-400 font-semibold">
                Executive Digest
              </p>
              <h4 className="text-base font-semibold text-white">Monthly Summary Report</h4>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800">
              Auto-Synthesized
            </span>
          </div>

          {/* 4 Quick Stat Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase">Tasks</p>
              <p className="text-sm font-mono font-bold text-lime-400">32 Done</p>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase">Pending</p>
              <p className="text-sm font-mono font-bold text-amber-300">₹4,250</p>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase">Reminders</p>
              <p className="text-sm font-mono font-bold text-sky-300">18 Sent</p>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase">Meetings</p>
              <p className="text-sm font-mono font-bold text-purple-300">24 Syncs</p>
            </div>
          </div>

          {/* 5 Export Channels Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 font-mono">Dispatched to:</span>
            <div className="flex flex-wrap gap-2">
              {exports.map((item) => {
                const Icon = item.icon;
                return (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-200 bg-zinc-950 px-2 py-1 rounded-lg border border-white/5"
                  >
                    <Icon className="w-3 h-3 text-lime-400" />
                    <span>{item.label}</span>
                    <CheckCircle2 className="w-2.5 h-2.5 text-lime-400" />
                  </span>
                );
              })}
            </div>
          </div>

          {/* Recurring Schedule Indicator */}
          <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-between text-xs text-lime-300 font-mono">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-lime-400" />
              Scheduled every Monday at 9:00 AM
            </span>
            <span className="text-[10px] text-lime-400/80">Active Cron</span>
          </div>
        </div>
      </div>
    </div>
  );
}
