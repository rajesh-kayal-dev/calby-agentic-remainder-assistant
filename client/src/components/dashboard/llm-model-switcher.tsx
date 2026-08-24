"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Check,
  ChevronDown,
  Search,
  Sparkles,
  Bot,
  Globe,
  Radio,
  Zap,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLLM } from "@/context/llm-context";
import { ModelDefinition } from "@/lib/llm";

function ProviderLogoIcon({ id, className }: { id: string; className?: string }) {
  if (id === "groq") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#F55036] rounded-xl text-white font-black text-xs shadow-sm select-none",
          className,
        )}
      >
        9
      </div>
    );
  }
  if (id === "google-gemini" || id === "gemini") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-white border border-zinc-200 rounded-xl p-1 text-center shadow-sm select-none",
          className,
        )}
      >
        <Sparkles className="size-3.5 text-blue-500" />
        <span className="text-[6px] font-bold text-zinc-900 leading-none mt-0.5">Gemini</span>
      </div>
    );
  }
  if (id === "openai") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-xl text-white shadow-sm select-none",
          className,
        )}
      >
        <Bot className="size-3.5 text-emerald-400" />
      </div>
    );
  }
  if (id === "anthropic") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#D97757] rounded-xl text-white font-bold text-[11px] shadow-sm select-none",
          className,
        )}
      >
        A\
      </div>
    );
  }
  if (id === "openrouter") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400 shadow-sm select-none",
          className,
        )}
      >
        <Globe className="size-3.5" />
      </div>
    );
  }
  if (id === "ollama") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white border border-zinc-200 rounded-xl text-zinc-900 font-bold text-[11px] shadow-sm select-none",
          className,
        )}
      >
        🦙
      </div>
    );
  }
  if (id === "deepseek") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#4D6BFE] rounded-xl text-white font-bold text-[11px] shadow-sm select-none",
          className,
        )}
      >
        🐋
      </div>
    );
  }
  if (id === "perplexity") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-xl text-teal-400 shadow-sm select-none",
          className,
        )}
      >
        <Radio className="size-3.5" />
      </div>
    );
  }
  if (id === "mistral") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#FF7000] rounded-xl text-white font-black text-[11px] shadow-sm select-none",
          className,
        )}
      >
        M
      </div>
    );
  }
  if (id === "minimax") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#FF4757] rounded-xl text-white font-bold text-[11px] shadow-sm select-none",
          className,
        )}
      >
        <Zap className="size-3.5" />
      </div>
    );
  }
  if (id === "xai-grok" || id === "grok") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-950 border border-zinc-700 rounded-xl text-white font-black text-[10px] shadow-sm select-none",
          className,
        )}
      >
        xAI
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[#2B2D42] rounded-xl text-lime-400 font-bold text-[11px] shadow-sm select-none",
        className,
      )}
    >
      Z
    </div>
  );
}

interface LLMModelSwitcherProps {
  onOpenSettings: (tab: "ai-providers") => void;
}

export function LLMModelSwitcher({ onOpenSettings }: LLMModelSwitcherProps) {
  const {
    providers,
    connections,
    defaultConnection,
    activeLLM,
    setActiveLLM,
    setTargetSettingsProviderId,
    loadModelsForProvider,
    updateConnection,
  } = useLLM();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inspectedProviderId, setInspectedProviderId] = useState<string>("groq");
  const [selectedModelInPopover, setSelectedModelInPopover] = useState<string>("");

  // Models for inspected provider
  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active Provider & Model Label for Trigger Pill
  const currentActiveProviderDef = useMemo(() => {
    if (activeLLM) {
      return providers.find((p) => p.id === activeLLM.providerId);
    }
    if (defaultConnection) {
      return providers.find((p) => p.id === defaultConnection.providerId);
    }
    return providers[0] || null;
  }, [activeLLM, defaultConnection, providers]);

  const activeModelDisplay = useMemo(() => {
    if (!currentActiveProviderDef) return "No Provider Connected";
    const model =
      activeLLM?.model ||
      defaultConnection?.selectedModel ||
      currentActiveProviderDef.defaultModels[0]?.id ||
      "default";
    return `${currentActiveProviderDef.name} • ${model}`;
  }, [currentActiveProviderDef, activeLLM, defaultConnection]);

  // Sync inspected provider with active provider when popover opens
  useEffect(() => {
    if (isOpen) {
      const initialId =
        activeLLM?.providerId || defaultConnection?.providerId || providers[0]?.id || "groq";
      setInspectedProviderId(initialId);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, activeLLM, defaultConnection, providers]);

  // Load models for the inspected provider
  useEffect(() => {
    if (!isOpen || !inspectedProviderId) return;
    let isMounted = true;
    setLoadingModels(true);

    loadModelsForProvider(inspectedProviderId).then((res) => {
      if (isMounted) {
        setModels(res);
        if (res.length > 0) {
          const inspectedConn = connections.find((c) => c.providerId === inspectedProviderId);
          const defaultSelected =
            (activeLLM?.providerId === inspectedProviderId && activeLLM.model) ||
            inspectedConn?.selectedModel ||
            res[0].id;
          setSelectedModelInPopover(defaultSelected);
        } else {
          setSelectedModelInPopover("");
        }
        setLoadingModels(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, inspectedProviderId, connections, activeLLM, loadModelsForProvider]);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Filtered providers
  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const q = searchQuery.toLowerCase().trim();
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [providers, searchQuery]);

  // Inspected provider definition & configured status
  const inspectedDef = useMemo(() => {
    return providers.find((p) => p.id === inspectedProviderId) || providers[0];
  }, [providers, inspectedProviderId]);

  const inspectedConnection = useMemo(() => {
    return connections.find((c) => c.providerId === inspectedProviderId) || null;
  }, [connections, inspectedProviderId]);

  // Handle "Set up now" action
  const handleSetUpNow = (pId: string) => {
    setTargetSettingsProviderId(pId);
    setIsOpen(false);
    onOpenSettings("ai-providers");
  };

  return (
    <div className="relative select-none" ref={containerRef}>
      {/* TOP-RIGHT TRIGGER PILL (MATCHES CALBY DESIGN) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "h-8 px-3 rounded-full border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer select-none",
          isOpen
            ? "border-lime-400/80 bg-[#121915] text-white ring-1 ring-lime-400/30"
            : "border-zinc-800 bg-[#121316] text-zinc-200 hover:border-zinc-700 hover:bg-[#16181E]",
        )}
        title="Switch AI Provider and Model"
      >
        <Sparkles className="size-3.5 text-lime-400 shrink-0" />
        <span className="truncate max-w-[200px] text-xs font-medium">{activeModelDisplay}</span>
        <ChevronDown className="size-3.5 text-zinc-400 shrink-0 ml-0.5" />
      </button>

      {/* 2-PANE DROPDOWN POPOVER OVERLAY (MATCHES REFERENCE SCREENSHOTS) */}
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-[540px] max-w-[94vw] rounded-2xl border border-zinc-800/90 bg-[#0C0D12]/98 shadow-2xl backdrop-blur-2xl p-3.5 flex gap-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* LEFT PANE: SEARCH & PROVIDERS LIST */}
          <div className="w-[230px] shrink-0 space-y-2 border-r border-zinc-800/80 pr-3.5">
            {/* Search Providers Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 size-3.5 text-zinc-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search providers..."
                className="w-full rounded-xl border border-zinc-800 bg-[#14151B] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
              />
            </div>

            <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-1">
              Popular Providers
            </div>

            {/* Scrollable Provider List */}
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredProviders.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  No providers found.
                </div>
              ) : (
                filteredProviders.map((prov) => {
                  const isInspected = prov.id === inspectedProviderId;
                  const isRecommended = prov.id === "groq" || prov.id === "openai";

                  return (
                    <div
                      key={prov.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setInspectedProviderId(prov.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setInspectedProviderId(prov.id);
                        }
                      }}
                      className={cn(
                        "group flex items-center justify-between rounded-xl border p-2 cursor-pointer transition-all text-left select-none",
                        isInspected
                          ? "border-lime-400/70 bg-[#141B16] shadow-[0_0_12px_rgba(163,230,53,0.12)] text-white"
                          : "border-transparent hover:bg-zinc-800/40 text-zinc-300",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ProviderLogoIcon id={prov.id} className="size-8 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs truncate">
                              {prov.name}
                            </span>
                            {isRecommended && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 px-1 py-0.2 text-[8px] font-semibold text-blue-400">
                                ★ Recommended
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 truncate leading-tight">
                            {prov.description}
                          </span>
                        </div>
                      </div>

                      {isInspected && (
                        <Check className="size-3.5 text-lime-400 shrink-0 ml-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: AVAILABLE MODELS OR MISSING CREDENTIALS (MATCHES REFERENCE SCREENSHOTS 1, 2, 3) */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white truncate">
                  Available Models for {inspectedDef?.name || "Provider"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select a model to use for this workspace.
                </p>
              </div>

              {/* CASE A: PROVIDER IS CONFIGURED */}
              {inspectedConnection ? (
                <div className="space-y-4 pt-1">
                  {loadingModels ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-zinc-400 animate-pulse">
                      <LoaderCircle className="size-4 animate-spin text-lime-400" />
                      <span>Loading available models...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Model Select Dropdown with 'Discovered models' Optgroup */}
                      <div className="relative flex items-center">
                        <select
                          value={selectedModelInPopover}
                          onChange={(e) => setSelectedModelInPopover(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-[#121316] px-3.5 py-2.5 text-xs font-medium text-white focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 cursor-pointer appearance-none shadow-sm"
                        >
                          <optgroup
                            label="Discovered models"
                            className="bg-[#121316] text-zinc-400 font-semibold"
                          >
                            {models.map((m) => (
                              <option
                                key={m.id}
                                value={m.id}
                                className="bg-[#121316] text-white py-1 font-medium"
                              >
                                {m.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <ChevronDown className="absolute right-3.5 size-4 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CASE B: PROVIDER IS NOT CONFIGURED */
                <div className="py-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                    <AlertCircle className="size-4 text-zinc-400 shrink-0" />
                    <span>This provider is missing credentials!</span>
                    <button
                      type="button"
                      onClick={() => handleSetUpNow(inspectedDef.id)}
                      className="font-bold text-lime-400 hover:underline cursor-pointer transition-colors ml-1"
                    >
                      Set up now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM BUTTON: "Use this model" (MATCHES REFERENCE SCREENSHOTS) */}
            {inspectedConnection && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedModelInPopover) return;
                    setActiveLLM({
                      providerId: inspectedProviderId,
                      model: selectedModelInPopover,
                    });
                    if (inspectedConnection) {
                      await updateConnection(inspectedConnection.id, {
                        selectedModel: selectedModelInPopover,
                      }).catch(() => null);
                    }
                    setIsOpen(false);
                  }}
                  disabled={!selectedModelInPopover || loadingModels}
                  className="w-full h-9 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  Use this model
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
