"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Coins,
  Search,
  Plus,
  CircleDollarSign,
  User,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Pencil,
  Trash2,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchLedgerItems,
  fetchLedgerSummary,
  markLedgerItemPaid,
  reopenLedgerItemApi,
  deleteLedgerItemApi,
  UserLedgerSummary,
} from "@/lib/money";
import { LedgerItem, LedgerDirection, LedgerStatus } from "@/lib/types";
import { CreateMoneyModal } from "./create-money-modal";
import { EditMoneyModal } from "./edit-money-modal";

interface MoneyPanelProps {
  sessionToken: string;
}

export function MoneyPanel({ sessionToken }: MoneyPanelProps) {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [summary, setSummary] = useState<UserLedgerSummary>({
    totalReceivables: 0,
    totalPayables: 0,
    netBalance: 0,
    activeCount: 0,
    unpaidCount: 0,
    paidCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active"); // active, unpaid, paid, all
  const [directionFilter, setDirectionFilter] = useState<string>("all"); // all, receivable, payable

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LedgerItem | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      let statusArg: LedgerStatus | undefined = undefined;
      if (statusFilter === "unpaid") statusArg = "pending";
      if (statusFilter === "paid") statusArg = "paid";

      const dirArg =
        directionFilter === "all"
          ? undefined
          : (directionFilter as LedgerDirection);

      const [itemsRes, summaryRes] = await Promise.all([
        fetchLedgerItems(sessionToken, {
          status: statusArg,
          direction: dirArg,
          search: search.trim() || undefined,
        }),
        fetchLedgerSummary(sessionToken),
      ]);

      let loadedItems = itemsRes.ledgerItems || [];
      if (statusFilter === "active") {
        loadedItems = loadedItems.filter(
          (item) => item.status === "pending" || item.status === "partially_paid",
        );
      }

      setItems(loadedItems);
      if (summaryRes?.summary) {
        setSummary(summaryRes.summary);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionToken, search, statusFilter, directionFilter]);

  const handleMarkPaid = async (item: LedgerItem) => {
    try {
      await markLedgerItemPaid(sessionToken, item.id);
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to mark as paid");
    }
  };

  const handleReopen = async (item: LedgerItem) => {
    try {
      await reopenLedgerItemApi(sessionToken, item.id);
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to reopen item");
    }
  };

  const handleDelete = async (item: LedgerItem) => {
    if (!confirm(`Are you sure you want to delete '${item.title}'?`)) return;
    try {
      await deleteLedgerItemApi(sessionToken, item.id);
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete item");
    }
  };

  const formatDateDisplay = (dateStr?: string | Date | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0B0C10]">
      {/* Top Banner Stats */}
      <section className="grid grid-cols-1 gap-4 px-6 pt-6 sm:grid-cols-3 select-none">
        {/* Card 1: Receivables */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#12131A] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              You’ll Receive
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-white">
            ₹{summary.totalReceivables.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Total unpaid money others owe you
          </p>
        </div>

        {/* Card 2: Payables */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#12131A] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              You Owe
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownLeft className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-white">
            ₹{summary.totalPayables.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Total unpaid money you owe others
          </p>
        </div>

        {/* Card 3: Net Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#12131A] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Net Balance
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400">
              <CircleDollarSign className="size-4" />
            </div>
          </div>
          <p
            className={`mt-3 text-2xl font-black ${
              summary.netBalance >= 0 ? "text-lime-400" : "text-rose-400"
            }`}
          >
            {summary.netBalance >= 0 ? "+" : ""}₹
            {Math.abs(summary.netBalance).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {summary.netBalance >= 0 ? "You are in profit" : "You have net debt"}
          </p>
        </div>
      </section>

      {/* Filter & Search Action Bar */}
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/60 bg-[#0B0C10] select-none">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center rounded-xl bg-zinc-900/90 p-1 border border-zinc-800/80">
            <button
              onClick={() => setStatusFilter("active")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "active"
                  ? "bg-lime-400 text-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("unpaid")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "unpaid"
                  ? "bg-lime-400 text-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setStatusFilter("paid")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "paid"
                  ? "bg-lime-400 text-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-lime-400 text-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All
            </button>
          </div>

          {/* Direction Filter */}
          <div className="flex items-center rounded-xl bg-zinc-900/90 p-1 border border-zinc-800/80">
            <button
              onClick={() => setDirectionFilter("all")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                directionFilter === "all"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setDirectionFilter("receivable")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                directionFilter === "receivable"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-emerald-400"
              }`}
            >
              Receivables
            </button>
            <button
              onClick={() => setDirectionFilter("payable")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                directionFilter === "payable"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "text-zinc-400 hover:text-rose-400"
              }`}
            >
              Payables
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full max-w-[220px]">
            <Search className="absolute left-3 top-2.5 size-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search person or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:border-lime-400 focus:outline-none transition-colors"
            />
          </div>

          <Button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-lime-400 px-4 py-2 text-xs font-bold text-black hover:bg-lime-300 transition-all cursor-pointer shadow-lg shadow-lime-400/20 shrink-0"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Add Entry</span>
          </Button>
        </div>
      </div>

      {/* Main Ledger Items List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-zinc-400 text-xs animate-pulse">
            Loading Money Ledger...
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-[#12131A]/40 p-8 text-center select-none">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-lime-400/30 bg-lime-400/10 text-lime-400 mb-4">
              <Coins className="size-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No money entries yet
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-5">
              Add something you lent or borrowed, or tell Calby AI in chat to add it automatically.
            </p>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="rounded-xl bg-lime-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-lime-300 transition-all cursor-pointer shadow-lg shadow-lime-400/20"
            >
              + Add Entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isReceivable = item.direction === "receivable";
              const isPaid = item.status === "paid";

              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#12131A] p-4 transition-all duration-200 hover:border-zinc-700/80"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Info */}
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border ${
                          isReceivable
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {isReceivable ? (
                          <ArrowUpRight className="size-5" />
                        ) : (
                          <ArrowDownLeft className="size-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {item.contact_name || item.title}
                          </h4>
                          <span
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              isReceivable
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isReceivable ? "Lent" : "Borrowed"}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              isPaid
                                ? "bg-lime-400/20 text-lime-400"
                                : "bg-zinc-800 text-zinc-300"
                            }`}
                          >
                            {isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400">
                          {item.title}
                          {item.notes ? ` · ${item.notes}` : ""}
                        </p>

                        {/* Due Date & Reminder info */}
                        <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-0.5">
                          {item.due_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3 text-lime-400" />
                              Due: {formatDateDisplay(item.due_at)}
                            </span>
                          )}
                          {item.reminder_id && (
                            <span className="flex items-center gap-1 text-lime-400">
                              <Bell className="size-3" />
                              Reminder Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-zinc-800/50 sm:border-0 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p
                          className={`text-lg font-black ${
                            isPaid
                              ? "text-zinc-500 line-through"
                              : isReceivable
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </p>
                        {isPaid && item.paid_at && (
                          <p className="text-[10px] text-zinc-500">
                            Paid {formatDateDisplay(item.paid_at)}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {!isPaid ? (
                          <button
                            onClick={() => handleMarkPaid(item)}
                            className="flex items-center gap-1 rounded-xl bg-lime-400/10 border border-lime-400/30 px-2.5 py-1.5 text-xs font-bold text-lime-400 hover:bg-lime-400 hover:text-black transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReopen(item)}
                            className="flex items-center gap-1 rounded-xl bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="size-3.5" />
                            <span>Reopen</span>
                          </button>
                        )}

                        <button
                          onClick={() => setEditingItem(item)}
                          className="rounded-xl border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          className="rounded-xl border border-zinc-800 p-1.5 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {createModalOpen && (
        <CreateMoneyModal
          sessionToken={sessionToken}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => loadData()}
        />
      )}

      {editingItem && (
        <EditMoneyModal
          sessionToken={sessionToken}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={() => loadData()}
        />
      )}
    </div>
  );
}
