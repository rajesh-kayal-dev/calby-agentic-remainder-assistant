"use client";

import { Clock, History, Sparkles, User, Bot, Check, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingMemory() {
  return (
    <section id="memory" className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-lime-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <History className="w-3.5 h-3.5" />
            <span>Persistent Context & Memory</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-6">
            Tell Calby once. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              It keeps track.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Calby remembers commitments, pending balances, and obligations over time so you never have to re-explain the context.
          </p>
        </ScrollReveal>

        {/* Timeline Interaction Display */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative items-stretch">
          {/* Connector Arrow (Desktop) */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-950 border border-lime-400/40 items-center justify-center text-lime-400 shadow-xl">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* DAY 1 CARD */}
          <ScrollReveal delay={0} className="h-full">
            <div className="h-full group glass-card rounded-[2rem] p-7 sm:p-8 border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                      Day 1 · Logging Context
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-full border border-white/5">
                    Original Conversation
                  </span>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* User Message */}
                  <div className="flex items-start gap-2.5 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0 text-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-zinc-800/90 p-3 rounded-2xl rounded-tr-none text-zinc-200 border border-white/5 font-medium leading-snug">
                      "Rahul owes me ₹200 for the book."
                    </div>
                  </div>

                  {/* Calby Response */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-zinc-900 border border-lime-400/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(163,230,53,0.25)]">
                      <img
                        src="/logo.png"
                        alt="Calby Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-lime-400 p-3.5 rounded-2xl rounded-tl-none text-zinc-950 font-medium leading-snug shadow-sm">
                      Got it. Added ₹200 to Rahul's pending balance for Books.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-zinc-400">
                <Check className="w-3.5 h-3.5 text-lime-400" />
                <span>Persisted into secure relational ledger</span>
              </div>
            </div>
          </ScrollReveal>

          {/* LATER / FOLLOW-UP CARD */}
          <ScrollReveal delay={120} className="h-full">
            <div className="h-full group rounded-[2rem] p-7 sm:p-8 border border-lime-400/30 bg-zinc-900/80 shadow-2xl transition-all duration-300 flex flex-col justify-between backdrop-blur-xl">
              <div>
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-lime-400" />
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-lime-300">
                      Days Later · Effortless Recall
                    </span>
                  </div>
                  <span className="text-[10px] text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/20 font-mono">
                    Context Retained
                  </span>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* User Message */}
                  <div className="flex items-start gap-2.5 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0 text-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-zinc-800/90 p-3 rounded-2xl rounded-tr-none text-zinc-200 border border-white/5 font-medium leading-snug">
                      "What is pending with Rahul?"
                    </div>
                  </div>

                  {/* Calby Response */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-zinc-900 border border-lime-400/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(163,230,53,0.25)]">
                      <img
                        src="/logo.png"
                        alt="Calby Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-zinc-950 border border-lime-400/40 p-3.5 rounded-2xl rounded-tl-none text-zinc-100 font-medium leading-snug shadow-inner">
                      Rahul has ₹200 pending for the book from last Thursday.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-lime-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant retrieval without repeated prompting</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
