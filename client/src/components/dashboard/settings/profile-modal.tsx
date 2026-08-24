"use client";

import { useState, useEffect, useRef } from "react";
import { User, ShieldCheck, Edit3, X, Check, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/context/user-profile-context";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLabel?: string;
  onUpdateName?: (newName: string) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  onUpdateName,
}: ProfileModalProps) {
  const { profile, isLoading, error, sessionStatus, refetchProfile, updateName } = useUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync current profile name into local input when profile changes or editing starts
  useEffect(() => {
    if (profile?.name) {
      setNameInput(profile.name);
    }
  }, [profile?.name, isEditing]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  if (!isOpen) return null;

  const displayName = profile?.name || "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  const handleStartEdit = () => {
    setNameInput(displayName);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setSaveError("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateName(trimmed);
      if (onUpdateName) onUpdateName(trimmed);
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setSaveError("Unable to update your name. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-[#121214] shadow-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Profile Details"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-[#121214]">
          <div className="flex items-center gap-2.5">
            <User className="size-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Profile Details
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Close Profile Details"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            /* Loading Skeleton State */
            <div className="space-y-6" role="status" aria-label="Loading profile details">
              <div className="flex items-center gap-4">
                <div className="size-14 shrink-0 rounded-full bg-zinc-800/80 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-36 rounded-md bg-zinc-800/80 animate-pulse" />
                  <div className="h-4 w-28 rounded-full bg-zinc-800/60 animate-pulse" />
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4 space-y-4">
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-zinc-800/80 animate-pulse" />
                  <div className="h-4 w-40 rounded bg-zinc-800/60 animate-pulse" />
                </div>
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                  <div className="h-3 w-20 rounded bg-zinc-800/80 animate-pulse" />
                  <div className="h-5 w-32 rounded-lg bg-zinc-800/60 animate-pulse" />
                </div>
              </div>
            </div>
          ) : error && !profile ? (
            /* Auth / Load Error State */
            <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-6 text-center space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <AlertCircle className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Unable to load your account.</p>
                <p className="text-xs text-zinc-400 mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchProfile()}
                className="inline-flex items-center gap-2 rounded-xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white text-xs font-semibold px-4"
              >
                <RefreshCw className="size-3.5" />
                <span>Retry</span>
              </Button>
            </div>
          ) : (
            /* Real Authenticated User State */
            <>
              {/* Avatar & Account Type Header */}
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-500/20 border border-teal-500/40 text-xl font-bold text-teal-300 shadow-inner select-none">
                  {initial}
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <h4 className="text-base font-semibold text-white truncate leading-tight">
                    {displayName}
                  </h4>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-900/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                    <ShieldCheck className="size-3 text-teal-400" />
                    <span>{profile?.accountType || "Permanent Account"}</span>
                  </div>
                </div>
              </div>

              {/* Details Card */}
              <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4 space-y-4">
                {/* Name / Handle Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Name / Handle
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors focus:outline-none focus:ring-1 focus:ring-teal-400 rounded px-1"
                        aria-label="Edit Name"
                      >
                        <Edit3 className="size-3" />
                        <span>Edit Name</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          disabled={isSaving}
                          className="flex-1 rounded-xl border border-teal-500/60 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-400 disabled:opacity-50"
                          placeholder="Enter display name..."
                          aria-label="Display Name Input"
                        />
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="h-8 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs rounded-xl px-3 disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="text-xs font-medium text-zinc-400 hover:text-white px-2 py-1 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>

                      {saveError && (
                        <p className="text-xs font-medium text-red-400 animate-in fade-in duration-150">
                          {saveError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-white truncate">
                      {displayName}
                    </p>
                  )}
                </div>

                {/* Session Type Section */}
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Session Type
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium",
                      sessionStatus === "Authenticated Session"
                        ? "border-teal-500/30 bg-teal-500/10 text-teal-300"
                        : sessionStatus === "Session Expired"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400"
                    )}
                  >
                    ● {sessionStatus}
                  </span>
                </div>
              </div>

              {savedSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs font-medium text-lime-400 animate-in fade-in duration-150">
                  <Check className="size-4" />
                  <span>Profile details updated successfully.</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 px-6 py-3.5 bg-[#121214] flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium px-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
