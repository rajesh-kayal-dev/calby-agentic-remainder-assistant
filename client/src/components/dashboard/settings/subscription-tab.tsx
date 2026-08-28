"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Gift,
  ShieldCheck,
  RefreshCcw,
  Headphones,
  Check,
  Bell,
  Calendar,
  Mail,
  Send,
  MessageSquare,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CALBY_PRO_PLAN, CALBY_FREE_PLAN } from "@/config/subscription-plan";
import {
  GoogleCalendarLogoSVG,
  GmailLogoSVG,
  SlackLogoSVG,
  GoogleDriveLogoSVG,
  NotionLogoSVG,
  WhatsAppLogoSVG,
  TelegramLogoSVG,
} from "@/components/ui/integration-icons";
import { FreePlanModal } from "./free-plan-modal";
import { UpgradePaymentModal } from "./upgrade-payment-modal";

interface SubscriptionTabProps {
  onBackToDashboard?: () => void;
}

export function SubscriptionTab({ onBackToDashboard }: SubscriptionTabProps) {
  const [freeModalOpen, setFreeModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Icon Resolver Helper
  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case "sparkles":
        return <Sparkles className="size-4 text-lime-400 shrink-0" />;
      case "check":
        return <CheckCircle2 className="size-4 text-lime-400 shrink-0" />;
      case "calendar":
        return <GoogleCalendarLogoSVG className="size-4 shrink-0" />;
      case "gmail":
        return <GmailLogoSVG className="size-4 shrink-0" />;
      case "whatsapp":
        return <WhatsAppLogoSVG className="size-4 shrink-0" />;
      case "telegram":
        return <TelegramLogoSVG className="size-4 shrink-0" />;
      case "slack":
        return <SlackLogoSVG className="size-4 shrink-0" />;
      case "drive":
        return <GoogleDriveLogoSVG className="size-4 shrink-0" />;
      case "notion":
        return <NotionLogoSVG className="size-4 shrink-0" />;
      case "bell":
        return <Bell className="size-4 text-lime-400 shrink-0" />;
      default:
        return <Check className="size-4 text-lime-400 shrink-0" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 select-none">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Subscription & Plan
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
          Choose what works for you. Change or cancel anytime.
        </p>
      </div>

      {/* SPECIAL LAUNCH OFFER CARD */}
      <div className="relative rounded-3xl border border-lime-400/50 bg-[#0d0e11] p-6 sm:p-8 shadow-xl space-y-6 overflow-hidden">
        {/* Card Header & Price Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-lime-400">
              {CALBY_PRO_PLAN.badge}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {CALBY_PRO_PLAN.title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
              {CALBY_PRO_PLAN.description}
            </p>
          </div>

          {/* Pricing Stack */}
          <div className="md:text-right shrink-0">
            <div className="flex items-center md:justify-end gap-2">
              <span className="text-sm font-semibold text-zinc-500 line-through">
                {CALBY_PRO_PLAN.originalPrice}
              </span>
              <span className="rounded-full bg-lime-400/20 px-2 py-0.5 text-[10px] font-extrabold text-lime-400 uppercase">
                {CALBY_PRO_PLAN.discountTag}
              </span>
            </div>

            <div className="flex items-baseline md:justify-end gap-1.5 mt-1">
              <span className="text-4xl font-black tracking-tight text-lime-400">
                {CALBY_PRO_PLAN.launchPrice}
              </span>
              <span className="text-xs font-semibold text-zinc-400">
                / {CALBY_PRO_PLAN.duration}
              </span>
            </div>

            <p className="text-[11px] font-medium text-zinc-500 mt-1">
              {CALBY_PRO_PLAN.paymentNote}
            </p>
          </div>
        </div>

        {/* Included Features 2-Column Grid */}
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-2">
            {CALBY_PRO_PLAN.features.map((feat) => (
              <div key={feat.id} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-200">
                {getFeatureIcon(feat.iconName)}
                <span>{feat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary CTA & Payment Note */}
        <div className="pt-2 flex flex-col items-end space-y-1.5">
          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="rounded-full bg-lime-400 hover:bg-lime-300 text-zinc-950 font-extrabold text-xs px-6 py-2.5 transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)] cursor-pointer"
          >
            {CALBY_PRO_PLAN.ctaText}
          </button>
          <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 pr-2">
            <Lock className="size-3 text-zinc-500" />
            <span>Secure payment</span>
          </div>
        </div>
      </div>

      {/* FREE PLAN SECTION CARD */}
      <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-400">
            <Gift className="size-5 text-lime-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {CALBY_FREE_PLAN.title}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {CALBY_FREE_PLAN.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFreeModalOpen(true)}
          className="rounded-xl border border-zinc-800 bg-[#16171c] text-zinc-300 hover:text-white hover:border-zinc-700 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          {CALBY_FREE_PLAN.ctaText}
        </button>
      </div>

      {/* 3 TRUST / GUARANTEE BADGES ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="rounded-2xl border border-zinc-800/80 bg-[#111215] p-4 flex items-start gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Cancel anytime</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
              No lock-ins. Cancel whenever you want.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-[#111215] p-4 flex items-start gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
            <RefreshCcw className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Your data is safe</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
              Your data remains secure and private with Calby.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-[#111215] p-4 flex items-start gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
            <Headphones className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Priority support</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
              Get faster help and personalized support.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER NOTICE */}
      <div className="pt-2 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <Sparkles className="size-3.5 text-yellow-400" />
          <span>Launch offer valid for a limited time only.</span>
        </p>
      </div>

      {/* FREE PLAN ONBOARDING FLOW MODAL */}
      <FreePlanModal
        isOpen={freeModalOpen}
        onClose={() => setFreeModalOpen(false)}
        onGoToDashboard={onBackToDashboard}
      />

      {/* UPGRADE PAYMENT MODAL */}
      <UpgradePaymentModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </div>
  );
}
