"use client";

import { Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingAudienceTicker() {
  const audiences = [
    "Busy Professionals",
    "Freelancers",
    "Small Business Owners",
    "Consultants",
    "Product Leaders",
    "Founders",
    "Remote Teams",
    "Developers",
  ];

  return (
    <section
      aria-label="Built for multi-taskers"
      className="py-14 sm:py-16 relative overflow-hidden border-y border-white/5 bg-zinc-950/40"
    >
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal delay={0}>
          {/* Section Heading */}
          <div className="text-center mb-8">
            <p className="uppercase text-[11px] font-semibold text-zinc-500 tracking-widest">
              Built for people who juggle multiple priorities
            </p>
          </div>

          {/* Ticker Container with edge gradient masks */}
          <div
            className="overflow-hidden relative select-none"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
            }}
          >
            {/* Animated Infinite Ticker Track */}
            <div className="animate-ticker flex items-center py-2 gap-10 sm:gap-14">
              {/* Primary Set */}
              <div className="flex shrink-0 items-center gap-10 sm:gap-14">
                {audiences.map((item, idx) => (
                  <div
                    key={`primary-${idx}`}
                    className="flex items-center gap-2.5 text-zinc-400 hover:text-white transition-colors duration-200 cursor-default"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-lime-400/50" />
                    <span className="text-sm sm:text-base font-medium tracking-tight whitespace-nowrap">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Duplicate Set for Loop */}
              <div
                aria-hidden="true"
                className="flex shrink-0 items-center gap-10 sm:gap-14"
              >
                {audiences.map((item, idx) => (
                  <div
                    key={`duplicate-${idx}`}
                    className="flex items-center gap-2.5 text-zinc-400 hover:text-white transition-colors duration-200 cursor-default"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-lime-400/50" />
                    <span className="text-sm sm:text-base font-medium tracking-tight whitespace-nowrap">
                      {item}
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
