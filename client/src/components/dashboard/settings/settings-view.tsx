"use client";

import { useState } from "react";
import {
  Sliders,
  Bot,
  Link as LinkIcon,
  Users,
  Bell,
  Shield,
  CreditCard,
  Receipt,
  Database,
  Lightbulb,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneralTab } from "./general-tab";
import { NotificationsTab } from "./notifications-tab";
import { AIProvidersTab } from "./ai-providers-tab";
import { ConnectorsTab } from "./connectors-tab";
import { ContactsTab } from "./contacts-tab";
import { SubscriptionTab } from "./subscription-tab";
import { BillingTab } from "./billing-tab";
import { StorageTab } from "./storage-tab";
import { ApiManagementTab } from "./api-management-tab";
import { SecurityTab } from "./security-tab";
import { ProfileModal } from "./profile-modal";
import { AccountPopover } from "./account-popover";
import { useUserProfile } from "@/context/user-profile-context";

export type SettingsTabId =
  | "general"
  | "ai-providers"
  | "connectors"
  | "contacts"
  | "alerts"
  | "notifications"
  | "security"
  | "subscription"
  | "billing"
  | "storage";

interface SettingsViewProps {
  sessionToken: string;
  userLabel: string;
  initialTab?: SettingsTabId;
  onBackToAssistant: () => void;
  onNavigateToChat?: (provider?: string) => void;
  onOpenCalendarWorkspace?: () => void;
}

export function SettingsView({
  sessionToken,
  userLabel,
  initialTab = "connectors",
  onBackToAssistant,
  onNavigateToChat,
  onOpenCalendarWorkspace,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("calby_settings_tab");
      if (savedTab) return savedTab as SettingsTabId;
    }
    return initialTab;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const { profile } = useUserProfile();
  const currentName = profile?.name || userLabel || "";

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      localStorage.setItem("calby_settings_tab", tabId);
    }
  };

  const NAV_ITEMS = [
    { id: "general" as SettingsTabId, label: "General", icon: Sliders },
    { id: "ai-providers" as SettingsTabId, label: "AI Providers", icon: Bot },
    { id: "connectors" as SettingsTabId, label: "Connectors", icon: LinkIcon },
    { id: "contacts" as SettingsTabId, label: "Contacts", icon: Users },
    { id: "alerts" as SettingsTabId, label: "Alerts", icon: Bell },
    { id: "security" as SettingsTabId, label: "Security & Privacy", icon: Shield },
    { id: "subscription" as SettingsTabId, label: "Subscription", icon: CreditCard },
    { id: "billing" as SettingsTabId, label: "Billing", icon: Receipt },
    { id: "storage" as SettingsTabId, label: "Data & Storage", icon: Database },
  ];

  return (
    <div className="flex h-svh w-full bg-[#08090a] text-zinc-100 overflow-hidden select-none">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-60 sm:w-64 shrink-0 border-r border-zinc-800/80 bg-[#08090a] p-4 sm:p-5 flex flex-col justify-between overflow-y-auto select-none">
        <div className="space-y-6">
          {/* Brand Logo & Name (Uses Official Calby Logo Image) */}
          <div className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              onClick={onBackToAssistant}
              className="flex items-center gap-3 cursor-pointer group text-left"
            >
              <img
                src="/logo.png"
                alt="Calby Logo"
                className="size-8 shrink-0 object-contain group-hover:scale-105 transition-transform"
                onError={(e) => {
                  // Fallback green circle C if image fails
                  e.currentTarget.style.display = "none";
                  const fallback = document.createElement("div");
                  fallback.className =
                    "flex size-8 shrink-0 items-center justify-center rounded-full bg-[#a3e635] text-zinc-950 font-extrabold text-base shadow-[0_0_15px_rgba(163,230,53,0.4)]";
                  fallback.innerText = "C";
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.insertBefore(fallback, e.currentTarget);
                  }
                }}
              />
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#a3e635] transition-colors">
                Calby
              </span>
            </button>

            <button
              type="button"
              onClick={onBackToAssistant}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Return to Assistant"
            >
              <ArrowLeft className="size-4 text-zinc-500 hover:text-zinc-300" />
            </button>
          </div>

          {/* Navigation Items Stack */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 text-left cursor-pointer",
                    isActive
                      ? "border border-lime-400 text-lime-400 bg-lime-400/5 shadow-[0_0_12px_rgba(163,230,53,0.08)]"
                      : "border border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive ? "text-lime-400" : "text-zinc-400"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Help Box & Profile */}
        <div className="pt-4 space-y-3">
          <div
            onClick={() => setHelpModalOpen(true)}
            className="rounded-2xl border border-zinc-800/80 bg-[#111215] p-3 flex items-center justify-between cursor-pointer hover:border-zinc-700/80 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/80 text-lime-400 text-xs font-bold">
                ?
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">Need help?</div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                  We&apos;re here to help you
                </div>
              </div>
            </div>
            <ChevronRight className="size-4 text-zinc-500 shrink-0" />
          </div>

          <AccountPopover
            userLabel={currentName}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenSettings={() => handleTabChange("general")}
            onLogout={onBackToAssistant}
          />
        </div>
      </aside>

      {/* MAIN SETTINGS WORKSPACE */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#08090a] p-5 sm:p-8">
        {activeTab === "connectors" && (
          <ConnectorsTab
            sessionToken={sessionToken}
            onOpenWorkspace={onOpenCalendarWorkspace}
            onNavigateToChat={onNavigateToChat}
          />
        )}
        {activeTab === "subscription" && (
          <SubscriptionTab onBackToDashboard={onBackToAssistant} />
        )}
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "storage" && <StorageTab />}
        {activeTab === "contacts" && <ContactsTab sessionToken={sessionToken} />}
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "ai-providers" && <AIProvidersTab />}
        {(activeTab === "alerts" || activeTab === "notifications") && <NotificationsTab />}
        {activeTab === "security" && <SecurityTab />}
      </main>

      {/* HELP MODAL */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0d0e11] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Lightbulb className="size-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Calby Support</h3>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Need assistance with your subscription, billing, storage, or integrations? Our support team is available 24/7.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHelpModalOpen(false)}
                className="rounded-full bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs px-5 py-1.5 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Details Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
