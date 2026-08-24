"use client";

import { useState } from "react";
import { User, ShieldCheck, Edit3, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLabel: string;
  onUpdateName?: (newName: string) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  userLabel,
  onUpdateName,
}: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(userLabel || "rajeshkayal8001");
  const [currentName, setCurrentName] = useState(userLabel || "rajeshkayal8001");
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!nameInput.trim()) return;
    setCurrentName(nameInput.trim());
    if (onUpdateName) onUpdateName(nameInput.trim());
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const initial = currentName.charAt(0).toUpperCase();

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
            aria-label="Close Profile"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Avatar & Account Type Header */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-500/20 border border-teal-500/40 text-xl font-bold text-teal-300 shadow-inner">
              {initial}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <h4 className="text-base font-semibold text-white truncate leading-tight">
                {currentName}
              </h4>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-900/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                <ShieldCheck className="size-3 text-teal-400" />
                <span>Permanent Account</span>
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
                    onClick={() => {
                      setNameInput(currentName);
                      setIsEditing(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    <Edit3 className="size-3" />
                    <span>Edit Name</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 rounded-xl border border-teal-500/60 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    placeholder="Enter name..."
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="h-8 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs rounded-xl px-3"
                  >
                    Save
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-medium text-zinc-400 hover:text-white px-2 py-1 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-sm font-medium text-white truncate">
                  {currentName}
                </p>
              )}
            </div>

            {/* Session Type Section */}
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Session Type
              </span>
              <span className="inline-flex items-center rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-300">
                Authenticated Session
              </span>
            </div>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs font-medium text-lime-400 animate-in fade-in duration-150">
              <Check className="size-4" />
              <span>Profile details updated successfully.</span>
            </div>
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
