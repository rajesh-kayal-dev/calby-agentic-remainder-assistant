"use client";

import ChatPanel from "@/components/dashboard/chat-panel";
import ConnectionsPanel from "@/components/dashboard/connection-panel";
import { UserProfileProvider } from "@/context/user-profile-context";
import { UserPreferencesProvider } from "@/context/user-preferences-context";
import { NotificationProvider } from "@/context/notification-context";
import { LLMProvider } from "@/context/llm-context";
import { useDescope, useSession } from "@descope/nextjs-sdk/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const styles = {
  loadingShell:
    "flex h-svh items-center justify-center bg-zinc-950 text-sm text-zinc-400 selection:bg-lime-400 selection:text-zinc-950",
  shell: "bg-zinc-950 text-zinc-100 min-h-svh",
} as const;

export default function CalendarPage() {
  const sdk = useDescope();
  const router = useRouter();
  const { isAuthenticated, sessionToken } = useSession();
  const [loggingOut, setLoggingout] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingout(true);

    try {
      await sdk.logout();
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setLoggingout(false);
    }
  }

  if (!isAuthenticated || !sessionToken) {
    return <div className={styles.loadingShell}>Checking session...</div>;
  }

  return (
    <UserProfileProvider>
      <UserPreferencesProvider>
        <NotificationProvider>
          <LLMProvider>
            <div className={styles.shell}>
              <ChatPanel
                sessionToken={sessionToken}
                initialView="calendar"
                connections={<ConnectionsPanel sessionToken={sessionToken} />}
                onLogout={handleLogout}
                loggingOut={loggingOut}
              />
            </div>
          </LLMProvider>
        </NotificationProvider>
      </UserPreferencesProvider>
    </UserProfileProvider>
  );
}


