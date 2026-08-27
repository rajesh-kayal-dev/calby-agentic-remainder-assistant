"use client";

import {
  Layers,
  Calendar,
  CheckSquare,
  IndianRupee,
  Bell,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function ConnectedWorkspaceScene() {
  return (
    <div className="relative w-full h-full flex flex-col justify-center p-4 sm:p-6 select-none overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-lime-500/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-4">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
            <Layers className="w-4 h-4 text-lime-400" />
            <span>Single Conversational Input → Cascading Sync</span>
          </div>
          <span className="text-[11px] font-mono text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full border border-lime-400/20">
            All Domains Updated
          </span>
        </div>

        {/* 3 Domain Synchronized Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Money Ledger */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-400/30 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Pending Ledger</span>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
            </div>
            <p className="text-sm font-semibold text-white">Rahul Sharma</p>
            <p className="text-xs font-mono text-amber-300">₹350 pending</p>
            <p className="text-[10px] text-zinc-400">• Books (₹200) • Food (₹150)</p>
          </div>

          {/* Card 2: Calendar */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-sky-400/30 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-sky-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Google Calendar</span>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
            </div>
            <p className="text-sm font-semibold text-white">Sarah Sync</p>
            <p className="text-xs font-mono text-sky-300">Tomorrow 10:30 AM</p>
            <p className="text-[10px] text-zinc-400">30 min • Non-conflicting</p>
          </div>

          {/* Card 3: Tasks & Reminders */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-purple-400/30 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Work Tasks</span>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
            </div>
            <p className="text-sm font-semibold text-white">Buy printer paper</p>
            <p className="text-xs font-mono text-purple-300">Office List</p>
            <p className="text-[10px] text-zinc-400">Linked to Reminder</p>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/5 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Unified Assistant Context</span>
          <span className="text-lime-400 flex items-center gap-1">
            Zero duplicate entry <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
