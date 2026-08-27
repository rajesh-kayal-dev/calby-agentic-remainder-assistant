"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  MessageSquare,
  MousePointer,
  Bell,
  Zap,
  FolderOpen,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  CheckSquare,
  ArrowRight,
} from "lucide-react";
import { CalbyBackground } from "@/components/ui/CalbyBackground";
import { EXTENSION_CONFIG } from "@/config/extension";

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

function ChromeLogoSvg({ className = "w-4 h-4" }: { className?: string }) {
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

export default function ChromeExtensionPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText("chrome://extensions");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400 selection:text-zinc-950 overflow-x-hidden">
      {/* Dynamic 3D WebGL Background Component */}
      <CalbyBackground />

      {/* 1. SIMPLE HEADER */}
      <header className="border-b border-white/10 bg-zinc-950/80 sticky top-0 z-50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Calby Logo"
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <img
              src="/Calby_text.png"
              alt="Calby"
              className="h-6 w-auto object-contain"
            />
            <span className="text-[11px] font-mono text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full border border-lime-400/20 flex items-center gap-1.5">
              <ChromeLogoSvg className="h-3 w-3" />
              <span>Chrome Extension</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={EXTENSION_CONFIG.mainRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60"
              title="GitHub Repository"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>

            <a
              href={EXTENSION_CONFIG.releaseZipUrl}
              download
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-950 bg-lime-400 hover:bg-lime-300 px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-lime-500/10 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download ZIP</span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10 space-y-16">
        {/* 2. HERO */}
        <section className="text-center pt-4 max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 font-mono text-xs font-medium">
            <img src="/chrome-extension-icon.png" alt="Calby Chrome Extension Icon" className="h-4 w-4 rounded shadow-sm" />
            <span>Free • Chrome Extension • Manual Install</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            The things you forget. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400">
              Calby doesn’t.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 font-light leading-relaxed max-w-xl mx-auto">
            Your personal AI assistant that remembers tasks, reminders, meetings, money, and the little things you don’t want to forget.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-lime-500/15 cursor-pointer group"
            >
              <span>Get started</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href={EXTENSION_CONFIG.releaseZipUrl}
              download
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2.5"
            >
              <img src="/chrome-extension-icon.png" alt="Extension Icon" className="h-4 w-4 rounded" />
              <span>Calby for Chrome</span>
              <Download className="h-3.5 w-3.5 text-lime-400" />
            </a>
          </div>

          <p className="text-xs font-mono text-zinc-500 pt-1">
            Version {EXTENSION_CONFIG.version} • Free • Open source
          </p>
        </section>

        {/* 3. REAL EXTENSION DEMO (Browser Window Frame) */}
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium flex items-center justify-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-lime-400" />
              <span>See Calby in Action</span>
            </span>
          </div>

          {/* Professional Browser Window Frame */}
          <div className="relative rounded-2xl border border-white/15 bg-zinc-900/90 overflow-hidden shadow-2xl shadow-lime-950/20 backdrop-blur-md">
            {/* Browser Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-b border-white/10 text-xs text-zinc-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>

              <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-md border border-white/5 text-[11px] text-zinc-400 w-full max-w-sm justify-center">
                <ChromeLogoSvg className="h-3.5 w-3.5" />
                <span className="truncate">calby.app / chrome-extension-demo</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded border border-lime-400/20 font-semibold">
                  LIVE DEMO
                </span>
              </div>
            </div>

            {/* GIF Render */}
            <div className="relative bg-zinc-950 flex items-center justify-center p-1">
              <img
                src="/CablyExtinctionDemo.gif"
                alt="Calby Chrome Extension Workflow Demo"
                className="w-full h-auto object-contain max-h-[520px] rounded-b-xl"
              />
            </div>
          </div>
        </section>

        {/* 4. WHAT YOU CAN DO */}
        <section className="space-y-6 pt-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              What you can do
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature 1 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm space-y-2">
              <div className="h-9 w-9 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Ask Calby</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Chat with Calby directly from your Chrome toolbar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm space-y-2">
              <div className="h-9 w-9 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400">
                <MousePointer className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Save to Calby</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Select text on any webpage and save it as a task, reminder, or prompt.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm space-y-2">
              <div className="h-9 w-9 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400">
                <Bell className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                See unread Calby notifications directly from the extension badge.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm space-y-2">
              <div className="h-9 w-9 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Quick Access</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Open your Calby workspace without leaving your current browser tab.
              </p>
            </div>
          </div>
        </section>

        {/* 5. HOW TO INSTALL (Exactly 4 Steps) */}
        <section id="installation" className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Install Calby in 1 minute
            </h2>
            <p className="text-xs text-zinc-400 font-light">
              Chrome Web Store publishing is not required. Install the free extension manually.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {/* STEP 1 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm flex items-start gap-4">
              <div className="h-8 w-8 rounded-lg bg-lime-400 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0">
                01
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Download className="h-3.5 w-3.5 text-lime-400" />
                  Download
                </h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  Download the latest Calby ZIP package.
                </p>
                <div className="pt-1">
                  <a
                    href={EXTENSION_CONFIG.releaseZipUrl}
                    download
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-400 hover:underline cursor-pointer"
                  >
                    <span>Download v{EXTENSION_CONFIG.version}</span>
                    <Download className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm flex items-start gap-4">
              <div className="h-8 w-8 rounded-lg bg-lime-400 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0">
                02
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5 text-lime-400" />
                  Extract
                </h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  Extract the ZIP file to a folder on your computer.
                </p>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm flex items-start gap-4">
              <div className="h-8 w-8 rounded-lg bg-lime-400 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0">
                03
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-lime-400" />
                  Open Chrome Extensions
                </h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  Open <code>chrome://extensions</code> in Chrome and turn on Developer mode.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <code className="text-[11px] font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-300">
                    chrome://extensions
                  </code>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-lime-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 4 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm flex items-start gap-4">
              <div className="h-8 w-8 rounded-lg bg-lime-400 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0">
                04
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-lime-400" />
                  Load & Pin
                </h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  Click Load unpacked, select the extracted Calby folder, then pin Calby from the Chrome Extensions menu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. HOW TO USE */}
        <section className="space-y-6 pt-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              How to use Calby
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm space-y-2">
              <div className="text-xs font-mono text-lime-400 uppercase tracking-wider">1. Open Calby</div>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                Click the Calby icon in your Chrome toolbar.
              </p>
            </div>

            {/* Action 2 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm space-y-2">
              <div className="text-xs font-mono text-lime-400 uppercase tracking-wider">2. Ask naturally</div>
              <div className="space-y-1 text-[11px] font-mono text-zinc-400">
                <p>"Remind me tomorrow at 9 AM to call Rahul."</p>
                <p>"Add buying printer paper to my tasks."</p>
                <p>"What's on my calendar today?"</p>
              </div>
            </div>

            {/* Action 3 */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm space-y-2">
              <div className="text-xs font-mono text-lime-400 uppercase tracking-wider">3. Use right-click</div>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                Select text on any webpage → Right click → Save to Calby.
              </p>
            </div>
          </div>
        </section>

        {/* 7. DOWNLOAD / GITHUB (Single Compact CTA Section) */}
        <section className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Ready to use Calby?</h2>
          <p className="text-xs text-zinc-400 font-light max-w-md mx-auto">
            Install the free Chrome extension and keep your assistant one click away.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Get started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <a
              href={EXTENSION_CONFIG.mainRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <GithubIcon className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </div>
        </section>
      </main>

      {/* 8. SMALL FOOTER */}
      <footer className="relative z-10 border-t border-zinc-900 py-8 mt-12 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-light">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Calby" className="h-4 w-auto" />
            <span className="font-bold text-white">Calby</span>
            <span>•</span>
            <span>Chrome Extension</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={EXTENSION_CONFIG.mainRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href={`${EXTENSION_CONFIG.githubRepoUrl}/tree/main/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              Documentation
            </a>
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
          </div>

          <div className="font-mono text-[11px]">
            Version {EXTENSION_CONFIG.version}
          </div>
        </div>
      </footer>
    </div>
  );
}
