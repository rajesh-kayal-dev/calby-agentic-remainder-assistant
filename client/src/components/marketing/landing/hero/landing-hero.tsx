"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Check,
  Link2,
  Bell,
  Zap,
  Brain,
  ClipboardList,
  Star,
  Heart,
} from "lucide-react";
import { HeroChatMockup } from "@/components/marketing/landing/hero/hero-chat-mockup";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

function ChromeLogoSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#1A73E8" />
      <path d="M12 2C16.42 2 20.17 4.89 21.5 8.91L12 12V2Z" fill="#EA4335" />
      <path d="M21.5 8.91C22.25 11.17 22.06 13.68 20.9 15.78L12 12L21.5 8.91Z" fill="#FBBC04" />
      <path d="M20.9 15.78C19.34 18.6 16.56 20.66 13.25 21.57L12 12L20.9 15.78Z" fill="#34A853" />
      <circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="3.2" fill="#1A73E8" />
    </svg>
  );
}

export function LandingHero() {
  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-lime-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 space-y-16 relative z-10">
        {/* ========================================================================= */}
        {/* TWO-COLUMN MAIN HERO SECTION */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: Core Message & CTAs (7 Cols on LG) */}
          <div className="lg:col-span-7 space-y-6 max-w-2xl">
            <ScrollReveal delay={0}>
              {/* Top Category Badge */}
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/25 text-lime-400 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                  <span>CONVERSATIONAL PERSONAL ASSISTANT</span>
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-[4.2rem] font-bold text-white tracking-tight leading-[1.08] mb-5">
                Stop keeping <br />
                everything in <br />
                your mind. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400 inline-flex items-center gap-2">
                  <span>Calby’s here.</span>
                  <span className="text-lime-400 text-3xl sm:text-4xl">✦</span>
                </span>
              </h1>
            </ScrollReveal>

            {/* Supporting Paragraph */}
            <ScrollReveal delay={80}>
              <p className="text-base sm:text-lg text-zinc-400 font-light leading-relaxed max-w-xl">
                Tasks, reminders, meetings, money, and follow-ups — just tell Calby what’s on your mind. Calby keeps track of everything, connects with Gmail, WhatsApp, and Telegram, and reminds you when it matters.
              </p>
            </ScrollReveal>

            {/* Unified Horizontal Feature Bar (Matching Reference Image) */}
            <ScrollReveal delay={120}>
              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-3.5 sm:p-4 max-w-xl shadow-lg">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 items-center">
                  {/* 1. Everything organized */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full border border-lime-400/60 flex items-center justify-center text-lime-400 shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <span className="text-[11px] sm:text-xs text-zinc-300 font-medium leading-tight">
                      Everything <br className="hidden sm:inline" />organized
                    </span>
                  </div>

                  {/* 2. Connects with your apps */}
                  <div className="flex items-center gap-2.5">
                    <Link2 className="w-5 h-5 text-lime-400 shrink-0" />
                    <span className="text-[11px] sm:text-xs text-zinc-300 font-medium leading-tight">
                      Connects with <br className="hidden sm:inline" />your apps
                    </span>
                  </div>

                  {/* 3. Notifies you on time */}
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-5 h-5 text-lime-400 shrink-0" />
                    <span className="text-[11px] sm:text-xs text-zinc-300 font-medium leading-tight">
                      Notifies you <br className="hidden sm:inline" />on time
                    </span>
                  </div>

                  {/* 4. Helps you stay ahead */}
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-lime-400 shrink-0" />
                    <span className="text-[11px] sm:text-xs text-zinc-300 font-medium leading-tight">
                      Helps you <br className="hidden sm:inline" />stay ahead
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* CTA Buttons */}
            <ScrollReveal delay={150}>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center pt-2">
                <Link
                  href="/sign-in"
                  className="bg-lime-400 hover:bg-lime-300 text-zinc-950 text-base font-bold py-4 px-8 rounded-full transition-all shadow-[0_0_30px_rgba(163,230,53,0.35)] hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/chrome-extension"
                  className="hover:bg-zinc-800 text-white text-base font-semibold py-4 px-7 rounded-full transition-all border border-white/15 hover:border-lime-400/40 flex items-center justify-center gap-2.5 bg-zinc-900/90 backdrop-blur-md shadow-md"
                >
                  <ChromeLogoSvg className="w-5 h-5" />
                  <span>Calby for Chrome</span>
                </Link>
              </div>
            </ScrollReveal>

            {/* Brand Emotional Line Below CTAs */}
            <ScrollReveal delay={180}>
              <p className="text-xs sm:text-sm text-zinc-400 font-normal flex items-center gap-2 pt-2">
                <Heart className="w-3.5 h-3.5 text-lime-400 fill-lime-400/20 shrink-0" />
                <span>Because your time is valuable, and we respect it.</span>
              </p>
            </ScrollReveal>
          </div>

          {/* RIGHT COLUMN: Visual Storytelling Mockup (5 Cols on LG) */}
          <div className="lg:col-span-5 relative w-full">
            <ScrollReveal delay={200} scale>
              <HeroChatMockup />
            </ScrollReveal>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM 4 BENEFIT VALUE CARDS */}
        {/* ========================================================================= */}
        <ScrollReveal delay={240}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/10">
            {/* Value Card 1 */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 backdrop-blur-sm space-y-2.5 hover:border-lime-400/30 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Free your mind</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Don't remember everything. Tell Calby.
              </p>
            </div>

            {/* Value Card 2 */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 backdrop-blur-sm space-y-2.5 hover:border-lime-400/30 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Calby keeps track</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                It organizes everything you tell it — tasks, reminders, meetings, money, and more.
              </p>
            </div>

            {/* Value Card 3 */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 backdrop-blur-sm space-y-2.5 hover:border-lime-400/30 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Notified on time</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Calby reminds you at the right time, so you never miss what matters.
              </p>
            </div>

            {/* Value Card 4 */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 backdrop-blur-sm space-y-2.5 hover:border-lime-400/30 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform">
                <Star className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Save time, every day</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Less stress. More focus. Better decisions.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
