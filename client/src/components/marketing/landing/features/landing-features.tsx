"use client";

import {
  Calendar,
  CheckSquare,
  IndianRupee,
  Bell,
  Users,
  FileText,
  MessageSquareCode,
  Sparkles,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingFeatures() {
  const features = [
    {
      icon: Calendar,
      title: "Calendar",
      description: "Schedule meetings and find time.",
      prompt: '"Find 30 minutes with Sarah tomorrow."',
      category: "Schedule",
    },
    {
      icon: CheckSquare,
      title: "Tasks",
      description: "Keep track of what needs to get done.",
      prompt: '"Add finish project slides to my Work list."',
      category: "To-Do",
    },
    {
      icon: IndianRupee,
      title: "Money",
      description: "Remember who owes what.",
      prompt: '"Rahul owes me ₹500 for books."',
      category: "Ledger",
    },
    {
      icon: Bell,
      title: "Reminders",
      description: "Never forget an important follow-up.",
      prompt: '"Remind me tomorrow to call Sarah."',
      category: "Scheduler",
    },
    {
      icon: Users,
      title: "Contacts",
      description: "Keep people and context connected.",
      prompt: '"What\'s still pending with Rahul?"',
      category: "Context",
    },
    {
      icon: FileText,
      title: "Reports",
      description: "Turn your activity into useful summaries.",
      prompt: '"Generate my monthly pending report."',
      category: "Exports",
    },
  ];

  return (
    <section id="capabilities" className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-lime-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Core Capabilities</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-6">
            Everything you need, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              in one place.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Calby keeps the everyday things you need to remember and manage connected.
          </p>
        </ScrollReveal>

        {/* 6 Clean Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.title} delay={idx * 60} className="h-full">
                <div className="h-full group glass-card rounded-[2rem] p-7 sm:p-8 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-lime-400/40 transition-all duration-300 shadow-xl flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-inner">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-full border border-white/5">
                        {feature.category}
                      </span>
                    </div>

                    <h3 className="text-2xl font-medium text-white mb-2.5">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                      {feature.description}
                    </p>
                  </div>

                  {/* Example Prompt Box */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/5 text-zinc-300 font-mono text-xs flex items-center gap-2.5 shadow-inner">
                    <MessageSquareCode className="w-4 h-4 text-lime-400 shrink-0" />
                    <span className="truncate">{feature.prompt}</span>
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
