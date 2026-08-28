"use client";

import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  PartyPopper,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface FreePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToDashboard?: () => void;
}

export function FreePlanModal({
  isOpen,
  onClose,
  onGoToDashboard,
}: FreePlanModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#0d0e11] p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-zinc-500 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-zinc-800"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>

        {/* STEP 1: ENJOY CALBY FREE */}
        {step === 1 && (
          <div className="text-center space-y-6 pt-2 animate-in fade-in duration-200">
            {/* Confetti Party Banner Graphic */}
            <div className="relative flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.2)]">
                <PartyPopper className="size-8 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Enjoy Calby Free!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                You can continue using Calby without upgrading. Happy exploring!
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5 text-xs font-semibold text-lime-400">
              <Check className="size-4 stroke-[3]" />
              <span>All core features are available</span>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-sm py-3 transition-all cursor-pointer shadow-[0_0_15px_rgba(163,230,53,0.3)]"
              >
                Continue to Calby
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ORBITING INTEGRATIONS ANIMATION */}
        {step === 2 && (
          <div className="text-center space-y-6 pt-1 animate-in fade-in duration-200">
            {/* Center Calby Logo with Orbiting Integration Badges */}
            <div className="relative flex items-center justify-center py-6">
              {/* Central Calby Icon */}
              <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-lime-400 text-zinc-950 font-black text-2xl shadow-[0_0_25px_rgba(163,230,53,0.4)]">
                C
              </div>

              {/* Orbiting Ring Icons (Google Calendar, Gmail, WhatsApp, Telegram, Slack, Drive, Docs, Notion) */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Google Calendar (Top Left) */}
                <div className="absolute -top-1 left-12 animate-pulse">
                  <GoogleCalendarIcon className="size-8" />
                </div>
                {/* Gmail (Top Right) */}
                <div className="absolute -top-1 right-12 animate-pulse delay-100">
                  <GmailIcon className="size-8" />
                </div>
                {/* WhatsApp (Middle Left) */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 animate-pulse delay-200">
                  <WhatsAppIcon className="size-8" />
                </div>
                {/* Telegram (Middle Right) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-pulse delay-300">
                  <TelegramIcon className="size-8" />
                </div>
                {/* Drive (Bottom Left) */}
                <div className="absolute -bottom-1 left-12 animate-pulse delay-400">
                  <GoogleDriveIcon className="size-8" />
                </div>
                {/* Docs (Bottom Center) */}
                <div className="absolute -bottom-2 top-auto animate-pulse delay-500">
                  <GoogleDocsIcon className="size-8" />
                </div>
                {/* Notion (Bottom Right) */}
                <div className="absolute -bottom-1 right-12 animate-pulse delay-600">
                  <NotionIcon className="size-8" />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                All integrations, all at your fingertips
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Calby connects with the apps you use so you can do more, in one place.
              </p>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="h-1.5 w-6 rounded-full bg-lime-400" />
              <span className="size-1.5 rounded-full bg-zinc-700" />
              <span className="size-1.5 rounded-full bg-zinc-700" />
              <span className="size-1.5 rounded-full bg-zinc-700" />
              <span className="size-1.5 rounded-full bg-zinc-700" />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-sm py-3 transition-all cursor-pointer shadow-[0_0_15px_rgba(163,230,53,0.3)]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: YOU'RE ALL SET */}
        {step === 3 && (
          <div className="text-center space-y-6 pt-2 animate-in fade-in duration-200">
            {/* Green Checkmark Circle Badge */}
            <div className="relative flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-lime-400 text-zinc-950 shadow-[0_0_25px_rgba(163,230,53,0.4)]">
                <Check className="size-9 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                You&apos;re all set!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Calby Free is ready to use. Start adding tasks, connecting apps, and getting more done.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onGoToDashboard) onGoToDashboard();
                }}
                className="w-full rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-sm py-3 transition-all cursor-pointer shadow-[0_0_15px_rgba(163,230,53,0.3)]"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
