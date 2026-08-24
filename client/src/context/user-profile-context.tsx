"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession, useUser } from "@descope/nextjs-sdk/client";
import { fetchUserProfile, updateUserProfileName, UserProfileData } from "@/lib/user-profile";

interface UserProfileContextType {
  profile: UserProfileData | null;
  isLoading: boolean;
  error: string | null;
  sessionStatus: "Authenticated Session" | "Session Expired" | "Not Authenticated";
  refetchProfile: () => Promise<void>;
  updateName: (newName: string) => Promise<boolean>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, sessionToken, isSessionLoading } = useSession();
  const { user: descopeUser, isUserLoading } = useUser();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const sessionStatus: "Authenticated Session" | "Session Expired" | "Not Authenticated" =
    isAuthenticated && sessionToken
      ? "Authenticated Session"
      : !isSessionLoading && !isAuthenticated
      ? "Not Authenticated"
      : "Session Expired";

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !sessionToken) {
      if (!isSessionLoading) {
        setIsLoading(false);
        setProfile(null);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchUserProfile(sessionToken);
      setProfile(data);
    } catch (err: any) {
      // Fallback: if backend endpoint fails but Descope user exists, resolve name from Descope
      if (descopeUser) {
        const fallbackName = descopeUser.name || descopeUser.email?.split("@")[0] || "User";
        setProfile({
          id: descopeUser.userId || "local",
          authUserId: descopeUser.userId || "local",
          email: descopeUser.email || null,
          name: fallbackName,
          accountType: "Permanent Account",
          sessionStatus: "Authenticated Session",
        });
      } else {
        setError(err?.message || "Unable to load your account.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, sessionToken, isSessionLoading, descopeUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateName = async (newName: string): Promise<boolean> => {
    if (!sessionToken) {
      throw new Error("Unable to update your name. Please try again.");
    }
    try {
      const updated = await updateUserProfileName(sessionToken, newName);
      setProfile((prev) => (prev ? { ...prev, name: updated.name } : updated));
      return true;
    } catch (err) {
      throw err;
    }
  };

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        isLoading: isLoading || isSessionLoading,
        error,
        sessionStatus,
        refetchProfile: loadProfile,
        updateName,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
