"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/context/user-profile-context";

interface AccountPopoverProps {
  userLabel?: string;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onLogout?: () => void;
  loggingOut?: boolean;
}

export function AccountPopover({
  onOpenProfile,
  onOpenSettings,
  onLogout,
  loggingOut = false,
}: AccountPopoverProps) {
  const { profile, isLoading } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const displayName = profile?.name || "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Popover Floating Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-full z-50 overflow-hidden rounded-2xl border border-zinc-800 bg-[#161618] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenProfile();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <User className="size-4 text-zinc-400" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Settings className="size-4 text-zinc-400" />
              <span>Settings</span>
            </button>

            <div className="my-1 border-t border-zinc-800/80" />

            <button
              type="button"
              disabled={loggingOut}
              onClick={() => {
                setIsOpen(false);
                if (onLogout) onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <LogOut className="size-4 text-red-400" />
              <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Account Profile Control Footer Button */}
      {isLoading ? (
        /* Sidebar Account Skeleton Loader */
        <div
          className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-2.5 py-2 animate-pulse"
          role="status"
          aria-label="Loading user account"
        >
          <div className="size-8 shrink-0 rounded-full bg-zinc-800/80" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-zinc-800/80" />
            <div className="h-2.5 w-12 rounded bg-zinc-800/60" />
          </div>
          <ChevronUp className="size-4 text-zinc-600 shrink-0" />
        </div>
      ) : (
        /* Real Authenticated Account Button */
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-2 text-left hover:bg-zinc-800/80 transition-all duration-150 shadow-sm group select-none",
            isOpen && "bg-zinc-800/90 border-zinc-700/80"
          )}
          aria-label="Account Menu"
          aria-expanded={isOpen}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-500/20 border border-teal-500/30 text-xs font-bold text-teal-300">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white leading-tight">
              {displayName || "Account"}
            </p>
            <p className="text-[10px] font-medium text-zinc-500 truncate leading-none mt-0.5">
              Account
            </p>
          </div>

          <ChevronUp
            className={cn(
              "size-4 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-lime-400"
            )}
          />
        </button>
      )}
    </div>
  );
}
