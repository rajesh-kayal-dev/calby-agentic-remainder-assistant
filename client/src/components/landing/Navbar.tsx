"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
      <div className="flex h-20 max-w-7xl mx-auto px-6 items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="Calby Icon"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <img
            src="/Calby_text.png"
            alt="Calby"
            className="h-7 w-auto object-contain"
          />
        </Link>


        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-10">
          <a
            href="#product"
            className="text-sm font-medium text-zinc-300 hover:text-lime-400 transition-colors"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-zinc-300 hover:text-lime-400 transition-colors"
          >
            How it works
          </a>
          <a
            href="#integrations"
            className="text-sm font-medium text-zinc-300 hover:text-lime-400 transition-colors"
          >
            Integrations
          </a>
        </div>

        {/* Desktop Right Action Buttons */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-zinc-300 hover:text-lime-400 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/sign-in"
            className="bg-lime-400 hover:bg-lime-300 text-zinc-950 text-sm font-semibold py-2.5 px-5 rounded-full transition-all shadow-[0_0_20px_rgba(163,230,53,0.2)] hover:shadow-[0_0_30px_rgba(163,230,53,0.4)] flex items-center gap-1.5 group"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-zinc-300 hover:text-white transition-colors focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-zinc-950/95 backdrop-blur-xl px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-4">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-zinc-300 hover:text-lime-400 transition-colors"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-zinc-300 hover:text-lime-400 transition-colors"
            >
              How it works
            </a>
            <a
              href="#integrations"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-zinc-300 hover:text-lime-400 transition-colors"
            >
              Integrations
            </a>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col space-y-3">
            <Link
              href="/sign-in"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-zinc-300 hover:text-lime-400 transition-colors text-center py-2"
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
          </div>
        </div>
      )}
    </nav>
  );
}
