"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles, X, AlertTriangle, ArrowRight, RefreshCcw } from "lucide-react";
import {
  GoogleCalendarIcon,
  GmailIcon,
  SlackIcon,
  GoogleDriveIcon,
  GoogleDocsIcon,
  NotionIcon,
  WhatsAppIcon,
  TelegramIcon,
} from "@/components/ui/integration-icons";
import { getIntegrationConfig } from "@/lib/integration-suggestions";

interface IntegrationConnectedBannerProps {
  provider: string;
  intendedAction?: string;
  error?: string | null;
  needsReconnect?: boolean;
  onSelectSuggestion: (promptText: string) => void;
  onDismiss: () => void;
  onReconnect?: () => void;
  onGoToIntegrations?: () => void;
}

function getProviderIcon(provider: string) {
  const p = provider.toLowerCase();
  if (p.includes("calendar")) return GoogleCalendarIcon;
  if (p.includes("mail") || p === "gmail") return GmailIcon;
  if (p.includes("drive")) return GoogleDriveIcon;
  if (p.includes("doc")) return GoogleDocsIcon;
  if (p.includes("notion")) return NotionIcon;
  if (p.includes("slack")) return SlackIcon;
  if (p.includes("whatsapp")) return WhatsAppIcon;
  if (p.includes("telegram")) return TelegramIcon;
  return Sparkles;
}

export function IntegrationConnectedBanner({
  provider,
  intendedAction,
  error,
  needsReconnect,
  onSelectSuggestion,
  onDismiss,
  onReconnect,
  onGoToIntegrations,
}: IntegrationConnectedBannerProps) {
  const config = getIntegrationConfig(provider);
  const Icon = getProviderIcon(provider);

  // Case 1: Error State
  if (error) {
    return (
      <div className="mx-auto my-3 w-full max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Couldn&apos;t connect {config.name}
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                The authorization request was cancelled or could not be completed.
              </p>
              <div className="flex items-center gap-2.5 mt-3">
                {onReconnect && (
                  <button
                    type="button"
                    onClick={onReconnect}
                    className="rounded-full bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    Try again
                  </button>
                )}
                {onGoToIntegrations && (
                  <button
                    type="button"
                    onClick={onGoToIntegrations}
                    className="rounded-full border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Back to integrations
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Needs Reconnect State
  if (needsReconnect) {
    return (
      <div className="mx-auto my-3 w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <RefreshCcw className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Your {config.name} connection needs to be renewed
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Session credentials expired. Please reconnect to continue using {config.name} in Calby.
              </p>
              <div className="mt-3">
                {onReconnect && (
                  <button
                    type="button"
                    onClick={onReconnect}
                    className="rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-1.5 text-xs transition-all cursor-pointer shadow-sm"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Connected Successfully + Smart Suggestions Card
  return (
    <div className="mx-auto my-3 w-full max-w-2xl rounded-2xl border border-lime-400/40 bg-[#101311]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md ring-1 ring-lime-400/20 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between gap-3">
        {/* Header with App Icon and Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-md">
            <Icon className="size-6" />
            <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-black shadow-[0_0_6px_rgba(16,185,129,0.8)]">
              <CheckCircle2 className="size-3 text-zinc-950" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {config.name} is connected.
              </h3>
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.2 text-[10px] font-semibold text-emerald-400">
                Connected
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {intendedAction
                ? `You're ready to ${intendedAction.toLowerCase()}.`
                : config.readyMessage}
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Intended Action Button if specified */}
      {intendedAction && (
        <div className="mt-3.5 pt-3 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={() => onSelectSuggestion(intendedAction)}
            className="group flex items-center justify-between w-full rounded-xl border border-lime-400/50 bg-lime-400/10 px-3.5 py-2 text-xs font-semibold text-lime-400 hover:bg-lime-400/20 hover:border-lime-400 transition-all cursor-pointer"
          >
            <span>Continue with: &ldquo;{intendedAction}&rdquo;</span>
            <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Suggested Action Chips */}
      <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-1.5">
        <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="size-3 text-lime-400" />
          <span>Try asking Calby:</span>
        </p>
        <div className="flex flex-wrap gap-2 pt-0.5">
          {config.suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(suggestion)}
              className="rounded-full border border-zinc-800 bg-zinc-900/90 hover:border-lime-400/60 hover:bg-lime-400/10 hover:text-lime-300 text-zinc-300 px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer shadow-sm flex items-center gap-1.5 text-left"
            >
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
