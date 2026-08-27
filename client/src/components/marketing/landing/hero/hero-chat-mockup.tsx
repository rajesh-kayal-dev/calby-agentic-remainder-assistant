"use client";

import React from "react";
import {
  Bell,
  Calendar,
  CreditCard,
  Sparkles,
  Check,
} from "lucide-react";

export function GmailSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6.5C2 5.12 3.12 4 4.5 4H6V14.5L2 11.5V6.5Z" fill="#E24B4A" />
      <path d="M22 6.5C22 5.12 20.88 4 19.5 4H18V14.5L22 11.5V6.5Z" fill="#00832D" />
      <path d="M18 4H6L12 9.5L18 4Z" fill="#EA4335" />
      <path d="M6 14.5V4H4.5C3.12 4 2 5.12 2 6.5V17.5C2 18.88 3.12 20 4.5 20H6V14.5Z" fill="#C5221F" />
      <path d="M18 14.5V4H19.5C20.88 4 22 5.12 22 6.5V17.5C22 18.88 20.88 20 19.5 20H18V14.5Z" fill="#188038" />
      <path d="M6 20V14.5L12 19L18 14.5V20H6Z" fill="#F4B400" />
      <path d="M12 9.5L6 14.5H18L12 9.5Z" fill="#FBBC04" />
    </svg>
  );
}

export function WhatsAppSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#25D366" />
      <path
        d="M17.5 14.3C17.2 14.1 15.7 13.4 15.5 13.3C15.2 13.2 15 13.2 14.8 13.5C14.6 13.8 14 14.5 13.8 14.7C13.7 14.9 13.5 14.9 13.2 14.7C12.9 14.6 11.9 14.3 10.8 13.3C9.9 12.5 9.3 11.5 9.2 11.2C9 10.9 9.1 10.8 9.3 10.6C9.4 10.5 9.6 10.3 9.7 10.1C9.9 9.9 9.9 9.8 10 9.6C10.1 9.4 10.1 9.2 10 9.1C9.9 8.9 9.3 7.4 9.1 6.8C8.8 6.3 8.6 6.3 8.4 6.3C8.2 6.3 8 6.3 7.8 6.3C7.6 6.3 7.3 6.4 7 6.7C6.7 7 6 7.7 6 9.2C6 10.7 7.1 12.1 7.2 12.3C7.4 12.5 9.3 15.5 12.3 16.8C13 17.1 13.6 17.3 14 17.4C14.8 17.7 15.4 17.6 15.9 17.6C16.5 17.5 17.7 16.8 18 16.1C18.2 15.4 18.2 14.8 18.1 14.7C18 14.6 17.8 14.5 17.5 14.3Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function TelegramSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#2AABEE" />
      <path
        d="M8.2 11.9L16 8.5C16.4 8.3 16.7 8.6 16.6 9L15.3 15.1C15.2 15.6 14.8 15.7 14.4 15.5L12 13.7L10.8 14.8C10.7 14.9 10.6 15 10.4 15L10.6 12.2L15.7 7.6C15.9 7.4 15.7 7.3 15.4 7.5L9.1 11.4L6.4 10.6C5.8 10.4 5.8 10 6.5 9.7L16 6C16.5 5.8 16.9 6.1 16.7 6.7L15 15C14.9 15.5 14.5 15.6 14.1 15.3L11.5 13.4L10.3 14.6C10.1 14.8 10 14.9 9.7 14.9L9.9 12L15.2 7.2"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function SmsSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#0284C7" />
      <path
        d="M7 8C7 7.45 7.45 7 8 7H16C16.55 7 17 7.45 17 8V13C17 13.55 16.55 14 16 14H10.5L8 16.5V14H8C7.45 14 7 13.55 7 13V8Z"
        fill="#FFFFFF"
      />
      <circle cx="10" cy="10.5" r="0.9" fill="#0284C7" />
      <circle cx="12" cy="10.5" r="0.9" fill="#0284C7" />
      <circle cx="14" cy="10.5" r="0.9" fill="#0284C7" />
    </svg>
  );
}

export function HeroChatMockup() {
  return (
    <div className="relative w-full max-w-[540px] mx-auto lg:max-w-none min-h-[560px] flex items-center justify-center select-none pt-20 sm:pt-24">
      {/* Background Orbiting Rings & Ambient Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Soft Radial Ambient Glow */}
        <div className="w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] rounded-full bg-lime-500/10 blur-[90px]" />
        
        {/* Subtle Orbit Rings */}
        <div className="absolute top-8 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-full border border-lime-500/15" />
        <div className="absolute top-4 w-[440px] h-[440px] sm:w-[540px] sm:h-[540px] rounded-full border border-lime-500/10" />

        {/* Orbit Dots (Matching Reference Image) */}
        <div className="absolute top-10 left-[38%] w-1.5 h-1.5 rounded-full bg-lime-400/80 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
        <div className="absolute top-26 right-[26%] w-1.5 h-1.5 rounded-full bg-lime-400/60 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
      </div>

      {/* ========================================================================= */}
      {/* FLOATING CONNECTED APP NODES (MATCHING REFERENCE IMAGE 1:1) */}
      {/* ========================================================================= */}

      {/* 1. Gmail Node (Glowing Glass Square on Left Orbit Curve) */}
      <div className="absolute top-2 left-[18%] sm:left-[22%] -translate-x-1/2 z-20 animate-orbit-1">
        <div
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-zinc-900/85 border border-lime-400/30 p-2.5 shadow-[0_0_20px_rgba(163,230,53,0.18)] backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform cursor-default"
          title="Gmail Integration"
        >
          <GmailSvg className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      </div>

      {/* 2. WhatsApp Node (Glowing Glass Square on Center-Top Orbit Curve) */}
      <div className="absolute -top-3 sm:-top-1 left-[42%] -translate-x-1/2 z-20 animate-orbit-2">
        <div
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-zinc-900/85 border border-lime-400/30 p-2.5 shadow-[0_0_20px_rgba(163,230,53,0.18)] backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform cursor-default"
          title="WhatsApp Integration"
        >
          <WhatsAppSvg className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      </div>

      {/* 3. SMS Node (Glowing Glass Square on Center-Right Orbit Curve) */}
      <div className="absolute top-3 sm:top-5 left-[62%] sm:left-[64%] -translate-x-1/2 z-20 animate-orbit-3">
        <div
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-zinc-900/85 border border-lime-400/30 p-2.5 shadow-[0_0_20px_rgba(163,230,53,0.18)] backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform cursor-default"
          title="SMS Integration"
        >
          <SmsSvg className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      </div>

      {/* 4. Telegram Node (Glowing Glass Square on Right Orbit Curve) */}
      <div className="absolute top-28 sm:top-32 -right-1 sm:right-2 z-20 animate-orbit-1">
        <div
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-zinc-900/85 border border-lime-400/30 p-2.5 shadow-[0_0_20px_rgba(163,230,53,0.18)] backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform cursor-default"
          title="Telegram Integration"
        >
          <TelegramSvg className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      </div>

      {/* 5. Connected Speech Card (Top Right Orbit Pocket Matching Reference) */}
      <div className="absolute -top-3 sm:-top-2 right-0 sm:right-2 z-30 hidden sm:block">
        <div className="px-3.5 py-2 rounded-xl bg-zinc-950/90 border border-lime-400/30 shadow-[0_0_25px_rgba(0,0,0,0.8)] backdrop-blur-md space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-400">
            <span>Connected</span>
            <Check className="w-3.5 h-3.5 text-lime-400" />
          </div>
          <p className="text-[10px] text-zinc-400 font-sans leading-tight">
            Gmail, WhatsApp, <br />SMS & Telegram
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CENTRAL MAIN CALBY ASSISTANT CARD (Phone/Widget Shape) */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-[315px] sm:max-w-[335px] rounded-[2rem] border border-white/15 bg-zinc-950/95 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl ring-1 ring-lime-400/25 -translate-x-2 sm:-translate-x-6 mt-4">
        {/* Card Header */}
        <div className="flex items-center gap-3 pb-3.5 mb-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-lime-400/40 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(163,230,53,0.3)]">
            <img
              src="/logo.png"
              alt="Calby Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
              <span>Calby Assistant</span>
            </h3>
            <p className="text-[11px] text-zinc-400 font-light">Always here. Always helpful.</p>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="space-y-3 mb-5">
          {/* User Request Bubble */}
          <div className="flex justify-end">
            <div className="bg-zinc-800/90 text-zinc-100 text-xs font-normal p-3 rounded-2xl rounded-tr-sm border border-white/5 max-w-[92%] leading-relaxed shadow-sm">
              Remind me to follow up with Rahul about the proposal tomorrow at 10 AM.
            </div>
          </div>

          {/* Calby Response Bubble */}
          <div className="flex justify-start">
            <div className="bg-lime-400 text-zinc-950 text-xs font-semibold p-3 rounded-2xl rounded-tl-sm shadow-[0_4px_20px_rgba(163,230,53,0.25)] max-w-[92%] flex items-center justify-between gap-2">
              <span>Got it! I’ll remind you tomorrow at 10:00 AM.</span>
              <Check className="w-4 h-4 text-zinc-950 shrink-0" />
            </div>
          </div>
        </div>

        {/* Upcoming Section Inside Main Card */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium px-1">
            Upcoming
          </div>

          {/* Item 1: Follow up with Rahul */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-lime-400/20 hover:border-lime-400/40 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] font-mono text-zinc-400 w-4">①</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-lime-400 truncate">Follow up with Rahul</p>
                <p className="text-[10px] text-zinc-400 font-light">Tomorrow, 10:00 AM</p>
              </div>
            </div>
            <Bell className="w-3.5 h-3.5 text-lime-400 shrink-0" />
          </div>

          {/* Item 2: Team meeting */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] font-mono text-zinc-400 w-4">②</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">Team meeting</p>
                <p className="text-[10px] text-zinc-500 font-light">Today, 3:00 PM</p>
              </div>
            </div>
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </div>

          {/* Item 3: Credit card payment */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] font-mono text-zinc-400 w-4">③</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">Credit card payment</p>
                <p className="text-[10px] text-zinc-500 font-light">25 May, 9:00 AM</p>
              </div>
            </div>
            <CreditCard className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FLOATING SECONDARY CARD 1: Calby Reminders (Notification Center) */}
      {/* ========================================================================= */}
      <div className="absolute top-36 sm:top-40 -right-4 sm:-right-8 z-20 hidden md:block w-[235px] sm:w-[255px] rounded-2xl border border-white/15 bg-zinc-900/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-lime-400/20 animate-float-card hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-lime-400" />
            <span className="text-xs font-semibold text-white">Calby Reminders</span>
          </div>
          <span className="w-4 h-4 rounded-full bg-lime-400 text-zinc-950 font-bold text-[9px] flex items-center justify-center">
            2
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-3 h-3 text-lime-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-200 truncate">Follow up with Rahul</p>
                <p className="text-[9px] text-zinc-500">Tomorrow, 10:00 AM</p>
              </div>
            </div>
            <span className="text-[9px] font-medium text-lime-400 bg-lime-400/10 border border-lime-400/20 px-1.5 py-0.5 rounded-full shrink-0">
              Due soon
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <CreditCard className="w-3 h-3 text-lime-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-200 truncate">Credit card payment</p>
                <p className="text-[9px] text-zinc-500">25 May, 9:00 AM</p>
              </div>
            </div>
            <span className="text-[9px] font-medium text-lime-400 bg-lime-400/10 border border-lime-400/20 px-1.5 py-0.5 rounded-full shrink-0">
              Due soon
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FLOATING SECONDARY CARD 2: Smart Summary Card */}
      {/* ========================================================================= */}
      <div className="absolute bottom-1 sm:bottom-3 -right-2 sm:-right-6 z-20 hidden md:block w-[235px] sm:w-[255px] rounded-2xl border border-white/15 bg-zinc-900/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-lime-400/20 animate-float-reverse-card hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
          <div className="flex items-center gap-1.5 text-lime-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold text-white">Smart Summary</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 text-[11px] text-zinc-300">
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 inline-block" />
              <strong className="text-white font-semibold">3 tasks</strong> pending
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400/60 inline-block" />
              <strong className="text-white font-semibold">1 meeting</strong> today
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400/40 inline-block" />
              <strong className="text-white font-semibold">1 payment</strong> due
            </p>
          </div>

          {/* Circular Progress Gauge */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-lime-400"
                strokeDasharray="75, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-white font-mono leading-none">75%</span>
              <span className="text-[8px] text-zinc-400 uppercase tracking-tighter">On Track</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
