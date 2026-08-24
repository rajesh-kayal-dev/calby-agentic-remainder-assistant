"use client";

import {
  MessageSquare,
  Calendar as CalendarIcon,
  Sparkles,
  Send,
  Paperclip,
  CheckCircle2,
  Bot,
  ChevronRight,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function ProductShowcase() {
  return (
    <section id="product" className="py-24 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-lime-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white tracking-tight leading-tight mb-4 sm:mb-6">
            Experience the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              Calby Interface
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            A clean, focused environment where natural language meets your daily schedule.
          </p>
        </ScrollReveal>

        {/* Large Product Mockup Window */}
        <ScrollReveal scale delay={100} className="relative w-full max-w-6xl mx-auto">
          {/* Green Glow Layer around Mockup */}
          <div className="absolute -inset-1 bg-gradient-to-b from-lime-400/25 via-emerald-500/10 to-transparent rounded-[2.5rem] blur-xl opacity-70" />


          {/* Main App Container */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[520px] sm:h-[620px] md:h-[680px]">
            {/* LEFT COLUMN: Calby Navigation Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950/60 flex flex-row md:flex-col shrink-0 items-center md:items-stretch justify-between md:justify-start">
              {/* Window Controls */}
              <div className="p-3.5 sm:p-5 flex items-center gap-2 border-b-0 md:border-b border-zinc-800/80">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs font-mono text-zinc-500 hidden sm:inline">calby.app</span>
              </div>

              {/* Navigation Items */}
              <div className="p-2 sm:p-4 space-y-2">
                <div className="p-2 sm:p-3 rounded-xl bg-lime-400/10 text-lime-400 flex items-center gap-2 sm:gap-3 border border-lime-400/20 font-medium text-xs sm:text-sm">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Assistant Chat</span>
                </div>
                <div className="hidden md:flex p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 items-center justify-between text-sm transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Google Calendar</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-lime-400" />
                </div>
              </div>


              {/* Saved Threads / Topics */}
              <div className="mt-4 px-4 hidden md:block">
                <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Recent Threads
                </h3>
                <div className="space-y-2.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/40 text-white font-medium">
                    <ChevronRight className="w-3.5 h-3.5 text-lime-400" />
                    <span className="truncate">Tomorrow's Agenda</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="truncate">Schedule Team Sync</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="truncate">Reschedule Client Call</span>
                  </div>
                </div>
              </div>

              {/* User Profile Mini */}
              <div className="mt-auto p-4 border-t border-zinc-800/80 hidden md:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center font-semibold text-xs border border-lime-400/30">
                  C
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Connected User</p>
                  <p className="text-[10px] text-zinc-500 truncate">Descope Verified</p>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: Main AI Assistant Area */}
            <div className="flex-1 flex flex-col bg-zinc-950/40 min-w-0">
              {/* Header */}
              <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-300 to-lime-500 flex items-center justify-center text-zinc-950 shadow-[0_0_12px_rgba(163,230,53,0.3)]">
                    <Bot className="w-4 h-4 fill-current text-zinc-950" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Calby Assistant</h3>
                    <p className="text-[10px] text-lime-400">Google Calendar Connected</p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-lime-400" />
              </div>

              {/* Chat Thread Area */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                <div className="flex justify-center">
                  <span className="text-[11px] font-medium text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                    Today
                  </span>
                </div>

                {/* User Message */}
                <div className="flex gap-3 max-w-md ml-auto flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-xs text-lime-400 font-bold shrink-0">
                    You
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1 flex-row-reverse">
                      <span className="text-xs font-medium text-white">You</span>
                      <span className="text-[10px] text-zinc-500">10:23 AM</span>
                    </div>
                    <div className="bg-zinc-800 p-3.5 rounded-2xl rounded-tr-none text-zinc-200 text-sm leading-relaxed border border-zinc-700">
                      "What's on tomorrow?"
                    </div>
                  </div>
                </div>

                {/* Calby Response */}
                <div className="flex gap-3 max-w-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-300 to-lime-500 flex items-center justify-center text-zinc-950 font-bold text-xs shrink-0 shadow-md">
                    C
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-medium text-lime-400">Calby AI</span>
                      <span className="text-[10px] text-zinc-500">10:23 AM</span>
                    </div>
                    <div className="bg-lime-400 p-4 rounded-2xl rounded-tl-none text-zinc-950 text-sm font-medium leading-relaxed shadow-[0_4px_20px_rgba(163,230,53,0.18)]">
                      You have 3 meetings tomorrow. I found a free 30-minute slot at 2:30 PM.
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Input Bar */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/60">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 flex items-center gap-2 shadow-inner">
                  <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    readOnly
                    value="Ask Calby to schedule, reschedule, or check availability..."
                    className="flex-1 bg-transparent text-zinc-400 text-xs focus:outline-none px-2 h-8"
                  />
                  <button className="p-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-lg transition-colors shadow-sm">
                    <Send className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Calendar Sidebar Preview */}
            <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-950/80 p-5 hidden lg:flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-lime-400" />
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Today
                  </h4>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                  Tomorrow
                </span>
              </div>

              {/* Event Cards Stack */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-zinc-400">10:00 AM</span>
                    <span className="text-[10px] text-zinc-500">30m</span>
                  </div>
                  <p className="text-xs font-medium text-white">Team Standup</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-zinc-400">02:00 PM</span>
                    <span className="text-[10px] text-zinc-500">1h</span>
                  </div>
                  <p className="text-xs font-medium text-white">Client Call</p>
                </div>

                {/* Highlighted Free Slot */}
                <div className="p-3 rounded-xl bg-lime-400/10 border border-dashed border-lime-400/40">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-lime-400 font-medium">02:30 PM</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                  </div>
                  <p className="text-xs font-medium text-lime-400">Free Slot Available</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-zinc-400">04:30 PM</span>
                    <span className="text-[10px] text-zinc-500">45m</span>
                  </div>
                  <p className="text-xs font-medium text-white">Project Review</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

  );
}
