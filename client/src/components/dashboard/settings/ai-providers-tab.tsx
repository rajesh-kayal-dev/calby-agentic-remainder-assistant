"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Search,
  X,
  Sparkles,
  Bot,
  Globe,
  Radio,
  Zap,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  HelpCircle,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLLM } from "@/context/llm-context";
import {
  LLMProviderDefinition,
  UserLLMConnectionDTO,
  ModelDefinition,
  ConfigFieldDefinition,
} from "@/lib/llm";

import {
  GeminiLogoIcon,
  OpenAILogoIcon,
  GroqLogoIcon,
  AnthropicLogoIcon,
  OpenRouterLogoIcon,
  OllamaLogoIcon,
  DeepSeekLogoIcon,
  PerplexityLogoIcon,
  MistralLogoIcon,
  MiniMaxLogoIcon,
  GrokLogoIcon,
  ZAILogoIcon,
} from "@/components/ui/llm-provider-icons";

function ProviderLogoIcon({ id, className }: { id: string; className?: string }) {
  if (id === "groq") {
    return <GroqLogoIcon className={className} />;
  }
  if (id === "google-gemini" || id === "gemini") {
    return <GeminiLogoIcon className={className} />;
  }
  if (id === "openai") {
    return <OpenAILogoIcon className={className} />;
  }
  if (id === "anthropic") {
    return <AnthropicLogoIcon className={className} />;
  }
  if (id === "openrouter") {
    return <OpenRouterLogoIcon className={className} />;
  }
  if (id === "ollama") {
    return <OllamaLogoIcon className={className} />;
  }
  if (id === "deepseek") {
    return <DeepSeekLogoIcon className={className} />;
  }
  if (id === "perplexity") {
    return <PerplexityLogoIcon className={className} />;
  }
  if (id === "mistral") {
    return <MistralLogoIcon className={className} />;
  }
  if (id === "minimax") {
    return <MiniMaxLogoIcon className={className} />;
  }
  if (id === "xai-grok" || id === "grok") {
    return <GrokLogoIcon className={className} />;
  }
  if (id === "zai") {
    return <ZAILogoIcon className={className} />;
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-xl text-white shadow-sm select-none",
        className,
      )}
    >
      <Bot className="size-4 text-lime-400" />
    </div>
  );
}

export function AIProvidersTab() {
  const {
    providers,
    connections,
    targetSettingsProviderId,
    setTargetSettingsProviderId,
    isLoading,
    error: globalError,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    setDefaultConnection,
    loadModelsForProvider,
  } = useLLM();

  const defaultConn = useMemo(() => connections.find((c) => c.isDefault), [connections]);

  const [selectedProviderId, setSelectedProviderId] = useState<string>(() => {
    return targetSettingsProviderId || "groq";
  });

  useEffect(() => {
    if (targetSettingsProviderId) {
      setSelectedProviderId(targetSettingsProviderId);
      setTargetSettingsProviderId(null);
    }
  }, [targetSettingsProviderId, setTargetSettingsProviderId]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Dynamic Form Values
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [selectedModelInput, setSelectedModelInput] = useState<string>("");
  const [isDefaultInput, setIsDefaultInput] = useState<boolean>(true);
  const [dynamicConfig, setDynamicConfig] = useState<Record<string, any>>({});

  // Models state for current provider
  const [availableModels, setAvailableModels] = useState<ModelDefinition[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [autoDetecting, setAutoDetecting] = useState<boolean>(false);

  // Action states
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message?: string } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Current Provider Definition
  const currentProviderDef = useMemo(() => {
    return providers.find((p) => p.id === selectedProviderId) || providers[0];
  }, [providers, selectedProviderId]);

  // Current User Connection for this provider
  const currentConnection = useMemo(() => {
    return connections.find((c) => c.providerId === selectedProviderId) || null;
  }, [connections, selectedProviderId]);

  // Sync Form State whenever selected provider or connection changes
  useEffect(() => {
    if (currentConnection) {
      setEditingConnectionId(currentConnection.id);
      setSelectedModelInput(currentConnection.selectedModel || "");
      setIsDefaultInput(currentConnection.isDefault);
      setDynamicConfig((currentConnection.config as Record<string, any>) || {});
    } else {
      setEditingConnectionId(null);
      setApiKeyInput("");
      setSelectedModelInput(currentProviderDef?.defaultModels[0]?.id || "");
      setIsDefaultInput(connections.length === 0);

      // Populate default dynamic configs from advanced fields schema
      const initialConfig: Record<string, any> = {};
      currentProviderDef?.advancedFields?.forEach((f) => {
        if (f.defaultValue !== undefined) {
          initialConfig[f.id] = f.defaultValue;
        }
      });
      setDynamicConfig(initialConfig);
    }
    setTestResult(null);
    setShowAdvanced(false);
  }, [selectedProviderId, currentConnection, currentProviderDef, connections.length]);

  // Initial load: prefer default connection if available
  useEffect(() => {
    if (defaultConn && !editingConnectionId) {
      setSelectedProviderId(defaultConn.providerId);
    }
  }, [defaultConn]);

  // Load models whenever selected provider or connection status changes
  useEffect(() => {
    if (!currentProviderDef) return;

    const hasCredentialsConfigured =
      !currentProviderDef.apiKeyRequired || Boolean(currentConnection?.hasApiKey);

    if (!hasCredentialsConfigured) {
      setAvailableModels([]);
      setSelectedModelInput("");
      setLoadingModels(false);
      return;
    }

    let isMounted = true;
    setLoadingModels(true);

    loadModelsForProvider(currentProviderDef.id).then((models) => {
      if (isMounted) {
        setAvailableModels(models);
        if (models.length > 0) {
          setSelectedModelInput((prev) => prev || models[0].id);
        }
        setLoadingModels(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentProviderDef, currentConnection, loadModelsForProvider]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isDropdownOpen]);

  // Handle dropdown outside click
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

  // Filtered providers for search
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

  // Auto-detect Ollama URL
  const handleAutoDetectOllama = async () => {
    setAutoDetecting(true);
    setFeedbackMessage(null);
    const candidateUrls = [
      "http://127.0.0.1:11434",
      "http://localhost:11434",
    ];

    let foundUrl: string | null = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(`${url}/api/tags`, { method: "GET" });
        if (res.ok) {
          foundUrl = url;
          break;
        }
      } catch {
        // try next
      }
    }

    if (foundUrl) {
      setDynamicConfig((prev) => ({ ...prev, baseUrl: foundUrl }));
      setFeedbackMessage({
        type: "success",
        text: `Detected Ollama server at ${foundUrl}`,
      });
      // reload models
      if (currentProviderDef) {
        setLoadingModels(true);
        const models = await loadModelsForProvider(currentProviderDef.id);
        setAvailableModels(models);
        setLoadingModels(false);
      }
    } else {
      setDynamicConfig((prev) => ({ ...prev, baseUrl: "http://127.0.0.1:11434" }));
      setFeedbackMessage({
        type: "error",
        text: "Could not automatically reach local Ollama on 127.0.0.1:11434. Make sure Ollama is running.",
      });
    }
    setAutoDetecting(false);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Handle Save Configuration
  const handleSaveConfiguration = async () => {
    if (!currentProviderDef || saving) return;
    setSaving(true);
    setFeedbackMessage(null);

    try {
      let activeConnId = currentConnection?.id;
      if (currentConnection) {
        await updateConnection(currentConnection.id, {
          apiKey: apiKeyInput.trim() || undefined,
          selectedModel: selectedModelInput,
          config: dynamicConfig,
          isDefault: isDefaultInput,
        });
        setFeedbackMessage({
          type: "success",
          text: `${currentProviderDef.name} configuration saved successfully.`,
        });
      } else {
        const newConn = await createConnection({
          providerId: currentProviderDef.id,
          apiKey: apiKeyInput.trim(),
          selectedModel: selectedModelInput || undefined,
          config: dynamicConfig,
          isDefault: isDefaultInput || connections.length === 0,
        });
        activeConnId = newConn.id;
        setEditingConnectionId(newConn.id);
        setFeedbackMessage({
          type: "success",
          text: `Connected ${currentProviderDef.name} successfully.`,
        });
      }
      setApiKeyInput("");

      // Fetch dynamic models dynamically after saving credentials
      setLoadingModels(true);
      const fetchedModels = await loadModelsForProvider(currentProviderDef.id);
      setAvailableModels(fetchedModels);
      if (fetchedModels.length > 0) {
        const defaultSelected = fetchedModels[0].id;
        setSelectedModelInput(defaultSelected);
        if (activeConnId) {
          await updateConnection(activeConnId, { selectedModel: defaultSelected }).catch(() => null);
        }
      }
      setLoadingModels(false);
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Failed to save provider configuration.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // Handle Test Connection
  const handleTestConnection = async () => {
    if (!currentConnection) {
      setFeedbackMessage({
        type: "error",
        text: "Please save your credentials before testing the connection.",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await testConnection(currentConnection.id);
      setTestResult({ valid: res.valid, message: res.message });
      if (res.valid) {
        setFeedbackMessage({
          type: "success",
          text: `${currentProviderDef.name} connection test passed!`,
        });
      } else {
        setFeedbackMessage({
          type: "error",
          text: res.message || "Invalid credentials or provider unavailable.",
        });
      }
    } catch (err: any) {
      setTestResult({ valid: false, message: err?.message || "Test failed." });
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Connection test failed.",
      });
    } finally {
      setTesting(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!currentConnection || deleting) return;
    setDeleting(true);
    try {
      await deleteConnection(currentConnection.id);
      setApiKeyInput("");
      setEditingConnectionId(null);
      setFeedbackMessage({
        type: "success",
        text: `${currentProviderDef.name} disconnected.`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Failed to disconnect provider.",
      });
    } finally {
      setDeleting(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 w-full" role="status" aria-label="Loading LLM provider settings">
        <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="rounded-2xl border border-zinc-800 bg-[#0C0D0F] p-6 space-y-4">
          <div className="h-14 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-zinc-800/60 rounded-xl animate-pulse" />
            <div className="h-10 bg-zinc-800/60 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const hasAdvanced = (currentProviderDef?.advancedFields?.length || 0) > 0;
  const advancedControlsLabel = currentProviderDef?.advancedControlsLabel || "advanced settings";

  return (
    <div className="w-full space-y-5 select-none max-w-4xl">
      {/* PAGE HEADER */}
      <div className="text-left">
        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          LLM Provider Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Configure your primary AI language model provider and API credentials.
        </p>
      </div>

      {globalError && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-3.5 py-2.5 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-red-400" />
          <span>{globalError}</span>
        </div>
      )}

      {/* MAIN SINGLE CARD: AI PROVIDER SELECTION */}
      <div className="relative rounded-2xl border border-zinc-800/80 bg-[#0B0C0E] p-6 space-y-5 shadow-xl">
        {/* CARD TOP ROW: TITLE & DYNAMIC STATUS BADGE */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-white">AI Provider Selection</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Choose which LLM powers reasoning across ContextIQ workspaces.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Badges */}
            {(() => {
              if (testResult && !testResult.valid) {
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 shadow-sm">
                    <AlertCircle className="size-3.5" />
                    Invalid key
                  </span>
                );
              }
              if (currentConnection) {
                if (currentConnection.status === "error") {
                  return (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 shadow-sm">
                      <AlertCircle className="size-3.5" />
                      Connection error
                    </span>
                  );
                }
                if (currentConnection.status === "active") {
                  return (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-xs font-semibold text-lime-400 shadow-sm">
                      <CheckCircle2 className="size-3.5" />
                      Connected
                    </span>
                  );
                }
              }
              if (currentProviderDef?.apiKeyRequired && !currentConnection?.hasApiKey) {
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400">
                    <span className="size-1.5 rounded-full bg-zinc-500" />
                    Not connected
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-xs font-semibold text-lime-400 shadow-sm">
                  <CheckCircle2 className="size-3.5" />
                  Ready
                </span>
              );
            })()}

            <Button
              type="button"
              onClick={handleSaveConfiguration}
              disabled={saving}
              className="h-8.5 px-4 rounded-xl bg-lime-400 text-zinc-950 hover:bg-lime-300 font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save changes</span>
              )}
            </Button>
          </div>
        </div>

        {/* OFFICIAL DOCUMENTATION & GET API KEY LINKS BAR */}
        <div className="flex items-center justify-between gap-3 text-xs bg-[#111216] border border-zinc-800/80 rounded-xl px-4 py-2.5 flex-wrap">
          <div className="flex items-center gap-4 text-xs">
            {currentProviderDef?.docsUrl && (
              <a
                href={currentProviderDef.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <BookOpen className="size-3.5 text-zinc-500" />
                <span>Official Documentation</span>
              </a>
            )}
            {currentProviderDef?.apiKeyUrl && (
              <a
                href={currentProviderDef.apiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-lime-400 hover:text-lime-300 font-semibold transition-colors cursor-pointer"
              >
                <ExternalLink className="size-3.5 text-lime-500" />
                <span>Get {currentProviderDef.name} API Key</span>
              </a>
            )}
          </div>

          {currentConnection && (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="text-[11px] font-semibold text-zinc-300 hover:text-lime-400 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testing ? (
                <>
                  <LoaderCircle className="size-3 animate-spin text-lime-400" />
                  <span>Validating API Key...</span>
                </>
              ) : (
                <>
                  <RefreshCcw className="size-3 text-zinc-400" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* PROVIDER SELECTOR TRIGGER & DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          {/* Collapsed Trigger Button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={cn(
              "w-full rounded-xl border border-zinc-800/90 bg-[#121316] hover:bg-[#16181C] hover:border-zinc-700/80 p-3.5 flex items-center justify-between transition-all cursor-pointer text-left",
              isDropdownOpen && "border-teal-500/60 ring-1 ring-teal-500/30",
            )}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <ProviderLogoIcon
                id={currentProviderDef?.id || "groq"}
                className="size-10 shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white truncate">
                    {currentProviderDef?.name || "Groq"}
                  </span>
                  {(currentProviderDef?.id === "groq" || currentProviderDef?.id === "openai") && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[9px] font-semibold text-blue-400">
                      ★ Recommended
                    </span>
                  )}
                  {currentConnection?.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-400">
                      <span className="size-1.5 rounded-full bg-teal-400 animate-pulse" />
                      Default
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400 truncate mt-0.5">
                  {currentProviderDef?.description || "Fast inference — recommended for most users."}
                </span>
              </div>
            </div>

            <ChevronsUpDown className="size-4 text-zinc-400 shrink-0 ml-2" />
          </button>

          {/* EXPANDED DROPDOWN POPOVER OVERLAY */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-0 z-40 rounded-2xl border border-teal-500/40 bg-[#0D0E12]/95 shadow-2xl backdrop-blur-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
              {/* Search Bar with Close Button */}
              <div className="relative flex items-center">
                <Search className="absolute left-3 size-4 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search providers..."
                  className="w-full rounded-xl border border-zinc-800 bg-[#14151B] pl-9 pr-9 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="absolute right-2.5 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Providers List */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {filteredProviders.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    No providers found.
                  </div>
                ) : (
                  filteredProviders.map((prov) => {
                    const isSelected = prov.id === selectedProviderId;
                    const isRecommended = prov.id === "groq" || prov.id === "openai";

                    return (
                      <div
                        key={prov.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedProviderId(prov.id);
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedProviderId(prov.id);
                            setIsDropdownOpen(false);
                            setSearchQuery("");
                          }
                        }}
                        className={cn(
                          "group flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all text-left select-none",
                          isSelected
                            ? "border-blue-500/80 bg-[#131B2E] shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                            : "border-zinc-800/60 bg-[#111216] hover:bg-[#161820] hover:border-zinc-700/60",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ProviderLogoIcon id={prov.id} className="size-9 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-white truncate">
                                {prov.name}
                              </span>
                              {isRecommended && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.2 text-[8px] font-semibold text-blue-400">
                                  ★ Recommended
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {prov.description}
                            </span>
                          </div>
                        </div>

                        {isSelected && <Check className="size-4 text-blue-400 shrink-0 ml-2" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* DYNAMIC PRIMARY CONFIGURATION ROW (CREDENTIAL & MODEL) */}
        <div
          className={cn(
            "grid gap-5",
            currentProviderDef?.apiKeyRequired
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-2",
          )}
        >
          {/* Field 1: API Key Field (if provider requires API Key) */}
          {currentProviderDef?.apiKeyRequired && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                <span>{currentProviderDef.apiKeyLabel || `${currentProviderDef.name} API Key`}</span>
                {currentConnection?.hasApiKey && (
                  <span className="text-[10px] text-lime-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="size-2.5" />
                    Configured ({currentConnection.maskedApiKey || "••••••••"})
                  </span>
                )}
              </label>

              <div className="relative flex items-center">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={
                    apiKeyInput ||
                    (showApiKey && currentConnection?.maskedApiKey
                      ? currentConnection.maskedApiKey
                      : "")
                  }
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    currentConnection?.hasApiKey
                      ? currentConnection.maskedApiKey || "••••••••••••••••••••"
                      : currentProviderDef.apiKeyPlaceholder ||
                        `Enter your ${currentProviderDef.name} API Key`
                  }
                  className="w-full rounded-xl border border-zinc-800/90 bg-[#121316] px-3.5 py-2.5 pr-10 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((prev) => !prev)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Field 2: Chat Model Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200">
                {currentProviderDef?.modelFieldLabel || "Chat Model Selection"}
              </label>
              <div className="flex items-center gap-2">
                {loadingModels ? (
                  <span className="text-[10px] text-lime-400 animate-pulse flex items-center gap-1">
                    <LoaderCircle className="size-2.5 animate-spin" />
                    Loading models...
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!currentProviderDef) return;
                      setLoadingModels(true);
                      const models = await loadModelsForProvider(currentProviderDef.id);
                      setAvailableModels(models);
                      setLoadingModels(false);
                    }}
                    className="text-[10px] font-semibold text-lime-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCcw className="size-2.5" />
                    <span>Refresh Models</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative flex items-center">
              {(() => {
                const isConfigured =
                  !currentProviderDef?.apiKeyRequired || Boolean(currentConnection?.hasApiKey);

                return (
                  <select
                    value={selectedModelInput}
                    onChange={async (e) => {
                      const newModel = e.target.value;
                      setSelectedModelInput(newModel);

                      if (currentConnection) {
                        try {
                          await updateConnection(currentConnection.id, {
                            selectedModel: newModel,
                          });
                          setFeedbackMessage({
                            type: "success",
                            text: `Active model updated to ${newModel}`,
                          });
                          setTimeout(() => setFeedbackMessage(null), 3000);
                        } catch (err: any) {
                          setFeedbackMessage({
                            type: "error",
                            text: err?.message || "Failed to update selected model.",
                          });
                        }
                      }
                    }}
                    disabled={!isConfigured || loadingModels}
                    className={cn(
                      "w-full rounded-xl border border-zinc-800/90 bg-[#121316] px-3.5 py-2.5 text-xs font-medium text-white focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 appearance-none transition-all",
                      !isConfigured || loadingModels
                        ? "cursor-not-allowed opacity-60 text-zinc-500"
                        : "cursor-pointer",
                    )}
                  >
                    {!isConfigured ? (
                      <option value="" disabled className="bg-zinc-900 text-amber-400 font-semibold">
                        Enter API Key & Save changes to load models
                      </option>
                    ) : availableModels.length === 0 ? (
                      <option value="" disabled className="bg-zinc-900 text-zinc-500">
                        {currentProviderDef?.modelPlaceholder || "Select a model"}
                      </option>
                    ) : (
                      availableModels.map((model) => (
                        <option key={model.id} value={model.id} className="bg-zinc-900 text-white">
                          {model.name}
                        </option>
                      ))
                    )}
                  </select>
                );
              })()}
              <ChevronDown className="absolute right-3.5 size-4 text-zinc-400 pointer-events-none" />
            </div>

            <p className="text-[10px] text-zinc-500">
              {currentProviderDef?.modelHelperText ||
                `Select the ${currentProviderDef?.name || "AI"} model you want to use for your conversations.`}
            </p>
          </div>
        </div>

        {/* ADVANCED SETTINGS ACCORDION TOGGLE */}
        {hasAdvanced && (
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>
                {showAdvanced ? `Hide ${advancedControlsLabel}` : `Show ${advancedControlsLabel}`}
              </span>
              {showAdvanced ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>

            {/* DYNAMIC ADVANCED FIELDS GRID */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-zinc-800/60 bg-[#0E0F13] p-4 animate-in fade-in duration-150">
                {currentProviderDef?.advancedFields?.map((field) => {
                  const val = dynamicConfig[field.id] ?? field.defaultValue ?? "";

                  return (
                    <div key={field.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                          <span>{field.name}</span>
                          {field.tooltip && (
                            <span title={field.tooltip} className="cursor-help text-zinc-500 hover:text-zinc-400">
                              <HelpCircle className="size-3" />
                            </span>
                          )}
                        </label>

                        {field.hasAutoDetect && (
                          <button
                            type="button"
                            onClick={handleAutoDetectOllama}
                            disabled={autoDetecting}
                            className="rounded-md bg-teal-400/15 text-teal-400 hover:bg-teal-400/25 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                          >
                            {autoDetecting ? (
                              <LoaderCircle className="size-2.5 animate-spin" />
                            ) : null}
                            <span>Auto-Detect</span>
                          </button>
                        )}
                      </div>

                      {field.type === "select" ? (
                        <div className="relative flex items-center">
                          <select
                            value={val}
                            onChange={(e) =>
                              setDynamicConfig((prev) => ({
                                ...prev,
                                [field.id]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-zinc-800 bg-[#121316] px-3 py-2 text-xs font-medium text-white focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/30 cursor-pointer appearance-none"
                          >
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 size-3.5 text-zinc-400 pointer-events-none" />
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          value={val}
                          onChange={(e) =>
                            setDynamicConfig((prev) => ({
                              ...prev,
                              [field.id]:
                                field.type === "number" ? Number(e.target.value) : e.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                          className="w-full rounded-xl border border-zinc-800 bg-[#121316] px-3.5 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK NOTIFICATION */}
        {feedbackMessage && (
          <div
            className={cn(
              "rounded-xl border px-3.5 py-2.5 text-xs flex items-center gap-2 animate-in fade-in duration-200",
              feedbackMessage.type === "success"
                ? "border-teal-500/30 bg-teal-950/20 text-teal-300"
                : "border-red-500/30 bg-red-950/20 text-red-300",
            )}
          >
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0 text-teal-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-red-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* CARD FOOTER: DEFAULT TOGGLE & CONNECTION TESTING */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefaultInput}
              onChange={(e) => setIsDefaultInput(e.target.checked)}
              className="size-3.5 rounded border-zinc-700 bg-zinc-900 text-teal-400 focus:ring-teal-400/30"
            />
            <span className="text-xs text-zinc-300 font-medium">
              Use as default AI provider
            </span>
          </label>

          <div className="flex items-center gap-2">
            {currentConnection && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="h-8 rounded-xl border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                >
                  {testing ? (
                    <span className="flex items-center gap-1.5">
                      <LoaderCircle className="size-3 animate-spin text-teal-400" />
                      Testing...
                    </span>
                  ) : (
                    <span>Test connection</span>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={deleting}
                  className="h-8 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 cursor-pointer"
                >
                  {deleting ? "Disconnecting..." : "Disconnect"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
