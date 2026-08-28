"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ListTodo,
  Calendar as CalendarIcon,
  Clock,
  RotateCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Tag,
  Flag,
  Bell,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Task, TaskList, TaskPriority, TaskStatus } from "@/lib/types";
import { createTask } from "@/lib/tasks";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  taskLists: TaskList[];
  onCreated: (task: Task) => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  sessionToken,
  taskLists,
  onCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [taskListId, setTaskListId] = useState<string>("");
  const [description, setDescription] = useState("");
  
  // Date State
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [timeInputText, setTimeInputText] = useState("09:00 AM");

  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [recurrenceRule, setRecurrenceRule] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [reminderOption, setReminderOption] = useState<string>("none");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Popover States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(new Date());

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (taskLists.length > 0 && !taskListId) {
      setTaskListId(taskLists[0].id);
    }
  }, [taskLists, taskListId]);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const obj = new Date(y, m - 1, d);
      return obj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime12h = (time24: string) => {
    try {
      const [hStr, mStr] = time24.split(":");
      let h = parseInt(hStr, 10);
      const m = mStr || "00";
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
    } catch {
      return time24;
    }
  };

  useEffect(() => {
    setTimeInputText(formatTime12h(time));
  }, [time]);

  const getTimeParts = (time24: string) => {
    try {
      const [h24Str, mStr] = time24.split(":");
      let h24 = parseInt(h24Str, 10);
      const ampm = h24 >= 12 ? "PM" : "AM";
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      return {
        hour12: String(h12).padStart(2, "0"),
        minute: mStr || "00",
        ampm,
      };
    } catch {
      return { hour12: "09", minute: "00", ampm: "AM" };
    }
  };

  const updateTimeFromParts = (h12Str: string, mStr: string, ampmStr: string) => {
    let h = parseInt(h12Str, 10);
    const m = parseInt(mStr, 10);

    if (ampmStr === "PM" && h < 12) h += 12;
    if (ampmStr === "AM" && h === 12) h = 0;

    const new24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setTime(new24);
    setTimeInputText(formatTime12h(new24));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
        setIsTimePickerOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTimeBlur = () => {
    const raw = timeInputText.trim().toLowerCase();
    const match = raw.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2] || "0", 10);
      const ampm = match[3];

      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;

      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        const new24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        setTime(new24);
        setTimeInputText(formatTime12h(new24));
        return;
      }
    }
    setTimeInputText(formatTime12h(time));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for your task");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dueAtIso = new Date(`${date}T${time}:00`).toISOString();

      const res = await createTask(sessionToken, {
        taskListId: taskListId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueAt: dueAtIso,
        recurrenceRule,
      });

      onCreated(res.task);
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setError(err?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  const viewYear = calendarViewMonth.getFullYear();
  const viewMonthIndex = calendarViewMonth.getMonth();
  const daysInMonth = new Date(viewYear, viewMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonthIndex, 1).getDay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-150">
      <div
        ref={containerRef}
        className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#12131A] p-6 shadow-2xl space-y-5 text-white select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
              <CheckSquare className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Create Task</h2>
              <p className="text-xs text-zinc-400">Add a new task to stay organized</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Title <span className="text-lime-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Submit project report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-b border-zinc-800 bg-transparent py-2 text-sm font-semibold text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Task List Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="size-3.5 text-lime-400" />
              Task List
            </label>
            <select
              value={taskListId}
              onChange={(e) => setTaskListId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-lime-400/50 focus:outline-none"
            >
              {taskLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Description (optional)
            </label>
            <textarea
              placeholder="Add details or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-lime-400/50 focus:outline-none resize-none"
            />
          </div>

          {/* Due Date & Time */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Due Date & Time
            </label>
            <div className="relative flex flex-wrap items-center gap-3">
              {/* Date Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsDatePickerOpen((prev) => !prev);
                    setIsTimePickerOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer",
                    isDatePickerOpen && "border-lime-400 bg-zinc-800 text-lime-400",
                  )}
                >
                  <CalendarIcon className="size-4 text-lime-400" />
                  <span>{formatDateDisplay(date)}</span>
                </button>

                {isDatePickerOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-2xl border border-zinc-800 bg-[#161722] p-3 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarViewMonth(
                            new Date(viewYear, viewMonthIndex - 1, 1),
                          )
                        }
                        className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <span className="text-xs font-bold text-white">
                        {calendarViewMonth.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarViewMonth(
                            new Date(viewYear, viewMonthIndex + 1, 1),
                          )
                        }
                        className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 pt-2 text-center text-[10px] font-bold text-zinc-500">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 pt-1 text-center text-xs">
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <span key={`empty-${i}`} />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dayStr = `${viewYear}-${String(viewMonthIndex + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                        const isSelected = date === dayStr;

                        return (
                          <button
                            key={dayStr}
                            type="button"
                            onClick={() => {
                              setDate(dayStr);
                              setIsDatePickerOpen(false);
                            }}
                            className={cn(
                              "flex size-7 items-center justify-center rounded-lg font-semibold transition-all cursor-pointer",
                              isSelected
                                ? "bg-lime-400 text-zinc-950 font-bold shadow-[0_0_8px_rgba(163,230,53,0.8)]"
                                : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                            )}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Time Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsTimePickerOpen((prev) => !prev);
                    setIsDatePickerOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer",
                    isTimePickerOpen && "border-lime-400 bg-zinc-800 text-lime-400",
                  )}
                >
                  <Clock className="size-4 text-lime-400" />
                  <span>{formatTime12h(time)}</span>
                </button>

                {isTimePickerOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-2xl border border-zinc-800 bg-[#161722] p-3 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 space-y-3">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Select Time
                    </div>

                    {/* Time Tuner Parts */}
                    {(() => {
                      const { hour12, minute, ampm } = getTimeParts(time);
                      return (
                        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-zinc-500">HH:</span>
                            <select
                              value={hour12}
                              onChange={(e) => updateTimeFromParts(e.target.value, minute, ampm)}
                              className="bg-transparent text-xs font-bold text-lime-400 focus:outline-none cursor-pointer py-1 px-1 rounded hover:bg-zinc-800"
                            >
                              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                                <option key={h} value={h} className="bg-[#161722] text-white">
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          <span className="text-zinc-500 font-bold text-xs">:</span>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-zinc-500">MM:</span>
                            <select
                              value={minute}
                              onChange={(e) => updateTimeFromParts(hour12, e.target.value, ampm)}
                              className="bg-transparent text-xs font-bold text-lime-400 focus:outline-none cursor-pointer py-1 px-1 rounded hover:bg-zinc-800"
                            >
                              {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                                <option key={m} value={m} className="bg-[#161722] text-white">
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="ml-auto flex items-center rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => updateTimeFromParts(hour12, minute, "AM")}
                              className={cn(
                                "px-2 py-0.5 rounded-md transition-all cursor-pointer",
                                ampm === "AM" ? "bg-lime-400 text-zinc-950 font-extrabold" : "text-zinc-400 hover:text-white"
                              )}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => updateTimeFromParts(hour12, minute, "PM")}
                              className={cn(
                                "px-2 py-0.5 rounded-md transition-all cursor-pointer",
                                ampm === "PM" ? "bg-lime-400 text-zinc-950 font-extrabold" : "text-zinc-400 hover:text-white"
                              )}
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Text Input */}
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5">
                      <Clock className="size-3.5 text-lime-400" />
                      <input
                        type="text"
                        value={timeInputText}
                        onChange={(e) => setTimeInputText(e.target.value)}
                        onBlur={handleTimeBlur}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleTimeBlur();
                          }
                        }}
                        className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 divide-y divide-zinc-800/50">
                      {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((preset24) => {
                        const isSel = time === preset24;
                        return (
                          <button
                            key={preset24}
                            type="button"
                            onClick={() => {
                              setTime(preset24);
                              setIsTimePickerOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                              isSel
                                ? "bg-lime-400/10 text-lime-400 font-bold"
                                : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                            )}
                          >
                            <span>{formatTime12h(preset24)}</span>
                            {isSel && <Check className="size-3.5 text-lime-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                <Flag className="size-3 text-lime-400" />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Repeat & Reminder */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                <RotateCw className="size-3 text-lime-400" />
                Repeat
              </label>
              <select
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                <Bell className="size-3 text-lime-400" />
                Reminder
              </label>
              <select
                value={reminderOption}
                onChange={(e) => setReminderOption(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="none">No reminder</option>
                <option value="at_time">At time of due</option>
                <option value="5m">5 min before</option>
                <option value="15m">15 min before</option>
                <option value="30m">30 min before</option>
                <option value="1h">1 hour before</option>
                <option value="1d">1 day before</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-lime-400 px-6 text-zinc-950 font-bold hover:bg-lime-300 text-xs shadow-md cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
