"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingFinalCTA() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5">
      <div className="mx-auto max-w-5xl px-6 text-center relative z-10">
        <ScrollReveal scale delay={0}>
          <div className="rounded-[3rem] p-10 sm:p-16 lg:p-20 border border-white/15 bg-gradient-to-b from-zinc-900/95 via-zinc-900/80 to-zinc-950/95 shadow-2xl relative overflow-hidden backdrop-blur-2xl group">
            {/* Ambient Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-lime-500/15 rounded-full blur-[140px] pointer-events-none" />

            {/* Subtle Dot Pattern */}
            <div className="absolute inset-0 pattern-dots opacity-25 pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-[1.12] mb-6">
                Stop keeping everything <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400">
                  in your mind.
                </span>
              </h2>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed mb-10 max-w-xl mx-auto">
                Tell Calby what needs to happen. Let it remember, organize, and follow up.
              </p>

              {/* CTA Button */}
              <div className="flex justify-center">
                <Link
                  href="/sign-in"
                  className="bg-lime-400 hover:bg-lime-300 text-zinc-950 text-base sm:text-lg font-semibold py-4 px-10 rounded-full transition-all shadow-[0_0_30px_rgba(163,230,53,0.35)] hover:shadow-[0_0_45px_rgba(163,230,53,0.55)] flex items-center justify-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
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
