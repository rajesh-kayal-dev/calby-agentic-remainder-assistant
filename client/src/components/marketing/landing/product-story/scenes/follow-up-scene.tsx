"use client";

import { Bell, Send, MessageCircle, Mail, CheckCircle2, IndianRupee } from "lucide-react";

export function FollowUpScene() {
  return (
    <div className="relative w-full h-full flex flex-col justify-center p-4 sm:p-6 select-none overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[280px] bg-lime-500/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-auto bg-zinc-950/95 border border-lime-400/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 backdrop-blur-xl">
        {/* Notification Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Proactive Reminder Alert</p>
              <p className="text-[10px] text-zinc-400">Scheduled Trigger Fired</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full">
            Just now
          </span>
        </div>

        {/* Pending Ledger Message */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs text-zinc-300">
          <div className="flex items-center justify-between text-white font-medium">
            <span>Rahul Sharma still has ₹350 pending.</span>
            <span className="text-amber-300 font-mono font-bold">₹350</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            • Books (₹200) + Food (₹150)
          </p>
          <p className="text-xs text-lime-300 font-medium pt-1">
            "Would you like me to send Rahul his pending list?"
          </p>
        </div>

        {/* Action Channel Dispatch Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-lime-400 text-zinc-950 border border-lime-400 flex items-center justify-center gap-1.5 text-xs font-semibold shadow-md">
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 flex items-center justify-center gap-1.5 text-xs font-medium">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 flex items-center justify-center gap-1.5 text-xs font-medium">
              <Mail className="w-3.5 h-3.5" />
              <span>Gmail</span>
            </div>
          </div>

          {/* Result Confirmation */}
          <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-lime-400/40 text-lime-400 text-xs font-mono flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Sent summary to Rahul via Telegram
            </span>
            <span className="text-[10px] text-zinc-500">Delivered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
