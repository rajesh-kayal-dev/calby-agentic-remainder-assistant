"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Trash2,
  AlertCircle,
  LoaderCircle,
  Brain,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  CalendarX,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./markdown-message";
import { useLLM } from "@/context/llm-context";
import { CalbyTooltip } from "../ui/calby-tooltip";
import { ReportSummaryCard } from "./reports/report-summary-card";
import type { Report } from "../../lib/report.types";

function parseReasoningAndResponse(text: string): {
  thinkingText: string;
  responseContent: string;
  confirmationPayload: any | null;
  reportPayload: { report: Report; summaryLine?: string } | null;
} {
  if (!text) return { thinkingText: "", responseContent: "", confirmationPayload: null, reportPayload: null };

  let confirmationPayload: any = null;
  const jsonMatch = text.match(/```json\s*(\{[\s\S]*?"type"\s*:\s*"confirmation_required"[\s\S]*?\})\s*```/i);
  if (jsonMatch) {
    try {
      confirmationPayload = JSON.parse(jsonMatch[1]);
    } catch {
      confirmationPayload = null;
    }
  }

  // Parse embedded report block (```report ... ```)
  let reportPayload: { report: Report; summaryLine?: string } | null = null;
  const reportMatch = text.match(/```report\s*([\s\S]*?)\s*```/i);
  if (reportMatch) {
    try {
      const parsed = JSON.parse(reportMatch[1]);
      if (parsed?.report?.type && parsed?.report?.sections) {
        reportPayload = { report: parsed.report, summaryLine: parsed.summaryLine };
      }
    } catch {
      reportPayload = null;
    }
  }

  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
  let thinkingText = "";
  // Strip report blocks from the visible response
  let responseContent = text.replace(/```report[\s\S]*?```/gi, "").trim();

  if (thinkMatch) {
    thinkingText = thinkMatch[1].trim();
    responseContent = responseContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  } else if (text.includes("<think>")) {
    const parts = responseContent.split("<think>");
    thinkingText = parts[1] ? parts[1].trim() : "";
    responseContent = parts[0] ? parts[0].trim() : "";
  }

  return { thinkingText, responseContent, confirmationPayload, reportPayload };
}

interface AssistantMessageItemProps {
  messageId: string;
  content: string;
  isStreaming?: boolean;
  isSystemError?: boolean;
  onRegenerate?: () => void;
  onDeleteMessage?: (id: string) => void;
  onConfirmAction?: (toolId: string, details: any) => void;
  onOpenConnectCalendar?: () => void;
  /** Called when user clicks a delivery channel button on an embedded report card */
  onSendReport?: (channel: "gmail" | "whatsapp" | "telegram", report: any, summaryLine?: string) => void;
}

export function AssistantMessageItem({
  messageId,
  content,
  isStreaming = false,
  isSystemError = false,
  onRegenerate,
  onDeleteMessage,
  onConfirmAction,
  onOpenConnectCalendar,
  onSendReport,
}: AssistantMessageItemProps) {
  const { providers, defaultConnection, activeLLM } = useLLM();

  // Action States
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState(true);
  const [confirmationStatus, setConfirmationStatus] = useState<"pending" | "confirmed" | "cancelled">("pending");
  const [reportDeliveryState, setReportDeliveryState] = useState<{
    status: "sending" | "sent" | "failed";
    channel: string;
    message?: string;
  } | undefined>(undefined);

  // Parse reasoning and confirmation payload
  const { thinkingText, responseContent, confirmationPayload, reportPayload } = useMemo(() => {
    return parseReasoningAndResponse(content);
  }, [content]);

  const isConnectionRequired = useMemo(() => {
    return responseContent.includes("Google Calendar is not connected");
  }, [responseContent]);

  // Provider Metadata Display
  const providerMeta = useMemo(() => {
    const pId = activeLLM?.providerId || defaultConnection?.providerId || "groq";
    const provDef = providers.find((p) => p.id === pId);
    const pName = provDef?.name || pId;
    const model =
      activeLLM?.model ||
      defaultConnection?.selectedModel ||
      provDef?.defaultModels[0]?.id ||
      "default";

    return `${pName} · ${model}`;
  }, [activeLLM, defaultConnection, providers]);

  // Handle Speech (TTS)
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(responseContent);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopy = async () => {
    if (!responseContent) return;
    try {
      await navigator.clipboard.writeText(responseContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (isSystemError) {
    return (
      <div className="py-2 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
          <AlertCircle className="size-4 shrink-0 text-red-400" />
          <span>Error</span>
        </div>
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-300">
          {responseContent || content || "Failed to process request."}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex w-full flex-col space-y-2.5 py-2 select-text max-w-3xl">
      {/* 1. COLLAPSIBLE LLM THINKING PROCESS CARD */}
      {thinkingText && (
        <div className="rounded-2xl border border-zinc-800/90 bg-[#14151B] p-3 text-xs text-zinc-300 shadow-sm transition-all select-none">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setThinkingExpanded((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setThinkingExpanded((prev) => !prev);
              }
            }}
            className="flex items-center justify-between gap-2.5 cursor-pointer font-medium"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-6 items-center justify-center rounded-lg bg-lime-400/10 border border-lime-400/30 text-lime-400 shrink-0">
                <Brain className="size-3.5" />
              </div>
              <span className="truncate text-xs font-medium text-zinc-200">
                {thinkingExpanded ? thinkingText : `${thinkingText.slice(0, 70)}...`}
              </span>
            </div>

            <button
              type="button"
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5"
              aria-label={thinkingExpanded ? "Collapse thinking process" : "Expand thinking process"}
            >
              {thinkingExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>

          {thinkingExpanded && (
            <div className="mt-2.5 pt-2 border-t border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
              {thinkingText}
            </div>
          )}
        </div>
      )}

      {/* 2. CONFIRMATION CARD UI FOR SENSITIVE ACTIONS */}
      {confirmationPayload && (
        <div className="rounded-2xl border border-amber-500/40 bg-[#161410] p-4 text-xs space-y-3 shadow-xl">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <ShieldAlert className="size-4 text-amber-400 shrink-0" />
            <span>Confirm Action: {confirmationPayload.toolName}</span>
          </div>

          <p className="text-zinc-300">
            This action requires your confirmation before executing.
          </p>

          {confirmationStatus === "pending" ? (
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmationStatus("cancelled")}
                className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmationStatus("confirmed");
                  if (onConfirmAction) {
                    onConfirmAction(confirmationPayload.toolId, confirmationPayload.details);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-zinc-950 font-semibold hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Confirm Execution
              </button>
            </div>
          ) : confirmationStatus === "confirmed" ? (
            <div className="text-xs font-medium text-lime-400">✓ Action confirmed. Executing...</div>
          ) : (
            <div className="text-xs font-medium text-zinc-500">Action cancelled.</div>
          )}
        </div>
      )}

      {/* 3. CONNECTION ALERT CARD UI */}
      {isConnectionRequired && (
        <div className="rounded-2xl border border-lime-500/30 bg-[#121612] p-4 text-xs space-y-2.5 shadow-xl">
          <div className="flex items-center gap-2 font-semibold text-lime-400">
            <CalendarX className="size-4 text-lime-400 shrink-0" />
            <span>Google Calendar Connection Required</span>
          </div>

          <p className="text-zinc-300">
            Calby needs access to your Google Calendar to read, schedule, or manage your agenda.
          </p>

          {onOpenConnectCalendar && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenConnectCalendar}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 transition-colors cursor-pointer"
              >
                <span>Connect Google Calendar</span>
                <ExternalLink className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. MAIN RESPONSE BODY */}
      {!confirmationPayload && !isConnectionRequired && (
        <div className="text-zinc-200 text-sm leading-relaxed min-w-0">
          {!responseContent && !thinkingText ? (
            <div className="flex items-center gap-2 py-1 text-xs text-zinc-400">
              <LoaderCircle className="size-3.5 animate-spin text-lime-400" />
              <span>Thinking...</span>
            </div>
          ) : (
            responseContent && <MarkdownMessage content={responseContent} tone="assistant" />
          )}
        </div>
      )}

      {/* 4b. REPORT CARD — rendered if LLM embedded a ```report block */}
      {reportPayload && (
        <div className="mt-2">
          <ReportSummaryCard
            report={reportPayload.report}
            summaryLine={reportPayload.summaryLine}
            deliveryState={reportDeliveryState}
            onSendViaChannel={
              onSendReport && !isStreaming
                ? (channel) => {
                    setReportDeliveryState({ status: "sending", channel });
                    onSendReport(channel, reportPayload.report, reportPayload.summaryLine);
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* 5. HOVER ACTION TOOLBAR & METADATA FOOTER */}
      {responseContent && !isStreaming && (
        <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
            <CalbyTooltip content={isSpeaking ? "Pause" : "Read aloud"} side="top">
              <button
                type="button"
                onClick={handleToggleSpeech}
                className={cn(
                  "p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer",
                  isSpeaking && "text-lime-400 bg-lime-400/10",
                )}
                aria-label="Read response aloud"
              >
                {isSpeaking ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
            </CalbyTooltip>

            <CalbyTooltip content={copied ? "Copied!" : "Copy response"} side="top">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                aria-label="Copy response"
              >
                {copied ? <Check className="size-3.5 text-lime-400" /> : <Copy className="size-3.5" />}
              </button>
            </CalbyTooltip>

            {onRegenerate && (
              <CalbyTooltip content="Regenerate response" side="top">
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  aria-label="Regenerate response"
                >
                  <RotateCw className="size-3.5" />
                </button>
              </CalbyTooltip>
            )}

            <CalbyTooltip content="Mark as helpful" side="top">
              <button
                type="button"
                onClick={() => setFeedback((prev) => (prev === "like" ? null : "like"))}
                className={cn(
                  "p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer",
                  feedback === "like" && "text-lime-400 bg-lime-400/10",
                )}
                aria-label="Mark response as helpful"
              >
                <ThumbsUp className="size-3.5" />
              </button>
            </CalbyTooltip>

            <CalbyTooltip content="Mark as not helpful" side="top">
              <button
                type="button"
                onClick={() => setFeedback((prev) => (prev === "dislike" ? null : "dislike"))}
                className={cn(
                  "p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer",
                  feedback === "dislike" && "text-red-400 bg-red-400/10",
                )}
                aria-label="Mark response as not helpful"
              >
                <ThumbsDown className="size-3.5" />
              </button>
            </CalbyTooltip>

            <div className="relative">
              <CalbyTooltip content="More actions" side="top">
                <button
                  type="button"
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  aria-label="More response actions"
                >
                  <MoreVertical className="size-3.5" />
                </button>
              </CalbyTooltip>

              {showMoreMenu && (
                <div className="absolute left-0 bottom-8 z-30 w-36 rounded-xl border border-zinc-800 bg-[#121318] p-1 shadow-xl space-y-0.5 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleCopy();
                      setShowMoreMenu(false);
                    }}
                    className="w-full rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="size-3" />
                    <span>Copy text</span>
                  </button>
                  {onRegenerate && (
                    <button
                      type="button"
                      onClick={() => {
                        onRegenerate();
                        setShowMoreMenu(false);
                      }}
                      className="w-full rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCw className="size-3" />
                      <span>Regenerate</span>
                    </button>
                  )}
                  {onDeleteMessage && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteMessage(messageId);
                        setShowMoreMenu(false);
                      }}
                      className="w-full rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 tracking-tight select-none">
            {providerMeta}
          </div>
        </div>
      )}
    </div>
  );
}
