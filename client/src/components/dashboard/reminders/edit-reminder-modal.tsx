"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Bell,
  Calendar as CalendarIcon,
  Clock,
  RotateCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateReminderApi, UpdateReminderPayload } from "@/lib/reminders";
import { Reminder } from "@/lib/types";

interface EditReminderModalProps {
  reminder: Reminder;
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  onUpdated: (reminder: Reminder) => void;
}

export function EditReminderModal({
  reminder,
  isOpen,
  onClose,
  sessionToken,
  onUpdated,
}: EditReminderModalProps) {
  const [title, setTitle] = useState(reminder.title);
  const [description, setDescription] = useState(reminder.description || "");
  const [date, setDate] = useState(() => {
    const d = new Date(reminder.due_at);
    return d.toISOString().split("T")[0];
  });
  const [time, setTime] = useState(() => {
    const d = new Date(reminder.due_at);
    return d.toTimeString().slice(0, 5);
  });
  const [timeInputText, setTimeInputText] = useState("09:00 AM");

  const [recurrence, setRecurrence] = useState(reminder.recurrence || "none");
  const [status, setStatus] = useState(reminder.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Popover States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(
    new Date(reminder.due_at),
  );

  const containerRef = useRef<HTMLDivElement>(null);

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
      setError("Please enter a title for your reminder");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dueAtIso = new Date(`${date}T${time}:00`).toISOString();

      const payload: UpdateReminderPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAtIso,
        recurrence,
        status,
      };

      const res = await updateReminderApi(sessionToken, reminder.id, payload);
      onUpdated(res.reminder);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update reminder");
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
        className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#12131A] p-6 shadow-2xl space-y-5 text-white"
      >
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Edit Reminder</h2>
              <p className="text-xs text-zinc-400">Update schedule, details, or status</p>
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
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Title <span className="text-lime-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-b border-zinc-800 bg-transparent py-2 text-sm font-semibold text-white focus:border-lime-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="relative flex flex-wrap items-center gap-3 pt-1">
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

                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1 divide-y divide-zinc-800/50">
                    {[
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
                      "19:00",
                      "20:00",
                    ].map((preset24) => {
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

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <RotateCw className="size-3.5 text-lime-400" />
                Repeat
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="mb-1 text-xs font-semibold text-zinc-300 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
              Notes (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none resize-none"
            />
          </div>

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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
