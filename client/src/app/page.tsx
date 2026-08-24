"use client";

import { useSession } from "@descope/nextjs-sdk/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CalbyBackground } from "@/components/ui/CalbyBackground";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AIAssistant } from "@/components/landing/AIAssistant";
import { Integrations } from "@/components/landing/Integrations";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function RootPage() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;

    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isSessionLoading, router]);

  if (isSessionLoading) {
    return (
      <div className="app-shell-bg flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading Calby...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-zinc-950 text-zinc-300 selection:bg-lime-400 selection:text-zinc-950 relative">
      <CalbyBackground />
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <TrustedBy />
          <ProductShowcase />
          <Features />
          <HowItWorks />
          <AIAssistant />
          <Integrations />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
