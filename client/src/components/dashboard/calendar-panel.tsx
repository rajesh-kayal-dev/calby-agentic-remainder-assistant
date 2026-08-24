"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  MapPin,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { fetchCalendarConnection } from "@/lib/connections";
import { ConnectionInfo } from "@/lib/types";

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string; // "10:00"
  endTime: string; // "10:30"
  duration: string; // "30 min"
  category: "work" | "meeting" | "personal";
  date: string; // "YYYY-MM-DD"
  location?: string;
  attendees?: string[];
  description?: string;
  source?: string;
};

const DEFAULT_SCHEDULE: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Daily Engineering Sync & Standup",
    startTime: "09:00",
    endTime: "09:30",
    duration: "30 min",
    category: "meeting",
    date: new Date().toISOString().split("T")[0],
    attendees: ["team@calby.ai", "lead@calby.ai", "marcus@calby.ai"],
    location: "Google Meet",
    description: "Daily engineering progress, sprint blocker removal, and roadmap alignment.",
    source: "Google Calendar",
  },
  {
    id: "evt-2",
    title: "Enterprise Client Architecture & Security Review",
    startTime: "11:30",
    endTime: "12:30",
    duration: "1 hour",
    category: "work",
    date: new Date().toISOString().split("T")[0],
    attendees: ["sarah@enterprise.com", "security@calby.ai"],
    location: "Google Meet / Security Room",
    description: "Review Google Calendar OAuth token encryption, database schemas, and AI access policies.",
    source: "Google Calendar",
  },
  {
    id: "evt-3",
    title: "Q3 AI Orchestration Strategy & Planning",
    startTime: "14:00",
    endTime: "15:00",
    duration: "1 hour",
    category: "meeting",
    date: new Date().toISOString().split("T")[0],
    attendees: ["execs@calby.ai", "ai-team@calby.ai"],
    location: "Executive Board & Meet",
    description: "Multi-model routing, latency minimization, and calendar agent autonomy benchmarks.",
    source: "Google Calendar",
  },
  {
    id: "evt-4",
    title: "Product UX Jam & Design System Polish",
    startTime: "16:30",
    endTime: "17:15",
    duration: "45 min",
    category: "personal",
    date: new Date().toISOString().split("T")[0],
    attendees: ["design@calby.ai"],
    location: "Figma Room",
    description: "Dark SaaS aesthetics, micro-interactions, and responsive calendar grid optimization.",
    source: "Google Calendar",
  },
];

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const categoryStyles: Record<
  CalendarEvent["category"],
  {
    card: string;
    tag: string;
    dot: string;
    border: string;
    text: string;
  }
> = {
  work: {
    card: "bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/15 text-emerald-200",
    tag: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    border: "border-l-emerald-400",
    text: "text-emerald-300",
  },
  meeting: {
    card: "bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/15 text-blue-200",
    tag: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    dot: "bg-blue-400",
    border: "border-l-blue-400",
    text: "text-blue-300",
  },
  personal: {
    card: "bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/15 text-amber-200",
    tag: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    border: "border-l-amber-400",
    text: "text-amber-300",
  },
};

type Props = {
  sessionToken: string;
  onClose?: () => void;
  isMobileDrawer?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onResizeStart?: (e: React.MouseEvent) => void;
  width?: number;
  isDragging?: boolean;
};

export function CalendarPanel({
  sessionToken,
  onClose,
  isMobileDrawer = false,
  isCollapsed = false,
  onToggleCollapse,
  isFullscreen = false,
  onToggleFullscreen,
  onResizeStart,
  width,
  isDragging = false,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [loadingConnection, setLoadingConnection] = useState(false);

  const checkConnection = useCallback(async () => {
    setLoadingConnection(true);
    try {
      const conn = await fetchCalendarConnection(sessionToken);
      setConnection(conn);
    } catch {
      // ignore
    } finally {
      setLoadingConnection(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Format month and year
  const monthYearLabel = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  // Generate 7-day week strip around selected date
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const startOfWeek = new Date(current);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const isToday =
        d.toDateString() === new Date().toDateString();
      const isSelected =
        d.toDateString() === selectedDate.toDateString();

      return {
        date: d,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: d.getDate(),
        dateString: d.toISOString().split("T")[0],
        isToday,
        isSelected,
      };
    });
  }, [selectedDate]);

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  const currentEvents = useMemo(() => {
    return DEFAULT_SCHEDULE.filter((evt) => evt.date === selectedDateStr);
  }, [selectedDateStr]);

  const selectedEvent = useMemo(() => {
    return currentEvents.find((evt) => evt.id === selectedEventId) ?? null;
  }, [currentEvents, selectedEventId]);

  /* Render Collapsed Vertical Rail */
  if (isCollapsed && !isMobileDrawer) {
    return (
      <div
        onClick={onToggleCollapse}
        className="group flex h-full w-12 cursor-pointer flex-col items-center justify-between border-l border-zinc-800/80 bg-[#0C0C0E] py-4 text-zinc-400 hover:bg-zinc-900/60 hover:text-white transition-all duration-200 select-none"
        title="Expand Calendar"
        role="button"
        tabIndex={0}
        aria-label="Expand Calendar"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onToggleCollapse?.();
          }
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className="flex size-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Expand Calendar"
            aria-label="Expand Calendar"
          >
            <PanelRightOpen className="size-4 text-lime-400" />
          </button>

          <span className="size-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
        </div>

        {/* Vertical Text */}
        <div className="flex items-center gap-2 [writing-mode:vertical-lr] rotate-180 text-xs font-semibold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
          <span>Calendar</span>
          <span className="text-[10px] text-zinc-600 font-mono tracking-normal">
            {monthYearLabel.slice(0, 3)}
          </span>
        </div>

        <CalendarIcon className="size-4 text-zinc-600 group-hover:text-lime-400 transition-colors" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full flex-col bg-[#0C0C0E] text-zinc-200 border-l border-zinc-800/80 overflow-hidden select-text",
        isMobileDrawer && "w-full max-w-full border-l-0",
        isFullscreen && "border-l-0 w-full flex-1",
        isDragging && "select-none"
      )}
      style={{
        width: !isFullscreen && !isMobileDrawer && width ? `${width}px` : undefined,
      }}
    >
      {/* Horizontal Left Resize Handle */}
      {!isFullscreen && !isMobileDrawer && onResizeStart && (
        <div
          onMouseDown={onResizeStart}
          className="group/handle absolute inset-y-0 -left-1 w-2 cursor-col-resize z-30 hover:bg-lime-400/40 transition-colors flex items-center justify-center"
          title="Drag to resize Calendar panel"
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
        >
          <div className="h-8 w-0.5 rounded-full bg-zinc-700 group-hover/handle:bg-lime-400 transition-colors" />
        </div>
      )}

      {/* Calendar Header with Controls */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 bg-[#0C0C0E] z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon className="size-4 text-lime-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white truncate">
            Calendar
          </span>
          {connection?.status === "connected" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/10 border border-lime-400/25 px-1.5 py-0.5 text-[9px] font-medium text-lime-400 shrink-0">
              <span className="size-1 rounded-full bg-lime-400" />
              Live
            </span>
          )}
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span className="text-[11px] text-zinc-400 font-medium truncate hidden sm:inline">
            {monthYearLabel}
          </span>
        </div>

        {/* Action Controls: Fullscreen, Collapse, Close */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Full Screen Toggle */}
          {onToggleFullscreen && !isMobileDrawer && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors",
                isFullscreen && "bg-lime-400/10 border-lime-400/30 text-lime-400"
              )}
              title={isFullscreen ? "Exit Full Screen" : "Full Screen Calendar"}
              aria-label={isFullscreen ? "Exit Full Screen" : "Full Screen Calendar"}
            >
              {isFullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </button>
          )}

          {/* Full Close Button (X) */}
          <button
            type="button"
            onClick={onClose || onToggleCollapse}
            className="flex size-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Close Calendar"
            aria-label="Close Calendar"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Date Navigation & Controls */}
      <div className="border-b border-zinc-800/80 p-3 space-y-2.5 bg-[#0C0C0E]/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">
            {monthYearLabel}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevDay}
              className="flex size-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="h-7 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="flex size-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Next day"
              aria-label="Next day"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* 7-Day Mini Week Strip */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((item) => (
            <button
              key={item.dateString}
              type="button"
              onClick={() => setSelectedDate(item.date)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl py-1.5 text-center transition-all duration-150 border",
                item.isSelected
                  ? "bg-lime-400 text-zinc-950 font-bold border-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                  : item.isToday
                  ? "bg-zinc-900 text-lime-400 border-lime-400/40 font-semibold"
                  : "bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900/80 hover:text-zinc-200"
              )}
            >
              <span className="text-[10px] uppercase">{item.dayName.slice(0, 2)}</span>
              <span className="text-xs font-semibold leading-tight">{item.dayNumber}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline & Agenda Area */}
      <ScrollArea className="flex-1 min-h-0 px-3 py-3">
        <div className="space-y-4">
          {/* Day Title & Summary */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Schedule ({currentEvents.length}{" "}
              {currentEvents.length === 1 ? "event" : "events"})
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Timeline View */}
          <div className="relative space-y-3">
            {HOURS.map((hour) => {
              // Find matching event
              const matchingEvent = currentEvents.find(
                (evt) => evt.startTime.startsWith(hour.slice(0, 2))
              );

              return (
                <div key={hour} className="group relative flex items-start gap-3">
                  {/* Hour Label */}
                  <span className="w-11 shrink-0 text-right font-mono text-[11px] text-zinc-500 pt-1 select-none">
                    {hour}
                  </span>

                  {/* Slot & Event Card Container */}
                  <div className="relative flex-1 min-w-0 border-t border-zinc-800/50 pt-1.5 min-h-[36px]">
                    {matchingEvent ? (
                      <div
                        onClick={() =>
                          setSelectedEventId((prev) =>
                            prev === matchingEvent.id ? null : matchingEvent.id
                          )
                        }
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 text-xs transition-all duration-150 shadow-sm border-l-4",
                          categoryStyles[matchingEvent.category].card,
                          categoryStyles[matchingEvent.category].border,
                          selectedEventId === matchingEvent.id &&
                            "ring-2 ring-lime-400/60 scale-[1.01] shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="font-semibold text-white text-xs leading-snug break-words">
                            {matchingEvent.title}
                          </p>
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[9px] font-medium border shrink-0",
                              categoryStyles[matchingEvent.category].tag
                            )}
                          >
                            {matchingEvent.duration}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="size-3 text-zinc-500 shrink-0" />
                            {matchingEvent.startTime} – {matchingEvent.endTime}
                          </span>
                          {matchingEvent.location && (
                            <span className="flex items-center gap-1 text-zinc-300">
                              <Video className="size-3 text-zinc-500 shrink-0" />
                              <span className="truncate max-w-[200px]">{matchingEvent.location}</span>
                            </span>
                          )}
                        </div>

                        {/* Rich Details on Selection */}
                        {selectedEventId === matchingEvent.id && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2 text-[11px] animate-in fade-in duration-150">
                            {matchingEvent.description && (
                              <p className="text-zinc-300 leading-relaxed font-light">
                                {matchingEvent.description}
                              </p>
                            )}
                            {matchingEvent.attendees && (
                              <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                                <Users className="size-3 text-zinc-500 shrink-0" />
                                <span className="truncate">
                                  {matchingEvent.attendees.join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-5 w-full rounded hover:bg-zinc-800/20 transition-colors" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty Day State */}
          {currentEvents.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-center text-zinc-500 space-y-1">
              <CalendarIcon className="size-6 mx-auto text-zinc-600 mb-2" />
              <p className="text-xs font-medium text-zinc-400">No events scheduled</p>
              <p className="text-[11px] text-zinc-600">
                Ask Calby to schedule a meeting for this day.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Calendar Bottom Sync Bar */}
      <div className="border-t border-zinc-800/80 p-3 bg-[#0C0C0E] flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-lime-400" />
          <span className="text-[11px] font-medium text-zinc-300">
            Google Calendar Sync
          </span>
        </div>
        <button
          type="button"
          onClick={() => checkConnection()}
          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors rounded-md"
          title="Refresh calendar sync"
          aria-label="Refresh calendar sync"
        >
          <RefreshCw
            className={cn("size-3.5", loadingConnection && "animate-spin text-lime-400")}
          />
        </button>
      </div>
    </div>
  );
}
