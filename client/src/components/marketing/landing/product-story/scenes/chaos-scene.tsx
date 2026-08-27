"use client";

import { AlertCircle, IndianRupee, Calendar, CheckSquare, Bell, FileText } from "lucide-react";

export function ChaosScene() {
  const floatingNotes = [
    {
      text: "Rahul owes ₹350 (200 books, 150 food)",
      icon: IndianRupee,
      color: "border-amber-400/40 text-amber-300 bg-amber-950/40",
      pos: "top-4 sm:top-8 left-2 sm:left-10 rotate-[-4deg]",
    },
    {
      text: "Client Meeting at 2:00 PM (Google Meet)",
      icon: Calendar,
      color: "border-sky-400/40 text-sky-300 bg-sky-950/40",
      pos: "top-14 sm:top-16 right-2 sm:right-12 rotate-[3deg]",
    },
    {
      text: "Buy printer paper for office",
      icon: CheckSquare,
      color: "border-purple-400/40 text-purple-300 bg-purple-950/40",
      pos: "bottom-24 sm:bottom-28 left-4 sm:left-14 rotate-[2deg]",
    },
    {
      text: "Call Sarah tomorrow morning",
      icon: Bell,
      color: "border-rose-400/40 text-rose-300 bg-rose-950/40",
      pos: "bottom-12 sm:bottom-14 right-4 sm:right-16 rotate-[-3deg]",
    },
    {
      text: "Send monthly summary to team",
      icon: FileText,
      color: "border-emerald-400/40 text-emerald-300 bg-emerald-950/40",
      pos: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-1deg]",
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 overflow-hidden select-none">
      {/* Scattered Floating Mental Load Cards */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingNotes.map((note, idx) => {
          const Icon = note.icon;
          return (
            <div
              key={idx}
              className={`absolute ${note.pos} p-2.5 sm:p-3.5 rounded-2xl border ${note.color} backdrop-blur-md shadow-xl flex items-center gap-2.5 max-w-[220px] sm:max-w-[280px] text-[11px] sm:text-xs font-medium animate-pulse`}
              style={{ animationDuration: `${3 + idx * 0.5}s` }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{note.text}</span>
            </div>
          );
        })}
      </div>

      {/* Central Humor & Narrative Punchline */}
      <div className="relative z-10 text-center max-w-lg mx-auto bg-zinc-950/90 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-2xl">
        <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-5 h-5" />
        </div>

        <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-3">
          "Future you will definitely remember all of this."
        </h3>

        <div className="inline-block bg-zinc-900 border border-rose-400/30 text-rose-300 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium shadow-sm">
          Future you: absolutely not.
        </div>
      </div>
    </div>
  );
}
