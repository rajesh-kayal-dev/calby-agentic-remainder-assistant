"use client";

import { useState } from "react";
import { ShieldCheck, Monitor, Smartphone, Lock, LogOut, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SecurityTab() {
  const [signedOutOther, setSignedOutOther] = useState(false);

  const handleSignOutOther = () => {
    setSignedOutOther(true);
    setTimeout(() => setSignedOutOther(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Security & Sessions
          <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-xs font-semibold text-lime-400 uppercase">
            Shield Active
          </span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Monitor your authenticated sessions, devices, and security controls.
        </p>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-4 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">
              End-to-End Session Security
            </h4>
            <p className="text-[11px] text-zinc-400">
              JWT authentication with HTTPS transport encryption.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-4 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Lock className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">
              OAuth 2.0 Token Isolation
            </h4>
            <p className="text-[11px] text-zinc-400">
              Google Calendar tokens are isolated per session.
            </p>
          </div>
        </div>
      </div>

      {/* Active Sessions List */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Monitor className="size-4 text-lime-400" />
            <span>Active Authenticated Sessions</span>
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOutOther}
            className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium px-3"
          >
            <LogOut className="size-3.5 mr-1 text-red-400" />
            <span>Sign Out Other Sessions</span>
          </Button>
        </div>

        {signedOutOther && (
          <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs font-medium text-lime-400 flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="size-4 shrink-0" />
            <span>Successfully revoked all other active session tokens.</span>
          </div>
        )}

        <div className="space-y-3 pt-1">
          {/* Current Session */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-3.5">
            <div className="flex items-center gap-3">
              <Monitor className="size-5 text-lime-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white flex items-center gap-2">
                  Windows Desktop · Chrome Browser
                  <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-[10px] font-semibold text-lime-400 uppercase">
                    Current Device
                  </span>
                </p>
                <p className="text-[11px] text-zinc-500">
                  India · Active Session token
                </p>
              </div>
            </div>

            <span className="text-xs font-medium text-lime-400">Online</span>
          </div>

          {/* Secondary Session */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3.5">
            <div className="flex items-center gap-3">
              <Smartphone className="size-5 text-zinc-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">
                  iOS Mobile Workspace · Safari
                </p>
                <p className="text-[11px] text-zinc-500">
                  India · Last active 3 hours ago
                </p>
              </div>
            </div>

            <span className="text-xs font-medium text-zinc-500">Idle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
