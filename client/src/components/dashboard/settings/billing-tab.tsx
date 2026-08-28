"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CALBY_PRO_PLAN } from "@/config/subscription-plan";
import { UpgradePaymentModal } from "./upgrade-payment-modal";
import {
  VisaLogoSVG,
  MastercardLogoSVG,
  UPILogoSVG,
  RuPayLogoSVG,
} from "@/components/ui/payment-icons";

export function BillingTab() {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-12 select-none">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Billing Details
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Manage your billing, payment methods and invoices.
        </p>
      </div>

      {/* NO PAYMENT REQUIRED CARD */}
      <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
          <CreditCard className="size-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-white leading-tight">
            No payment required right now
          </h3>
          <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
            Using Calby for free during launch period. Upgrade to Pro anytime for full unlimited integrations.
          </p>
        </div>
      </div>

      {/* COMPACT & SIMPLIFIED SUBSCRIPTION CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-lime-400/30 bg-gradient-to-br from-[#13170D] via-[#111215] to-[#111215] p-4 sm:p-5 space-y-4 shadow-md">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Calby Pro — Everything Unlocked
                </h2>
                <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-[9px] font-extrabold text-lime-400 uppercase tracking-wider">
                  LAUNCH OFFER
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Full unlimited access to all AI features, connections & notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 shrink-0">
            <ShieldCheck className="size-3.5 shrink-0" />
            <span>Active Plan</span>
          </div>
        </div>

        {/* Compact Feature Highlights (Simplified Tag List) */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800/60">
          {[
            "All AI Features",
            "Unlimited Tasks & Reminders",
            "Google Calendar & Gmail",
            "WhatsApp & Telegram",
            "Slack, Drive & Notion",
            "Notifications & Follow-ups",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] text-zinc-300 font-medium"
            >
              <Check className="size-3 text-lime-400 stroke-[3]" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Compact Price & Action Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-lime-400">
              {CALBY_PRO_PLAN.launchPrice}
            </span>
            <span className="text-xs text-zinc-500 line-through">
              {CALBY_PRO_PLAN.originalPrice}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              / {CALBY_PRO_PLAN.duration}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs px-5 py-2 transition-all shadow-md shadow-lime-400/20 cursor-pointer"
          >
            {CALBY_PRO_PLAN.ctaText}
          </button>
        </div>
      </div>

      {/* PAYMENT METHODS SECTION */}
      <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-4 sm:p-5 space-y-3 shadow-sm">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Payment
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Secure payment powered by our trusted partner.
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-0.5 flex-wrap">
          <div className="flex h-9 px-3.5 items-center justify-center rounded-xl border border-zinc-800/90 bg-zinc-900/90 shadow-sm transition-transform hover:scale-105">
            <VisaLogoSVG className="h-4 w-auto" />
          </div>
          <div className="flex h-9 px-3.5 items-center justify-center rounded-xl border border-zinc-800/90 bg-zinc-900/90 shadow-sm transition-transform hover:scale-105">
            <MastercardLogoSVG className="h-5.5 w-auto" />
          </div>
          <div className="flex h-9 px-3.5 items-center justify-center rounded-xl border border-zinc-800/90 bg-zinc-900/90 shadow-sm transition-transform hover:scale-105">
            <UPILogoSVG className="h-4 w-auto" />
          </div>
          <div className="flex h-9 px-3.5 items-center justify-center rounded-xl border border-zinc-800/90 bg-zinc-900/90 shadow-sm transition-transform hover:scale-105">
            <RuPayLogoSVG className="h-4 w-auto" />
          </div>
        </div>
      </div>

      {/* INVOICES & HISTORY SECTION */}
      <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-lime-400">
            <FileText className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Invoices & History</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Your invoices will appear here after a purchase.
            </p>
          </div>
        </div>
      </div>

      <UpgradePaymentModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </div>
  );
}
