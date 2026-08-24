"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
};

export function MiniCalendar({ selectedDate, onSelectDate, className }: Props) {
  const [viewDate, setViewDate] = useState<Date>(() => new Date(selectedDate));

  const monthYearTitle = useMemo(() => {
    return viewDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return next;
    });
  };

  const daysGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    const todayStr = new Date().toDateString();
    const selectedStr = selectedDate.toDateString();

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: d.toDateString() === todayStr,
        isSelected: d.toDateString() === selectedStr,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: d.toDateString() === todayStr,
        isSelected: d.toDateString() === selectedStr,
      });
    }

    // Next month leading days to complete grid (multiples of 7)
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: d.toDateString() === todayStr,
        isSelected: d.toDateString() === selectedStr,
      });
    }

    return days;
  }, [viewDate, selectedDate]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-3.5 backdrop-blur-md",
        className
      )}
    >
      {/* Month Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="flex size-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <span className="text-xs font-semibold tracking-tight text-white">
          {monthYearTitle}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="flex size-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysGrid.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelectDate(item.date);
              if (!item.isCurrentMonth) {
                setViewDate(new Date(item.date));
              }
            }}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-all duration-150 mx-auto",
              item.isSelected
                ? "bg-lime-400 text-zinc-950 font-bold shadow-[0_0_12px_rgba(163,230,53,0.35)] scale-105"
                : item.isToday
                ? "border border-lime-400/60 text-lime-400 font-semibold bg-lime-400/5"
                : item.isCurrentMonth
                ? "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                : "text-zinc-600 hover:bg-zinc-800/40 hover:text-zinc-400"
            )}
          >
            {item.dayNumber}
          </button>
        ))}
      </div>
    </div>
  );
}
