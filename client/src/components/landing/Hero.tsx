"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { HeroProductVisual } from "@/components/landing/HeroProductVisual";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-lime-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Column Content */}
        <div className="max-w-2xl">
          <ScrollReveal delay={0}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-medium text-white tracking-tight leading-[1.15] sm:leading-[1.1] mb-6 sm:mb-8">
              Your calendar, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
                on autopilot.
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <p className="text-lg sm:text-xl lg:text-2xl text-zinc-400 font-light leading-relaxed mb-8 sm:mb-10 max-w-lg">
              Tell Calby what you need. It helps find time, schedule meetings, reschedule events, and manage your calendar through natural language.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/sign-in"
                className="bg-lime-400 hover:bg-lime-300 text-zinc-950 text-lg font-semibold py-4 px-8 rounded-full transition-all shadow-[0_0_20px_rgba(163,230,53,0.25)] flex items-center justify-center gap-2 group"
              >
                <span>Get started</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#how-it-works"
                className="hover:bg-white/5 text-white text-lg font-medium py-4 px-8 rounded-full transition-all border border-white/10 flex items-center justify-center gap-2 bg-zinc-900/60 backdrop-blur-md"
              >
                <PlayCircle className="w-5 h-5 text-lime-400" />
                <span>See how it works</span>
              </a>
            </div>
          </ScrollReveal>
        </div>

        {/* Right Column Product Visual */}
        <ScrollReveal delay={200} scale className="relative w-full">
          <HeroProductVisual />
        </ScrollReveal>
      </div>
    </section>
  );
}
