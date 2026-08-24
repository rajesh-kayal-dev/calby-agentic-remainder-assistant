"use client";

import { Clock, MapPin, Users, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarEventItem = {
  id: string;
  title: string;
  startTime: string; // e.g. "09:30"
  endTime: string; // e.g. "10:30"
  duration?: string; // e.g. "1h" or "30 min"
  category: "work" | "meeting" | "personal";
  dayOfWeek: number; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 0 = Sun
  dateStr?: string; // "2026-08-24"
  startHour: number; // e.g. 9.5 for 09:30
  durationHours: number; // e.g. 1.0
  location?: string;
  attendees?: string[];
  description?: string;
  source?: string;
};

const categoryColorStyles: Record<
  CalendarEventItem["category"],
  {
    ring: string;
    bg: string;
    text: string;
    timeText: string;
    border: string;
  }
> = {
  work: {
    ring: "ring-emerald-400/30",
    bg: "bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 hover:from-emerald-500/30 hover:to-emerald-400/15",
    text: "text-emerald-300",
    timeText: "text-emerald-400/80",
    border: "border-l-emerald-400",
  },
  meeting: {
    ring: "ring-sky-400/30",
    bg: "bg-gradient-to-r from-sky-500/20 to-cyan-500/10 hover:from-sky-500/30 hover:to-cyan-500/15",
    text: "text-sky-300",
    timeText: "text-sky-400/80",
    border: "border-l-sky-400",
  },
  personal: {
    ring: "ring-amber-400/30",
    bg: "bg-gradient-to-r from-amber-500/20 to-orange-500/10 hover:from-amber-500/30 hover:to-orange-500/15",
    text: "text-amber-300",
    timeText: "text-amber-400/80",
    border: "border-l-amber-400",
  },
};

type Props = {
  event: CalendarEventItem;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
};

export function EventCard({
  event,
  isSelected,
  onClick,
  className,
  compact = false,
}: Props) {
  const styles = categoryColorStyles[event.category] || categoryColorStyles.work;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 ring-1 p-2 text-left transition-all duration-150 cursor-pointer shadow-sm border-l-[3px]",
        styles.ring,
        styles.bg,
        styles.border,
        isSelected &&
          "ring-2 ring-lime-400 scale-[1.02] shadow-[0_0_15px_rgba(163,230,53,0.25)] z-20",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p
            className={cn(
              "font-semibold leading-tight truncate text-white",
              compact ? "text-[11px]" : "text-xs"
            )}
          >
            {event.title}
          </p>
          {event.location && (
            <Video className="size-2.5 text-zinc-400 shrink-0" />
          )}
        </div>

        <p
          className={cn(
            "font-mono font-medium tracking-tight mt-0.5",
            styles.timeText,
            compact ? "text-[9px]" : "text-[10px]"
          )}
        >
          {event.startTime} - {event.endTime}
        </p>
      </div>

      {!compact && event.attendees && event.attendees.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-[9px] text-zinc-400 truncate">
          <Users className="size-2.5 text-zinc-500 shrink-0" />
          <span className="truncate">{event.attendees[0]}</span>
        </div>
      )}
    </div>
  );
}
