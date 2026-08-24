"use client";

import { Bot, Sparkles, User, CalendarSearch, ClockCheck, CalendarSync } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function AIAssistant() {
  const examples = [
    {
      badge: "Query Agenda",
      icon: CalendarSearch,
      userPrompt: "What's my afternoon look like?",
      calbyResponse: "You have two meetings between 1 PM and 4 PM.",
    },
    {
      badge: "Slot Finder",
      icon: ClockCheck,
      userPrompt: "Find a 45-minute slot with John next week.",
      calbyResponse: "I found Thursday at 2:30 PM.",
    },
    {
      badge: "Smart Reschedule",
      icon: CalendarSync,
      userPrompt: "Move my 3 PM meeting to Friday.",
      calbyResponse: "Done. The meeting has been moved to Friday.",
    },
  ];

  return (
    <section id="ai-assistant" className="py-24 relative overflow-hidden border-y border-white/5">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-lime-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Interaction Engine</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-medium text-white tracking-tight leading-tight mb-6">
            A calendar that <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              understands you.
            </span>
          </h2>
          <p className="text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Communicate with Calby using natural human expressions. No strict commands, manual forms, or complex time converters needed.
          </p>
        </ScrollReveal>

        {/* Interaction Examples Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {examples.map((item, index) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={index} delay={index * 80} className="h-full">
                <div className="h-full group glass-card rounded-[2rem] p-6 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-lime-400/40 transition-all duration-200 shadow-xl flex flex-col justify-between">
                  {/* Card Top Label */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                      <Icon className="w-4 h-4 text-lime-400" />
                      <span>{item.badge}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-lime-400" />
                  </div>

                  {/* AI Assistant Chat Conversation Thread */}
                  <div className="space-y-4 text-xs font-sans">
                    {/* User Prompt */}
                    <div className="flex items-start gap-2.5 flex-row-reverse">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-zinc-800/90 p-3.5 rounded-2xl rounded-tr-none text-zinc-200 border border-white/5 leading-relaxed font-medium">
                        "{item.userPrompt}"
                      </div>
                    </div>

                    {/* Calby Response */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lime-300 to-lime-500 flex items-center justify-center text-zinc-950 font-bold shrink-0 shadow-md">
                        <Bot className="w-3.5 h-3.5 fill-current text-zinc-950" />
                      </div>
                      <div className="bg-lime-400 p-4 rounded-2xl rounded-tl-none text-zinc-950 font-medium leading-relaxed shadow-[0_4px_20px_rgba(163,230,53,0.18)]">
                        "{item.calbyResponse}"
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
