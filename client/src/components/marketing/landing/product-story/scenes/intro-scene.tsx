"use client";

import { Bot, Sparkles, User, ShieldCheck } from "lucide-react";

export function IntroScene() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Calby Ambient Center Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-lime-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-zinc-950/95 border border-lime-400/30 rounded-3xl p-5 sm:p-7 shadow-[0_15px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lime-300 to-lime-500 flex items-center justify-center text-zinc-950 font-bold shadow-md">
              <Bot className="w-4 h-4 fill-current text-zinc-950" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Calby Assistant</h4>
              <p className="text-[10px] text-lime-400 font-mono">Conversational AI Ready</p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-lime-400" />
        </div>

        {/* Dialogue */}
        <div className="space-y-3.5 text-xs sm:text-sm">
          {/* User Asks */}
          <div className="flex items-start gap-2.5 flex-row-reverse">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0 text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="bg-zinc-800/90 p-3.5 rounded-2xl rounded-tr-none text-zinc-200 border border-white/5 font-medium leading-relaxed">
              "Can you keep track of all this for me?"
            </div>
          </div>

          {/* Calby Responds */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-zinc-900 border border-lime-400/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(163,230,53,0.25)]">
              <img
                src="/logo.png"
                alt="Calby Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="bg-lime-400 p-4 rounded-2xl rounded-tl-none text-zinc-950 font-medium leading-relaxed shadow-[0_4px_25px_rgba(163,230,53,0.3)]">
              <p className="font-semibold text-sm mb-1">Yep. I've got it.</p>
              <p className="text-xs opacity-90">
                Just tell me what needs to happen whenever you think of it.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span className="flex items-center gap-1.5 text-lime-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Connected & Isolated
          </span>
          <span>Zero manual forms</span>
        </div>
      </div>
    </div>
  );
}
