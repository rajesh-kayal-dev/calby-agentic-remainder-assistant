"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { EXTENSION_CONFIG } from "@/config/extension";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Capabilities", href: "#capabilities" },
    { label: "Chrome Extension", href: "/chrome-extension" },
    { label: "Integrations", href: "#integrations" },
    { label: "Security", href: "#security" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
      <div className="flex h-20 max-w-7xl mx-auto px-6 items-center justify-between">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded-lg p-1"
          aria-label="Calby - Home"
        >
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

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-300 hover:text-lime-400 transition-colors focus-visible:outline-none focus-visible:text-lime-400"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden sm:flex items-center gap-4">
          <PWAInstallButton variant="compact" />
          <Link
            href="/sign-in"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-3 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
          >
            Log in
          </Link>
          <Link
            href="/sign-in"
            className="bg-lime-400 hover:bg-lime-300 text-zinc-950 text-sm font-semibold py-2.5 px-5 rounded-full transition-all shadow-[0_0_20px_rgba(163,230,53,0.25)] hover:shadow-[0_0_30px_rgba(163,230,53,0.4)] flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 focus-visible:ring-offset-zinc-950"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* GitHub Repository Link Button at Far Right End */}
          <a
            href={EXTENSION_CONFIG.mainRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3.5 rounded-full bg-zinc-900 border border-white/10 hover:border-lime-400/40 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md group"
            title="GitHub Repository"
            aria-label="GitHub Repository"
          >
            <GithubIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>GitHub</span>
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-zinc-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded-lg"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-zinc-950/95 backdrop-blur-xl px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-zinc-300 hover:text-lime-400 transition-colors py-1.5"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-white/10 flex flex-col space-y-3">
            <Link
              href="/sign-in"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-zinc-300 hover:text-white transition-colors text-center py-2.5 rounded-lg border border-white/10"
            >
              Log in
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-lime-400 hover:bg-lime-300 text-zinc-950 text-base font-semibold py-3 px-5 rounded-full transition-all shadow-[0_0_20px_rgba(163,230,53,0.25)] text-center flex items-center justify-center gap-2"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={EXTENSION_CONFIG.mainRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-zinc-300 hover:text-white transition-colors text-center py-2.5 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center gap-2"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
