"use client";

import { useState } from "react";
import { X, Bell, Calendar, Clock, RotateCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [recurrence, setRecurrence] = useState(reminder.recurrence || "none");
  const [status, setStatus] = useState(reminder.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
              <Bell className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Edit Reminder</h2>
              <p className="text-[11px] text-zinc-400">Update reminder schedule or details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium text-zinc-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-300">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-300">
                <Calendar className="size-3.5 text-zinc-400" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-300">
                <Clock className="size-3.5 text-zinc-400" />
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-300">
                <RotateCw className="size-3.5 text-zinc-400" />
                Repeat
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-zinc-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
