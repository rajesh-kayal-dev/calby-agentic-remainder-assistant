"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Coins,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Plus,
  Bell,
  FileText,
} from "lucide-react";
import { fetchContactsApi, Contact } from "@/lib/contacts";
import { createLedgerItem } from "@/lib/money";
import { LedgerItem, LedgerDirection } from "@/lib/types";

interface CreateMoneyModalProps {
  sessionToken: string;
  onClose: () => void;
  onCreated: (item: LedgerItem) => void;
}

export function CreateMoneyModal({
  sessionToken,
  onClose,
  onCreated,
}: CreateMoneyModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [customPersonName, setCustomPersonName] = useState<string>("");

  const [direction, setDirection] = useState<LedgerDirection>("receivable");
  const [amount, setAmount] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Dates
  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [hasDueDate, setHasDueDate] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
  );

  // Reminder
  const [hasReminder, setHasReminder] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>("09:00");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContactsApi(sessionToken)
      .then((res) => {
        const list = res.contacts || [];
        setContacts(list);
        if (list.length > 0) {
          setSelectedContactId(list[0].id);
        }
      })
      .catch(() => {});
  }, [sessionToken]);

  // Click Outside to close modal
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    let personName = "";
    let contactIdToPass: string | undefined;

    if (selectedContactId === "new" || !selectedContactId) {
      if (!customPersonName.trim()) {
        setError("Please enter or select a person");
        return;
      }
      personName = customPersonName.trim();
    } else {
      contactIdToPass = selectedContactId;
      const cObj = contacts.find((c) => c.id === selectedContactId);
      personName = cObj ? cObj.name : "Contact";
    }

    const defaultTitle = `${direction === "receivable" ? "Lent to" : "Borrowed from"} ${personName}`;
    const finalTitle = title.trim() || defaultTitle;

    let dueAtIso: string | undefined;
    if (hasDueDate && dueDate) {
      dueAtIso = new Date(`${dueDate}T23:59:59`).toISOString();
    }

    let reminderAtIso: string | undefined;
    if (hasReminder && reminderTime) {
      const remDateStr = hasDueDate && dueDate ? dueDate : entryDate;
      reminderAtIso = new Date(`${remDateStr}T${reminderTime}:00`).toISOString();
    }

    setIsSubmitting(true);
    try {
      const res = await createLedgerItem(sessionToken, {
        contactId: contactIdToPass,
        personName: contactIdToPass ? undefined : personName,
        direction,
        amount: numAmount,
        currency: "INR",
        title: finalTitle,
        notes: notes.trim() || undefined,
        dueAt: dueAtIso,
        reminderAt: reminderAtIso,
      });

      onCreated(res.ledgerItem);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create money entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-150">
      <div
        ref={containerRef}
        className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#12131A] p-6 shadow-2xl space-y-5 text-white select-none max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
              <Coins className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Add Money Entry
              </h2>
              <p className="text-xs text-zinc-400">
                Track money lent or borrowed
              </p>
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
          {/* Segmented Direction Pill */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-1">
            <button
              type="button"
              onClick={() => setDirection("receivable")}
              className={`rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer ${
                direction === "receivable"
                  ? "bg-lime-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ↑ I Lent (Receivable)
            </button>
            <button
              type="button"
              onClick={() => setDirection("payable")}
              className={`rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer ${
                direction === "payable"
                  ? "bg-amber-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ↓ I Borrowed (Payable)
            </button>
          </div>

          {/* Amount Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Amount (₹) <span className="text-lime-400">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-bold text-lime-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-8 pr-3 text-base font-bold text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Person Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="size-3.5 text-lime-400" />
              Person Involved <span className="text-lime-400">*</span>
            </label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-lime-400/50 focus:outline-none"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.relationship ? `(${c.relationship})` : ""}
                </option>
              ))}
              <option value="new">+ Add New Person Name...</option>
            </select>

            {(selectedContactId === "new" || contacts.length === 0) && (
              <input
                type="text"
                placeholder="Enter person's name (e.g. Rahul)"
                value={customPersonName}
                onChange={(e) => setCustomPersonName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none transition-colors mt-2"
              />
            )}
          </div>

          {/* Title Optional */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Title / Note (Optional)
            </label>
            <input
              type="text"
              placeholder={`e.g. ${direction === "receivable" ? "Lunch money" : "Borrowed for groceries"}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Due Date Toggle */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 cursor-pointer">
                <CalendarIcon className="size-3.5 text-lime-400" />
                Add Due Date
              </label>
              <button
                type="button"
                onClick={() => setHasDueDate(!hasDueDate)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasDueDate ? "bg-lime-400" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                    hasDueDate ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {hasDueDate && (
              <div className="relative pt-1">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-lime-400 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Reminder Toggle */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 cursor-pointer">
                <Bell className="size-3.5 text-lime-400" />
                Set Reminder
              </label>
              <button
                type="button"
                onClick={() => setHasReminder(!hasReminder)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasReminder ? "bg-lime-400" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                    hasReminder ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {hasReminder && (
              <div className="relative flex items-center gap-2 pt-1">
                <Clock className="size-4 text-zinc-400" />
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-lime-400 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Notes Optional */}
          <div className="space-y-1 border-t border-zinc-800/80 pt-3">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-3.5 text-lime-400" />
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 p-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-lime-400 px-5 py-2 text-xs font-bold text-black hover:bg-lime-300 transition-all cursor-pointer shadow-lg shadow-lime-400/20 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
