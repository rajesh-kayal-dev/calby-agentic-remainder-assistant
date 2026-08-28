"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "@descope/nextjs-sdk/client";
import {
  fetchLLMProviders,
  fetchLLMProviderModels,
  fetchLLMConnections,
  createLLMConnectionApi,
  updateLLMConnectionApi,
  deleteLLMConnectionApi,
  testLLMConnectionApi,
  setDefaultLLMConnectionApi,
  DEFAULT_LLM_PROVIDERS,
  LLMProviderDefinition,
  UserLLMConnectionDTO,
  ModelDefinition,
} from "@/lib/llm";

interface ActiveLLMSelection {
  providerId: string;
  model: string;
}

interface LLMContextType {
  providers: LLMProviderDefinition[];
  connections: UserLLMConnectionDTO[];
  defaultConnection: UserLLMConnectionDTO | null;
  activeLLM: ActiveLLMSelection | null;
  setActiveLLM: (val: ActiveLLMSelection | null) => void;
  targetSettingsProviderId: string | null;
  setTargetSettingsProviderId: (id: string | null) => void;
  isLoading: boolean;
  error: string | null;
  refetchAll: () => Promise<void>;
  createConnection: (data: {
    providerId: string;
    apiKey?: string;
    selectedModel?: string;
    config?: Record<string, unknown>;
    isDefault?: boolean;
  }) => Promise<UserLLMConnectionDTO>;
  updateConnection: (
    id: string,
    data: {
      apiKey?: string;
      selectedModel?: string;
      config?: Record<string, unknown>;
      isDefault?: boolean;
    },
  ) => Promise<UserLLMConnectionDTO>;
  deleteConnection: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<{ valid: boolean; message: string }>;
  setDefaultConnection: (id: string) => Promise<void>;
  loadModelsForProvider: (providerId: string) => Promise<ModelDefinition[]>;
}

const LLMContext = createContext<LLMContextType | undefined>(undefined);

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, sessionToken } = useSession();

  const [providers, setProviders] = useState<LLMProviderDefinition[]>(DEFAULT_LLM_PROVIDERS);
  const [connections, setConnections] = useState<UserLLMConnectionDTO[]>([]);
  const [activeLLM, setActiveLLM] = useState<ActiveLLMSelection | null>(null);
  const [targetSettingsProviderId, setTargetSettingsProviderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Unconditionally fetch public provider definitions on initial mount
  useEffect(() => {
    fetchLLMProviders()
      .then((res) => {
        if (res.providers && res.providers.length > 0) {
          setProviders(res.providers);
        }
      })
      .catch((err) => {
        console.warn("Failed to load public LLM providers on mount:", err?.message);
      });
  }, []);

  // 2. Load authenticated connections safely
  const loadData = useCallback(
    async (isSilent = false) => {
      if (!isSilent && providers.length === 0) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const provRes = await fetchLLMProviders(sessionToken || undefined).catch(() => null);
        if (provRes?.providers && provRes.providers.length > 0) {
          setProviders(provRes.providers);
        }

        if (isAuthenticated && sessionToken) {
          try {
            const connRes = await fetchLLMConnections(sessionToken);
            const userConns = connRes.connections || [];
            setConnections(userConns);

            if (userConns.length > 0) {
              const defConn = userConns.find((c) => c.isDefault) || userConns[0];
              const provDef = (provRes?.providers || providers)?.find((p) => p.id === defConn.providerId);
              const modelId = defConn.selectedModel || provDef?.defaultModels[0]?.id || "default";

              setActiveLLM((prev) => {
                if (!prev) {
                  return { providerId: defConn.providerId, model: modelId };
                }
                return prev;
              });
            }
          } catch (connErr: any) {
            console.warn("Could not fetch user LLM connections:", connErr?.message);
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load LLM providers.");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, sessionToken, providers.length],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const defaultConnection = useMemo(() => {
    return connections.find((c) => c.isDefault) || connections[0] || null;
  }, [connections]);

  const createConnection = async (data: {
    providerId: string;
    apiKey?: string;
    selectedModel?: string;
    config?: Record<string, unknown>;
    isDefault?: boolean;
  }) => {
    if (!sessionToken) throw new Error("Not authenticated");
    const res = await createLLMConnectionApi(sessionToken, data);
    await loadData(true);
    if (data.isDefault || !activeLLM) {
      setActiveLLM({
        providerId: res.connection.providerId,
        model: res.connection.selectedModel || "default",
      });
    }
    return res.connection;
  };

  const updateConnection = async (
    id: string,
    data: {
      apiKey?: string;
      selectedModel?: string;
      config?: Record<string, unknown>;
      isDefault?: boolean;
    },
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");
    const res = await updateLLMConnectionApi(sessionToken, id, data);
    await loadData(true);
    if (activeLLM?.providerId === res.connection.providerId && data.selectedModel) {
      setActiveLLM({
        providerId: res.connection.providerId,
        model: data.selectedModel,
      });
    }
    return res.connection;
  };

  const deleteConnection = async (id: string) => {
    if (!sessionToken) throw new Error("Not authenticated");
    await deleteLLMConnectionApi(sessionToken, id);
    await loadData(true);
  };

  const testConnection = async (id: string): Promise<{ valid: boolean; message: string }> => {
    if (!sessionToken) throw new Error("Not authenticated");
    const res = await testLLMConnectionApi(sessionToken, id);
    await loadData(true);
    return {
      valid: res.status === "active",
      message: res.message,
    };
  };

  const setDefaultConnection = async (id: string) => {
    if (!sessionToken) throw new Error("Not authenticated");
    await setDefaultLLMConnectionApi(sessionToken, id);
    await loadData(true);
  };

  const loadModelsForProvider = useCallback(
    async (providerId: string): Promise<ModelDefinition[]> => {
      if (!sessionToken) {
        const prov = providers.find((p) => p.id === providerId);
        return prov?.defaultModels || [];
      }
      try {
        const res = await fetchLLMProviderModels(sessionToken, providerId);
        return res.models || [];
      } catch {
        const prov = providers.find((p) => p.id === providerId);
        return prov?.defaultModels || [];
      }
    },
    [sessionToken, providers],
  );

  const value = {
    providers,
    connections,
    defaultConnection,
    activeLLM,
    setActiveLLM,
    targetSettingsProviderId,
    setTargetSettingsProviderId,
    isLoading,
    error,
    refetchAll: loadData,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    setDefaultConnection,
    loadModelsForProvider,
  };

  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>;
}

export function useLLM() {
  const context = useContext(LLMContext);
  if (!context) {
    throw new Error("useLLM must be used within an LLMProvider");
  }
  return context;
}
