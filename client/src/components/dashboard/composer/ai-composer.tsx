"use client";

import React, { useState, FormEvent, KeyboardEvent, useRef, useMemo } from "react";
import { ArrowUp, LoaderCircle, X, Sparkles, AlertCircle } from "lucide-react";
import { ToolMenuPopover } from "./tool-menu-popover";
import { VoiceInputButton } from "./voice-input-button";
import { ToolDefinition, CATEGORY_LABELS, buildToolPrompt } from "@/lib/tools-registry";
import { ConnectionInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ComposerState =
  | "idle"
  | "typing"
  | "tool-selected"
  | "recording"
  | "processing"
  | "disabled"
  | "error";

interface AIComposerProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  running: boolean;
  calendarConnection: ConnectionInfo | null;
  onConnectService?: (serviceId: string) => void;
}

export function AIComposer({
  prompt,
  setPrompt,
  onSubmit,
  running,
  calendarConnection,
  onConnectService,
}: AIComposerProps) {
  const [selectedTools, setSelectedTools] = useState<ToolDefinition[]>([]);
  const [composerError, setComposerError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine active state
  let currentState: ComposerState = "idle";
  if (running) currentState = "processing";
  else if (selectedTools.length > 0) currentState = "tool-selected";
  else if (prompt.trim()) currentState = "typing";

  // Dynamic Contextual Placeholder
  const currentPlaceholder = useMemo(() => {
    if (selectedTools.length === 0) {
      return "Ask Calby about your calendar...";
    }
    const lastTool = selectedTools[selectedTools.length - 1];
    return lastTool.placeholder || "Tell Calby what you'd like to do...";
  }, [selectedTools]);

  const focusAndMoveCursorToEnd = (textLength: number) => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(textLength, textLength);
      }
    }, 50);
  };

  const handleToggleSelectTool = (tool: ToolDefinition) => {
    console.log("Tool selected:", tool);
    const previousTool = selectedTools[selectedTools.length - 1];

    if (selectedTools.some((t) => t.id === tool.id)) {
      // Toggle off if clicking the exact same tool again
      setSelectedTools([]);
      if (prompt.trim() === tool.promptTemplate) {
        setPrompt("");
      }
    } else {
      // Attach tool chip and compute intelligent prompt
      const newPrompt = buildToolPrompt(prompt, tool, previousTool);
      console.log("Composer prompt:", newPrompt);
      setSelectedTools([tool]);
      setPrompt(newPrompt);
      focusAndMoveCursorToEnd(newPrompt.length);
    }
  };

  const handleRemoveTool = (toolId: string) => {
    const targetTool = selectedTools.find((t) => t.id === toolId);
    setSelectedTools((prev) => prev.filter((t) => t.id !== toolId));

    if (targetTool && prompt.trim() === targetTool.promptTemplate) {
      setPrompt("");
    }
  };

  const voiceBasePromptRef = useRef<string>("");

  const handleStartVoiceListening = () => {
    voiceBasePromptRef.current = prompt.trim();
  };

  const handleVoiceTranscript = (transcriptText: string) => {
    const base = voiceBasePromptRef.current;
    const updated = base ? `${base} ${transcriptText}` : transcriptText;
    setPrompt(updated);
    setComposerError(null);
    focusAndMoveCursorToEnd(updated.length);
  };

  const handleVoiceError = (errorMsg: string) => {
    setComposerError(errorMsg);
    setTimeout(() => setComposerError(null), 4000);
  };

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && selectedTools.length === 0) return;
    if (running) return;

    // Attach selected tool scope prefix if tools are selected and not already in prompt
    let finalPrompt = prompt.trim();
    if (selectedTools.length > 0) {
      const toolScopePrefix = selectedTools
        .map((t) => `[Action: ${CATEGORY_LABELS[t.category]} · ${t.name}]`)
        .join(" ");

      if (!finalPrompt.includes("[Action:")) {
        finalPrompt = finalPrompt ? `${toolScopePrefix} ${finalPrompt}` : `${toolScopePrefix} execute request`;
        setPrompt(finalPrompt);
      }
    }

    const activeToolObj = selectedTools[0]
      ? { id: selectedTools[0].id, category: selectedTools[0].category, name: selectedTools[0].name }
      : undefined;

    console.log("Sending:", {
      message: finalPrompt,
      selectedTool: activeToolObj,
    });

    onSubmit(e);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((prompt.trim() || selectedTools.length > 0) && !running) {
        handleSubmitForm(e);
      }
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto space-y-1.5">
      {/* COMPOSER / VOICE ERROR ALERT */}
      {composerError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-900/50 bg-red-950/40 px-3.5 py-1.5 text-xs text-red-300 animate-in fade-in duration-150">
          <AlertCircle className="size-3.5 text-red-400 shrink-0" />
          <span>{composerError}</span>
        </div>
      )}

      {/* MAIN COMMAND BAR CONTAINER */}
      <div
        className={cn(
          "relative flex flex-col w-full rounded-2xl border bg-[#0F1015]/95 p-2 shadow-2xl backdrop-blur-md transition-all duration-200 overflow-visible z-20",
          currentState === "processing"
            ? "border-lime-500/50 shadow-[0_0_16px_rgba(163,230,53,0.15)]"
            : currentState === "tool-selected"
            ? "border-lime-500/40"
            : "border-zinc-800 focus-within:border-zinc-700",
        )}
      >
        {/* SELECTED TOOL CHIPS DIRECTLY ABOVE INPUT */}
        {selectedTools.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-2 pt-1 pb-2 border-b border-zinc-800/80 mb-1.5">
            {selectedTools.map((tool) => (
              <span
                key={tool.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-lime-500/30 bg-lime-950/40 px-2.5 py-1 text-xs font-medium text-lime-300 animate-in fade-in zoom-in-95 duration-100 select-none"
              >
                <Sparkles className="size-3 text-lime-400 shrink-0" />
                <span>
                  {CATEGORY_LABELS[tool.category]} · {tool.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveTool(tool.id)}
                  className="rounded p-0.5 hover:bg-lime-400/20 text-lime-400 transition-colors cursor-pointer"
                  title="Remove tool context"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* INPUT & CONTROLS ROW */}
        <form onSubmit={handleSubmitForm} className="flex items-end gap-2 w-full">
          {/* LEFT: PLUS / TOOL MENU POPOVER */}
          <ToolMenuPopover
            calendarConnection={calendarConnection}
            selectedToolIds={selectedTools.map((t) => t.id)}
            onSelectTool={handleToggleSelectTool}
            onConnectService={onConnectService}
          />

          {/* MIDDLE: TEXTAREA INPUT */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={running}
            rows={1}
            placeholder={currentPlaceholder}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none min-h-[36px] max-h-32"
          />

          {/* RIGHT: VOICE MIC & SEND BUTTON */}
          <div className="flex items-center gap-1.5 shrink-0">
            <VoiceInputButton
              onStartListening={handleStartVoiceListening}
              onTranscript={handleVoiceTranscript}
              onError={handleVoiceError}
              disabled={running}
            />

            <button
              type="submit"
              disabled={(!prompt.trim() && selectedTools.length === 0) || running}
              className={cn(
                "flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer shadow-sm font-semibold",
                (prompt.trim() || selectedTools.length > 0) && !running
                  ? "bg-lime-400 text-zinc-950 hover:bg-lime-300"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed",
              )}
              aria-label="Send message"
            >
              {running ? (
                <LoaderCircle className="size-4 animate-spin text-zinc-400" />
              ) : (
                <ArrowUp className="size-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-[10px] text-zinc-500">
        Ask about events, free slots, or schedule a Google Calendar meeting.
      </p>
    </div>
  );
}
