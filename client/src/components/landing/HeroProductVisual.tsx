"use client";

import { Calendar as CalendarIcon, Sparkles, CheckCircle2, Bot } from "lucide-react";

export function HeroProductVisual() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none h-[460px] sm:h-[520px] flex items-center justify-center scale-[0.88] sm:scale-100 origin-center transition-transform">
      {/* Background Decorative Dot Patterns */}
      <div className="absolute top-2 left-4 w-32 h-32 pattern-dots opacity-40 rounded-full blur-[1px]" />
      <div className="absolute bottom-2 right-4 w-32 h-32 pattern-dots opacity-40 rounded-full blur-[1px]" />

      {/* CARD 2: CALENDAR (Underlying Back Card) */}
      <div className="absolute top-2 left-0 sm:left-4 z-10 w-[285px] sm:w-[340px] glass-card rounded-[2rem] p-5 shadow-2xl animate-float-reverse-card hover:rotate-0 transition-all duration-700 ease-out group">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 border border-white/10">
              <CalendarIcon className="w-4 h-4 text-lime-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Calendar</h3>
              <p className="text-[11px] text-zinc-500">Tomorrow, Oct 24</p>
            </div>
          </div>
          <span className="text-[10px] font-medium bg-lime-400/10 text-lime-400 border border-lime-400/20 px-2.5 py-1 rounded-full">
            Synced
          </span>
        </div>

        {/* Example Events Timeline */}
        <div className="space-y-2.5">
          {/* Event 1 */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
            <span className="text-xs font-mono font-medium text-zinc-400 w-11 shrink-0">10:00</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">Team Standup</p>
              <p className="text-[10px] text-zinc-500">Google Meet • 30m</p>
            </div>
          </div>

          {/* Event 2 */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
            <span className="text-xs font-mono font-medium text-zinc-400 w-11 shrink-0">14:00</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">Client Call</p>
              <p className="text-[10px] text-zinc-500">Video Call • 1h</p>
            </div>
          </div>

          {/* Slot Highlight */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-lime-400/10 border border-dashed border-lime-400/40">
            <span className="text-xs font-mono font-medium text-lime-400 w-11 shrink-0">14:30</span>
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <p className="text-xs font-medium text-lime-400">Free 30m Slot Found</p>
              <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
            </div>
          </div>

          {/* Event 3 */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
            <span className="text-xs font-mono font-medium text-zinc-400 w-11 shrink-0">16:30</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">Project Review</p>
              <p className="text-[10px] text-zinc-500">Room 4B • 45m</p>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 1: AI ASSISTANT (Overlapping Front Card) */}
      <div className="absolute bottom-2 right-0 sm:right-2 z-20 w-[275px] sm:w-[330px] rounded-[2rem] border border-white/10 bg-zinc-950/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-lime-400/30 animate-float-card hover:rotate-0 transition-all duration-700 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lime-300 to-lime-500 flex items-center justify-center text-zinc-950 shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              <Bot className="w-4 h-4 fill-current text-zinc-950" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Calby AI</h3>
              <p className="text-[11px] text-lime-400 font-medium">Assistant Active</p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-lime-400" />
        </div>

        {/* Conversation */}
        <div className="space-y-3 text-xs">
          {/* User Message */}
          <div className="flex items-start gap-2 flex-row-reverse">
            <div className="bg-zinc-800 p-3 rounded-2xl rounded-tr-none text-zinc-200 border border-white/5 max-w-[85%] font-medium">
              "What's on tomorrow?"
            </div>
          </div>

          {/* Calby Response */}
          <div className="flex items-start gap-2">
            <div className="bg-lime-400 p-3.5 rounded-2xl rounded-tl-none text-zinc-950 font-medium leading-relaxed shadow-[0_4px_20px_rgba(163,230,53,0.2)] max-w-[92%]">
              You have 3 meetings tomorrow. I also found a free 30-minute slot at 2:30 PM.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
