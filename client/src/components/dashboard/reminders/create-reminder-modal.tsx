"use client";

import { useState, useEffect } from "react";
import { X, Bell, Calendar, Clock, RotateCw, AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createReminderApi,
  CreateReminderPayload,
  fetchReminderChannelsApi,
} from "@/lib/reminders";
import { fetchContactsApi, Contact } from "@/lib/contacts";
import { Reminder } from "@/lib/types";

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  onCreated: (reminder: Reminder) => void;
  taskId?: string;
  defaultTitle?: string;
}

export function CreateReminderModal({
  isOpen,
  onClose,
  sessionToken,
  onCreated,
  taskId,
  defaultTitle = "",
}: CreateReminderModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("09:00");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly" | "yearly">("none");
  const [channel, setChannel] = useState("in_app");
  const [channels, setChannels] = useState<
    { id: string; name: string; enabled: boolean; connected?: boolean }[]
  >([]);
  const [timezone] = useState("Asia/Kolkata");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
    }
  }, [isOpen, defaultTitle]);

  useEffect(() => {
    if (sessionToken && isOpen) {
      fetchReminderChannelsApi(sessionToken)
        .then((res) => setChannels(res.channels || []))
        .catch(() => {});
      fetchContactsApi(sessionToken)
        .then((res) => setContacts(res.contacts || []))
        .catch(() => {});
    }
  }, [sessionToken, isOpen]);

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

      const payload: CreateReminderPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        recipientId: recipientId || undefined,
        dueAt: dueAtIso,
        timezone,
        recurrence,
        channel,
        taskId: taskId || undefined,
      };

      const res = await createReminderApi(sessionToken, payload);
      onCreated(res.reminder);
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setRecipientId("");
    } catch (err: any) {
      setError(err?.message || "Failed to create reminder");
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
              <h2 className="text-sm font-semibold text-white">Create Reminder</h2>
              <p className="text-[11px] text-zinc-400">Set a time-based alert or recurring task</p>
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
              placeholder="e.g., Cancel Netflix subscription"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-300">
              <User className="size-3.5 text-zinc-400" />
              Recipient
            </label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
            >
              <option value="">Me (Account Owner)</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.email ? `(${c.email})` : c.phoneNumber ? `(${c.phoneNumber})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-300">Description (optional)</label>
            <textarea
              placeholder="Add details or notes..."
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
              <label className="mb-1 block font-medium text-zinc-300">Delivery Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 focus:border-lime-400/50 focus:outline-none"
              >
                <option value="in_app">In-app Notification</option>
                {channels.find((c) => c.id === "email")?.enabled ? (
                  <option value="email">Email Notification</option>
                ) : (
                  <option value="email" disabled>
                    Email Notification (Not configured)
                  </option>
                )}
                {channels.find((c) => c.id === "telegram")?.enabled ? (
                  channels.find((c) => c.id === "telegram")?.connected ? (
                    <option value="telegram">Telegram Notification</option>
                  ) : (
                    <option value="telegram" disabled>
                      Telegram (Connect in Settings)
                    </option>
                  )
                ) : (
                  <option value="telegram" disabled>
                    Telegram (Bot disabled)
                  </option>
                )}
                {channels.find((c) => c.id === "whatsapp")?.enabled ? (
                  channels.find((c) => c.id === "whatsapp")?.connected ? (
                    <option value="whatsapp">WhatsApp Notification</option>
                  ) : (
                    <option value="whatsapp" disabled>
                      WhatsApp (Configure in Settings)
                    </option>
                  )
                ) : (
                  <option value="whatsapp" disabled>
                    WhatsApp (API disabled)
                  </option>
                )}
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
              {isSubmitting ? "Creating..." : "Set Reminder"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
