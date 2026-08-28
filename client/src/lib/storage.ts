import { apiFetch } from "./api";

export type StorageCategory = {
  id: string;
  label: string;
  bytes: number;
  formattedSize: string;
  percentage: number;
};

export type StorageStats = {
  totalUsedBytes: number;
  formattedUsed: string;
  storageLimitBytes: number;
  formattedLimit: string;
  remainingBytes: number;
  formattedRemaining: string;
  usagePercentage: number;
  isHighUsage: boolean;
  categories: StorageCategory[];
};

export async function fetchUserStorageApi(token: string): Promise<StorageStats> {
  const res = await apiFetch<{ success: boolean; stats: StorageStats }>("/api/user/storage", {
    token,
  });
  return res.stats;
}

export async function clearServerCacheApi(token: string): Promise<boolean> {
  const res = await apiFetch<{ success: boolean }>("/api/user/clear-cache", {
    method: "POST",
    token,
  });
  return res.success;
}
