"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, Bot } from "lucide-react";

export function PayoffScene() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 select-none overflow-hidden text-center">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-lime-500/20 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto space-y-6">
        {/* Assistant Avatar Badge */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-300 to-lime-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(163,230,53,0.4)] text-zinc-950">
          <Bot className="w-7 h-7 fill-current" />
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Peace Of Mind</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Stop remembering everything. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              Just tell Calby.
            </span>
          </h3>

          <p className="text-sm text-zinc-400 font-light max-w-sm mx-auto">
            Your day. Organized.
          </p>
        </div>

        {/* Direct Action Link */}
        <div className="flex justify-center">
          <Link
            href="/sign-in"
            className="bg-lime-400 hover:bg-lime-300 text-zinc-950 text-sm sm:text-base font-semibold py-3 px-7 rounded-full transition-all shadow-[0_0_25px_rgba(163,230,53,0.35)] hover:shadow-[0_0_35px_rgba(163,230,53,0.5)] flex items-center gap-2 group"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1 text-zinc-400">
            <CheckCircle2 className="w-3 h-3 text-lime-400" /> Instant Setup
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <CheckCircle2 className="w-3 h-3 text-lime-400" /> Free Tier Available
          </span>
        </div>
      </div>
    </div>
  );
}
