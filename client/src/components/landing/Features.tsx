"use client";

import { Clock, Calendar, RefreshCw, MessageSquareCode } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-lime-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl lg:text-5xl font-medium text-white tracking-tight leading-tight mb-6">
            Stop managing your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              calendar manually.
            </span>
          </h2>
          <p className="text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Calby replaces tedious calendar clicking with natural conversation. Tell your AI assistant what you need, and let it inspect availability, schedule meetings, and adjust your agenda instantly.
          </p>
        </ScrollReveal>

        {/* Feature Cards Grid with Staggered Delays */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Find time */}
          <ScrollReveal delay={0} className="h-full">
            <div className="h-full group glass-card rounded-[2rem] p-8 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-lime-400/40 transition-all duration-200 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-medium text-white mb-3">
                  Find time
                </h3>
                <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                  Skip the manual scanning. Calby searches your Google Calendar to identify optimal open slots without conflicts.
                </p>
              </div>

              {/* Example Prompt Box */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 text-zinc-300 font-mono text-xs flex items-center gap-3">
                <MessageSquareCode className="w-4 h-4 text-lime-400 shrink-0" />
                <span className="truncate">"Find me 30 minutes with Sarah next week."</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: Schedule meetings */}
          <ScrollReveal delay={80} className="h-full">
            <div className="h-full group glass-card rounded-[2rem] p-8 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-lime-400/40 transition-all duration-200 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-medium text-white mb-3">
                  Schedule meetings
                </h3>
                <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                  Create events instantly with full details. Calby handles title, time, duration, and calendar synchronization automatically.
                </p>
              </div>

              {/* Example Prompt Box */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 text-zinc-300 font-mono text-xs flex items-center gap-3">
                <MessageSquareCode className="w-4 h-4 text-lime-400 shrink-0" />
                <span className="truncate">"Schedule the project review for Thursday afternoon."</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3: Reschedule */}
          <ScrollReveal delay={160} className="h-full">
            <div className="h-full group glass-card rounded-[2rem] p-8 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-lime-400/40 transition-all duration-200 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-medium text-white mb-3">
                  Reschedule
                </h3>
                <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                  Need to change plans? Calby shifts events, checks new availability, and updates your agenda in seconds.
                </p>
              </div>

              {/* Example Prompt Box */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 text-zinc-300 font-mono text-xs flex items-center gap-3">
                <MessageSquareCode className="w-4 h-4 text-lime-400 shrink-0" />
                <span className="truncate">"Move tomorrow's client call to Friday."</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
