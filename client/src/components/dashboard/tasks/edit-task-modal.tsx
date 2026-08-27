"use client";

import { useState, useEffect } from "react";
import { X, CheckSquare, Calendar, Clock, AlertCircle, User, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchContactsApi, Contact } from "@/lib/contacts";
import { updateTask } from "@/lib/tasks";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  onUpdated: (task: Task) => void;
}

export function EditTaskModal({
  task,
  isOpen,
  onClose,
  sessionToken,
  onUpdated,
}: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [contactId, setContactId] = useState<string>(task.contact_id || "");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [recurrenceRule, setRecurrenceRule] = useState<"none" | "daily" | "weekly" | "monthly">(task.recurrence_rule || "none");
  const [hasDueDate, setHasDueDate] = useState(Boolean(task.due_at));
  const [date, setDate] = useState(() => {
    if (task.due_at) {
      return new Date(task.due_at).toISOString().split("T")[0];
    }
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [time, setTime] = useState(() => {
    if (task.due_at) {
      const d = new Date(task.due_at);
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return "12:00";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionToken && isOpen) {
      fetchContactsApi(sessionToken)
        .then((res) => setContacts(res.contacts || []))
        .catch(() => {});
    }
  }, [sessionToken, isOpen]);

  // Synchronize modal state with task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setContactId(task.contact_id || "");
    setPriority(task.priority);
    setStatus(task.status);
    setRecurrenceRule(task.recurrence_rule || "none");
    setHasDueDate(Boolean(task.due_at));
    if (task.due_at) {
      setDate(new Date(task.due_at).toISOString().split("T")[0]);
      const d = new Date(task.due_at);
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for your task");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dueAtIso = hasDueDate ? new Date(`${date}T${time}:00`).toISOString() : null;

      const res = await updateTask(sessionToken, task.id, {
        title: title.trim(),
        description: description.trim() || null,
        contactId: contactId || null,
        status,
        priority,
        dueAt: dueAtIso,
        recurrenceRule,
      });

      onUpdated(res.task);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update task");
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
              <CheckSquare className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Edit Task</h2>
              <p className="text-[11px] text-zinc-400">Modify your task details and status</p>
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
            <label className="mb-1 block font-medium text-zinc-300">Task Title</label>
            <input
              type="text"
              placeholder="Task name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-zinc-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-300">
                <User className="size-3.5 text-zinc-400" />
                Contact
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="">No Contact</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-300">Description (optional)</label>
            <textarea
              placeholder="Add details, links, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-zinc-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-zinc-300">Repeat</label>
              <select
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="none">Never</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col justify-end">
              <label className="mb-2 flex items-center gap-2 font-medium text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasDueDate}
                  onChange={(e) => setHasDueDate(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-900 text-lime-400 focus:ring-lime-400/20"
                />
                Set Due Date
              </label>
            </div>
          </div>

          {hasDueDate && (
            <div className="grid grid-cols-2 gap-3 animate-enter">
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
          )}

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
              {isSubmitting ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
