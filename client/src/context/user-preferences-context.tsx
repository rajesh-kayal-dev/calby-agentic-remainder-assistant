"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "@descope/nextjs-sdk/client";
import {
  fetchUserPreferences,
  updateUserPreferences,
  UserPreferencesData,
  ConnectedCalendarItem,
} from "@/lib/user-preferences";

interface UserPreferencesContextType {
  preferences: UserPreferencesData | null;
  calendars: ConnectedCalendarItem[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveSuccess: boolean;
  systemTimezone: string;
  refetchPreferences: () => Promise<void>;
  savePreferences: (newPrefs: UserPreferencesData) => Promise<boolean>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, sessionToken, isSessionLoading } = useSession();
  const [preferences, setPreferences] = useState<UserPreferencesData | null>(null);
  const [calendars, setCalendars] = useState<ConnectedCalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // System Timezone detection
  const systemTimezone = React.useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated || !sessionToken) {
      if (!isSessionLoading) {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchUserPreferences(sessionToken);
      // Fallback timezone to user's system timezone if default UTC returned
      const prefData = data.preferences;
      if (!prefData.timezone || prefData.timezone === "UTC") {
        prefData.timezone = systemTimezone;
      }
      setPreferences(prefData);
      setCalendars(data.calendars || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load preferences");
      // Fallback local defaults
      setPreferences({
        theme: "dark",
        defaultCalendarId: "primary",
        timezone: systemTimezone,
        dateFormat: "DD/MM/YYYY",
        timeFormat: "24h",
        notifications: {
          dailyBriefing: true,
          eventReminder: true,
          reminderMinutes: 10,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, sessionToken, isSessionLoading, systemTimezone]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Apply Theme to document root
  useEffect(() => {
    if (!preferences?.theme) return;
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-midnight", "theme-system");
    if (preferences.theme === "midnight") {
      root.classList.add("theme-midnight");
    } else if (preferences.theme === "system") {
      root.classList.add("theme-system");
    } else {
      root.classList.add("theme-dark");
    }
  }, [preferences?.theme]);

  const savePreferences = async (newPrefs: UserPreferencesData): Promise<boolean> => {
    if (!sessionToken) {
      throw new Error("Unable to save preferences. Session invalid.");
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updated = await updateUserPreferences(sessionToken, newPrefs);
      setPreferences(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return true;
    } catch (err: any) {
      setError(err?.message || "Failed to save preferences. Please try again.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        calendars,
        isLoading: isLoading || isSessionLoading,
        isSaving,
        error,
        saveSuccess,
        systemTimezone,
        refetchPreferences: loadPreferences,
        savePreferences,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
}
