"use client";

import { useEffect } from "react";
import { X, ShieldCheck, Lock, CreditCard, Sparkles, CheckCircle2 } from "lucide-react";
import { CALBY_PRO_PLAN } from "@/config/subscription-plan";

interface UpgradePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradePaymentModal({
  isOpen,
  onClose,
}: UpgradePaymentModalProps) {
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
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-[#0d0e11] p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-zinc-500 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-zinc-800"
          aria-label="Close modal"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
            <CreditCard className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Calby Pro Upgrade</h3>
            <span className="inline-block text-[10px] font-bold text-lime-400 bg-lime-400/10 border border-lime-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
              {CALBY_PRO_PLAN.badge}
            </span>
          </div>
        </div>

        {/* Plan Summary Box */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121316] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Calby Pro (6 Months Access)</span>
            <div className="text-right">
              <span className="text-xs text-zinc-500 line-through mr-1.5">{CALBY_PRO_PLAN.originalPrice}</span>
              <span className="text-base font-extrabold text-lime-400">{CALBY_PRO_PLAN.launchPrice}</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400">{CALBY_PRO_PLAN.paymentNote}</p>
        </div>

        {/* Real Status Notice (Requirement 5) */}
        <div className="rounded-2xl border border-lime-400/30 bg-lime-400/[0.04] p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-lime-400">
            <Lock className="size-4 shrink-0" />
            <span>Payment Setup Coming Soon</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Online payment gateway integration (Cards, UPI, NetBanking) is currently in sandbox setup mode for our launch rollout.
          </p>
          <p className="text-[11px] text-zinc-400">
            Your account currently enjoys Calby Free with complete core capabilities. You will be notified as soon as direct payments open!
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs py-3 transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
