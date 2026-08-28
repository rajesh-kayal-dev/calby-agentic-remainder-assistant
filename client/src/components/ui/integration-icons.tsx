"use client";

import React from "react";

export function GoogleCalendarIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[#131418] border border-zinc-800/80 p-1.5 shadow-sm ${className}`}>
      <GoogleCalendarLogoSVG className="w-full h-full" />
    </div>
  );
}

export function GmailIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[#131418] border border-zinc-800/80 p-1.5 shadow-sm ${className}`}>
      <GmailLogoSVG className="w-full h-full" />
    </div>
  );
}

export function SlackIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[#131418] border border-zinc-800/80 p-1.5 shadow-sm ${className}`}>
      <SlackLogoSVG className="w-full h-full" />
    </div>
  );
}

export function GoogleDriveIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[#131418] border border-zinc-800/80 p-1.5 shadow-sm ${className}`}>
      <GoogleDriveLogoSVG className="w-full h-full" />
    </div>
  );
}

export function GoogleDocsIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[#131418] border border-zinc-800/80 p-1.5 shadow-sm ${className}`}>
      <GoogleDocsLogoSVG className="w-full h-full" />
    </div>
  );
}

export function NotionIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[#131418] border border-zinc-800/80 p-1.5 shadow-sm ${className}`}>
      <NotionLogoSVG className="w-full h-full" />
    </div>
  );
}

export function WhatsAppIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[#131418] border border-zinc-800/80 p-1 shadow-sm ${className}`}>
      <WhatsAppLogoSVG className="w-full h-full" />
    </div>
  );
}

export function TelegramIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[#131418] border border-zinc-800/80 p-1 shadow-sm ${className}`}>
      <TelegramLogoSVG className="w-full h-full" />
    </div>
  );
}

/* RAW UNWRAPPED SVG BRAND LOGOS FOR FEATURE LISTS & BADGES */
export function GoogleCalendarLogoSVG({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} fill="none">
      <path fill="#4285F4" d="M38 12H10c-1.1 0-2 .9-2 2v24c0 1.1.9 2 2 2h28c1.1 0 2-.9 2-2V14c0-1.1-.9-2-2-2z"/>
      <path fill="#34A853" d="M38 12h-6v28h6c1.1 0 2-.9 2-2V14c0-1.1-.9-2-2-2z"/>
      <path fill="#FBBC05" d="M16 8h16v4H16z"/>
      <path fill="#EA4335" d="M10 12c-1.1 0-2 .9-2 2v6h32v-6c0-1.1-.9-2-2-2H10z"/>
      <text x="24" y="32" fill="#FFFFFF" fontSize="15" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif">31</text>
    </svg>
  );
}

export function GmailLogoSVG({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} fill="none">
      <path fill="#4285F4" d="M10 38V18.5L24 29l14-10.5V38c0 1.1-.9 2-2 2H12c-1.1 0-2-.9-2-2z"/>
      <path fill="#34A853" d="M38 12.5V18.5L24 29 10 18.5V12.5c0-1.7 1.9-2.7 3.3-1.7L24 18l10.7-7.2c1.4-1 3.3 0 3.3 1.7z"/>
      <path fill="#EA4335" d="M10 18.5V12.5c0-1.7 1.9-2.7 3.3-1.7L24 18 10 18.5z"/>
      <path fill="#FBBC05" d="M38 18.5V12.5c0-1.7-1.9-2.7-3.3-1.7L24 18l14 .5z"/>
    </svg>
  );
}

export function SlackLogoSVG({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 127 127" className={`shrink-0 ${className}`} fill="none">
      <path d="M27.3 80c0 7.3-5.9 13.3-13.3 13.3C6.7 93.3.8 87.4.8 80c0-7.3 5.9-13.3 13.3-13.3h13.2V80zm6.7 0c0-7.3 5.9-13.3 13.3-13.3 7.3 0 13.3 5.9 13.3 13.3v33.3c0 7.3-5.9 13.3-13.3 13.3-7.3 0-13.3-5.9-13.3-13.3V80z" fill="#E01E5A"/>
      <path d="M47.3 27.3c-7.3 0-13.3-5.9-13.3-13.3C34 .7 39.9.8 47.3.8c7.3 0 13.3 5.9 13.3 13.3v13.2H47.3zm0 6.7c7.3 0 13.3 5.9 13.3 13.3 0 7.3-5.9 13.3-13.3 13.3H14C6.7 60.6.8 54.7.8 47.3c0-7.3 5.9-13.3 13.3-13.3h33.2z" fill="#36C5F0"/>
      <path d="M99.7 47.3c0-7.3 5.9-13.3 13.3-13.3 7.3 0 13.3 5.9 13.3 13.3 0 7.3-5.9 13.3-13.3 13.3H99.7V47.3zm-6.7 0c0 7.3-5.9 13.3-13.3 13.3-7.3 0-13.3-5.9-13.3-13.3V14c0-7.3 5.9-13.3 13.3-13.3 7.3 0 13.3 5.9 13.3 13.3v33.3z" fill="#2EB67D"/>
      <path d="M79.7 99.7c7.3 0 13.3 5.9 13.3 13.3 0 7.3-5.9 13.3-13.3 13.3-7.3 0-13.3-5.9-13.3-13.3V99.7h13.3zm0-6.7c-7.3 0-13.3-5.9-13.3-13.3 0-7.3 5.9-13.3 13.3-13.3h33.3c7.3 0 13.3 5.9 13.3 13.3 0 7.3-5.9 13.3-13.3 13.3H79.7z" fill="#ECB22E"/>
    </svg>
  );
}

export function GoogleDriveLogoSVG({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 87.3 78" className={`shrink-0 ${className}`} fill="none">
      <path d="M6.6 66.85l12.45-21.55H87.3L74.85 66.85H6.6z" fill="#FFC107"/>
      <path d="M43.65 2.5L68.5 45.3H43.65L18.8 2.5h24.85z" fill="#0066DA"/>
      <path d="M6.6 66.85L31.45 23.8 43.8 45.3 19.05 66.85H6.6z" fill="#00AC47"/>
      <path d="M43.65 2.5L68.5 45.3H87.3L62.45 2.5H43.65z" fill="#00832D"/>
    </svg>
  );
}

export function GoogleDocsLogoSVG({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} fill="none">
      <path fill="#2196F3" d="M37 42H11c-2.2 0-4-1.8-4-4V10c0-2.2 1.8-4 4-4h18l12 12v20c0 2.2-1.8 4-4 4z"/>
      <path fill="#BBDEFB" d="M29 6v12h12L29 6z"/>
      <path fill="#FFFFFF" d="M15 22h18v2H15zm0 6h18v2H15zm0 6h12v2H15z"/>
    </svg>
  );
}

export function NotionLogoSVG({ className = "size-4 text-white" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`shrink-0 ${className}`} fill="none">
      <rect width="100" height="100" rx="20" fill="#FFFFFF"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M27.5 22.5C25.3 22.5 23.5 24.3 23.5 26.5V73.5C23.5 75.7 25.3 77.5 27.5 77.5H35V36.5L65 77.5H72.5C74.7 77.5 76.5 75.7 76.5 73.5V26.5C76.5 24.3 74.7 22.5 72.5 22.5H65V63.5L35 22.5H27.5Z" fill="#000000"/>
    </svg>
  );
}

export function WhatsAppLogoSVG({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} fill="none">
      <circle cx="24" cy="24" r="22" fill="#25D366"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M33.5 28.3c-.6-.3-3.4-1.7-3.9-1.9-.5-.2-.9-.3-1.3.3-.4.6-1.5 1.9-1.8 2.3-.3.4-.7.4-1.3.1-3.1-1.5-5.2-2.7-7.3-6.3-.5-.9.5-.8 1.5-2.8.2-.3.1-.7-.1-1-.2-.3-1.3-3.1-1.8-4.2-.5-1.1-1-1-1.4-1h-1.2c-.4 0-1.1.2-1.7.8s-2.2 2.1-2.2 5.2 2.3 6.1 2.6 6.5c.3.4 4.5 6.9 10.9 9.6 4.3 1.9 5.8 1.7 6.9 1.5 1.8-.3 3.9-1.6 4.4-3.1.6-1.5.6-2.8.4-3.1-.2-.2-.6-.3-1.2-.6z" fill="#FFFFFF"/>
    </svg>
  );
}

export function TelegramLogoSVG({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} fill="none">
      <circle cx="24" cy="24" r="22" fill="#24A1DE"/>
      <path d="M34.8 14.5L11.5 23.5c-1.6.6-1.6 1.5-.3 1.9l6 1.9 13.9-8.7c.7-.4 1.3-.2.8.2L20.6 29l-.4 6c.6 0 .9-.3 1.2-.6l2.9-2.8 6 4.4c1.1.6 1.9.3 2.2-1l3.9-18.5c.4-1.6-.6-2.3-1.6-2z" fill="#FFFFFF"/>
    </svg>
  );
}
