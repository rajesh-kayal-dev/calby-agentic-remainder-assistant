"use client";

import { useEffect, useState } from "react";
import { useSession } from "@descope/nextjs-sdk/client";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { CalbyBackground } from "@/components/ui/CalbyBackground";

export default function ExtensionAuthPage() {
  const { isAuthenticated, sessionToken, isSessionLoading } = useSession();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && sessionToken) {
      // Broadcast session token to extension content script
      window.postMessage(
        {
          type: "CALBY_SESSION_HANDOFF",
          sessionToken,
        },
        "*"
      );
      setConnected(true);
    }
  }, [isAuthenticated, sessionToken]);

  return (
    <main className="relative flex min-h-svh items-center justify-center bg-zinc-950 px-4 py-12 selection:bg-lime-400 selection:text-zinc-950 overflow-hidden">
      <CalbyBackground />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-2xl text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center shadow-lg shadow-lime-500/10">
            <img src="/logo.png" alt="Calby Logo" className="h-10 w-10 object-contain" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
          Calby Extension Connect
        </h1>

        {isSessionLoading ? (
          <div className="py-8 text-zinc-400 text-sm flex flex-col items-center gap-3">
            <div className="h-6 w-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Checking authentication status...</span>
          </div>
        ) : isAuthenticated && sessionToken ? (
          <div className="py-6 space-y-6">
            <div className="p-4 rounded-2xl bg-lime-500/10 border border-lime-500/20 text-lime-400 flex items-center justify-center gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <span className="text-sm font-semibold">Chrome Extension Connected!</span>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              Your Calby account is now active on the Chrome Extension. You can close this tab and start using the extension.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/dashboard"
                className="w-full py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Go to Calby Web Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            <p className="text-zinc-400 text-sm leading-relaxed">
              Please sign in to your Calby account to authorize the Chrome Extension.
            </p>

            <Link
              href="/sign-in"
              className="w-full py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Sign In to Calby</span>
            </Link>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-center gap-2 text-xs text-zinc-500 font-light">
          <ShieldCheck className="h-4 w-4 text-lime-400" />
          <span>Secure Encrypted Handoff</span>
        </div>
      </div>
    </main>
  );
}
