"use client";

import { ShieldCheck, Lock, Database } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingSecurity() {
  const points = [
    {
      icon: ShieldCheck,
      title: "Secure connections",
      desc: "Authenticated integrations keep your accounts protected.",
    },
    {
      icon: Database,
      title: "Private data",
      desc: "Your data is isolated from other users.",
    },
    {
      icon: Lock,
      title: "Encrypted credentials",
      desc: "Sensitive credentials are protected server-side.",
    },
  ];

  return (
    <section id="security" className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5 bg-zinc-950/60">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-lime-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Lock className="w-3.5 h-3.5" />
            <span>Trust & Privacy</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-6">
            Your data <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              stays yours.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Calby is designed with secure authentication, isolated user data, and encrypted credentials.
          </p>
        </ScrollReveal>

        {/* 3 Compact Security Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {points.map((point, idx) => {
            const Icon = point.icon;
            return (
              <ScrollReveal key={point.title} delay={idx * 70} className="h-full">
                <div className="h-full rounded-[2rem] p-7 sm:p-8 border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-lime-400/30 transition-all duration-200 shadow-xl flex flex-col justify-between backdrop-blur-md">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-lime-400 flex items-center justify-center mb-6 shadow-inner">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-medium text-white mb-2.5">
                      {point.title}
                    </h3>
                    <p className="text-sm text-zinc-400 font-light leading-relaxed">
                      {point.desc}
                    </p>
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
