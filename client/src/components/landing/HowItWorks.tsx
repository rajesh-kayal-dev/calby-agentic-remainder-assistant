"use client";

import { Link2, MessageSquareText, Cpu, CalendarCheck } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Connect your calendar",
      description: "Link your Google Calendar account securely using Descope authentication.",
      icon: Link2,
    },
    {
      number: "02",
      title: "Tell Calby what you need",
      description: "Type natural messages like 'Find 30m with Sarah' or 'Move client call to Friday'.",
      icon: MessageSquareText,
    },
    {
      number: "03",
      title: "Calby understands your request",
      description: "AI analyzes your request, checks conflict availability, and resolves timezones.",
      icon: Cpu,
    },
    {
      number: "04",
      title: "Calby handles the calendar",
      description: "Events are instantly created or updated directly in your Google Calendar.",
      icon: CalendarCheck,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-lime-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl lg:text-5xl font-medium text-white tracking-tight leading-tight mb-6">
            Your calendar, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              handled by AI.
            </span>
          </h2>
          <p className="text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Four simple steps to transform your scheduling experience.
          </p>
        </ScrollReveal>

        {/* Steps Grid */}
        <div className="relative">
          {/* Subtle Horizontal Connecting Line for Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-px bg-gradient-to-r from-lime-400/0 via-lime-400/20 to-lime-400/0 -translate-y-6 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.number} delay={idx * 80} className="h-full">
                  <div className="h-full group glass-card rounded-[2rem] p-7 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/90 hover:border-lime-400/40 transition-all duration-200 shadow-xl flex flex-col justify-between">
                    <div>
                      {/* Header: Number & Icon */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="font-mono text-2xl font-bold text-lime-400 tracking-wider">
                          {step.number}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Step Title */}
                      <h3 className="text-xl font-medium text-white mb-3">
                        {step.title}
                      </h3>

                      {/* Step Description */}
                      <p className="text-sm text-zinc-400 font-light leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
