"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 text-center relative z-10">
        {/* Large Rounded CTA Container with Scale-Reveal */}
        <ScrollReveal scale delay={0}>
          <div className="rounded-[3rem] p-10 sm:p-16 border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 shadow-2xl relative overflow-hidden backdrop-blur-xl group">
            {/* Subtle Green Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-lime-500/10 rounded-full blur-[130px] pointer-events-none" />

            {/* Decorative Dot Pattern overlay */}
            <div className="absolute inset-0 pattern-dots opacity-20 pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              {/* Small Top Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started Today</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-[1.15] mb-6">
                Give your calendar <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
                  less work.
                </span>
              </h2>

              {/* Supporting Copy */}
              <p className="text-lg lg:text-xl text-zinc-400 font-light leading-relaxed mb-10 max-w-xl mx-auto">
                Let Calby handle the scheduling so you can focus on the work that matters.
              </p>

              {/* Primary CTA Button */}
              <div className="flex justify-center">
                <Link
                  href="/sign-in"
                  className="bg-lime-400 hover:bg-lime-300 text-zinc-950 text-lg font-semibold py-4 px-10 rounded-full transition-all shadow-[0_0_30px_rgba(163,230,53,0.35)] hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] flex items-center justify-center gap-2 group"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
