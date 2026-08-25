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
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reminder, ReminderStatus } from "@/lib/types";
import {
  fetchReminders,
  pauseReminderApi,
  resumeReminderApi,
  deleteReminderApi,
} from "@/lib/reminders";
import { CreateReminderModal } from "./create-reminder-modal";
import { EditReminderModal } from "./edit-reminder-modal";

interface RemindersPanelProps {
  sessionToken: string;
}

type TabCategory = "all" | "active" | "today" | "completed" | "paused";

export function RemindersPanel({ sessionToken }: RemindersPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabCategory>("active");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
        (r) => r.due_at.startsWith(todayStr) || r.next_run_at.startsWith(todayStr),
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

  // Time-based grouping: TODAY, TOMORROW, THIS WEEK, LATER
  const groupedReminders = useMemo(() => {
    const today: Reminder[] = [];
    const tomorrow: Reminder[] = [];
    const thisWeek: Reminder[] = [];
    const later: Reminder[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const startOfNextWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const r of filteredReminders) {
      const dueDate = new Date(r.next_run_at || r.due_at);
      if (dueDate < startOfTomorrow) {
        today.push(r);
      } else if (dueDate < new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000)) {
        tomorrow.push(r);
      } else if (dueDate < startOfNextWeek) {
        thisWeek.push(r);
      } else {
        later.push(r);
      }
    }

    return [
      { label: "TODAY", items: today },
      { label: "TOMORROW", items: tomorrow },
      { label: "THIS WEEK", items: thisWeek },
      { label: "LATER", items: later },
    ].filter((g) => g.items.length > 0);
  }, [filteredReminders]);

  const handlePause = async (id: string) => {
    setOpenMenuId(null);
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: "paused" } : r)));
    try {
      await pauseReminderApi(sessionToken, id);
    } catch {
      loadReminders();
    }
  };

  const handleResume = async (id: string) => {
    setOpenMenuId(null);
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: "active" } : r)));
    try {
      await resumeReminderApi(sessionToken, id);
    } catch {
      loadReminders();
    }
  };

  const handleDelete = async (id: string) => {
    setOpenMenuId(null);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteReminderApi(sessionToken, id);
    } catch {
      loadReminders();
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-950 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Reminders & Tasks
            </h1>
            <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-[10px] font-semibold text-lime-400">
              {reminders.filter((r) => r.status === "active").length} Active
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Time-based alerts and recurring tasks created manually or via Calby AI
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => loadReminders()}
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className="size-3.5" />
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 text-xs"
          >
            <Plus className="mr-1.5 size-4" />
            Create Reminder
          </Button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-1 text-xs">
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
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium transition-all",
                activeTab === tab.id
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex items-center rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5">
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
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/40"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <AlertCircle className="size-8 text-red-400" />
            <h3 className="mt-2 text-xs font-semibold text-white">Couldn&apos;t load reminders</h3>
            <p className="mt-1 text-[11px] text-zinc-400">{error}</p>
            <Button
              onClick={loadReminders}
              size="sm"
              className="mt-4 rounded-xl bg-zinc-800 text-xs hover:bg-zinc-700"
            >
              Try Again
            </Button>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10 text-lime-400">
              <Bell className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-white">Nothing to remember yet</h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-400">
              Tell Calby what you&apos;d like to remember in chat (e.g., &quot;Remind me tomorrow at 5 PM to call Rahul&quot;) or create one manually.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="mt-4 rounded-xl bg-lime-400 text-xs font-semibold text-zinc-950 hover:bg-lime-300"
            >
              <Plus className="mr-1.5 size-4" />
              Create Reminder
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {groupedReminders.map((group) => (
              <div key={group.label} className="space-y-2.5">
                <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {group.label} ({group.items.length})
                </h2>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200",
                        reminder.status === "active"
                          ? "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
                          : reminder.status === "paused"
                            ? "border-zinc-800/60 bg-zinc-950/80 opacity-70"
                            : "border-zinc-800/40 bg-zinc-950/60 opacity-60",
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {((reminder as any).obligation_type || (reminder as any).obligationType) && (reminder as any).obligation_type !== "custom" && (
                                <span className="inline-flex items-center rounded-md border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-lime-400">
                                  {(reminder as any).obligation_type || (reminder as any).obligationType}
                                </span>
                              )}
                              {(reminder as any).recipient_name && (
                                <span className="inline-flex items-center rounded-md border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-400">
                                  To: {(reminder as any).recipient_name}
                                </span>
                              )}
                            </div>
                            <h3 className="line-clamp-1 text-xs font-semibold text-white">
                              {reminder.title}
                            </h3>
                          </div>

                          {/* Action Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === reminder.id ? null : reminder.id)
                              }
                              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                            >
                              <MoreVertical className="size-3.5" />
                            </button>

                            {openMenuId === reminder.id && (
                              <div className="absolute right-0 top-6 z-20 w-36 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-xl text-xs space-y-0.5">
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setEditingReminder(reminder);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                >
                                  <Pencil className="size-3.5 text-zinc-400" />
                                  Edit
                                </button>

                                {reminder.status === "active" ? (
                                  <button
                                    onClick={() => handlePause(reminder.id)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-amber-400 hover:bg-amber-400/10"
                                  >
                                    <Pause className="size-3.5" />
                                    Pause
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleResume(reminder.id)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-lime-400 hover:bg-lime-400/10"
                                  >
                                    <Play className="size-3.5" />
                                    Resume
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDelete(reminder.id)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-red-400 hover:bg-red-400/10"
                                >
                                  <Trash2 className="size-3.5" />
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {reminder.description && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400 leading-relaxed">
                            {reminder.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                          <Clock className="size-3.5 text-lime-400" />
                          <span>{formatDate(reminder.next_run_at || reminder.due_at)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {reminder.recurrence && reminder.recurrence !== "none" && (
                            <span className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[10px] text-zinc-400 capitalize">
                              <RotateCw className="size-2.5 text-zinc-500" />
                              {reminder.recurrence}
                            </span>
                          )}

                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                              reminder.status === "active"
                                ? "bg-lime-400/10 text-lime-400 border border-lime-400/20"
                                : reminder.status === "paused"
                                  ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                                  : "bg-zinc-800 text-zinc-400",
                            )}
                          >
                            {reminder.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
