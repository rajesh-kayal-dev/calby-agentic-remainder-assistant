"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { EXTENSION_CONFIG } from "@/config/extension";

function ChromeLogoSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#1A73E8" />
      <path d="M12 2C16.42 2 20.17 4.89 21.5 8.91L12 12V2Z" fill="#EA4335" />
      <path d="M21.5 8.91C22.25 11.17 22.06 13.68 20.9 15.78L12 12L21.5 8.91Z" fill="#FBBC04" />
      <path d="M20.9 15.78C19.34 18.6 16.56 20.66 13.25 21.57L12 12L20.9 15.78Z" fill="#34A853" />
      <circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="3.2" fill="#1A73E8" />
    </svg>
  );
}

function GooglePlayLogoSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.6 2.62C3.23 3 3 3.58 3 4.34V19.66C3 20.42 3.23 21 3.6 21.38L3.68 21.45L12.38 12.75V12.25L3.68 3.55L3.6 2.62Z" fill="#00D2FF" />
      <path d="M15.28 15.65L12.38 12.75V12.25L15.28 9.35L15.35 9.39L18.78 11.34C19.76 11.9 19.76 12.82 18.78 13.38L15.35 15.33L15.28 15.65Z" fill="#FFC900" />
      <path d="M15.35 15.34L12.38 12.37L3.6 21.15C3.93 21.5 4.46 21.55 5.06 21.21L15.35 15.34Z" fill="#FF3A44" />
      <path d="M15.35 9.39L5.06 3.51C4.46 3.17 3.93 3.23 3.6 3.58L12.38 12.37L15.35 9.39Z" fill="#00F076" />
    </svg>
  );
}

export function LandingFooter() {
  const chromeStoreUrl = process.env.NEXT_PUBLIC_EXTENSION_STORE_URL;

  return (
    <footer className="border-t border-zinc-900 bg-black pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal delay={0}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
            {/* Logo & Description Column */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 pr-4 lg:pr-8">
              <Link href="/" className="flex items-center gap-2 mb-5 group inline-block" aria-label="Calby">
                <img
                  src="/logo.png"
                  alt="Calby Logo"
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
                <img
                  src="/Calby_text.png"
                  alt="Calby"
                  className="h-7 w-auto object-contain"
                />
              </Link>

              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm font-light mb-4">
                Your conversational personal assistant for the things you need to remember, organize, schedule, and follow up.
              </p>
              <p className="text-zinc-600 text-xs font-mono">
                Calendar · Tasks · Money · Reminders · Contacts · Reports
              </p>
            </div>

            {/* PRODUCT */}
            <div>
              <h4 className="text-white text-xs font-semibold mb-5 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-3 text-sm text-zinc-400 font-light">
                <li>
                  <a href="#how-it-works" className="hover:text-lime-400 transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#capabilities" className="hover:text-lime-400 transition-colors">
                    Capabilities
                  </a>
                </li>
                <li>
                  <a href="#capabilities" className="hover:text-lime-400 transition-colors">
                    Reports
                  </a>
                </li>
              </ul>
            </div>

            {/* PLATFORM */}
            <div>
              <h4 className="text-white text-xs font-semibold mb-5 uppercase tracking-wider">
                Platform
              </h4>
              <ul className="space-y-3 text-sm text-zinc-400 font-light">
                <li>
                  <Link href="/chrome-extension" className="hover:text-lime-400 transition-colors">
                    Calby for Chrome
                  </Link>
                </li>
                <li>
                  <a
                    href={EXTENSION_CONFIG.mainRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-lime-400 transition-colors"
                  >
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a href="#integrations" className="hover:text-lime-400 transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-lime-400 transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>

            {/* ACCOUNT */}
            <div>
              <h4 className="text-white text-xs font-semibold mb-5 uppercase tracking-wider">
                Account
              </h4>
              <ul className="space-y-3 text-sm text-zinc-400 font-light">
                <li>
                  <Link href="/sign-in" className="hover:text-lime-400 transition-colors">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="hover:text-lime-400 transition-colors">
                    Get started
                  </Link>
                </li>
              </ul>
            </div>

            {/* APPS & EXTENSIONS (Right Side Download Badges) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <h4 className="text-white text-xs font-semibold mb-5 uppercase tracking-wider">
                Apps & Extension
              </h4>
              <div className="space-y-3">
                {/* Chrome Extension Download Card */}
                <a
                  href={EXTENSION_CONFIG.releaseZipUrl}
                  download
                  className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/10 hover:border-lime-400/40 hover:bg-zinc-800/80 transition-all duration-200 group shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <ChromeLogoSvg className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110" />
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider leading-none mb-1">
                        Chrome Extension
                      </span>
                      <span className="text-xs text-white font-semibold tracking-tight group-hover:text-lime-400 transition-colors">
                        Download Extension (.zip)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-mono font-medium text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2 py-0.5 rounded-full shrink-0">
                    <Download className="w-2.5 h-2.5" />
                    <span>ZIP</span>
                  </div>
                </a>

                {/* Google Play Store Badge */}
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900/70 border border-white/10 hover:border-white/20 transition-all shadow-md group">
                  <div className="flex items-center gap-3">
                    <GooglePlayLogoSvg className="w-6 h-6 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider leading-none mb-1">
                        GET IT ON
                      </span>
                      <span className="text-xs text-zinc-200 font-semibold tracking-tight">
                        Google Play
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-medium text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2 py-0.5 rounded-full shrink-0">
                    Soon
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-600 font-light">
            <p>© {new Date().getFullYear()} Calby. All rights reserved.</p>
            <p className="flex items-center gap-4">
              <span>Secure Authentication</span>
              <span>•</span>
              <span>Isolated Data</span>
              <span>•</span>
              <span>Encrypted Credentials</span>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
