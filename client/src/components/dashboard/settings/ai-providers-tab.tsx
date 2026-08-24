"use client";

import { useState, useRef, useEffect } from "react";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Search,
  X,
  Sparkles,
  Bot,
  Cpu,
  Globe,
  HardDrive,
  Zap,
  Radio,
  Layers,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ProviderItem {
  id: string;
  name: string;
  description: string;
  isRecommended?: boolean;
  apiKeyLabel: string;
  defaultModel: string;
  availableModels: string[];
  status: "connected" | "not_configured";
  apiKey: string;
}

const PROVIDERS_DATA: ProviderItem[] = [
  {
    id: "groq",
    name: "Groq",
    description: "Fast inference — recommended for most users.",
    isRecommended: true,
    apiKeyLabel: "Groq API Key",
    defaultModel: "openai/gpt-oss-120b",
    availableModels: [
      "openai/gpt-oss-120b",
      "llama-3.3-70b-versatile",
      "llama3-8b-8192",
      "mixtral-8x7b-32768",
    ],
    status: "connected",
    apiKey: "gsk_••••••••••••••••70bVersatile",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "General-purpose AI from Google.",
    apiKeyLabel: "Google AI API Key",
    defaultModel: "gemini-1.5-flash",
    availableModels: [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash",
    ],
    status: "not_configured",
    apiKey: "",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT models from OpenAI.",
    apiKeyLabel: "OpenAI API Key",
    defaultModel: "gpt-4o-mini",
    availableModels: [
      "gpt-4o-mini",
      "gpt-4o",
      "o3-mini",
      "gpt-3.5-turbo",
    ],
    status: "connected",
    apiKey: "sk-proj-••••••••••••••••4oMini",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "High-quality reasoning via Claude models.",
    apiKeyLabel: "Anthropic API Key",
    defaultModel: "claude-3-5-sonnet",
    availableModels: [
      "claude-3-5-sonnet",
      "claude-3-5-haiku",
      "claude-3-opus",
    ],
    status: "not_configured",
    apiKey: "",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access multiple models through one API.",
    apiKeyLabel: "OpenRouter API Key",
    defaultModel: "deepseek/deepseek-r1",
    availableModels: [
      "deepseek/deepseek-r1",
      "meta-llama/llama-3.3-70b-instruct",
      "anthropic/claude-3.5-sonnet",
    ],
    status: "not_configured",
    apiKey: "",
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Run models locally on your own machine.",
    apiKeyLabel: "Ollama Server Host URL",
    defaultModel: "llama3:latest",
    availableModels: [
      "llama3:latest",
      "mistral:latest",
      "phi3:latest",
      "codellama:latest",
    ],
    status: "not_configured",
    apiKey: "http://localhost:11434",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Reasoning & coding models from DeepSeek.",
    apiKeyLabel: "DeepSeek API Key",
    defaultModel: "deepseek-reasoner",
    availableModels: [
      "deepseek-reasoner",
      "deepseek-chat",
      "deepseek-coder",
    ],
    status: "not_configured",
    apiKey: "",
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    description: "Web-connected AI from Perplexity.",
    apiKeyLabel: "Perplexity API Key",
    defaultModel: "sonar-reasoning",
    availableModels: [
      "sonar-reasoning",
      "sonar-pro",
      "sonar",
    ],
    status: "not_configured",
    apiKey: "",
  },
  {
    id: "mistral",
    name: "Mistral",
    description: "Open and enterprise models from Mistral AI.",
    apiKeyLabel: "Mistral API Key",
    defaultModel: "mistral-large-latest",
    availableModels: [
      "mistral-large-latest",
      "mistral-medium-latest",
      "codestral-latest",
    ],
    status: "not_configured",
    apiKey: "",
  },
  {
    id: "minimax",
    name: "MiniMax",
    description: "General-purpose AI from MiniMax.",
    apiKeyLabel: "MiniMax API Key",
    defaultModel: "abab6.5-chat",
    availableModels: ["abab6.5-chat", "abab6-chat"],
    status: "not_configured",
    apiKey: "",
  },
  {
    id: "grok",
    name: "xAI Grok",
    description: "Grok models from xAI.",
    apiKeyLabel: "xAI Grok API Key",
    defaultModel: "grok-2-latest",
    availableModels: ["grok-2-latest", "grok-2-vision-latest"],
    status: "not_configured",
    apiKey: "",
  },
  {
    id: "zai",
    name: "Z.AI",
    description: "GLM models from Z.AI.",
    apiKeyLabel: "Z.AI API Key",
    defaultModel: "glm-4-plus",
    availableModels: ["glm-4-plus", "glm-4-air"],
    status: "not_configured",
    apiKey: "",
  },
];

function ProviderLogoIcon({ id, className }: { id: string; className?: string }) {
  if (id === "groq") {
    return (
      <div className={cn("flex items-center justify-center bg-[#F55036] rounded-xl text-white font-black text-sm shadow-sm", className)}>
        9
      </div>
    );
  }
  if (id === "gemini") {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-white border border-zinc-200 rounded-xl p-1 text-center shadow-sm", className)}>
        <Sparkles className="size-4 text-blue-500" />
        <span className="text-[7px] font-bold text-zinc-900 leading-none mt-0.5">Gemini</span>
      </div>
    );
  }
  if (id === "openai") {
    return (
      <div className={cn("flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-xl text-white shadow-sm", className)}>
        <Bot className="size-4 text-emerald-400" />
      </div>
    );
  }
  if (id === "anthropic") {
    return (
      <div className={cn("flex items-center justify-center bg-[#D97757] rounded-xl text-white font-bold text-xs shadow-sm", className)}>
        A\
      </div>
    );
  }
  if (id === "openrouter") {
    return (
      <div className={cn("flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400 shadow-sm", className)}>
        <Globe className="size-4" />
      </div>
    );
  }
  if (id === "ollama") {
    return (
      <div className={cn("flex items-center justify-center bg-white border border-zinc-200 rounded-xl text-zinc-900 font-bold text-xs shadow-sm", className)}>
        🦙
      </div>
    );
  }
  if (id === "deepseek") {
    return (
      <div className={cn("flex items-center justify-center bg-[#4D6BFE] rounded-xl text-white font-bold text-xs shadow-sm", className)}>
        🐋
      </div>
    );
  }
  if (id === "perplexity") {
    return (
      <div className={cn("flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-xl text-teal-400 shadow-sm", className)}>
        <Radio className="size-4" />
      </div>
    );
  }
  if (id === "mistral") {
    return (
      <div className={cn("flex items-center justify-center bg-[#FF7000] rounded-xl text-white font-black text-xs shadow-sm", className)}>
        M
      </div>
    );
  }
  if (id === "minimax") {
    return (
      <div className={cn("flex items-center justify-center bg-[#FF4757] rounded-xl text-white font-bold text-xs shadow-sm", className)}>
        <Zap className="size-4" />
      </div>
    );
  }
  if (id === "grok") {
    return (
      <div className={cn("flex items-center justify-center bg-zinc-950 border border-zinc-700 rounded-xl text-white font-black text-xs shadow-sm", className)}>
        xAI
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-center bg-[#2B2D42] rounded-xl text-lime-400 font-bold text-xs shadow-sm", className)}>
      Z
    </div>
  );
}

export function AIProvidersTab() {
  const [providerState, setProviderState] = useState<Record<string, ProviderItem>>(() => {
    const map: Record<string, ProviderItem> = {};
    PROVIDERS_DATA.forEach((p) => {
      map[p.id] = { ...p };
    });
    return map;
  });

  const [selectedId, setSelectedId] = useState<string>("groq");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [inputKeys, setInputKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const selectedProvider = providerState[selectedId] || PROVIDERS_DATA[0];

  const filteredProviders = PROVIDERS_DATA.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const toggleShowKey = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleKeyInputChange = (val: string) => {
    setInputKeys((prev) => ({ ...prev, [selectedId]: val }));
    setSavedMessage(null);
  };

  const handleModelChange = (newModel: string) => {
    setProviderState((prev) => ({
      ...prev,
      [selectedId]: {
        ...prev[selectedId],
        defaultModel: newModel,
      },
    }));
  };

  const handleSaveChanges = () => {
    setSaving(true);
    setTimeout(() => {
      const rawVal = inputKeys[selectedId];
      if (rawVal && rawVal.trim()) {
        const maskedKey = rawVal.startsWith("••••")
          ? rawVal
          : `${rawVal.slice(0, 4)}••••••••••••••••${rawVal.slice(-4)}`;

        setProviderState((prev) => ({
          ...prev,
          [selectedId]: {
            ...prev[selectedId],
            status: "connected",
            apiKey: maskedKey,
          },
        }));
      }
      setSaving(false);
      setSavedMessage("LLM provider settings updated successfully.");
      setTimeout(() => setSavedMessage(null), 3000);
    }, 600);
  };

  const currentInputValue =
    inputKeys[selectedId] !== undefined
      ? inputKeys[selectedId]
      : selectedProvider.apiKey;

  return (
    <div className="mx-auto max-w-[900px] w-full space-y-6 select-none">
      {/* PAGE HEADER */}
      <div className="text-left">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          LLM Provider Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure your primary AI language model provider and API credentials.
        </p>
      </div>

      {/* MAIN SETTINGS CARD (Centered & Styled with Calby Lime Theme) */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#0C0D0F] p-6 space-y-6 shadow-2xl ring-1 ring-white/5">
        {/* Card Header & Save Changes Button */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">
              AI Provider Selection
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Choose which LLM powers reasoning across Calby workspaces.
            </p>
          </div>

          <Button
            size="sm"
            disabled={saving}
            onClick={handleSaveChanges}
            className="h-9 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs px-5 shadow-[0_0_15px_rgba(156,255,0,0.25)] hover:shadow-[0_0_20px_rgba(156,255,0,0.4)] transition-all cursor-pointer"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>

        {/* PROVIDER SELECTOR DROPDOWN BOX */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border border-zinc-800/90 bg-[#12141A] p-3.5 hover:border-zinc-700 transition-all cursor-pointer",
              isDropdownOpen && "border-lime-400/80 bg-[#151822] ring-1 ring-lime-400/30"
            )}
          >
            <div className="flex items-center gap-3.5 min-w-0 text-left">
              <ProviderLogoIcon id={selectedProvider.id} className="size-10 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white leading-tight">
                    {selectedProvider.name}
                  </h3>
                  {selectedProvider.isRecommended && (
                    <span className="rounded-md border border-lime-400/40 bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-lime-400">
                      ★ Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {selectedProvider.description}
                </p>
              </div>
            </div>

            <ChevronsUpDown className="size-4 text-zinc-400 shrink-0 ml-2" />
          </button>

          {/* Searchable Dropdown Popover (Exact Match to Reference Screenshots!) */}
          {isDropdownOpen && (
            <div className="absolute top-full mt-2 left-0 w-full z-50 overflow-hidden rounded-2xl border border-lime-400/60 bg-[#0F1115] p-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] space-y-3 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-lime-400/20">
              {/* Search Header */}
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 size-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search providers..."
                  className="w-full rounded-xl border border-zinc-800 bg-[#161820] pl-10 pr-9 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/40"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-zinc-500 hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Provider List Items (12 Providers from Reference Screenshots!) */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {filteredProviders.map((p) => {
                  const isSelected = p.id === selectedProvider.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(p.id);
                        setIsDropdownOpen(false);
                        setSearchQuery("");
                        setSavedMessage(null);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl p-3 text-left transition-all duration-150 cursor-pointer select-none border",
                        isSelected
                          ? "bg-zinc-800/90 border-lime-400/60 text-white shadow-md"
                          : "hover:bg-zinc-800/50 text-zinc-300 border-zinc-800/60 bg-[#12141C]"
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <ProviderLogoIcon id={p.id} className="size-9 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {p.name}
                            </span>
                            {p.isRecommended && (
                              <span className="rounded-md border border-lime-400/40 bg-lime-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-lime-400">
                                ★ Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      {isSelected && <Check className="size-4 text-lime-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2-COLUMN INPUTS ROW (Matching Reference Screenshots!) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Column 1: API Key Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-200">
              {selectedProvider.apiKeyLabel}
            </label>
            <div className="relative flex items-center">
              <input
                type={showPasswordMap[selectedProvider.id] ? "text" : "password"}
                value={currentInputValue}
                onChange={(e) => handleKeyInputChange(e.target.value)}
                placeholder={`${selectedProvider.name} API Key`}
                className="w-full rounded-xl border border-zinc-800/90 bg-[#12141A] px-3.5 py-2.5 pr-10 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 transition-all"
              />
              <button
                type="button"
                onClick={() => toggleShowKey(selectedProvider.id)}
                className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPasswordMap[selectedProvider.id] ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Column 2: Chat Model Selection Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-200">
              Chat Model Selection
            </label>
            <div className="relative flex items-center">
              <select
                value={selectedProvider.defaultModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-800/90 bg-[#12141A] px-3.5 py-2.5 text-xs font-medium text-white focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 cursor-pointer appearance-none"
              >
                {selectedProvider.availableModels.map((model) => (
                  <option key={model} value={model} className="bg-zinc-900 text-white">
                    {model}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 size-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {savedMessage && (
          <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3.5 py-2.5 text-xs font-medium text-lime-400 flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="size-4 shrink-0" />
            <span>{savedMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
