"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<{ outcome: "accepted" | "dismissed" } | null>;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  promptInstall: async () => null,
});

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if app is already running in standalone display mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    setIsInstalled(Boolean(isStandalone));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return null;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return { outcome: choice.outcome };
    } catch (err) {
      console.warn("[PWA] Install prompt failed:", err);
      return null;
    }
  }, [deferredPrompt]);

  return (
    <PWAContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt) && !isInstalled,
        isInstalled,
        promptInstall,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  return useContext(PWAContext);
}
