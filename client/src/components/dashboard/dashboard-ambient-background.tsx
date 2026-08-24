"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized?: boolean;
      init: () => void;
      destroy?: () => void;
    };
  }
}

interface DashboardAmbientBackgroundProps {
  /** Optional custom class name */
  className?: string;
  /** Ambient layer opacity (default: 55%) */
  opacity?: number;
  /** Whether to show subtle green atmospheric glow (default: true) */
  showGlow?: boolean;
}

export function DashboardAmbientBackground({
  className = "",
  opacity = 0.55,
  showGlow = true,
}: DashboardAmbientBackgroundProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    if (mediaQuery.matches) {
      return () => mediaQuery.removeEventListener("change", handleMotionChange);
    }

    const runInit = () => {
      if (window.UnicornStudio) {
        try {
          window.UnicornStudio.isInitialized = false;
          window.UnicornStudio.init();
        } catch (e) {
          console.error("UnicornStudio init error:", e);
        }
      }
    };

    const existingScript = document.getElementById("unicorn-studio-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "unicorn-studio-script";
      script.src =
        "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
      script.async = true;
      script.onload = () => {
        runInit();
        setTimeout(runInit, 150);
        setTimeout(runInit, 500);
      };
      document.body.appendChild(script);
    } else {
      runInit();
      const t1 = setTimeout(runInit, 100);
      const t2 = setTimeout(runInit, 350);
      const t3 = setTimeout(runInit, 800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        mediaQuery.removeEventListener("change", handleMotionChange);
      };
    }

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden select-none bg-[#050505] ${className}`}
    >
      {/* 1. Deep Black Base Layer (#050505) */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* 2. Unicorn Studio AI Ambient Animation Layer with Vibrant Calby Green Color Transform */}
      {!reducedMotion ? (
        <div
          className="aura-background-component absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 ease-out"
          data-alpha-mask="100"
          style={{
            opacity,
            filter: "hue-rotate(145deg) saturate(2.0) brightness(1.25)",
            WebkitFilter: "hue-rotate(145deg) saturate(2.0) brightness(1.25)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          }}
        >
          <div
            data-us-project="ZPruWnhzwuk5Tf6nc1q0"
            className="absolute inset-0 w-full h-full"
          />
        </div>
      ) : null}

      {/* 3. Calby Green Atmospheric Glow (#102000 base with #9CFF00 / #62D900 highlights) */}
      {showGlow ? (
        <>
          {/* Deep dark green ambient base */}
          <div
            className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full blur-[150px]"
            style={{ backgroundColor: "rgba(16, 32, 0, 0.55)" }}
          />
          {/* Soft neon-green core highlight (#9CFF00) */}
          <div
            className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[650px] rounded-full blur-[120px]"
            style={{ backgroundColor: "rgba(156, 255, 0, 0.08)" }}
          />
        </>
      ) : null}
    </div>
  );
}
