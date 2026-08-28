"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  FileText,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CALBY_PRO_PLAN } from "@/config/subscription-plan";
import { UpgradePaymentModal } from "./upgrade-payment-modal";

export function BillingTab() {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 select-none">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Billing Details
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
          Manage your billing, payment methods and invoices.
        </p>
      </div>

      {/* NO PAYMENT REQUIRED CARD */}
      <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-5 sm:p-6 flex items-start gap-4 shadow-sm">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">
          <CreditCard className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            No payment required right now.
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            You are currently using Calby for free during our launch period.<br />
            Upgrade to Pro anytime to unlock all connections and premium features.
          </p>
        </div>
      </div>

      {/* WANT EVERYTHING CONNECTED BANNER */}
      <div className="rounded-3xl border border-zinc-800 bg-[#111215] p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md">
        {/* Left Side Info */}
        <div className="space-y-4 max-w-lg">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Want everything connected?
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Get 6 months of Calby Pro at a special price.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="flex size-4 items-center justify-center rounded-full bg-lime-400/20 text-lime-400 text-[10px]">✓</span>
              <span>All app connections</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-4 items-center justify-center rounded-full bg-lime-400/20 text-lime-400 text-[10px]">✓</span>
              <span>Unlimited AI assistance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-4 items-center justify-center rounded-full bg-lime-400/20 text-lime-400 text-[10px]">✓</span>
              <span>Smart reminders & follow-ups</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-4 items-center justify-center rounded-full bg-lime-400/20 text-lime-400 text-[10px]">✓</span>
              <span>Priority support</span>
            </div>
          </div>
        </div>

        {/* Right Side Pricing & CTA */}
        <div className="lg:text-right shrink-0 space-y-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
          <span className="inline-block rounded-full border border-lime-400/40 bg-lime-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-400">
            {CALBY_PRO_PLAN.badge}
          </span>

          <div>
            <div className="flex items-center lg:justify-end gap-2">
              <span className="text-sm font-semibold text-zinc-500 line-through">
                {CALBY_PRO_PLAN.originalPrice}
              </span>
              <span className="rounded-full bg-lime-400/20 px-2 py-0.5 text-[10px] font-bold text-lime-400 uppercase">
                {CALBY_PRO_PLAN.discountTag}
              </span>
            </div>

            <div className="flex items-baseline lg:justify-end gap-1 mt-1">
              <span className="text-3xl font-black text-lime-400">
                {CALBY_PRO_PLAN.launchPrice}
              </span>
              <span className="text-xs font-semibold text-zinc-400">
                / {CALBY_PRO_PLAN.duration}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="w-full lg:w-auto rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-extrabold text-xs px-6 py-2.5 transition-all shadow-[0_0_12px_rgba(163,230,53,0.25)] cursor-pointer"
          >
            Upgrade for {CALBY_PRO_PLAN.launchPrice}
          </button>
        </div>
      </div>

      {/* PAYMENT METHODS SECTION */}
      <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-5 space-y-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Payment
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Secure payment powered by our trusted partner.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <div className="flex h-8 px-3 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-extrabold text-blue-400 tracking-wider">
            VISA
          </div>
          <div className="flex h-8 px-3 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-extrabold text-red-400 tracking-wider">
            Mastercard
          </div>
          <div className="flex h-8 px-3 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-extrabold text-orange-400 tracking-wider">
            UPI
          </div>
          <div className="flex h-8 px-3 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-extrabold text-emerald-400 tracking-wider">
            RuPay
          </div>
        </div>
      </div>

      {/* INVOICES & HISTORY SECTION */}
      <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-400">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Invoices & History</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Your invoices and payment history will appear here after getting more a purchase.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHistoryModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-[#16171c] text-zinc-300 hover:text-white px-4 py-2 text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          <span>View history</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* FOOTER SECURITY */}
      <div className="pt-2 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <Lock className="size-3.5 text-zinc-500" />
          <span>Your payments are secure and encrypted.</span>
        </p>
      </div>

      {/* UPGRADE PAYMENT MODAL */}
      <UpgradePaymentModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      {/* INVOICES HISTORY MODAL */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0d0e11] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="size-5 text-lime-400" />
                <h3 className="text-base font-bold text-white">Payment History</h3>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="py-6 text-center space-y-2">
              <p className="text-xs font-semibold text-zinc-300">No transactions recorded yet</p>
              <p className="text-[11px] text-zinc-500">Your receipts will automatically generate here when you make a purchase.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-full bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs px-5 py-2 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
