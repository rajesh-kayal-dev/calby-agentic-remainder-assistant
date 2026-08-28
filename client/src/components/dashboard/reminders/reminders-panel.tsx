"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  RotateCw,
  MoreVertical,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Check,
  Timer,
  Phone,
  FileText,
  Dumbbell,
  Gift,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reminder, ReminderStatus } from "@/lib/types";
import {
  fetchReminders,
  pauseReminderApi,
  resumeReminderApi,
  deleteReminderApi,
  completeReminderApi,
  snoozeReminderApi,
} from "@/lib/reminders";
import { CreateReminderModal } from "./create-reminder-modal";
import { EditReminderModal } from "./edit-reminder-modal";

interface RemindersPanelProps {
  sessionToken: string;
}

type TabCategory = "active" | "today" | "all" | "completed" | "paused";

function getReminderCategoryIcon(title: string, category?: string) {
  const lower = (title + " " + (category || "")).toLowerCase();
  if (lower.includes("call") || lower.includes("phone") || lower.includes("meet")) {
    return {
      icon: <Phone className="size-4 text-lime-400" />,
      bg: "bg-lime-400/10 border-lime-400/30",
    };
  }
  if (lower.includes("report") || lower.includes("doc") || lower.includes("file") || lower.includes("submit")) {
    return {
      icon: <FileText className="size-4 text-sky-400" />,
      bg: "bg-sky-400/10 border-sky-400/30",
    };
  }
  if (lower.includes("gym") || lower.includes("workout") || lower.includes("health") || lower.includes("fitness")) {
    return {
      icon: <Dumbbell className="size-4 text-purple-400" />,
      bg: "bg-purple-400/10 border-purple-400/30",
    };
  }
  if (lower.includes("gift") || lower.includes("birthday") || lower.includes("party") || lower.includes("buy")) {
    return {
      icon: <Gift className="size-4 text-amber-400" />,
      bg: "bg-amber-400/10 border-amber-400/30",
    };
  }
  return {
    icon: <Bell className="size-4 text-lime-400" />,
    bg: "bg-lime-400/10 border-lime-400/30",
  };
}

function formatDateDisplay(isoString: string): { date: string; time: string } {
  try {
    const d = new Date(isoString);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const dateStr = isToday
      ? "Today"
      : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    return { date: dateStr, time: timeStr };
  } catch {
    return { date: "Scheduled", time: "" };
  }
}

export function RemindersPanel({ sessionToken }: RemindersPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabCategory>("active");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [openSnoozeId, setOpenSnoozeId] = useState<string | null>(null);

  const loadReminders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchReminders(sessionToken);
      setReminders(res.reminders || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load reminders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, [sessionToken]);

  // Tab filtering & Search logic
  const filteredReminders = useMemo(() => {
    let list = reminders;
    const todayStr = new Date().toISOString().split("T")[0];

    if (activeTab === "active") {
      list = list.filter((r) => r.status === "active");
    } else if (activeTab === "today") {
      list = list.filter(
        (r) => (r.due_at && r.due_at.startsWith(todayStr)) || (r.next_run_at && r.next_run_at.startsWith(todayStr)),
      );
    } else if (activeTab === "completed") {
      list = list.filter((r) => r.status === "completed");
    } else if (activeTab === "paused") {
      list = list.filter((r) => r.status === "paused");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [reminders, activeTab, searchQuery]);

  const handlePause = async (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: "paused" } : r)));
    try {
      await pauseReminderApi(sessionToken, id);
    } catch {
      loadReminders();
    }
  };

  const handleResume = async (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: "active" } : r)));
    try {
      await resumeReminderApi(sessionToken, id);
    } catch {
      loadReminders();
    }
  };

  const handleComplete = async (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: "completed" } : r)));
    try {
      await completeReminderApi(sessionToken, id);
    } catch {
      loadReminders();
    }
  };

  const handleSnooze = async (id: string, minutes = 10) => {
    setOpenSnoozeId(null);
    try {
      const res = await snoozeReminderApi(sessionToken, id, minutes);
      if (res.reminder) {
        setReminders((prev) => prev.map((r) => (r.id === id ? res.reminder : r)));
      } else {
        loadReminders();
      }
    } catch {
      loadReminders();
    }
  };

  const handleDelete = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteReminderApi(sessionToken, id);
    } catch {
      loadReminders();
    }
  };

  const activeCount = reminders.filter((r) => r.status === "active").length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#0A0B0E] p-4 sm:p-6 text-white select-none">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">Reminders</h1>
            <span className="rounded-full border border-lime-400/40 bg-lime-400/15 px-2.5 py-0.5 text-xs font-bold text-lime-400">
              {activeCount} Active
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Time-based alerts and recurring tasks created manually or via Calby AI
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadReminders()}
            className="flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            title="Refresh reminders"
          >
            <RefreshCw className="size-4" />
          </button>
          <Button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full bg-lime-400 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-lime-300 transition-all shadow-md cursor-pointer"
          >
            <Plus className="mr-1.5 size-4" />
            Create Reminder
          </Button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-2xl border border-zinc-800/80 bg-[#12131A] p-1 text-xs">
          {(
            [
              { id: "active", label: "Upcoming" },
              { id: "today", label: "Today" },
              { id: "all", label: "All" },
              { id: "completed", label: "Completed" },
              { id: "paused", label: "Paused" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-xl px-4 py-1.5 font-bold transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-lime-400 text-zinc-950 shadow-[0_0_10px_rgba(163,230,53,0.3)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex items-center rounded-xl border border-zinc-800 bg-[#12131A] px-3 py-2 sm:w-64">
          <Search className="size-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/40"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-[#12131A] p-10 text-center space-y-3">
            <AlertCircle className="size-8 text-red-400" />
            <h3 className="text-xs font-bold text-white">Couldn't load reminders</h3>
            <p className="text-xs text-zinc-400">{error}</p>
            <Button
              type="button"
              onClick={loadReminders}
              size="sm"
              className="rounded-xl bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 cursor-pointer"
            >
              Try Again
            </Button>
          </div>
        ) : filteredReminders.length === 0 ? (
          /* Reference Design Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800/80 bg-[#12131A] p-12 text-center my-8 space-y-4">
            <div className="relative flex size-14 items-center justify-center rounded-2xl border border-lime-400/30 bg-lime-400/10 text-lime-400 shadow-md">
              <ClipboardList className="size-7" />
              <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-lime-400 text-zinc-950 shadow-sm">
                <Bell className="size-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No reminders yet</h3>
              <p className="max-w-xs text-xs text-zinc-400 leading-relaxed">
                Create your first reminder to stay on top of important things.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-full bg-lime-400 px-6 text-xs font-bold text-zinc-950 hover:bg-lime-300 shadow-md cursor-pointer"
            >
              <Plus className="mr-1.5 size-4" />
              Create Reminder
            </Button>
          </div>
        ) : (
          /* Reminders List (Reference Card Design) */
          <div className="space-y-3 pb-8">
            {filteredReminders.map((reminder) => {
              const category = (reminder as any).obligation_type || (reminder as any).obligationType || "Personal";
              const { icon, bg } = getReminderCategoryIcon(reminder.title, category);
              const dt = formatDateDisplay(reminder.next_run_at || reminder.due_at);
              const isCompleted = reminder.status === "completed";

              return (
                <div
                  key={reminder.id}
                  onClick={() => setEditingReminder(reminder)}
                  className={cn(
                    "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-200 cursor-pointer",
                    isCompleted
                      ? "border-zinc-800/50 bg-[#101117]/60 opacity-60"
                      : "border-zinc-800 bg-[#12131A] hover:border-zinc-700 hover:bg-[#161722]",
                  )}
                >
                  {/* Left Column: Category Icon + Title + Meta Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Category Icon Badge */}
                    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm", bg)}>
                      {icon}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn("text-xs font-bold truncate leading-tight", isCompleted ? "line-through text-zinc-400" : "text-white")}>
                          {reminder.title}
                        </h3>
                        <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-zinc-700/50 capitalize">
                          {category}
                        </span>
                      </div>

                      {reminder.description && (
                        <p className="text-[11px] text-zinc-400 truncate max-w-md">
                          {reminder.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Date & Time, Recurrence, Alert Info */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-zinc-300">
                    {/* Date & Time */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-zinc-400" />
                      <span className="font-semibold text-white">{dt.date}</span>
                      {dt.time && (
                        <span className="flex items-center gap-1 text-zinc-400 ml-1">
                          <Clock className="size-3 text-zinc-500" />
                          <span>{dt.time}</span>
                        </span>
                      )}
                    </div>

                    {/* Recurrence */}
                    <div className="flex items-center gap-1 text-zinc-400">
                      <RotateCw className="size-3.5 text-zinc-500" />
                      <span>
                        {reminder.recurrence && reminder.recurrence !== "none"
                          ? `Every ${reminder.recurrence.replace("ly", "")}`
                          : "Does not repeat"}
                      </span>
                    </div>

                    {/* Alert Channel */}
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Bell className="size-3.5 text-zinc-500" />
                      <span>
                        {reminder.channel === "email" ? "Email" : reminder.channel === "telegram" ? "Telegram" : "In-app Notification"}
                      </span>
                    </div>
                  </div>

                  {/* Right Action Icons (Reference Design: Complete, Snooze, Delete) */}
                  <div className="flex items-center gap-2 border-t border-zinc-800/60 pt-3 sm:pt-0 sm:border-t-0 justify-end" onClick={(e) => e.stopPropagation()}>
                    {/* Complete Button */}
                    <button
                      type="button"
                      onClick={() => handleComplete(reminder.id)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl border transition-all cursor-pointer",
                        isCompleted
                          ? "border-lime-400/40 bg-lime-400/20 text-lime-400"
                          : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-lime-400/50 hover:bg-lime-400/10 hover:text-lime-400",
                      )}
                      title={isCompleted ? "Completed" : "Mark as Complete"}
                    >
                      <Check className="size-4" />
                    </button>

                    {/* Snooze Button & Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenSnoozeId(openSnoozeId === reminder.id ? null : reminder.id)}
                        className="flex size-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-400 transition-all cursor-pointer"
                        title="Snooze Reminder"
                      >
                        <Timer className="size-4" />
                      </button>

                      {openSnoozeId === reminder.id && (
                        <div className="absolute right-0 top-full mt-2 z-30 w-36 rounded-2xl border border-zinc-800 bg-[#161722] p-1.5 shadow-2xl backdrop-blur-xl text-xs space-y-1">
                          <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Snooze
                          </div>
                          {[
                            { label: "10 minutes", mins: 10 },
                            { label: "30 minutes", mins: 30 },
                            { label: "1 hour", mins: 60 },
                            { label: "Tomorrow", mins: 1440 },
                          ].map((s) => (
                            <button
                              key={s.mins}
                              type="button"
                              onClick={() => handleSnooze(reminder.id, s.mins)}
                              className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                            >
                              <span>{s.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(reminder.id)}
                      className="flex size-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                      title="Delete Reminder"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateReminderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        sessionToken={sessionToken}
        onCreated={(newRem) => setReminders((prev) => [newRem, ...prev])}
      />

      {editingReminder && (
        <EditReminderModal
          reminder={editingReminder}
          isOpen={Boolean(editingReminder)}
          onClose={() => setEditingReminder(null)}
          sessionToken={sessionToken}
          onUpdated={(updatedRem) =>
            setReminders((prev) => prev.map((r) => (r.id === updatedRem.id ? updatedRem : r)))
          }
        />
      )}
    </div>
  );
}
