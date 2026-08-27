"use client";

import {
  MessageSquare,
  Calendar as CalendarIcon,
  CheckSquare,
  IndianRupee,
  Bell,
  Users,
  FileText,
  Sparkles,
  Bot,
  Send,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingProductDemo() {
  const sidebarItems = [
    { icon: MessageSquare, label: "Assistant", active: true },
    { icon: CalendarIcon, label: "Calendar", active: false },
    { icon: CheckSquare, label: "Tasks", active: false },
    { icon: IndianRupee, label: "Money", active: false },
    { icon: Bell, label: "Reminders", active: false },
    { icon: Users, label: "Contacts", active: false },
    { icon: FileText, label: "Reports", active: false },
  ];

  return (
    <section id="product-demo" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-lime-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Unified Workspace</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-4 sm:mb-6">
            One assistant. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              Everything connected.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Calby connects your calendar, tasks, money, reminders, and contacts into a unified conversational workspace.
          </p>
        </ScrollReveal>

        {/* Large Product Mockup Window */}
        <ScrollReveal scale delay={100} className="relative w-full max-w-6xl mx-auto">
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-b from-lime-400/20 via-emerald-500/10 to-transparent rounded-[2.5rem] blur-xl opacity-80 pointer-events-none" />

          {/* Main Container */}
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[620px] sm:h-[680px] lg:h-[720px]">
            {/* LEFT COLUMN: Sidebar Navigation */}
            <aside className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-zinc-800/80 bg-zinc-950/90 flex flex-row lg:flex-col shrink-0 justify-between lg:justify-start">
              {/* Window Controls */}
              <div className="p-4 sm:p-5 flex items-center gap-2 border-b-0 lg:border-b border-zinc-800/80">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs font-mono text-zinc-500 hidden sm:inline">calby.app</span>
              </div>

              {/* Navigation Items */}
              <nav className="p-2 sm:p-3 space-y-1.5 flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 lg:gap-0" aria-label="Demo Sidebar">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`px-3 py-2 sm:py-2.5 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                        item.active
                          ? "bg-lime-400/10 text-lime-400 border border-lime-400/20 shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-400 ml-auto hidden lg:inline" />
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* User Profile Mini Badge */}
              <div className="mt-auto p-4 border-t border-zinc-800/80 hidden lg:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center font-bold text-xs border border-lime-400/30">
                  C
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Connected Account</p>
                  <p className="text-[10px] text-zinc-500">Encrypted • Isolated</p>
                </div>
              </div>
            </aside>

            {/* CENTER COLUMN: Live Assistant Chat Area */}
            <main className="flex-1 flex flex-col bg-zinc-900/30 min-w-0 border-b lg:border-b-0">
              {/* Header */}
              <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-5 bg-zinc-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-lime-300 to-lime-500 flex items-center justify-center text-zinc-950 shadow-sm">
                    <Bot className="w-3.5 h-3.5 fill-current text-zinc-950" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white">Calby Assistant</h3>
                    <p className="text-[10px] text-lime-400">All Connected Domains Active</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
                  GPT-4o Mini / Gemini / Claude
                </span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
                {/* User Message */}
                <div className="flex gap-2.5 max-w-md ml-auto flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-xs text-lime-400 font-bold shrink-0">
                    You
                  </div>
                  <div className="bg-zinc-800/90 p-3 sm:p-3.5 rounded-2xl rounded-tr-none text-zinc-200 text-xs sm:text-sm leading-relaxed border border-white/5">
                    "What's on my schedule today, and what's still pending with Rahul?"
                  </div>
                </div>

                {/* Calby Response */}
                <div className="flex gap-2.5 max-w-xl">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 border border-lime-400/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(163,230,53,0.25)]">
                    <img
                      src="/logo.png"
                      alt="Calby Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-tl-none text-zinc-200 text-xs sm:text-sm leading-relaxed space-y-3 shadow-xl">
                    <p className="font-medium text-white">
                      Here is your summary for today:
                    </p>

                    {/* Schedule Snippet */}
                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <p className="text-[11px] font-semibold text-lime-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Today's Calendar (2 Events)</span>
                      </p>
                      <p className="text-xs text-zinc-300">• 10:00 AM — Team Standup (30m)</p>
                      <p className="text-xs text-zinc-300">• 02:00 PM — Client Call (1h)</p>
                    </div>

                    {/* Pending Context Snippet */}
                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>Rahul Sharma — ₹350 Pending</span>
                      </p>
                      <p className="text-xs text-zinc-300">• ₹200 (Books) + ₹150 (Food)</p>
                      <p className="text-xs text-zinc-300">• 2 tasks pending (Send files, confirm draft)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/80">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 flex items-center gap-2">
                  <span className="text-[11px] font-mono text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-md border border-lime-400/20">
                    [Action: Money · Create]
                  </span>
                  <input
                    type="text"
                    readOnly
                    value="Tell Calby to schedule, track money, add tasks, or export reports..."
                    className="flex-1 bg-transparent text-zinc-400 text-xs focus:outline-none px-2 h-7"
                  />
                  <div className="p-2 bg-lime-400 text-zinc-950 rounded-lg">
                    <Send className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>
            </main>

            {/* RIGHT COLUMN: Real-Time Context Drawer */}
            <aside className="w-full lg:w-72 bg-zinc-950/95 p-5 flex flex-col space-y-5 border-t lg:border-t-0 lg:border-l border-zinc-800/80">
              {/* Today Section */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <CalendarIcon className="w-3.5 h-3.5 text-lime-400" />
                    <span>TODAY'S SCHEDULE</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">2 Events</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-0.5">
                      <span className="font-mono text-zinc-300">10:00 AM</span>
                      <span className="text-[10px] text-zinc-500">30m</span>
                    </div>
                    <p className="text-xs font-medium text-white truncate">Team Standup</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-0.5">
                      <span className="font-mono text-zinc-300">02:00 PM</span>
                      <span className="text-[10px] text-zinc-500">1h</span>
                    </div>
                    <p className="text-xs font-medium text-white truncate">Client Call</p>
                  </div>
                </div>
              </div>

              {/* Pending Ledger & Contacts Section */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                    <span>PENDING LEDGER</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono">₹350 total</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white">Rahul Sharma</p>
                    <span className="text-xs font-mono font-bold text-lime-400">₹350</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>• Books</span>
                      <span className="font-mono">₹200</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Food</span>
                      <span className="font-mono">₹150</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>2 tasks linked</span>
                    <span className="text-lime-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Reminding tmrw
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
