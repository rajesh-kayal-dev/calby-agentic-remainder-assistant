"use client";

import { useState } from "react";
import {
  Sliders,
  Bot,
  Globe,
  Key,
  Shield,
  User,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GeneralTab } from "./general-tab";
import { AIProvidersTab } from "./ai-providers-tab";
import { ConnectorsTab } from "./connectors-tab";
import { ApiManagementTab } from "./api-management-tab";
import { SecurityTab } from "./security-tab";
import { ProfileModal } from "./profile-modal";
import { AccountPopover } from "./account-popover";

export type SettingsTabId =
  | "general"
  | "ai-providers"
  | "connectors"
  | "api-management"
  | "security"
  | "profile";

interface SettingsViewProps {
  sessionToken: string;
  userLabel: string;
  initialTab?: SettingsTabId;
  onBackToAssistant: () => void;
  onOpenCalendarWorkspace?: () => void;
}

export function SettingsView({
  sessionToken,
  userLabel,
  initialTab = "ai-providers",
  onBackToAssistant,
  onOpenCalendarWorkspace,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentName, setCurrentName] = useState(userLabel || "Rajesh Kayal");

  const NAV_GROUPS = [
    {
      title: "GENERAL",
      items: [
        { id: "general" as SettingsTabId, label: "General", icon: Sliders },
        { id: "ai-providers" as SettingsTabId, label: "AI Providers", icon: Bot },
        { id: "connectors" as SettingsTabId, label: "Connectors", icon: Globe },
        { id: "api-management" as SettingsTabId, label: "API Management", icon: Key },
        { id: "security" as SettingsTabId, label: "Security", icon: Shield },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { id: "profile" as SettingsTabId, label: "Profile", icon: User },
      ],
    },
  ];

  const handleNavClick = (tabId: SettingsTabId) => {
    if (tabId === "profile") {
      setIsProfileModalOpen(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const initialInitial = currentName ? currentName.charAt(0).toUpperCase() : "R";

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-[#08090A] text-zinc-100 overflow-hidden select-none">
      {/* GLOBAL CALBY HEADER */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 sm:px-6 bg-[#08090A]/95 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToAssistant}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="flex size-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
              <img
                src="/logo.png"
                alt="Calby Logo"
                className="size-6 object-contain"
                onError={(e) => {
                  // Fallback green badge if logo image not found
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.className =
                      "flex size-8 items-center justify-center rounded-xl bg-lime-400 text-zinc-950 font-bold shadow-[0_0_12px_rgba(163,230,53,0.3)]";
                    e.currentTarget.parentElement.innerText = "C";
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white group-hover:text-lime-400 transition-colors">
                  Calby
                </span>
                <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-lime-400 uppercase tracking-widest">
                  SETTINGS
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToAssistant}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer px-2 py-1"
          >
            <ChevronLeft className="size-4 text-zinc-400" />
            <span>Home</span>
          </button>
        </div>
      </header>

      {/* FULL-HEIGHT SETTINGS WORKSPACE */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-[#08090A]">
        {/* FIXED LEFT SETTINGS NAVIGATION SIDEBAR */}
        <aside className="w-56 sm:w-64 shrink-0 border-r border-zinc-800/80 bg-[#08090A] p-4 flex flex-col justify-between overflow-y-auto select-none">
          {/* Top Nav Items */}
          <div className="space-y-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3">
                  {group.title}
                </span>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 text-left select-none cursor-pointer",
                          isActive
                            ? "bg-zinc-800/90 text-lime-400 border border-zinc-700/80 shadow-sm"
                            : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
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
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Account Profile Control (Matching Reference Image 2) */}
          <div className="pt-4 border-t border-zinc-800/80">
            <AccountPopover
              userLabel={currentName}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenSettings={() => setActiveTab("general")}
              onLogout={onBackToAssistant}
            />
          </div>
        </aside>

        {/* MAIN SETTINGS CONTENT WORKSPACE */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#08090A] p-6 sm:p-8 space-y-6 max-w-[1150px] mx-auto">
          {/* Main Settings Header */}
          <div className="pb-4 border-b border-zinc-800/80">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Settings
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your account, AI providers, connectors, and security.
            </p>
          </div>

          {/* Active Settings Section */}
          <div className="pt-2">
            {activeTab === "general" && <GeneralTab />}
            {activeTab === "ai-providers" && <AIProvidersTab />}
            {activeTab === "connectors" && (
              <ConnectorsTab
                sessionToken={sessionToken}
                onOpenWorkspace={onOpenCalendarWorkspace}
              />
            )}
            {activeTab === "api-management" && <ApiManagementTab />}
            {activeTab === "security" && <SecurityTab />}
          </div>
        </main>
      </div>

      {/* Profile Details Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userLabel={currentName}
        onUpdateName={(name) => setCurrentName(name)}
      />
    </div>
  );
}
