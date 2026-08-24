"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarEventItem, EventCard } from "./event-card";

const HOURS = [
  "07:00",
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

type Props = {
  selectedDate: Date;
  events: CalendarEventItem[];
  selectedEventId: string | null;
  onSelectEvent: (event: CalendarEventItem) => void;
  onScheduleWithCalby?: (dateStr: string, timeSlot: string) => void;
  searchQuery?: string;
};

export function WeekView({
  selectedDate,
  events,
  selectedEventId,
  onSelectEvent,
  onScheduleWithCalby,
  searchQuery = "",
}: Props) {
  // Calculate the 5 or 7 days of the week containing selectedDate
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const startOfWeek = new Date(current.setDate(diff));

    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const isToday =
        d.toDateString() === new Date().toDateString();
      const isSelected =
        d.toDateString() === selectedDate.toDateString();

      const dayOfWeekIndex = d.getDay(); // 1 for Mon, 2 for Tue, etc.

      return {
        date: d,
        dayOfWeekIndex,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: d.getDate(),
        dateStr: d.toISOString().split("T")[0],
        isToday,
        isSelected,
      };
    });
  }, [selectedDate]);

  // Filter events matching search query if provided
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHourNum = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  return (
    <div className="w-full min-w-[620px] overflow-x-auto select-none">
      {/* Days Header */}
      <div
        className="grid gap-2 mb-3 px-1"
        style={{ gridTemplateColumns: "64px repeat(5, minmax(0, 1fr))" }}
      >
        <div className="text-xs text-zinc-500 font-mono" />
        {weekDays.map((item) => (
          <div
            key={item.dateStr}
            className={cn(
              "rounded-xl py-2 px-1 text-center transition-colors border",
              item.isToday
                ? "bg-lime-400/10 border-lime-400/40 text-lime-400 shadow-sm"
                : item.isSelected
                ? "bg-zinc-800/80 border-zinc-700 text-white font-semibold"
                : "border-transparent text-zinc-300 hover:bg-zinc-900/60"
            )}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider block text-zinc-400">
              {item.dayName}
            </span>
            <span
              className={cn(
                "text-sm font-bold block",
                item.isToday ? "text-lime-400" : "text-white"
              )}
            >
              {item.dayNumber}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Hourly Grid */}
      <div
        className="grid relative border border-zinc-800/80 rounded-2xl bg-zinc-950/40 backdrop-blur-sm overflow-hidden divide-y divide-zinc-800/50"
        style={{
          gridTemplateColumns: "64px repeat(5, minmax(0, 1fr))",
          gridAutoRows: "68px",
        }}
      >
        {HOURS.map((hour, hourIdx) => {
          const gridRow = hourIdx + 1;
          const hourNum = parseInt(hour.slice(0, 2), 10);
          const isCurrentHour = currentHourNum === hourNum;

          return (
            <div key={hour} className="contents">
              {/* Hour Label */}
              <div
                className="flex items-center justify-end pr-3 text-[11px] font-mono text-zinc-500 border-r border-zinc-800/70 bg-[#0C0C0E]/40 select-none relative"
                style={{ gridRow }}
              >
                <span>{hour}</span>
                {isCurrentHour && (
                  <span className="absolute -right-1.5 size-2 rounded-full bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.8)] z-30" />
                )}
              </div>

              {/* 5 Day Columns for this hour */}
              {weekDays.map((dayItem, dayColIdx) => {
                const dayIndex = dayItem.dayOfWeekIndex;

                // Find event starting in this hour
                const matchingEvent = filteredEvents.find(
                  (evt) =>
                    evt.dayOfWeek === dayIndex &&
                    Math.floor(evt.startHour) === hourNum
                );

                // Calby AI Free Slot suggestion for Tuesday 13:00 or Wednesday 11:00
                const isAiSlot =
                  (dayIndex === 2 && hourNum === 13) ||
                  (dayIndex === 4 && hourNum === 14);

                return (
                  <div
                    key={`${dayItem.dateStr}-${hour}`}
                    className={cn(
                      "relative p-1 border-r border-zinc-800/40 last:border-r-0 hover:bg-zinc-900/30 transition-colors group",
                      dayItem.isToday && "bg-lime-400/[0.02]"
                    )}
                    style={{ gridRow }}
                  >
                    {/* Live Current Time Indicator Line */}
                    {isCurrentHour && dayItem.isToday && (
                      <div
                        className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                        style={{
                          top: `${Math.min(Math.max((currentMinutes / 60) * 100, 5), 95)}%`,
                        }}
                      >
                        <div className="size-1.5 -ml-0.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,1)]" />
                        <div className="h-[1.5px] flex-1 bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.6)]" />
                      </div>
                    )}
                    {matchingEvent ? (
                      <div
                        className="h-full"
                        style={{
                          height:
                            matchingEvent.durationHours > 1
                              ? `calc(${matchingEvent.durationHours * 100}% + ${(matchingEvent.durationHours - 1) * 8}px)`
                              : "100%",
                        }}
                      >
                        <EventCard
                          event={matchingEvent}
                          isSelected={selectedEventId === matchingEvent.id}
                          onClick={() => onSelectEvent(matchingEvent)}
                        />
                      </div>
                    ) : isAiSlot ? (
                      /* Calby AI Suggested Free Slot */
                      <div
                        onClick={() =>
                          onScheduleWithCalby?.(
                            dayItem.dateStr,
                            `${hourNum}:00 - ${hourNum}:45`
                          )
                        }
                        className="h-full cursor-pointer rounded-xl border border-dashed border-lime-400/40 bg-lime-400/5 p-1.5 transition-all hover:bg-lime-400/10 hover:border-lime-400/70 group/slot"
                        title="Click to schedule with Calby AI"
                      >
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-lime-400">
                          <Sparkles className="size-2.5 text-lime-400 animate-pulse" />
                          <span>Calby AI Hint</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 group-hover/slot:text-zinc-200">
                          Optimal open slot
                        </p>
                      </div>
                    ) : (
                      /* Empty slot quick action */
                      <button
                        type="button"
                        onClick={() =>
                          onScheduleWithCalby?.(
                            dayItem.dateStr,
                            `${hourNum}:00`
                          )
                        }
                        className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg border border-dashed border-zinc-700 text-[10px] text-zinc-500 hover:text-lime-400 hover:border-lime-400/50 hover:bg-zinc-900/60 transition-all"
                      >
                        + Book
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
