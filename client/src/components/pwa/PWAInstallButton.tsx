"use client";

import React, { useState } from "react";
import { Download, MonitorCheck, Sparkles } from "lucide-react";
import { usePWA } from "@/context/pwa-context";

interface PWAInstallButtonProps {
  className?: string;
  variant?: "pill" | "compact" | "sidebar";
}

export function PWAInstallButton({
  className = "",
  variant = "pill",
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  // If not installable or already running as standalone app, render nothing
  if (!isInstallable || isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await promptInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-lime-400/30 text-lime-400 hover:text-lime-300 hover:border-lime-400/60 text-xs font-semibold transition-all shadow-md cursor-pointer ${className}`}
        title="Install Calby as a Desktop App"
        aria-label="Install Calby App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-lime-400/40 text-xs font-medium text-zinc-300 hover:text-white transition-all group ${className}`}
        title="Install Calby as a Desktop App"
        aria-label="Install Calby App"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform">
            <MonitorCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold">Install Desktop App</span>
        </div>
        <Download className="w-3.5 h-3.5 text-lime-400" />
      </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      disabled={isInstalling}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/90 border border-lime-400/30 hover:border-lime-400 text-lime-400 hover:text-lime-300 text-xs font-semibold transition-all shadow-md shadow-lime-500/5 cursor-pointer ${className}`}
      title="Install Calby Desktop App"
      aria-label="Install Calby App"
    >
      <img src="/icons/icon-192x192.png" alt="Calby" className="w-4 h-4 rounded" />
      <span>Install Calby App</span>
      <Download className="w-3.5 h-3.5 ml-0.5" />
    </button>
  );
}
