"use client";

import { useState } from "react";
import { Key, Plus, Copy, Check, Trash2, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ApiKeyItem {
  id: string;
  name: string;
  keyMasked: string;
  fullKey?: string;
  createdAt: string;
  lastUsed: string;
}

const INITIAL_KEYS: ApiKeyItem[] = [
  {
    id: "key-1",
    name: "Production Calby Assistant Key",
    keyMasked: "calby_pk_live_••••••••••••8001",
    fullKey: "calby_pk_live_9f82a10b4c73d9e28001",
    createdAt: "24 Aug 2026",
    lastUsed: "2 mins ago",
  },
  {
    id: "key-2",
    name: "CLI & Automation Token",
    keyMasked: "calby_pk_dev_••••••••••••1049",
    fullKey: "calby_pk_dev_3e71d9a2b5f8c6d11049",
    createdAt: "20 Aug 2026",
    lastUsed: "Yesterday",
  },
];

export function ApiManagementTab() {
  const [keys, setKeys] = useState<ApiKeyItem[]>(INITIAL_KEYS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyCreated, setNewKeyCreated] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const rawSecret = `calby_pk_live_${Math.random().toString(36).slice(2, 18)}${Date.now().toString().slice(-4)}`;
    const newObj: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      keyMasked: `${rawSecret.slice(0, 14)}••••••••••••${rawSecret.slice(-4)}`,
      fullKey: rawSecret,
      createdAt: "Today",
      lastUsed: "Never",
    };
    setKeys((prev) => [newObj, ...prev]);
    setNewKeyCreated(rawSecret);
    setNewKeyName("");
    setIsCreating(false);
  };

  const handleRevoke = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            API Management
            <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-xs font-semibold text-lime-400 uppercase">
              Developer Access
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Generate and manage secret API tokens for external scripts, SDKs, and workflow integrations.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          className="h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs px-3.5 shadow-sm"
        >
          <Plus className="size-3.5 mr-1" />
          <span>Create New API Key</span>
        </Button>
      </div>

      {/* Creation Modal / Inline Prompt */}
      {isCreating && (
        <div className="rounded-2xl border border-zinc-800 bg-[#121214] p-5 space-y-4 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key className="size-4 text-lime-400" />
              <span>Create Developer API Key</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Key Name / Purpose
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Webhook Token..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-lime-400"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(false)}
              className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateKey}
              className="h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs px-4"
            >
              Generate Key
            </Button>
          </div>
        </div>
      )}

      {/* New Key Alert Banner */}
      {newKeyCreated && (
        <div className="rounded-2xl border border-lime-400/40 bg-lime-400/10 p-4 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-lime-400 flex items-center gap-1.5">
              <Check className="size-4" />
              API Key Generated Successfully
            </span>
            <button
              type="button"
              onClick={() => setNewKeyCreated(null)}
              className="text-xs text-lime-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
          <p className="text-[11px] text-zinc-300">
            Please copy your secret key now. You will not be able to see it again!
          </p>
          <div className="flex items-center gap-2 pt-1">
            <code className="flex-1 rounded-xl border border-lime-400/30 bg-zinc-950 px-3 py-1.5 text-xs font-mono text-lime-300 truncate">
              {newKeyCreated}
            </code>
            <Button
              size="sm"
              onClick={() => handleCopy("new-key", newKeyCreated)}
              className="h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs px-3"
            >
              {copiedId === "new-key" ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              <span>{copiedId === "new-key" ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#101012] p-8 text-center space-y-2">
            <Key className="size-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-medium text-white">No API keys created yet</p>
            <p className="text-xs text-zinc-500">
              Generate a developer API key to connect external scripts and tools.
            </p>
          </div>
        ) : (
          keys.map((k) => (
            <div
              key={k.id}
              className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm hover:border-zinc-700/80 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Key className="size-4 text-lime-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-white truncate">
                    {k.name}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                  <span>{k.keyMasked}</span>
                  <span>·</span>
                  <span className="text-[11px] font-sans text-zinc-400">
                    Created: {k.createdAt}
                  </span>
                  <span>·</span>
                  <span className="text-[11px] font-sans text-zinc-400">
                    Last used: {k.lastUsed}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(k.id, k.fullKey || k.keyMasked)}
                  className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium px-3"
                >
                  {copiedId === k.id ? (
                    <Check className="size-3.5 text-lime-400 mr-1" />
                  ) : (
                    <Copy className="size-3.5 mr-1" />
                  )}
                  <span>{copiedId === k.id ? "Copied" : "Copy Key"}</span>
                </Button>

                <button
                  type="button"
                  onClick={() => handleRevoke(k.id)}
                  className="flex size-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Revoke Key"
                  aria-label="Revoke Key"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
