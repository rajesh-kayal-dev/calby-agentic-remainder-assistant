"use client";

import { Calendar, ShieldCheck, CheckCircle2, ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function Integrations() {
  return (
    <section id="integrations" className="py-24 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-lime-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-5xl font-medium text-white tracking-tight leading-tight mb-6">
            Works with the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              calendar you already use.
            </span>
          </h2>
          <p className="text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Calby integrates directly with your connected Google Calendar service via secure OAuth authorization, allowing your AI assistant to manage events in real time.
          </p>
        </ScrollReveal>

        {/* Real Integrations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Integration 1: Google Calendar */}
          <ScrollReveal delay={0} className="h-full">
            <div className="h-full group glass-card rounded-[2rem] p-8 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-lime-400/40 transition-all duration-200 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-lime-400/10 text-lime-400 border border-lime-400/20 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                    Live Integration
                  </span>
                </div>

                <h3 className="text-2xl font-medium text-white mb-3 flex items-center gap-2">
                  <span>Google Calendar</span>
                  <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-lime-400 transition-colors" />
                </h3>

                <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                  Direct two-way synchronization. Calby inspects availability, creates new events, and reschedules existing appointments on your Google Calendar.
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-lime-400" />
                <span>Full read/write event permissions</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Integration 2: Descope Auth Security */}
          <ScrollReveal delay={80} className="h-full">
            <div className="h-full group glass-card rounded-[2rem] p-8 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-lime-400/40 transition-all duration-200 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/10 px-3 py-1 rounded-full">
                    OAuth 2.0 Verified
                  </span>
                </div>

                <h3 className="text-2xl font-medium text-white mb-3 flex items-center gap-2">
                  <span>Descope Authentication</span>
                  <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-lime-400 transition-colors" />
                </h3>

                <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                  Enterprise Outbound OAuth authorization ensures your calendar access tokens are securely managed, encrypted, and isolated to your user identity.
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-lime-400" />
                <span>Zero plain-text token exposure</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
