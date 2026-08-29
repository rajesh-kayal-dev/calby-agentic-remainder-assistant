"use client";

import { useEffect } from "react";
import { AlertTriangle, LoaderCircle, Unlink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DisconnectConfirmModalProps {
  isOpen: boolean;
  providerName: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DisconnectConfirmModal({
  isOpen,
  providerName,
  isBusy = false,
  onConfirm,
  onCancel,
}: DisconnectConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBusy, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0e1013] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disconnect-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Unlink className="size-5" />
            </div>
            <div>
              <h3 id="disconnect-modal-title" className="text-sm font-bold text-white">
                Disconnect {providerName}?
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Revoke access to this integration
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 text-xs text-zinc-300 leading-relaxed">
          <p>
            Calby will no longer be able to access your <strong className="text-white font-semibold">{providerName}</strong> data, schedule events, or send messages on your behalf.
          </p>
          <p className="text-zinc-500 mt-1.5 text-[11px]">
            You can reconnect anytime from this settings tab.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className="rounded-full bg-red-600 hover:bg-red-500 text-white px-5 py-2 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-950 flex items-center gap-2 disabled:opacity-60"
          >
            {isBusy ? (
              <>
                <LoaderCircle className="size-3.5 animate-spin" />
                <span>Disconnecting...</span>
              </>
            ) : (
              <span>Disconnect</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
