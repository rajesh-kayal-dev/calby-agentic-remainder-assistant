"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized?: boolean;
      init: () => void;
      destroy?: () => void;
    };
  }
}

export function CalbyBackground() {
  useEffect(() => {
    // Dynamically load and initialize UnicornStudio script
    const loadAndInitUnicorn = () => {
      if (window.UnicornStudio) {
        window.UnicornStudio.init();
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
        // If script tag already exists in head/body, wait for window.UnicornStudio
        const checkInterval = setInterval(() => {
          if (window.UnicornStudio) {
            clearInterval(checkInterval);
            window.UnicornStudio.init();
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 3000);
      }
    };

    loadAndInitUnicorn();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 3D WebGL Canvas Layer */}
      <div
        className="absolute inset-0 h-full w-full opacity-90"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)",
        }}
      >
        <div
          data-us-project="yWZ2Tbe094Fsjgy9NRnD"
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* Subtle Dark Atmospheric & Lime Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[550px] w-[900px] bg-lime-500/10 rounded-full blur-[130px] pointer-events-none" />
    </div>
  );
}
