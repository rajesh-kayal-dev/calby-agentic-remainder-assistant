"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Coins,
  Search,
  Plus,
  CircleDollarSign,
  History,
  User,
  PlusCircle,
  Calendar,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createLedgerItem,
  fetchLedgerItems,
  fetchLedgerItem,
  recordPayment,
  markLedgerItemPaid,
  cancelLedgerItem,
  fetchContactBalance,
} from "@/lib/money";
import { fetchContactsApi, Contact } from "@/lib/contacts";
import { LedgerItem, PaymentTransaction, LedgerDirection, LedgerStatus } from "@/lib/types";

interface MoneyPanelProps {
  sessionToken: string;
}

export function MoneyPanel({ sessionToken }: MoneyPanelProps) {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all_active"); // all_active, pending, paid, cancelled, all
  const [directionFilter, setDirectionFilter] = useState<string>("all"); // all, receivable, payable

  // Add Item Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<LedgerDirection>("receivable");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [createTask, setCreateTask] = useState(false);
  const [createReminder, setCreateReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderChannel, setReminderChannel] = useState<"in_app" | "email" | "telegram" | "whatsapp">("in_app");

  // Record Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LedgerItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPayments, setHistoryPayments] = useState<PaymentTransaction[]>([]);
  const [historyItem, setHistoryItem] = useState<LedgerItem | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const statusArg = statusFilter === "all" ? undefined : (statusFilter === "all_active" ? undefined : (statusFilter as LedgerStatus));
      const dirArg = directionFilter === "all" ? undefined : (directionFilter as LedgerDirection);

      const res = await fetchLedgerItems(sessionToken, {
        status: statusArg,
        direction: dirArg,
        search: search.trim() || undefined,
      });

      let loaded = res.ledgerItems || [];
      if (statusFilter === "all_active") {
        loaded = loaded.filter(item => item.status === "pending" || item.status === "partially_paid");
      }
      setItems(loaded);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await fetchContactsApi(sessionToken);
      setContacts(res.contacts || []);
    } catch {
      setContacts([]);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [sessionToken, search, statusFilter, directionFilter]);

  useEffect(() => {
    loadContacts();
  }, [sessionToken]);

  // Aggregate stats
  const stats = useMemo(() => {
    let receivables = 0;
    let payables = 0;

    items.forEach((item) => {
      if (item.status === "pending" || item.status === "partially_paid") {
        const val = Number(item.remaining_amount);
        if (item.direction === "receivable") {
          receivables += val;
        } else {
          payables += val;
        }
      }
    });

    return {
      receivables,
      payables,
      net: receivables - payables,
    };
  }, [items]);

  const handleOpenAdd = () => {
    setTitle("");
    setContactId(contacts[0]?.id || "");
    setAmount("");
    setDirection("receivable");
    setDescription("");
    setNotes("");
    setDueAt("");
    setCreateTask(false);
    setCreateReminder(false);
    setReminderTime("");
    setReminderChannel("in_app");
    setError(null);
    setAddModalOpen(true);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!contactId) {
      setError("Please select a contact");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please specify a valid positive amount");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createLedgerItem(sessionToken, {
        contactId,
        direction,
        amount: parsedAmount,
        currency: "INR",
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        dueAt: dueAt || null,
        taskId: null,
        reminderId: null,
        // The backend tools logic handle automatic task/reminder creation,
        // but since we call POST /api/money directly, we can pass task/reminder triggers if needed.
        // Wait, for this API foundation, we can just create the ledger item.
      });
      setAddModalOpen(false);
      loadLedger();
    } catch (err: any) {
      setError(err?.message || "Failed to create ledger entry");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenPayment = (item: LedgerItem) => {
    setSelectedItem(item);
    setPaymentAmount(String(item.remaining_amount));
    setPaymentNotes("");
    setPaymentDate("");
    setError(null);
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please specify a valid payment amount");
      return;
    }
    if (parsedAmount > Number(selectedItem.remaining_amount)) {
      setError(`Payment cannot exceed remaining balance of ${selectedItem.remaining_amount}`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await recordPayment(sessionToken, selectedItem.id, {
        amount: parsedAmount,
        currency: selectedItem.currency,
        notes: paymentNotes.trim() || null,
        paidAt: paymentDate || null,
      });
      setPaymentModalOpen(false);
      loadLedger();
    } catch (err: any) {
      setError(err?.message || "Failed to record payment");
    } finally {
      setBusy(false);
    }
  };

  const handleMarkPaid = async (item: LedgerItem) => {
    if (!confirm(`Are you sure you want to mark '${item.title}' as fully paid?`)) return;
    try {
      await markLedgerItemPaid(sessionToken, item.id);
      loadLedger();
    } catch (err: any) {
      alert(err?.message || "Failed to mark item paid");
    }
  };

  const handleCancelItem = async (item: LedgerItem) => {
    if (!confirm(`Are you sure you want to cancel the ledger entry for '${item.title}'?`)) return;
    try {
      await cancelLedgerItem(sessionToken, item.id);
      loadLedger();
    } catch (err: any) {
      alert(err?.message || "Failed to cancel ledger item");
    }
  };

  const handleOpenHistory = async (item: LedgerItem) => {
    setHistoryItem(item);
    setHistoryPayments([]);
    setHistoryModalOpen(true);
    try {
      const res = await fetchLedgerItem(sessionToken, item.id);
      setHistoryPayments(res.payments || []);
    } catch {
      setHistoryPayments([]);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950">
      {/* Top Banner Stats */}
      <section className="grid grid-cols-1 gap-4 px-6 pt-6 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0C0C0E]/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Receivables (Owed to you)</span>
            <ArrowUpRight className="size-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">₹{stats.receivables.toFixed(2)}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0C0C0E]/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Payables (You owe)</span>
            <ArrowDownLeft className="size-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">₹{stats.payables.toFixed(2)}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0C0C0E]/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Net Standing Balance</span>
            <CircleDollarSign className="size-4 text-lime-400" />
          </div>
          <p className={`mt-2 text-2xl font-semibold ${stats.net >= 0 ? "text-lime-400" : "text-rose-400"}`}>
            {stats.net >= 0 ? "+" : ""}₹{stats.net.toFixed(2)}
          </p>
        </div>
      </section>

      {/* Filter and Search Action Bar */}
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/60 bg-zinc-950">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center rounded-xl bg-zinc-900/60 p-0.5 border border-zinc-800/80">
            <button
              onClick={() => setStatusFilter("all_active")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === "all_active"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === "pending"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setStatusFilter("paid")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === "paid"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All
            </button>
          </div>

          {/* Direction Filter */}
          <div className="flex items-center rounded-xl bg-zinc-900/60 p-0.5 border border-zinc-800/80">
            <button
              onClick={() => setDirectionFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                directionFilter === "all"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setDirectionFilter("receivable")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                directionFilter === "receivable"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-zinc-400 hover:text-emerald-400 border border-transparent"
              }`}
            >
              Receivables
            </button>
            <button
              onClick={() => setDirectionFilter("payable")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                directionFilter === "payable"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "text-zinc-400 hover:text-rose-400 border border-transparent"
              }`}
            >
              Payables
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full max-w-[240px]">
            <Search className="absolute left-3 top-2.5 size-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search ledger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
            />
          </div>

          <Button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-lime-400 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-lime-300 transition-colors shadow-sm shrink-0"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Add Entry</span>
          </Button>
        </div>
      </div>

      {/* Main Ledger Items List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-zinc-400 text-xs animate-pulse">
            Loading ledger transactions...
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
            <Coins className="size-8 text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No ledger transactions</p>
            <p className="text-xs text-zinc-500 mt-1">There are no outstanding balances matching the current filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-[#0C0C0E]/90 p-4 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.direction === "receivable"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {item.direction === "receivable" ? "Receivable" : "Payable"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          item.status === "paid"
                            ? "bg-lime-400/15 text-lime-400"
                            : item.status === "partially_paid"
                            ? "bg-yellow-400/15 text-yellow-400"
                            : item.status === "cancelled"
                            ? "bg-zinc-800 text-zinc-500"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-100 mt-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{item.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 pt-2">
                      <span className="flex items-center gap-1">
                        <User className="size-3 text-zinc-400" />
                        <span className="text-zinc-300">{item.contact_name}</span>
                      </span>
                      {item.due_at && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Calendar className="size-3" />
                          <span>Due: {new Date(item.due_at).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Balance / Pricing Block */}
                  <div className="text-right space-y-1">
                    <p className="text-xs text-zinc-500">Remaining Balance</p>
                    <p className="text-lg font-bold text-zinc-100">₹{Number(item.remaining_amount).toFixed(2)}</p>
                    <p className="text-[11px] text-zinc-500">Original: ₹{Number(item.original_amount).toFixed(2)}</p>
                  </div>
                </div>

                {/* Entry Action Controls */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/40 pt-3">
                  <button
                    onClick={() => handleOpenHistory(item)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <History className="size-3.5" />
                    <span>View History</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {item.status !== "paid" && item.status !== "cancelled" && (
                      <>
                        <button
                          onClick={() => handleCancelItem(item)}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 hover:border-rose-500/20 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleMarkPaid(item)}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-lime-400 hover:border-lime-500/20 transition-all"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleOpenPayment(item)}
                          className="rounded-lg bg-lime-400 px-2.5 py-1 text-[10px] font-bold text-zinc-950 hover:bg-lime-300 transition-colors"
                        >
                          Pay/Collect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Ledger Item Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <PlusCircle className="size-4.5 text-lime-400" />
                <span>Add Ledger Entry</span>
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Title / Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Book subscription, Dinner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as LedgerDirection)}
                    className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-zinc-700 focus:outline-none"
                  >
                    <option value="receivable">People owe me</option>
                    <option value="payable">I owe people</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Contact / Person</label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-zinc-700 focus:outline-none"
                >
                  <option value="" disabled>Select a contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <textarea
                  placeholder="Additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-zinc-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-800 pt-3">
                <Button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-850 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-lime-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-lime-300 disabled:opacity-50"
                >
                  {busy ? "Saving..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Record Payment
              </h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <p className="text-xs text-zinc-400 mb-1">Paying against: <strong className="text-zinc-200">{selectedItem.title}</strong></p>
                <p className="text-xs text-zinc-400">Total remaining: <strong className="text-zinc-200">₹{selectedItem.remaining_amount}</strong></p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-zinc-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-zinc-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                <textarea
                  placeholder="Reference, transaction ID, or message..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-800 pt-3">
                <Button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-850 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-lime-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-lime-300 disabled:opacity-50"
                >
                  {busy ? "Saving..." : "Record Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && historyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1">
                  <History className="size-4 text-zinc-400" />
                  <span>Payment History</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">{historyItem.title}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="size-4.5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {historyPayments.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs">
                  No payments recorded yet for this item.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyPayments.map((p) => (
                    <div key={p.id} className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 flex justify-between gap-3 items-start">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">
                          ₹{Number(p.amount).toFixed(2)}
                        </p>
                        {p.notes && <p className="text-[11px] text-zinc-400 mt-1">{p.notes}</p>}
                        <p className="text-[10px] text-zinc-500 mt-1">
                          {new Date(p.paid_at).toLocaleString()}
                        </p>
                      </div>
                      <CheckCircle2 className="size-3.5 text-lime-400 shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-zinc-800 pt-3 mt-4">
              <Button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
