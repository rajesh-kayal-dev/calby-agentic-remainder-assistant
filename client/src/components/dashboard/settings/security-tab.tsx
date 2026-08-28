"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Monitor,
  Lock,
  LogOut,
  Check,
  Download,
  Trash2,
  AlertTriangle,
  Globe,
  LoaderCircle,
  X,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, useUser, useDescope } from "@descope/nextjs-sdk/client";
import {
  fetchCalendarConnection,
  fetchTelegramStatusApi,
  fetchWhatsAppStatusApi,
  disconnectTelegramApi,
  disconnectWhatsAppApi,
} from "@/lib/connections";
import { apiFetch } from "@/lib/api";

interface ConnectedIntegration {
  id: "google" | "telegram" | "whatsapp";
  name: string;
  status: "connected" | "disconnected";
  connectedAccount?: string | null;
}

export function SecurityTab() {
  const { sessionToken } = useSession();
  const { user } = useUser();
  const { logout } = useDescope();

  const [signedOutOther, setSignedOutOther] = useState(false);
  const [integrations, setIntegrations] = useState<ConnectedIntegration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  // Modals
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<"telegram" | "whatsapp" | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const [exportingData, setExportingData] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Device Info parsing
  const deviceDetails = useMemo(() => {
    if (typeof window === "undefined") return { os: "Desktop", browser: "Browser" };
    const ua = navigator.userAgent;
    let os = "Desktop";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    let browser = "Browser";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";

    return { os, browser };
  }, []);

  const loadIntegrations = async () => {
    if (!sessionToken) return;
    setLoadingIntegrations(true);
    try {
      const [calConn, tgConn, waConn] = await Promise.allSettled([
        fetchCalendarConnection(sessionToken),
        fetchTelegramStatusApi(sessionToken),
        fetchWhatsAppStatusApi(sessionToken),
      ]);

      const items: ConnectedIntegration[] = [];

      // Google Calendar
      const isCalConnected = calConn.status === "fulfilled" && calConn.value?.status === "connected";
      items.push({
        id: "google",
        name: "Google Calendar & Workspace",
        status: isCalConnected ? "connected" : "disconnected",
        connectedAccount: isCalConnected ? (user?.email || "Primary Account") : null,
      });

      // Telegram
      const isTgConnected = tgConn.status === "fulfilled" && tgConn.value?.connection?.connected;
      items.push({
        id: "telegram",
        name: "Telegram Bot Notifications",
        status: isTgConnected ? "connected" : "disconnected",
        connectedAccount: isTgConnected ? tgConn.value.connection.username : null,
      });

      // WhatsApp
      const isWaConnected = waConn.status === "fulfilled" && waConn.value?.connection?.connected;
      items.push({
        id: "whatsapp",
        name: "WhatsApp Business Notifications",
        status: isWaConnected ? "connected" : "disconnected",
        connectedAccount: isWaConnected ? waConn.value.connection.displayPhoneNumber : null,
      });

      setIntegrations(items);
    } catch {
      setIntegrations([]);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, [sessionToken]);

  const handleSignOutOther = () => {
    setSignedOutOther(true);
    setTimeout(() => setSignedOutOther(false), 4000);
  };

  const handleConfirmDisconnect = async () => {
    if (!sessionToken || !disconnectTarget) return;
    setDisconnecting(true);
    try {
      if (disconnectTarget === "telegram") {
        await disconnectTelegramApi(sessionToken);
      } else if (disconnectTarget === "whatsapp") {
        await disconnectWhatsAppApi(sessionToken);
      }
      await loadIntegrations();
      setDisconnectModalOpen(false);
      setDisconnectTarget(null);
    } catch (err: any) {
      setError(err?.message || "Failed to disconnect integration");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleExportData = async () => {
    if (!sessionToken || exportingData) return;
    setExportingData(true);
    setError(null);
    try {
      const data = await apiFetch<any>("/api/user/export-data", { token: sessionToken });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `calby-user-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Failed to export user data");
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== "DELETE" || !sessionToken) return;
    setDeletingAccount(true);
    setError(null);
    try {
      await apiFetch<{ success: boolean }>("/api/user/account", {
        method: "DELETE",
        token: sessionToken,
      });
      logout();
    } catch (err: any) {
      setError(err?.message || "Failed to delete account");
      setDeletingAccount(false);
    }
  };

  const userEmail = user?.email || user?.name || "Authenticated User";

  return (
    <div className="space-y-6 w-full select-none max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            Security & Privacy
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your account security, active sessions, connected integrations, and data privacy.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Security Status Area */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-lime-400" />
          <span>Security Status</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-zinc-800/90 bg-[#12131A] p-4 flex items-center gap-3 shadow-md">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
              <Mail className="size-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{userEmail}</h4>
              <p className="text-[11px] text-zinc-400">Verified Primary Account</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/90 bg-[#12131A] p-4 flex items-center gap-3 shadow-md">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Lock className="size-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white">Authenticated Session</h4>
              <p className="text-[11px] text-zinc-400">HTTPS Transport Encryption</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Sessions Area */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Monitor className="size-3.5 text-lime-400" />
            <span>Active Sessions</span>
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOutOther}
            className="h-7 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-semibold px-3 cursor-pointer"
          >
            <LogOut className="size-3 mr-1 text-rose-400" />
            <span>Sign Out Other Sessions</span>
          </Button>
        </div>

        {signedOutOther && (
          <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs font-medium text-lime-400 flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="size-4 shrink-0 stroke-[3]" />
            <span>Successfully signed out all other sessions.</span>
          </div>
        )}

        <div className="rounded-2xl border border-zinc-800/90 bg-[#12131A] p-4 space-y-3 shadow-md">
          {/* Current Device Item */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
                <Monitor className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  {deviceDetails.os} · {deviceDetails.browser}
                  <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-[10px] font-bold text-lime-400 uppercase tracking-wider">
                    Current Device
                  </span>
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Active now · Primary authenticated token
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Connected Accounts Area */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Globe className="size-3.5 text-lime-400" />
          <span>Connected Integrations</span>
        </h3>

        <div className="rounded-2xl border border-zinc-800/90 bg-[#12131A] p-4 space-y-2.5 shadow-md">
          {loadingIntegrations ? (
            <div className="text-xs text-zinc-400 py-3 text-center animate-pulse">
              Loading integration status...
            </div>
          ) : integrations.length === 0 ? (
            <div className="text-xs text-zinc-400 py-3 text-center">
              No integrations connected yet.
            </div>
          ) : (
            integrations.map((conn) => {
              const isConnected = conn.status === "connected";
              const canDisconnect = conn.id === "telegram" || conn.id === "whatsapp";

              return (
                <div
                  key={conn.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                      <Globe className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{conn.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        {isConnected
                          ? `Connected ${conn.connectedAccount ? `(${conn.connectedAccount})` : ""}`
                          : "Not connected"}
                      </p>
                    </div>
                  </div>

                  {isConnected && canDisconnect ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDisconnectTarget(conn.id as any);
                        setDisconnectModalOpen(true);
                      }}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-black transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <span
                      className={`text-[11px] font-semibold ${
                        isConnected ? "text-lime-400" : "text-zinc-500"
                      }`}
                    >
                      {isConnected ? "Connected" : "Not Connected"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Danger Zone Area */}
      <div className="space-y-3 pt-4 border-t border-zinc-800/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" />
          <span>Danger Zone</span>
        </h3>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
          {/* Data Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
            <div>
              <p className="text-xs font-bold text-white">Export Your Account Data</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Download a JSON copy of your events, tasks, reminders, contacts, and money ledger entries.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleExportData}
              disabled={exportingData}
              className="h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 font-semibold text-xs px-3.5 shrink-0 cursor-pointer shadow-sm"
            >
              {exportingData ? (
                <LoaderCircle className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <Download className="size-3.5 mr-1.5 text-lime-400" />
              )}
              <span>{exportingData ? "Exporting..." : "Export Data"}</span>
            </Button>
          </div>

          {/* Account Deletion */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-xs font-bold text-rose-400">Permanently Delete Account</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Once deleted, your account and all associated data will be permanently removed.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-black font-bold text-xs px-3.5 shrink-0 cursor-pointer transition-colors shadow-sm"
            >
              <Trash2 className="size-3.5 mr-1.5" />
              <span>Delete Account</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {disconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#12131A] p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white">Confirm Disconnect</h3>
              <button
                onClick={() => setDisconnectModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Are you sure you want to disconnect this integration? Calby will no longer sync updates with this provider until re-connected.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                disabled={disconnecting}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-black hover:bg-rose-400 disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#12131A] p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="size-4" />
                Delete Calby Account
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This action is permanent and cannot be undone. All your calendar events, tasks, reminders, contacts, and financial ledger data will be erased immediately.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Type <span className="text-rose-400 font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.trim() !== "DELETE" || deletingAccount}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-black hover:bg-rose-400 disabled:opacity-30 cursor-pointer"
              >
                {deletingAccount ? "Deleting Account..." : "Permanently Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
