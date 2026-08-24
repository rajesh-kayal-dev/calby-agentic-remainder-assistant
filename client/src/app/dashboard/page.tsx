"use client";

import ChatPanel from "@/components/dashboard/chat-panel";
import ConnectionsPanel from "@/components/dashboard/connection-panel";
import { Button } from "@/components/ui/button";
import { useDescope, useSession, useUser } from "@descope/nextjs-sdk/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const styles = {
  loadingShell:
    "flex h-svh items-center justify-center bg-zinc-950 text-sm text-zinc-400 selection:bg-lime-400 selection:text-zinc-950",
  shell: "bg-zinc-950 text-zinc-100 min-h-svh",
  userLabel: "mb-2 truncate px-1 text-xs font-medium text-zinc-400",
  logoutBtn:
    "w-full justify-start gap-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors text-xs font-medium",
  logoutIcon: "size-3.5 text-zinc-500",
} as const;

function DashboardPage() {
  const sdk = useDescope();
  const router = useRouter();
  const { isAuthenticated, sessionToken } = useSession();
  const { user, isUserLoading } = useUser();
  const [loggingOut, setLoggingout] = useState(false);

  const label = user?.email || user?.name || "Signed in User";

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
    <div className={styles.shell}>
      <ChatPanel
        sessionToken={sessionToken}
        userLabel={isUserLoading ? "Loading..." : label}
        footer={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200">
                {label.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white leading-tight">
                  {isUserLoading ? "Loading..." : label}
                </p>
                <p className="text-[11px] text-zinc-500 truncate">Account</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors text-xs font-medium"
              disabled={loggingOut}
              onClick={() => handleLogout()}
            >
              <LogOut className="size-3.5 text-zinc-500" />
              {loggingOut ? "Logging out..." : "Log out"}
            </Button>
          </div>
        }
      />
    </div>
  );
}

export default DashboardPage;
