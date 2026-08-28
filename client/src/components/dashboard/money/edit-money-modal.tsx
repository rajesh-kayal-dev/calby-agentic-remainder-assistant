"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Coins,
  Calendar as CalendarIcon,
  AlertCircle,
  User,
  FileText,
} from "lucide-react";
import { fetchContactsApi, Contact } from "@/lib/contacts";
import { updateLedgerItemApi } from "@/lib/money";
import { LedgerItem, LedgerDirection } from "@/lib/types";

interface EditMoneyModalProps {
  sessionToken: string;
  item: LedgerItem;
  onClose: () => void;
  onUpdated: (item: LedgerItem) => void;
}

export function EditMoneyModal({
  sessionToken,
  item,
  onClose,
  onUpdated,
}: EditMoneyModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>(item.contact_id || "");
  const [direction, setDirection] = useState<LedgerDirection>(item.direction || "receivable");
  const [amount, setAmount] = useState<string>(item.amount ? item.amount.toString() : "");
  const [title, setTitle] = useState<string>(item.title || "");
  const [notes, setNotes] = useState<string>(item.notes || "");

  const [hasDueDate, setHasDueDate] = useState<boolean>(Boolean(item.due_at));
  const [dueDate, setDueDate] = useState<string>(
    item.due_at ? new Date(item.due_at).toISOString().split("T")[0] : "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContactsApi(sessionToken)
      .then((res) => {
        setContacts(res.contacts || []);
      })
      .catch(() => {});
  }, [sessionToken]);

  // Click Outside
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

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    let dueAtIso: string | null = null;
    if (hasDueDate && dueDate) {
      dueAtIso = new Date(`${dueDate}T23:59:59`).toISOString();
    }

    setIsSubmitting(true);
    try {
      const res = await updateLedgerItemApi(sessionToken, item.id, {
        title: title.trim(),
        amount: numAmount,
        direction,
        dueAt: dueAtIso,
        notes: notes.trim() || null,
        contactId: selectedContactId || null,
      });

      onUpdated(res.ledgerItem);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update money entry");
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
                Edit Money Entry
              </h2>
              <p className="text-xs text-zinc-400">
                Update transaction details
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
          {/* Direction */}
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

          {/* Amount */}
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-8 pr-3 text-base font-bold text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Person Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="size-3.5 text-lime-400" />
              Person
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
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Title <span className="text-lime-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Due Date */}
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

          {/* Notes */}
          <div className="space-y-1 border-t border-zinc-800/80 pt-3">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-3.5 text-lime-400" />
              Notes
            </label>
            <textarea
              rows={2}
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
              {isSubmitting ? "Updating..." : "Update Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
