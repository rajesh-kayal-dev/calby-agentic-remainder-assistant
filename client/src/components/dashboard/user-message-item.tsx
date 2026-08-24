"use client";

import React, { useState } from "react";
import { Pencil, Copy, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalbyTooltip } from "../ui/calby-tooltip";

interface UserMessageItemProps {
  messageId: string;
  content: string;
  onSave?: (newContent: string) => void;
  onSubmit?: (newContent: string) => void;
}

export function UserMessageItem({
  messageId,
  content,
  onSave,
  onSubmit,
}: UserMessageItemProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>(content);
  const [copied, setCopied] = useState<boolean>(false);

  // Handle Copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Handle Save (updates message text only)
  const handleSave = () => {
    const trimmed = editText.trim();
    if (trimmed && onSave) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  // Handle Submit (updates message text and triggers AI re-generation)
  const handleSubmit = () => {
    const trimmed = editText.trim();
    if (trimmed && onSubmit) {
      onSubmit(trimmed);
    }
    setIsEditing(false);
  };

  // Handle Cancel
  const handleCancel = () => {
    setEditText(content);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex w-full min-w-0 flex-col space-y-2 py-2">
        {/* EDIT TEXTAREA INPUT */}
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          }}
          rows={3}
          className="w-full rounded-2xl border border-zinc-700/80 bg-[#121316] p-3 text-sm text-white placeholder:text-zinc-500 focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 transition-all font-sans resize-y"
          autoFocus
        />

        {/* BOTTOM TOOLBAR (MATCHES REFERENCE SCREENSHOT 2) */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800/90 bg-[#0F1014] p-2 px-3 shadow-md">
          {/* Left Info Text */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium min-w-0">
            <Info className="size-3.5 text-zinc-500 shrink-0" />
            <span className="truncate">
              <strong className="text-zinc-200 font-semibold">&quot;Submit&quot;</strong> regenerates the AI response.{" "}
              <strong className="text-zinc-200 font-semibold">&quot;Save&quot;</strong> updates your message only.
            </span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl border border-zinc-700 bg-zinc-800/90 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 transition-all cursor-pointer shadow-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-xl bg-white hover:bg-zinc-100 px-3.5 py-1.5 text-xs font-bold text-zinc-950 transition-all cursor-pointer shadow-md"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex w-full flex-col items-end py-1 select-text">
      {/* USER MESSAGE BUBBLE */}
      <div className="rounded-2xl rounded-tr-none bg-zinc-800/90 border border-zinc-700/80 px-4 py-3 text-zinc-100 text-sm leading-relaxed max-w-[85%] sm:max-w-lg shadow-sm backdrop-blur-sm">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>

      {/* HOVER ACTIONS (MATCHES REFERENCE SCREENSHOT 1) */}
      <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <CalbyTooltip content="Edit message" side="bottom">
          <button
            type="button"
            onClick={() => {
              setEditText(content);
              setIsEditing(true);
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            aria-label="Edit message"
          >
            <Pencil className="size-3.5" />
          </button>
        </CalbyTooltip>

        <CalbyTooltip content={copied ? "Copied!" : "Copy message"} side="bottom">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            aria-label="Copy message"
          >
            {copied ? <Check className="size-3.5 text-lime-400" /> : <Copy className="size-3.5" />}
          </button>
        </CalbyTooltip>
      </div>
    </div>
  );
}
