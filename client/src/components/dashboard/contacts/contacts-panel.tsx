"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Send,
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit2,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchContactsApi,
  createContactApi,
  updateContactApi,
  deleteContactApi,
  Contact,
} from "@/lib/contacts";

interface ContactsPanelProps {
  sessionToken: string;
}

export function ContactsPanel({ sessionToken }: ContactsPanelProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async (query?: string) => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const res = await fetchContactsApi(sessionToken, query);
      setContacts(res.contacts || []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts(search);
  }, [sessionToken, search]);

  const handleOpenAdd = () => {
    setEditingContact(null);
    setName("");
    setEmail("");
    setPhoneNumber("");
    setTelegramId("");
    setNotes("");
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Contact) => {
    setEditingContact(c);
    setName(c.name);
    setEmail(c.email || "");
    setPhoneNumber(c.phoneNumber || "");
    setTelegramId(c.telegramId || "");
    setNotes(c.notes || "");
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Contact name is required");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (editingContact) {
        await updateContactApi(sessionToken, editingContact.id, {
          name: name.trim(),
          email: email.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          telegramId: telegramId.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await createContactApi(sessionToken, {
          name: name.trim(),
          email: email.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          telegramId: telegramId.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      await loadContacts(search);
      setModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save contact");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await deleteContactApi(sessionToken, contactId);
      await loadContacts(search);
    } catch (err: any) {
      alert(err?.message || "Failed to delete contact");
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 max-w-6xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Contacts Directory</h1>
            <p className="text-xs text-zinc-400">
              Manage your personal and business contacts for automated multi-channel reminder dispatch.
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs px-4 h-9 gap-1.5"
        >
          <Plus className="size-4" />
          <span>Add Contact</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search contacts by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none"
        />
      </div>

      {/* Contacts List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-xs text-zinc-500">
          Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-12 text-center space-y-3">
          <Users className="size-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">No contacts found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {search ? "No matching contacts found for your query." : "Add friends, clients, or colleagues to send reminders to external recipients."}
          </p>
          {!search && (
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="mt-2 rounded-xl bg-lime-400 text-zinc-950 font-semibold text-xs px-4"
            >
              Add Your First Contact
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-zinc-800/80 bg-[#101012] p-5 space-y-3 hover:border-zinc-700/80 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                  {c.notes && <p className="text-[11px] text-zinc-400 mt-0.5">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Communication Method Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {c.email && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                    <Mail className="size-3" /> Email
                  </span>
                )}
                {c.phoneNumber && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <MessageSquare className="size-3" /> WhatsApp
                  </span>
                )}
                {c.telegramId && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                    <Send className="size-3" /> Telegram
                  </span>
                )}
              </div>

              <div className="space-y-1 pt-1 text-[11px] text-zinc-400">
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3 text-zinc-500" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3 text-zinc-500" />
                    <span>{c.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
                  <Users className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-medium"
              >
                <X className="size-4" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Phone Number (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="e.g. +15550192831"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Telegram Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. @rahul_sharma or Chat ID"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Customer / Friend / Colleague"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-400 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={busy}
                className="h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs px-4"
              >
                {busy ? "Saving..." : editingContact ? "Update Contact" : "Save Contact"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
