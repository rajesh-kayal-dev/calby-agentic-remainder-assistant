"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  Edit3,
  MoreHorizontal,
  Users,
  ShieldCheck,
  X,
  Check,
  ChevronDown,
  AlertCircle,
  Trash2,
  Mail,
  MessageSquare,
  Send,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchContactsApi,
  createContactApi,
  updateContactApi,
  deleteContactApi,
  Contact,
} from "@/lib/contacts";
import {
  WhatsAppIcon,
  GmailIcon,
  TelegramIcon,
} from "@/components/ui/integration-icons";

const AVATAR_COLORS = [
  "bg-[#a3e635] text-black",
  "bg-[#b4c6ff] text-black",
  "bg-[#93c5fd] text-black",
  "bg-[#fcd34d] text-black",
  "bg-[#f472b6] text-black",
  "bg-[#c084fc] text-black",
];

interface ContactsTabProps {
  sessionToken: string;
}

export function ContactsTab({ sessionToken }: ContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Contacts");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Modals & Menu State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [activeMenuContactId, setActiveMenuContactId] = useState<string | null>(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Friend");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [preferredChannel, setPreferredChannel] = useState<string>("WhatsApp");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const res = await fetchContactsApi(sessionToken);
      setContacts(res.contacts || []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [sessionToken]);

  const handleOpenAdd = () => {
    setEditingContact(null);
    setName("");
    setRelationship("Friend");
    setEmail("");
    setPhoneNumber("");
    setTelegramId("");
    setPreferredChannel("WhatsApp");
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Contact) => {
    setEditingContact(c);
    setName(c.name);
    setRelationship(c.relationship || "Friend");
    setEmail(c.email || "");
    setPhoneNumber(c.phoneNumber || (c as any).phone_number || "");
    setTelegramId(c.telegramId || (c as any).telegram_id || "");
    setPreferredChannel(c.preferredChannel || "WhatsApp");
    setError(null);
    setActiveMenuContactId(null);
    setModalOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    setActiveMenuContactId(null);
    setContacts((prev) => prev.filter((item) => item.id !== contactId));
    if (sessionToken) {
      try {
        await deleteContactApi(sessionToken, contactId);
        await loadContacts();
      } catch {
        loadContacts();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full Name is required");
      return;
    }

    setBusy(true);
    setError(null);

    const payload = {
      name: name.trim(),
      relationship: relationship.trim(),
      email: email.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      telegramId: telegramId.trim() || undefined,
      preferredChannel,
    };

    try {
      if (editingContact) {
        await updateContactApi(sessionToken, editingContact.id, payload);
      } else {
        await createContactApi(sessionToken, payload);
      }
      await loadContacts();
      setModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save contact");
    } finally {
      setBusy(false);
    }
  };

  // Filtered Contacts List
  const filteredContacts = useMemo(() => {
    return contacts.filter((item) => {
      // Category filter
      if (selectedCategory !== "All Contacts") {
        if (selectedCategory === "Friends" && item.relationship?.toLowerCase() !== "friend") return false;
        if (selectedCategory === "Clients" && item.relationship?.toLowerCase() !== "client") return false;
        if (selectedCategory === "Colleagues" && item.relationship?.toLowerCase() !== "colleague") return false;
        if (selectedCategory === "Business Partners" && item.relationship?.toLowerCase() !== "business partner") return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesRel = (item.relationship || "").toLowerCase().includes(q);
        const matchesEmail = (item.email || "").toLowerCase().includes(q);
        const matchesPhone = (item.phoneNumber || "").toLowerCase().includes(q);
        const matchesTg = (item.telegramId || "").toLowerCase().includes(q);
        if (!matchesName && !matchesRel && !matchesEmail && !matchesPhone && !matchesTg) {
          return false;
        }
      }
      return true;
    });
  }, [contacts, searchQuery, selectedCategory]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 select-none">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Contacts
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
            Save people you regularly contact so Calby knows who to reach when you ask.
          </p>
        </div>

        {/* Top Right Add Contact Action Button */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-lime-400 hover:bg-lime-300 text-zinc-950 px-4 py-2 text-xs font-bold transition-all shadow-[0_0_12px_rgba(163,230,53,0.25)] cursor-pointer shrink-0"
        >
          <Plus className="size-4 stroke-[3]" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Search Input Box */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full rounded-xl border border-zinc-800/90 bg-[#121316] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown Selector */}
        <div className="relative w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterDropdownOpen((prev) => !prev)}
            className="flex w-full sm:w-auto items-center justify-between gap-3 rounded-xl border border-zinc-800/90 bg-[#121316] px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <span>{selectedCategory}</span>
            <ChevronDown className="size-4 text-zinc-500" />
          </button>

          {filterDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-800 bg-[#121316] py-1.5 shadow-2xl z-30 animate-in fade-in duration-100">
              {[
                "All Contacts",
                "Friends",
                "Clients",
                "Colleagues",
                "Business Partners",
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setFilterDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors text-left cursor-pointer",
                    selectedCategory === cat
                      ? "text-lime-400 bg-lime-400/5 font-semibold"
                      : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                  )}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="size-3.5 text-lime-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTACT CARDS STACK */}
      <div className="space-y-3 pt-1">
        {filteredContacts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-[#111215] p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-zinc-300">No contacts match your query</p>
            <p className="text-xs text-zinc-500">Try adjusting your search terms or filter.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Contacts");
              }}
              className="mt-2 text-xs text-lime-400 hover:underline font-semibold cursor-pointer"
            >
              Reset search
            </button>
          </div>
        ) : (
          filteredContacts.map((c, idx) => {
            const avatarColorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const initial = c.name.charAt(0).toUpperCase();

            return (
              <div
                key={c.id}
                className="group rounded-2xl border border-zinc-800/80 bg-[#111215] hover:border-zinc-700/80 transition-all p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                {/* Left Side: Avatar + Details */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Large Initial Avatar Circle */}
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-full font-bold text-lg shadow-sm",
                      avatarColorClass
                    )}
                  >
                    {initial}
                  </div>

                  <div className="min-w-0 space-y-1">
                    {/* Name + Relationship Tag */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {c.name}
                      </h3>
                      {c.relationship && (
                        <span className="rounded-full bg-zinc-800/80 border border-zinc-700/60 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                          {c.relationship}
                        </span>
                      )}
                    </div>

                    {/* Communication Info Line */}
                    <div className="flex items-center gap-2.5 text-xs text-zinc-300 flex-wrap">
                      {c.phoneNumber && (
                        <div className="flex items-center gap-1.5">
                          <WhatsAppIcon className="size-4" />
                          <span>{c.phoneNumber}</span>
                        </div>
                      )}

                      {c.phoneNumber && (c.email || c.telegramId) && (
                        <span className="text-zinc-600 font-bold">•</span>
                      )}

                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <GmailIcon className="size-4" />
                          <span>{c.email}</span>
                        </div>
                      )}

                      {c.email && c.telegramId && (
                        <span className="text-zinc-600 font-bold">•</span>
                      )}

                      {c.telegramId && (
                        <div className="flex items-center gap-1.5">
                          <TelegramIcon className="size-4" />
                          <span>{c.telegramId}</span>
                        </div>
                      )}
                    </div>

                    {/* Preferred Channel Line */}
                    <div className="text-xs text-zinc-400 font-medium">
                      Preferred:{" "}
                      <span className="text-lime-400 font-semibold">
                        {c.preferredChannel || "WhatsApp"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Edit & More Actions */}
                <div className="relative flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(c)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#16171c] hover:bg-zinc-800 hover:text-white px-3.5 py-1.5 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    <Edit3 className="size-3.5 text-zinc-400" />
                    <span>Edit</span>
                  </button>

                  {/* More Menu Toggle */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMenuContactId(activeMenuContactId === c.id ? null : c.id)
                      }
                      className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 bg-[#16171c] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {activeMenuContactId === c.id && (
                      <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-zinc-800 bg-[#121316] py-1.5 shadow-2xl z-30 animate-in fade-in duration-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit3 className="size-3.5 text-zinc-400" />
                          <span>Edit Contact</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5 text-red-400" />
                          <span>Delete Contact</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DASHED PROMO / ONBOARDING BANNER */}
      <div className="rounded-2xl border border-dashed border-lime-400/40 bg-lime-400/[0.02] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Your contacts help Calby reach the right people
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Add contacts and choose how Calby should reach them.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-lime-400 text-lime-400 hover:bg-lime-400/10 px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <span>Add your first contact</span>
          <Plus className="size-3.5 stroke-[3]" />
        </button>
      </div>

      {/* FOOTER PRIVACY GUARANTEE */}
      <div className="pt-4 text-center">
        <p className="inline-flex items-center justify-center gap-2 text-xs text-zinc-400 font-medium flex-wrap">
          <ShieldCheck className="size-4 text-lime-400 shrink-0" />
          <span>Your contacts are private and secure. Calby only uses them when you ask.</span>
          <button
            type="button"
            onClick={() => setPrivacyModalOpen(true)}
            className="text-lime-400 hover:underline font-semibold cursor-pointer"
          >
            Learn more
          </button>
        </p>
      </div>

      {/* ADD / EDIT CONTACT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0d0e11] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
                  <Users className="size-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-medium cursor-pointer"
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

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-[#121316] px-3.5 py-2.5 text-white placeholder:text-zinc-500 focus:border-lime-400 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Relationship / Tag</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-[#121316] px-3.5 py-2.5 text-white focus:border-lime-400 focus:outline-none"
                >
                  <option value="Friend">Friend</option>
                  <option value="Client">Client</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Business Partner">Business Partner</option>
                  <option value="Family">Family</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Phone Number (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-[#121316] px-3.5 py-2.5 text-white placeholder:text-zinc-500 focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-[#121316] px-3.5 py-2.5 text-white placeholder:text-zinc-500 focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Telegram Handle</label>
                <input
                  type="text"
                  placeholder="e.g. @rahul_sharma"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-[#121316] px-3.5 py-2.5 text-white placeholder:text-zinc-500 focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Preferred Channel</label>
                <select
                  value={preferredChannel}
                  onChange={(e) => setPreferredChannel(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-[#121316] px-3.5 py-2.5 text-white focus:border-lime-400 focus:outline-none"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Telegram">Telegram</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white px-4 py-2 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs px-5 py-2 transition-colors cursor-pointer"
              >
                {busy ? "Saving..." : editingContact ? "Update Contact" : "Save Contact"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRIVACY LEARN MORE MODAL */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0d0e11] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-5 text-lime-400" />
                <h3 className="text-base font-bold text-white">Contact Privacy & Security</h3>
              </div>
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-medium cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                Calby uses end-to-end AES-256 encryption to store your contact recipients securely.
              </p>
              <p>
                Your contacts are never sold or shared with third parties. They are exclusively used to send reminder briefs or scheduling updates when you explicitly command Calby.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="rounded-full bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs px-5 py-2 cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
