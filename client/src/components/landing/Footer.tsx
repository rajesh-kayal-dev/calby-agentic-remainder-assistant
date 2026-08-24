"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-black pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal delay={0}>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            {/* Logo & Description Column */}
            <div className="col-span-1 lg:col-span-2 pr-4 lg:pr-10">
              <Link href="/" className="flex items-center gap-2 mb-6 group">
                <img
                  src="/logo.png"
                  alt="Calby icon"
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
                <img
                  src="/Calby_text.png"
                  alt="Calby"
                  className="h-7 w-auto object-contain"
                />
              </Link>

              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs font-light">
                AI calendar assistant that helps you manage your schedule through natural language.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-6 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-3.5 text-sm text-zinc-500 font-light">
                <li>
                  <a href="#product" className="hover:text-lime-400 transition-colors">
                    Product
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-lime-400 transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#integrations" className="hover:text-lime-400 transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-6 uppercase tracking-wider">
                Resources
              </h4>
              <ul className="space-y-3.5 text-sm text-zinc-500 font-light">
                <li>
                  <a href="#ai-assistant" className="hover:text-lime-400 transition-colors">
                    Help
                  </a>
                </li>
                <li>
                  <a href="#product" className="hover:text-lime-400 transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Account Links */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-6 uppercase tracking-wider">
                Account
              </h4>
              <ul className="space-y-3.5 text-sm text-zinc-500 font-light">
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
          </div>

          {/* Bottom Legal / Copyright Bar */}
          <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-600 font-light">
              © {new Date().getFullYear()} Calby Inc. All rights reserved.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
