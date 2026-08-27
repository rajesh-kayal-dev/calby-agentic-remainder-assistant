"use client";

import { useSession } from "@descope/nextjs-sdk/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CalbyBackground } from "@/components/ui/CalbyBackground";
import { LandingNavbar } from "@/components/marketing/landing/navbar/landing-navbar";
import { LandingHero } from "@/components/marketing/landing/hero/landing-hero";
import { LandingHowItWorks } from "@/components/marketing/landing/product-story/landing-how-it-works";
import { LandingFeatures } from "@/components/marketing/landing/features/landing-features";
import { LandingConversations } from "@/components/marketing/landing/conversations/landing-conversations";
import { LandingSecurity } from "@/components/marketing/landing/security/landing-security";
import { LandingFinalCTA } from "@/components/marketing/landing/cta/landing-final-cta";
import { LandingFooter } from "@/components/marketing/landing/footer/landing-footer";

export default function RootPage() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isSessionLoading, router]);

  return (
    <div className="min-h-svh bg-zinc-950 text-zinc-300 selection:bg-lime-400 selection:text-zinc-950 relative">
      <CalbyBackground />
      <div className="relative z-10">
        <LandingNavbar />
        <main>
          {/* Section 1: Hero */}
          <LandingHero />

          {/* Section 2: How It Works */}
          <LandingHowItWorks />

          {/* Section 3: Core Capabilities */}
          <LandingFeatures />

          {/* Section 4: Real Examples & Compact Integrations */}
          <LandingConversations />

          {/* Section 5: Trust & Privacy */}
          <LandingSecurity />

          {/* Section 6: Final CTA */}
          <LandingFinalCTA />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
