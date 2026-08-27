"use client";

import { MessageSquare, Cpu, Bell, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingHowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Tell Calby",
      description: "Say what you need in normal language.",
      example: '"Rahul owes me ₹350."',
      icon: MessageSquare,
      accentColor: "border-lime-400/30 text-lime-400 bg-lime-400/10",
    },
    {
      number: "02",
      title: "Calby organizes it",
      description: "It understands the context and updates the right place.",
      example: "₹350 added to Rahul's pending balance.",
      icon: Cpu,
      accentColor: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10",
    },
    {
      number: "03",
      title: "Calby follows up",
      description: "It remembers and acts when needed.",
      example: "Reminder scheduled for tomorrow at 9:00 AM.",
      icon: Bell,
      accentColor: "border-amber-400/30 text-amber-400 bg-amber-400/10",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5 bg-zinc-950/70">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-lime-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>How It Works</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-4 sm:mb-6">
            Just tell Calby <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              what you need.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            No complex workflows, forms, or commands. Calby handles the rest in three simple steps.
          </p>
        </ScrollReveal>

        {/* 3-Step Visual Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.number} delay={idx * 100} className="h-full">
                <div className="h-full group rounded-[2.2rem] p-7 sm:p-8 border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-lime-400/30 transition-all duration-300 shadow-xl flex flex-col justify-between relative overflow-hidden backdrop-blur-xl">
                  {/* Top Step Badge & Number */}
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${step.accentColor} shadow-inner`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-mono font-bold text-zinc-600 group-hover:text-lime-400 transition-colors">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="text-2xl font-medium text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                      {step.description}
                    </p>
                  </div>

                  {/* Concrete Example Quote Box */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-1.5 font-mono text-xs shadow-inner">
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block font-sans">
                      Example
                    </span>
                    <p className="text-zinc-200 font-sans font-medium text-sm">
                      {step.example}
                    </p>
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
