"use client";

import { useState, useEffect } from "react";
import { X, CheckSquare, Calendar, Clock, AlertCircle, User, ListTodo, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchContactsApi, Contact } from "@/lib/contacts";
import { createTask } from "@/lib/tasks";
import { createReminderApi, fetchReminderChannelsApi } from "@/lib/reminders";
import { Task, TaskList, TaskPriority } from "@/lib/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  taskLists: TaskList[];
  defaultTaskListId?: string;
  onCreated: (task: Task) => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  sessionToken,
  taskLists,
  defaultTaskListId = "",
  onCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskListId, setTaskListId] = useState(defaultTaskListId);
  const [contactId, setContactId] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [hasDueDate, setHasDueDate] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("12:00");
  
  // Reminder State
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderChannel, setReminderChannel] = useState("in_app");
  const [channels, setChannels] = useState<{ id: string; name: string; enabled: boolean; connected?: boolean }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionToken && isOpen) {
      fetchContactsApi(sessionToken)
        .then((res) => setContacts(res.contacts || []))
        .catch(() => {});
      fetchReminderChannelsApi(sessionToken)
        .then((res) => setChannels(res.channels || []))
        .catch(() => {});
    }
  }, [sessionToken, isOpen]);

  useEffect(() => {
    if (defaultTaskListId) {
      setTaskListId(defaultTaskListId);
    } else if (taskLists.length > 0) {
      setTaskListId(taskLists[0].id);
    }
  }, [defaultTaskListId, taskLists, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for your task");
      return;
    }
    if (!taskListId) {
      setError("Please select a task list");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dueAtIso = hasDueDate ? new Date(`${date}T${time}:00`).toISOString() : null;

      const res = await createTask(sessionToken, {
        taskListId,
        title: title.trim(),
        description: description.trim() || null,
        contactId: contactId || null,
        priority,
        dueAt: dueAtIso,
        recurrenceRule: recurrenceRule !== "none" ? recurrenceRule : undefined,
      });

      let reminder = null;
      if (hasReminder) {
        const reminderDueIso = new Date(`${reminderDate}T${reminderTime}:00`).toISOString();
        const remRes = await createReminderApi(sessionToken, {
          title: title.trim(),
          description: description.trim() || undefined,
          dueAt: reminderDueIso,
          channel: reminderChannel,
          recipientId: contactId || undefined,
          taskId: res.task.id,
        });
        reminder = remRes.reminder;
      }

      onCreated({
        ...res.task,
        reminder_id: reminder?.id || null,
        reminder_due_at: reminder?.due_at || null,
        reminder_channel: reminder?.channel || null,
        reminder_status: reminder?.status || null,
      });
      
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setContactId("");
      setPriority("medium");
      setHasDueDate(false);
      setHasReminder(false);
      setRecurrenceRule("none");
    } catch (err: any) {
      setError(err?.message || "Failed to create task");
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
              <h2 className="text-sm font-semibold text-white">Create Task</h2>
              <p className="text-[11px] text-zinc-400">Add a new action item to your task list</p>
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
              placeholder="e.g., Buy books for college, Review Q3 project plans"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-300">
                <ListTodo className="size-3.5 text-zinc-400" />
                Task List
              </label>
              <select
                value={taskListId}
                onChange={(e) => setTaskListId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              >
                {taskLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-300">
                <User className="size-3.5 text-zinc-400" />
                Contact (optional)
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

          <div className="flex items-center gap-2 py-1 select-none">
            <label className="flex items-center gap-2 font-medium text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasReminder}
                onChange={(e) => setHasReminder(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-900 text-lime-400 focus:ring-lime-400/20"
              />
              <span className="flex items-center gap-1.5">
                <Bell className="size-3.5 text-zinc-400" />
                Set Reminder
              </span>
            </label>
          </div>

          {hasReminder && (
            <div className="space-y-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-enter">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-300">
                    <Calendar className="size-3.5 text-zinc-400" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-850 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-300">
                    <Clock className="size-3.5 text-zinc-400" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full rounded-xl border border-zinc-850 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-zinc-300">Notification Channel</label>
                <select
                  value={reminderChannel}
                  onChange={(e) => setReminderChannel(e.target.value)}
                  className="w-full rounded-xl border border-zinc-850 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
                >
                  <option value="in_app">In-app Notification</option>
                  {channels.find((c) => c.id === "email")?.enabled && (
                    <option value="email">Email</option>
                  )}
                  {channels.find((c) => c.id === "telegram")?.enabled && channels.find((c) => c.id === "telegram")?.connected && (
                    <option value="telegram">Telegram</option>
                  )}
                  {channels.find((c) => c.id === "whatsapp")?.enabled && channels.find((c) => c.id === "whatsapp")?.connected && (
                    <option value="whatsapp">WhatsApp</option>
                  )}
                </select>
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
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
