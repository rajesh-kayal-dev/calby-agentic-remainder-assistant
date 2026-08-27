"use client";

import {
  FileText,
  FileSpreadsheet,
  Mail,
  Send,
  CalendarClock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  CheckSquare,
  IndianRupee,
  Bell,
  MessageCircle,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingReports() {
  const deliveryChannels = [
    { label: "Google Docs", icon: FileText, desc: "Structured Docs Export" },
    { label: "Google Sheets", icon: FileSpreadsheet, desc: "Spreadsheet Ledger Tables" },
    { label: "Gmail", icon: Mail, desc: "Direct Email Dispatch" },
    { label: "Telegram", icon: Send, desc: "Instant Bot Notification" },
    { label: "WhatsApp", icon: MessageCircle, desc: "Cloud API Message" },
  ];

  return (
    <section id="reports" className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5 bg-zinc-950/40">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[550px] bg-lime-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <FileText className="w-3.5 h-3.5" />
            <span>Reports & Recurring Automation</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-6">
            Turn your work <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              into a report.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Generate executive summaries of tasks, money ledger items, and obligations, then export or schedule them to your favorite tools.
          </p>
        </ScrollReveal>

        {/* 2-Column Grid: Visual Report Digest (Left) + Export Channels & Scheduling (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT: Structured Report Card Preview (6 cols) */}
          <ScrollReveal delay={0} className="lg:col-span-6 h-full">
            <div className="h-full group rounded-[2rem] p-6 sm:p-8 border border-white/10 bg-zinc-900/60 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-lime-400 font-semibold">
                      Executive Digest
                    </span>
                    <h3 className="text-xl font-medium text-white">Monthly Summary Report</h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
                    Generated on demand
                  </span>
                </div>

                {/* 3 Metric Rows */}
                <div className="space-y-3.5">
                  {/* Tasks Section */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <CheckSquare className="w-4 h-4 text-lime-400" />
                        <span>Tasks</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">39 total</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-lime-400 font-medium">32 completed</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-300">7 pending</span>
                    </div>
                  </div>

                  {/* Money Section */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <IndianRupee className="w-4 h-4 text-amber-400" />
                        <span>Money Ledger</span>
                      </div>
                      <span className="text-xs font-mono text-amber-300">₹6,350 volume</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-amber-300 font-medium">₹4,250 pending</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-emerald-400">₹2,100 collected</span>
                    </div>
                  </div>

                  {/* Reminders Section */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <Bell className="w-4 h-4 text-sky-400" />
                        <span>Reminders</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">22 total</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-zinc-300 font-medium">18 delivered</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-sky-300">4 upcoming</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Pipeline */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>Generate</span>
                <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                <span>Export</span>
                <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                <span>Schedule</span>
                <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                <span>Send</span>
              </div>
            </div>
          </ScrollReveal>

          {/* RIGHT: Export Channels & Scheduling Automation (6 cols) */}
          <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
            {/* Supported Export Channels Grid */}
            <ScrollReveal delay={100}>
              <div className="glass-card rounded-[2rem] p-6 sm:p-7 border border-white/10 bg-zinc-900/40">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Direct Export & Multi-Channel Delivery
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {deliveryChannels.map((ch) => {
                    const Icon = ch.icon;
                    return (
                      <div
                        key={ch.label}
                        className="p-3 rounded-xl bg-zinc-950/80 border border-white/5 hover:border-lime-400/30 transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-lime-400 border border-white/10 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{ch.label}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{ch.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>

            {/* Scheduled Recurring Automation Preview */}
            <ScrollReveal delay={180}>
              <div className="rounded-[2rem] p-6 sm:p-7 border border-lime-400/30 bg-zinc-900/80 shadow-xl backdrop-blur-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-wider">
                  <CalendarClock className="w-4 h-4" />
                  <span>Scheduled Automated Recurring Delivery</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  {/* User Prompt */}
                  <div className="flex items-start gap-2.5 flex-row-reverse">
                    <div className="bg-zinc-800/90 px-3.5 py-2 rounded-2xl rounded-tr-none text-zinc-200 border border-white/5 font-medium">
                      "Every Monday at 9 AM, send me my pending report."
                    </div>
                  </div>

                  {/* Calby Response */}
                  <div className="flex items-start gap-2.5">
                    <div className="bg-lime-400 text-zinc-950 px-4 py-2.5 rounded-2xl rounded-tl-none font-medium leading-snug shadow-sm">
                      Done. I'll generate your pending report every Monday at 9:00 AM.
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-[11px] text-zinc-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                  <span>Runs automatically in the background via BullMQ scheduler</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
