"use client";

import {
  Briefcase,
  Laptop,
  Store,
  Compass,
  HeartHandshake,
  MessageSquareCode,
  Sparkles,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingUseCases() {
  const cases = [
    {
      role: "Busy Professional",
      icon: Briefcase,
      scenario: "Keeping meetings, conflicts, and daily priorities on track without context-switching.",
      example: '"What\'s on my schedule tomorrow afternoon?"',
    },
    {
      role: "Freelancer & Contractor",
      icon: Laptop,
      scenario: "Tracking project deliverables, client dues, and pending payments in one conversation.",
      example: '"Rahul still owes me ₹2,000 for the design assets."',
    },
    {
      role: "Small Business Owner",
      icon: Store,
      scenario: "Getting a holistic view of team tasks, outstanding payments, and weekly commitments.",
      example: '"Show me everything pending across all contacts this month."',
    },
    {
      role: "Consultant",
      icon: Compass,
      scenario: "Generating executive digests and sending automated reports to stakeholders.",
      example: '"Send my monthly pending report directly to Gmail."',
    },
    {
      role: "Personal & Everyday",
      icon: HeartHandshake,
      scenario: "Managing personal errands, shopping lists, and split bills with friends effortlessly.",
      example: '"Remind me tomorrow at 5 PM to pick up the book."',
    },
  ];

  return (
    <section id="use-cases" className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-lime-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Versatile Scenarios</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-6">
            Built for how you <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              actually work and live.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Whether you are coordinating multi-party meetings, tracking loans, or managing deliverables, Calby adapts to your routine.
          </p>
        </ScrollReveal>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {cases.map((item, idx) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.role} delay={idx * 60} className="h-full">
                <div className="h-full group glass-card rounded-[2rem] p-7 border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-lime-400/30 transition-all duration-300 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-medium text-white">
                        {item.role}
                      </h3>
                    </div>

                    <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                      {item.scenario}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/5 text-zinc-300 font-mono text-xs flex items-center gap-2 shadow-inner">
                    <MessageSquareCode className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                    <span className="truncate">{item.example}</span>
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
