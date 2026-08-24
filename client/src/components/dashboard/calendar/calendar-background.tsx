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

export function CalendarBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    if (!mediaQuery.matches) {
      const loadAndInit = () => {
        if (window.UnicornStudio) {
          window.UnicornStudio.isInitialized = false;
          try {
            window.UnicornStudio.init();
          } catch {
            // ignore
          }
          return;
        }

        const existingScript = document.getElementById("unicorn-studio-script");
        if (!existingScript) {
          const script = document.createElement("script");
          script.id = "unicorn-studio-script";
          script.src =
            "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
          script.async = true;
          script.onload = () => {
            if (window.UnicornStudio) {
              window.UnicornStudio.init();
            }
          };
          document.body.appendChild(script);
        } else {
          // If script tag exists, poll until window.UnicornStudio is available
          let count = 0;
          const interval = setInterval(() => {
            count++;
            if (window.UnicornStudio) {
              clearInterval(interval);
              window.UnicornStudio.isInitialized = false;
              window.UnicornStudio.init();
            }
            if (count > 30) clearInterval(interval);
          }, 100);
        }
      };

      loadAndInit();
      const retryTimer = setTimeout(loadAndInit, 300);

      return () => {
        clearTimeout(retryTimer);
        mediaQuery.removeEventListener("change", handleChange);
      };
    }

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      {/* Unicorn Studio 3D WebGL Canvas Layer */}
      {!reducedMotion ? (
        <div
          className="aura-background-component absolute inset-0 h-full w-full opacity-85 z-0"
          data-alpha-mask="100"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent, black 0%, black 100%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 0%, black 100%, transparent)",
          }}
        >
          <div
            data-us-project="ZPruWnhzwuk5Tf6nc1q0"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : null}

      {/* Dark Scrim to guarantee maximum text contrast and readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-[1]" />

      {/* Subtle Ambient Lime Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[350px] w-[700px] bg-lime-400/10 rounded-full blur-[120px] pointer-events-none z-[1]" />
    </div>
  );
}
