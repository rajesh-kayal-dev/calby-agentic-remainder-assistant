"use client";

import { Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function TrustedBy() {
  const teams = [
    "Startups",
    "Remote Teams",
    "Developers",
    "Freelancers",
    "Agencies",
    "Small Businesses",
    "Consultants",
    "Product Teams",
  ];

  return (
    <section
      aria-label="Trusted by teams"
      className="py-16 sm:py-20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal delay={0}>
          {/* Section Heading */}
          <div className="text-center mb-10">
            <p className="uppercase text-xs font-semibold text-zinc-500 tracking-widest">
              Trusted by teams
            </p>
          </div>

          {/* Ticker Container with edge gradient masks */}
          <div
            className="overflow-hidden relative select-none"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            }}
          >
            {/* Animated Infinite Ticker Track */}
            <div className="animate-ticker flex items-center py-2 gap-12 sm:gap-16">
              {/* Primary Track Set */}
              <div className="flex shrink-0 items-center gap-12 sm:gap-16">
                {teams.map((team, idx) => (
                  <div
                    key={`primary-${idx}`}
                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-200 group cursor-default"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-lime-400/40 group-hover:text-lime-400 transition-colors" />
                    <span className="text-base sm:text-lg font-medium tracking-tight whitespace-nowrap">
                      {team}
                    </span>
                  </div>
                ))}
              </div>

              {/* Duplicate Set for Seamless Infinite Loop (Aria hidden for screen readers) */}
              <div
                aria-hidden="true"
                className="flex shrink-0 items-center gap-12 sm:gap-16"
              >
                {teams.map((team, idx) => (
                  <div
                    key={`duplicate-${idx}`}
                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-200 group cursor-default"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-lime-400/40 group-hover:text-lime-400 transition-colors" />
                    <span className="text-base sm:text-lg font-medium tracking-tight whitespace-nowrap">
                      {team}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
