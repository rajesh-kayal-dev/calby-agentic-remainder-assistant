"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  CalendarPlus,
  CalendarRange,
  CalendarX,
  Video,
  VideoOff,
  Users,
  Mail,
  MessageCircle,
  Send,
  Bell,
  CheckSquare,
  Globe,
  Paperclip,
  Plus,
} from "lucide-react";
import {
  TOOLS_REGISTRY,
  CATEGORY_LABELS,
  ToolDefinition,
  ToolCategory,
} from "@/lib/tools-registry";
import { ConnectionInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ToolMenuPopoverProps {
  calendarConnection: ConnectionInfo | null;
  selectedToolIds: string[];
  onSelectTool: (tool: ToolDefinition) => void;
  onConnectService?: (serviceId: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Calendar,
  Clock,
  CalendarPlus,
  CalendarRange,
  CalendarX,
  Video,
  VideoOff,
  Users,
  Mail,
  MessageCircle,
  Send,
  Bell,
  CheckSquare,
  Globe,
  Paperclip,
};

export function ToolMenuPopover({
  calendarConnection,
  selectedToolIds,
  onSelectTool,
  onConnectService,
}: ToolMenuPopoverProps) {
  // State Machine for Hover + Click Pinning
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);

  const hoveringTriggerRef = useRef(false);
  const hoveringMenuRef = useRef(false);
  const isPinnedRef = useRef(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync ref
  useEffect(() => {
    isPinnedRef.current = isPinned;
  }, [isPinned]);

  // Filter tools by search query
  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return TOOLS_REGISTRY;
    return TOOLS_REGISTRY.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const categories: ToolCategory[] = [
    "CALENDAR",
    "MEETINGS",
    "COMMUNICATION",
    "PRODUCTIVITY",
    "TOOLS",
  ];

  const checkIsConnected = useCallback(
    (tool: ToolDefinition): boolean => {
      if (!tool.connectorId) return true;
      if (tool.connectorId === "google_calendar") {
        return calendarConnection?.status === "connected";
      }
      return false;
    },
    [calendarConnection],
  );

  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      if (!hoveringTriggerRef.current && !hoveringMenuRef.current && !isPinnedRef.current) {
        setIsOpen(false);
      }
    }, 250);
  }, []);

  // Click Trigger Handler
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsPinned((prev) => {
      const next = !prev;
      setIsOpen(next);
      return next;
    });
  };

  // Outside Click & Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPinned(false);
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPinned(false);
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handlePopoverKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % filteredTools.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetTool = filteredTools[focusedIndex];
      if (targetTool && checkIsConnected(targetTool)) {
        onSelectTool(targetTool);
        if (!isPinnedRef.current) setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* PLUS TRIGGER BUTTON */}
      <button
        type="button"
        aria-label="Open Tool Menu"
        onClick={handleTriggerClick}
        onMouseEnter={() => {
          hoveringTriggerRef.current = true;
          if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          setIsOpen(true);
        }}
        onMouseLeave={() => {
          hoveringTriggerRef.current = false;
          scheduleClose();
        }}
        className={cn(
          "flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer border shadow-sm select-none",
          isPinned || isOpen
            ? "bg-zinc-700 border-lime-500/50 text-lime-400"
            : "bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:bg-zinc-700 hover:text-white",
        )}
      >
        <Plus className={cn("size-4 transition-transform duration-200", (isOpen || isPinned) && "rotate-45")} />
      </button>

      {/* POPOVER MENU CONTAINER */}
      {isOpen && (
        <div
          onMouseEnter={() => {
            hoveringMenuRef.current = true;
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          }}
          onMouseLeave={() => {
            hoveringMenuRef.current = false;
            scheduleClose();
          }}
          onKeyDown={handlePopoverKeyDown}
          className="absolute bottom-full left-0 mb-3 z-50 w-80 max-h-96 rounded-2xl border border-zinc-800 bg-[#121318] p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col pointer-events-auto"
        >
          {/* SEARCH INPUT */}
          <div className="relative mb-2 shrink-0">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFocusedIndex(0);
              }}
              placeholder="Search tools..."
              className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-lime-500/50 focus:outline-none"
              autoFocus
            />
          </div>

          {/* SCROLLABLE TOOLS LIST */}
          <div className="overflow-y-auto pr-1 space-y-2.5 custom-scrollbar flex-1">
            {filteredTools.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-500">No matching tools found.</p>
            ) : (
              categories.map((cat) => {
                const catTools = filteredTools.filter((t: ToolDefinition) => t.category === cat);
                if (catTools.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="px-2 text-[9px] font-bold tracking-wider text-lime-400/90 uppercase">
                      {CATEGORY_LABELS[cat]}
                    </div>

                    <div className="space-y-0.5">
                      {catTools.map((tool: ToolDefinition) => {
                        const IconComponent = ICON_MAP[tool.iconName] || Plus;
                        const isConnected = checkIsConnected(tool);
                        const isSelected = selectedToolIds.includes(tool.id);
                        const toolGlobalIndex = filteredTools.findIndex((t: ToolDefinition) => t.id === tool.id);
                        const isFocused = toolGlobalIndex === focusedIndex;

                        return (
                          <div
                            key={tool.id}
                            className={cn(
                              "group flex h-11 items-center justify-between rounded-xl px-2.5 py-1 transition-all cursor-pointer select-none",
                              isSelected
                                ? "bg-lime-950/40 border border-lime-500/40 text-lime-300"
                                : isFocused
                                ? "bg-zinc-800/80 border border-zinc-700 text-white"
                                : "hover:bg-zinc-800/60 border border-transparent text-zinc-300",
                            )}
                            onClick={() => {
                              if (isConnected) {
                                onSelectTool(tool);
                                if (!isPinnedRef.current) setIsOpen(false);
                              }
                            }}
                          >
                            {/* LEFT: ICON & DETAILS */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={cn(
                                  "flex size-7 items-center justify-center rounded-lg border shrink-0 transition-colors",
                                  isSelected
                                    ? "bg-lime-900/50 border-lime-500/50 text-lime-300"
                                    : "bg-zinc-900 border-zinc-800 text-lime-400 group-hover:border-zinc-700",
                                )}
                              >
                                <IconComponent className="size-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-zinc-100 group-hover:text-white truncate">
                                  {tool.name}
                                </div>
                                <div className="text-[10px] text-zinc-500 truncate">
                                  {tool.description}
                                </div>
                              </div>
                            </div>

                            {/* RIGHT: SELECTION OR CONNECTION STATE */}
                            <div className="shrink-0 ml-2">
                              {isSelected ? (
                                <span className="inline-flex size-5 items-center justify-center rounded-full bg-lime-400 text-zinc-950">
                                  <Check className="size-3 stroke-[3]" />
                                </span>
                              ) : isConnected ? (
                                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">
                                  <Check className="size-3 text-zinc-600 group-hover:text-lime-400" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (onConnectService) onConnectService(tool.connectorId!);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                >
                                  <span>Connect</span>
                                  <ExternalLink className="size-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
