"use client";

import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Maximize2,
  MessageSquare,
  Minimize2,
  Plus,
  Search,
  Share2,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarBackground } from "./calendar-background";
import { MiniCalendar } from "./mini-calendar";
import { ConnectedCalendars } from "./connected-calendars";
import { WeekView } from "./week-view";
import { CalendarEventItem } from "./event-card";
import { Button } from "@/components/ui/button";
import { CalbyTooltip } from "@/components/ui/calby-tooltip";

const INITIAL_EVENTS: CalendarEventItem[] = [
  {
    id: "evt-1",
    title: "Daily Engineering Kickoff",
    startTime: "08:30",
    endTime: "09:00",
    duration: "30 min",
    category: "work",
    dayOfWeek: 1, // Mon
    startHour: 8.5,
    durationHours: 0.5,
    location: "Google Meet",
    attendees: ["team@calby.ai", "lead@calby.ai"],
    description: "Daily engineering synchronization and sprint blocker removal.",
    source: "Google Calendar",
  },
  {
    id: "evt-2",
    title: "Daily Engineering Kickoff",
    startTime: "08:30",
    endTime: "09:00",
    duration: "30 min",
    category: "work",
    dayOfWeek: 2, // Tue
    startHour: 8.5,
    durationHours: 0.5,
    location: "Google Meet",
    attendees: ["team@calby.ai"],
    source: "Google Calendar",
  },
  {
    id: "evt-3",
    title: "Daily Engineering Kickoff",
    startTime: "08:30",
    endTime: "09:00",
    duration: "30 min",
    category: "work",
    dayOfWeek: 3, // Wed
    startHour: 8.5,
    durationHours: 0.5,
    location: "Google Meet",
    attendees: ["team@calby.ai"],
    source: "Google Calendar",
  },
  {
    id: "evt-4",
    title: "Daily Engineering Kickoff",
    startTime: "08:30",
    endTime: "09:00",
    duration: "30 min",
    category: "work",
    dayOfWeek: 4, // Thu
    startHour: 8.5,
    durationHours: 0.5,
    location: "Google Meet",
    attendees: ["team@calby.ai"],
    source: "Google Calendar",
  },
  {
    id: "evt-5",
    title: "Daily Engineering Kickoff",
    startTime: "08:30",
    endTime: "09:00",
    duration: "30 min",
    category: "work",
    dayOfWeek: 5, // Fri
    startHour: 8.5,
    durationHours: 0.5,
    location: "Google Meet",
    attendees: ["team@calby.ai"],
    source: "Google Calendar",
  },
  {
    id: "evt-6",
    title: "UX Architecture Review",
    startTime: "09:30",
    endTime: "11:00",
    duration: "1h 30m",
    category: "meeting",
    dayOfWeek: 1, // Mon
    startHour: 9.5,
    durationHours: 1.5,
    location: "Design Room & Meet",
    attendees: ["sarah@calby.ai", "marcus@enterprise.com"],
    description: "Deep dive into Calby dark design system and user flow ergonomics.",
    source: "Google Calendar",
  },
  {
    id: "evt-7",
    title: "Quarterly Strategy Planning",
    startTime: "09:30",
    endTime: "10:30",
    duration: "1h",
    category: "meeting",
    dayOfWeek: 2, // Tue
    startHour: 9.5,
    durationHours: 1.0,
    attendees: ["execs@calby.ai"],
    description: "Q3 objectives, key results, and AI model orchestration roadmap.",
    source: "Google Calendar",
  },
  {
    id: "evt-8",
    title: "Enterprise Stakeholder Sync",
    startTime: "09:45",
    endTime: "11:30",
    duration: "1h 45m",
    category: "meeting",
    dayOfWeek: 3, // Wed
    startHour: 9.75,
    durationHours: 1.75,
    location: "Google Meet",
    attendees: ["partner@enterprise.com"],
    source: "Google Calendar",
  },
  {
    id: "evt-9",
    title: "Product All-Hands",
    startTime: "09:30",
    endTime: "10:30",
    duration: "1h",
    category: "personal",
    dayOfWeek: 4, // Thu
    startHour: 9.5,
    durationHours: 1.0,
    attendees: ["all@calby.ai"],
    source: "Google Calendar",
  },
  {
    id: "evt-10",
    title: "Sprint Implementation",
    startTime: "10:45",
    endTime: "12:00",
    duration: "1h 15m",
    category: "work",
    dayOfWeek: 2, // Tue
    startHour: 10.75,
    durationHours: 1.25,
    description: "Focused engineering session for agentic scheduling integrations.",
    source: "Google Calendar",
  },
  {
    id: "evt-11",
    title: "Client Integration Demo",
    startTime: "11:00",
    endTime: "11:30",
    duration: "30 min",
    category: "work",
    dayOfWeek: 1, // Mon
    startHour: 11.0,
    durationHours: 0.5,
    location: "Google Meet",
    attendees: ["client-success@calby.ai"],
    source: "Google Calendar",
  },
  {
    id: "evt-12",
    title: "Lunch & Rest",
    startTime: "12:00",
    endTime: "13:00",
    duration: "1h",
    category: "personal",
    dayOfWeek: 1, // Mon
    startHour: 12.0,
    durationHours: 1.0,
  },
  {
    id: "evt-13",
    title: "Lunch & Rest",
    startTime: "12:00",
    endTime: "13:00",
    duration: "1h",
    category: "personal",
    dayOfWeek: 2, // Tue
    startHour: 12.0,
    durationHours: 1.0,
  },
  {
    id: "evt-14",
    title: "Lunch & Rest",
    startTime: "12:00",
    endTime: "13:00",
    duration: "1h",
    category: "personal",
    dayOfWeek: 3, // Wed
    startHour: 12.0,
    durationHours: 1.0,
  },
  {
    id: "evt-15",
    title: "Lunch & Rest",
    startTime: "12:00",
    endTime: "13:00",
    duration: "1h",
    category: "personal",
    dayOfWeek: 4, // Thu
    startHour: 12.0,
    durationHours: 1.0,
  },
  {
    id: "evt-16",
    title: "Lunch & Rest",
    startTime: "12:00",
    endTime: "13:00",
    duration: "1h",
    category: "personal",
    dayOfWeek: 5, // Fri
    startHour: 12.0,
    durationHours: 1.0,
  },
];

const UPCOMING_TASKS = [
  {
    id: "task-1",
    title: "Review Q3 Calendar Availability",
    time: "Today • 2:00 PM",
    completed: false,
  },
  {
    id: "task-2",
    title: "Sync with Calby on sprint schedule",
    time: "Tomorrow • 10:00 AM",
    completed: true,
  },
];

type Props = {
  sessionToken: string;
  userLabel?: string;
  onAskCalby?: (initialPrompt?: string) => void;
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
  onToggleFullscreen?: () => void;
};

export function CalendarWorkspace({
  sessionToken,
  userLabel,
  onAskCalby,
  isFullscreen = false,
  onExitFullscreen,
  onToggleFullscreen,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<CalendarEventItem[]>(INITIAL_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState(UPCOMING_TASKS);
  const [shareSuccess, setShareSuccess] = useState(false);

  const monthYearLabel = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const handlePrevWeek = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleScheduleWithCalby = (dateStr: string, timeSlot: string) => {
    if (onAskCalby) {
      onAskCalby(
        `Schedule a meeting on ${dateStr} around ${timeSlot}. Check my Google Calendar for conflicts first.`
      );
    }
  };

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) ?? null;
  }, [events, selectedEventId]);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  const userInitial = userLabel ? userLabel.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#09090B]/40 p-2 sm:p-4 select-text">
      {/* Unicorn Studio Subtle Atmospheric Background (Project: ZPruWnhzwuk5Tf6nc1q0) */}
      <CalendarBackground />

      {/* Outer Workspace Glass Card with Smooth Expand Animation */}
      <div className="calendar-fullscreen-enter relative z-10 flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0C0C0E]/75 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        {/* Subtle Top Radial Lime Glow */}
        <div className="pointer-events-none absolute -top-8 left-1/2 h-20 w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(163,230,53,0.12),rgba(0,0,0,0))] blur-2xl" />

        {/* Workspace App Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 sm:px-6 bg-[#0C0C0E]/90 z-10">
          <div className="flex items-center gap-3">
            {onExitFullscreen || onAskCalby ? (
              <CalbyTooltip content="Close Calendar" side="bottom">
                <button
                  type="button"
                  onClick={() => {
                    if (onExitFullscreen) onExitFullscreen();
                    else if (onAskCalby) onAskCalby();
                  }}
                  className="flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-all shadow-sm group"
                  aria-label="Close Calendar"
                >
                  <CalendarIcon className="size-5 text-lime-400 group-hover:scale-105 transition-transform" />
                </button>
              </CalbyTooltip>
            ) : (
              <div className="flex size-9 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
                <CalendarIcon className="size-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                Calby Calendar
                <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-lime-400 uppercase">
                  Workspace
                </span>
              </p>
              <p className="text-[11px] text-zinc-400">{monthYearLabel}</p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="hidden md:flex items-center gap-2 h-9 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 focus-within:border-zinc-700 transition-colors">
              <Search className="size-3.5 text-zinc-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schedule…"
                className="w-36 lg:w-48 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                aria-label="Next week"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* Ask Calby AI Quick Button */}
            {onAskCalby && (
              <Button
                onClick={() =>
                  onAskCalby("What meetings do I have this week?")
                }
                size="sm"
                className="hidden sm:inline-flex items-center gap-1.5 h-9 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs shadow-[0_0_12px_rgba(163,230,53,0.25)] transition-all"
              >
                <Sparkles className="size-3.5" />
                <span>Ask Calby</span>
              </Button>
            )}

            {/* Exit Fullscreen Button */}
            {onExitFullscreen && (
              <CalbyTooltip content="Exit Fullscreen" side="bottom">
                <button
                  type="button"
                  onClick={onExitFullscreen}
                  className="flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  aria-label="Exit Fullscreen"
                >
                  <Minimize2 className="size-4 text-lime-400" />
                </button>
              </CalbyTooltip>
            )}

            {/* User Profile Avatar */}
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Workspace Body Grid */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left Calendar Sidebar */}
          <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-zinc-800/80 bg-[#0C0C0E]/70 p-4 space-y-5 overflow-y-auto">
            {/* Mini Month Calendar */}
            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
            />

            {/* Linked / Connected Google Calendar */}
            <ConnectedCalendars sessionToken={sessionToken} />

            {/* Next Up / Tasks Section */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                Next Up
              </p>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 cursor-pointer hover:bg-zinc-800/60 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="mt-0.5 size-3.5 rounded accent-lime-400 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-medium leading-snug text-zinc-200",
                          task.completed && "line-through text-zinc-500"
                        )}
                      >
                        {task.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {task.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Calendar Week Grid Area */}
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950/40 p-3 sm:p-4">
            <div className="flex-1 overflow-y-auto pr-1">
              <WeekView
                selectedDate={selectedDate}
                events={events}
                selectedEventId={selectedEventId}
                onSelectEvent={(evt) =>
                  setSelectedEventId((prev) =>
                    prev === evt.id ? null : evt.id
                  )
                }
                onScheduleWithCalby={handleScheduleWithCalby}
                searchQuery={searchQuery}
              />

              {/* Selected Event Detail Overlay Drawer */}
              {selectedEvent && (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-[#0C0C0E] p-4 shadow-xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-lime-400" />
                      <h4 className="text-sm font-semibold text-white">
                        {selectedEvent.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEventId(null)}
                      className="text-zinc-400 hover:text-white p-1"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-zinc-300">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Clock className="size-3.5 text-zinc-500" />
                      {selectedEvent.startTime} – {selectedEvent.endTime} (
                      {selectedEvent.duration})
                    </span>
                    {selectedEvent.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-zinc-500" />
                        {selectedEvent.location}
                      </span>
                    )}
                    {selectedEvent.source && (
                      <span className="flex items-center gap-1.5 text-lime-400 font-medium">
                        <CalendarIcon className="size-3.5" />
                        {selectedEvent.source}
                      </span>
                    )}
                  </div>

                  {selectedEvent.description && (
                    <p className="text-xs text-zinc-400 leading-relaxed font-light">
                      {selectedEvent.description}
                    </p>
                  )}

                  {selectedEvent.attendees && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Users className="size-3.5 text-zinc-500" />
                      <span>{selectedEvent.attendees.join(", ")}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                    {onAskCalby && (
                      <Button
                        size="sm"
                        onClick={() =>
                          onAskCalby(
                            `Reschedule my "${selectedEvent.title}" meeting at ${selectedEvent.startTime}`
                          )
                        }
                        className="h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs"
                      >
                        <Sparkles className="size-3" />
                        Reschedule with Calby
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status & Action Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-[#0C0C0E] p-3 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)] animate-pulse" />
                <span className="font-medium text-white">
                  Calby Smart Scheduling is active
                </span>
                <span className="hidden sm:inline text-zinc-500">·</span>
                <span className="hidden sm:inline text-zinc-400">
                  Synced with Google Calendar
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onAskCalby && (
                  <button
                    type="button"
                    onClick={() =>
                      onAskCalby("Find a free 45-minute slot this week")
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <Sparkles className="size-3 text-lime-400" />
                    <span>Find Free Slot</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <Share2 className="size-3 text-zinc-400" />
                  <span>{shareSuccess ? "Link Copied!" : "Share"}</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
