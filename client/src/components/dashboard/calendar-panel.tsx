"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  MapPin,
  Maximize2,
  Minimize2,
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
import { CalbyTooltip } from "../ui/calby-tooltip";
import { CalendarEventItem, fetchCalendarEvents } from "@/lib/calendar";

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
  string,
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
  focus: {
    card: "bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/15 text-purple-200",
    tag: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    dot: "bg-purple-400",
    border: "border-l-purple-400",
    text: "text-purple-300",
  },
  other: {
    card: "bg-zinc-700/10 border-zinc-600/25 hover:bg-zinc-700/15 text-zinc-200",
    tag: "bg-zinc-700/20 text-zinc-300 border-zinc-600/30",
    dot: "bg-zinc-400",
    border: "border-l-zinc-400",
    text: "text-zinc-300",
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
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const checkConnection = useCallback(async () => {
    try {
      const conn = await fetchCalendarConnection(sessionToken);
      setConnection(conn);
    } catch {
      // ignore
    }
  }, [sessionToken]);

  const loadEvents = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const res = await fetchCalendarEvents(sessionToken, {
        start: start.toISOString(),
        end: end.toISOString(),
      });
      if (res.success) {
        setEvents(res.events);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [sessionToken, selectedDate]);

  useEffect(() => {
    checkConnection();
    loadEvents();
  }, [checkConnection, loadEvents]);

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
      const isToday = d.toDateString() === new Date().toDateString();
      const isSelected = d.toDateString() === selectedDate.toDateString();

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
    return events.filter((evt) => {
      const evtDate = new Date(evt.start).toISOString().split("T")[0];
      return evtDate === selectedDateStr;
    });
  }, [events, selectedDateStr]);

  const selectedEvent = useMemo(() => {
    return currentEvents.find((evt) => evt.id === selectedEventId) ?? null;
  }, [currentEvents, selectedEventId]);

  /* Render Collapsed Fallback (0px layout width handled by parent section) */
  if (isCollapsed && !isMobileDrawer) {
    return null;
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
      {/* Vertical Stretch / Drag Handle with Grip Icon */}
      {!isFullscreen && !isMobileDrawer && onResizeStart && (
        <div
          onMouseDown={onResizeStart}
          className="group/handle absolute inset-y-0 -left-2 w-4 cursor-col-resize z-30 flex items-center justify-center select-none"
          role="separator"
          aria-orientation="vertical"
          aria-label="Drag to stretch Calendar workspace"
          tabIndex={0}
        >
          {/* Divider Line */}
          <div className="h-full w-[1px] bg-zinc-800 group-hover/handle:bg-lime-400/60 transition-colors" />

          {/* Centered Floating Stretch Handle Icon */}
          <div className="absolute top-1/2 -translate-y-1/2 flex h-8 w-4 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/90 text-zinc-500 group-hover/handle:border-lime-400/50 group-hover/handle:bg-zinc-800 group-hover/handle:text-lime-400 shadow-md transition-all duration-200">
            <GripVertical className="size-3.5" />
          </div>
        </div>
      )}

      {/* Calendar Header with Controls */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 bg-[#0C0C0E] z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <CalbyTooltip content={isCollapsed ? "Open Calendar" : "Close Calendar"} side="bottom">
            <button
              type="button"
              onClick={onToggleCollapse || onClose}
              className="flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-all shadow-sm group shrink-0"
              aria-label={isCollapsed ? "Open Calendar" : "Close Calendar"}
            >
              <CalendarIcon className="size-5 text-lime-400 group-hover:scale-105 transition-transform" />
            </button>
          </CalbyTooltip>

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

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={loadEvents}
            disabled={loading}
            className="flex size-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin text-lime-400")} />
          </button>

          {onToggleFullscreen && !isMobileDrawer && (
            <CalbyTooltip content={isFullscreen ? "Exit Fullscreen" : "Expand Calendar"} side="bottom">
              <button
                type="button"
                onClick={onToggleFullscreen}
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors",
                  isFullscreen && "bg-lime-400/10 border-lime-400/30 text-lime-400"
                )}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Expand Calendar"}
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </button>
            </CalbyTooltip>
          )}
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
              const hourNum = parseInt(hour.slice(0, 2), 10);
              const matchingEvent = currentEvents.find((evt) => {
                const evtHour = new Date(evt.start).getHours();
                return evtHour === hourNum;
              });

              const categoryStyle = matchingEvent
                ? categoryStyles[matchingEvent.category] || categoryStyles.work
                : null;

              const startTimeFormatted = matchingEvent
                ? new Date(matchingEvent.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
              const endTimeFormatted = matchingEvent
                ? new Date(matchingEvent.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div key={hour} className="group relative flex items-start gap-3">
                  {/* Hour Label */}
                  <span className="w-11 shrink-0 text-right font-mono text-[11px] text-zinc-500 pt-1 select-none">
                    {hour}
                  </span>

                  {/* Slot & Event Card Container */}
                  <div className="relative flex-1 min-w-0 border-t border-zinc-800/50 pt-1.5 min-h-[36px]">
                    {matchingEvent && categoryStyle ? (
                      <div
                        onClick={() =>
                          setSelectedEventId((prev) =>
                            prev === matchingEvent.id ? null : matchingEvent.id
                          )
                        }
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 text-xs transition-all duration-150 shadow-sm border-l-4",
                          categoryStyle.card,
                          categoryStyle.border,
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
                              categoryStyle.tag
                            )}
                          >
                            {matchingEvent.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-zinc-500" />
                            {startTimeFormatted} - {endTimeFormatted}
                          </span>
                          {matchingEvent.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="size-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{matchingEvent.location}</span>
                            </span>
                          )}
                        </div>

                        {matchingEvent.description && (
                          <p className="text-[11px] text-zinc-300/90 leading-relaxed line-clamp-2">
                            {matchingEvent.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="h-6 rounded border border-dashed border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-2 text-[10px] text-zinc-600">
                        Open Slot
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
