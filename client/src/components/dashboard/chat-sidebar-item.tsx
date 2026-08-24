"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThreadSummary } from "@/lib/agent";

interface ChatSidebarItemProps {
  thread: ThreadSummary;
  isActive: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onPinToggle: (threadId: string, currentPinned: boolean) => Promise<void>;
  onRename: (threadId: string, newTitle: string) => Promise<void>;
  onDelete: (threadId: string) => Promise<void>;
  formatDate: (iso: string) => string;
}

export function ChatSidebarItem({
  thread,
  isActive,
  disabled = false,
  onSelect,
  onPinToggle,
  onRename,
  onDelete,
  formatDate,
}: ChatSidebarItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Close menu on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        if (isEditing) {
          setIsEditing(false);
          setEditTitle(thread.title);
        }
      }
    }

    if (menuOpen || isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, isEditing, thread.title]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveRename = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === thread.title) {
      setIsEditing(false);
      setEditTitle(thread.title);
      return;
    }

    try {
      setIsSubmitting(true);
      await onRename(thread.id, trimmed);
      setIsEditing(false);
    } catch {
      setEditTitle(thread.title);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsSubmitting(true);
      await onDelete(thread.id);
      setDeleteConfirmOpen(false);
    } catch {
      // Handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (disabled || isEditing) return;
          onSelect();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (disabled || isEditing) return;
            onSelect();
          }
        }}
        className={cn(
          "group relative flex w-full flex-col rounded-xl px-3 py-2 text-left transition-all duration-150 border cursor-pointer select-none",
          isActive
            ? "bg-zinc-800/90 border-zinc-700/80 shadow-sm text-white"
            : "border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        {/* Active Left Indicator Bar */}
        {isActive && (
          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
        )}

        {isEditing ? (
          /* INLINE RENAME MODE */
          <div
            className="flex items-center gap-1.5 w-full py-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={editInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveRename();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setIsEditing(false);
                  setEditTitle(thread.title);
                }
              }}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-lime-400 min-w-0"
              placeholder="Chat title..."
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={handleSaveRename}
              disabled={isSubmitting}
              className="p-1 rounded bg-lime-400/20 text-lime-400 hover:bg-lime-400/30 transition-colors"
              title="Save"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditTitle(thread.title);
              }}
              disabled={isSubmitting}
              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Cancel"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          /* NORMAL DISPLAY MODE */
          <>
            <div className="flex items-center justify-between min-w-0 w-full">
              <span
                className={cn(
                  "truncate text-xs font-medium text-zinc-200 min-w-0 flex-1 pr-2",
                  isActive && "pl-2 font-semibold text-white",
                )}
              >
                {thread.title}
              </span>

              {/* 3-DOT ACTION BUTTON (HOVER / MOBILE SELECT) */}
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Chat actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((prev) => !prev);
                  }}
                  className={cn(
                    "p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-all cursor-pointer",
                    menuOpen
                      ? "opacity-100 bg-zinc-700/80 text-white"
                      : "opacity-0 group-hover:opacity-100 focus:opacity-100",
                    isActive && "opacity-80",
                  )}
                >
                  <MoreVertical className="size-3.5" />
                </button>

                {/* CONTEXTUAL DROPDOWN MENU */}
                {menuOpen && (
                  <div
                    className="absolute right-0 top-6 z-50 w-36 rounded-xl border border-zinc-800 bg-[#14151B]/95 p-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={async () => {
                        setMenuOpen(false);
                        await onPinToggle(thread.id, !!thread.isPinned);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                    >
                      {thread.isPinned ? (
                        <>
                          <PinOff className="size-3.5 text-zinc-400" />
                          <span>Unpin</span>
                        </>
                      ) : (
                        <>
                          <Pin className="size-3.5 text-zinc-400" />
                          <span>Pin</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setIsEditing(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <Pencil className="size-3.5 text-zinc-400" />
                      <span>Rename</span>
                    </button>

                    <div className="my-1 border-t border-zinc-800/80" />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteConfirmOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5 text-red-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <span
              className={cn(
                "mt-0.5 text-[10px] text-zinc-500 truncate",
                isActive && "pl-2 text-zinc-400",
              )}
            >
              {formatDate(thread.updatedAt)}
            </span>
          </>
        )}
      </div>

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#14151B] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="rounded-xl bg-red-950/50 border border-red-900/50 p-2">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Delete conversation?</h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              <span className="font-medium text-zinc-200">&quot;{thread.title}&quot;</span> will be permanently deleted along with all stored messages.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl border border-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
