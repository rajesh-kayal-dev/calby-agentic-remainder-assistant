"use client";

import { useState, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Calendar,
  Bot,
  Shield,
  Sparkles,
  Check,
  Trash2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/notification-context";
import { NotificationItem, NotificationType } from "@/lib/notifications";

type FilterCategory = "ALL" | "UNREAD" | "CALENDAR" | "AI" | "SECURITY" | "SYSTEM";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "CALENDAR_REMINDER":
    case "CALENDAR_CONNECTED":
    case "EVENT_CREATED":
    case "EVENT_UPDATED":
    case "EVENT_CANCELLED":
      return <Calendar className="size-4 text-lime-400" />;
    case "AI_PROVIDER_UPDATED":
      return <Bot className="size-4 text-lime-400" />;
    case "SECURITY":
      return <Shield className="size-4 text-amber-400" />;
    case "SYSTEM":
    default:
      return <Sparkles className="size-4 text-lime-400" />;
  }
}

function formatFormattedTime(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function getTimeGroup(dateIso: string): "Today" | "Yesterday" | "Older" {
  try {
    const d = new Date(dateIso);
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    const itemTime = d.getTime();
    if (itemTime >= todayStart) return "Today";
    if (itemTime >= yesterdayStart) return "Yesterday";
    return "Older";
  } catch {
    return "Older";
  }
}

export function NotificationsTab() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotificationItem,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterCategory>("ALL");

  // Filter items
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === "UNREAD") return !n.read;
      if (activeFilter === "CALENDAR")
        return n.type.startsWith("CALENDAR_") || n.type.startsWith("EVENT_");
      if (activeFilter === "AI") return n.type === "AI_PROVIDER_UPDATED";
      if (activeFilter === "SECURITY") return n.type === "SECURITY";
      if (activeFilter === "SYSTEM") return n.type === "SYSTEM";
      return true; // ALL
    });
  }, [notifications, activeFilter]);

  // Group items by Today, Yesterday, Older
  const groupedNotifications = useMemo(() => {
    const groups: { Today: NotificationItem[]; Yesterday: NotificationItem[]; Older: NotificationItem[] } = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    for (const item of filteredNotifications) {
      const group = getTimeGroup(item.createdAt);
      groups[group].push(item);
    }

    return groups;
  }, [filteredNotifications]);

  const FILTER_PILLS: Array<{ id: FilterCategory; label: string }> = [
    { id: "ALL", label: "All" },
    { id: "UNREAD", label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}` },
    { id: "CALENDAR", label: "Calendar" },
    { id: "AI", label: "AI" },
    { id: "SECURITY", label: "Security" },
    { id: "SYSTEM", label: "System" },
  ];

  return (
    <div className="space-y-6 max-w-4xl select-none">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-md border border-lime-400/40 bg-lime-400/10 px-2 py-0.5 text-xs font-bold text-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.15)]">
                {unreadCount} UNREAD
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            View and manage your notification history.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            onClick={() => markAllAsRead()}
            className="h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs px-3.5 inline-flex items-center gap-1.5 shadow-[0_0_12px_rgba(163,230,53,0.25)]"
          >
            <CheckCheck className="size-4" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-zinc-800/80">
        <Filter className="size-3.5 text-zinc-500 mr-1" />
        {FILTER_PILLS.map((pill) => {
          const active = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setActiveFilter(pill.id)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                active
                  ? "border-lime-400 bg-lime-400/10 text-lime-400 shadow-sm"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              )}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List Grouped by Date */}
      {isLoading ? (
        <div className="space-y-4" role="status" aria-label="Loading notifications list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-zinc-900/50 animate-pulse border border-zinc-800/80" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-10 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20">
            <CheckCheck className="size-6" />
          </div>
          <p className="text-sm font-bold text-white">No notifications found</p>
          <p className="text-xs text-zinc-400">
            {activeFilter === "ALL"
              ? "You're all caught up! No notifications in history."
              : `No notifications match the filter "${activeFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["Today", "Yesterday", "Older"] as const).map((groupName) => {
            const items = groupedNotifications[groupName];
            if (items.length === 0) return null;

            return (
              <div key={groupName} className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1 flex items-center gap-1.5">
                  <span>{groupName}</span>
                </span>

                <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] divide-y divide-zinc-800/60 overflow-hidden shadow-sm">
                  {items.map((item) => {
                    const icon = getNotificationIcon(item.type);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start justify-between gap-4 p-4 transition-colors group border-l-2",
                          !item.read
                            ? "border-l-lime-400 bg-lime-400/5 hover:bg-lime-400/10"
                            : "border-l-transparent bg-transparent hover:bg-zinc-900/50",
                        )}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-sm mt-0.5",
                            !item.read ? "bg-lime-400/10 border-lime-400/30" : "bg-zinc-900 border-zinc-800"
                          )}>
                            {icon}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  "text-sm leading-tight truncate",
                                  !item.read
                                    ? "font-bold text-white"
                                    : "font-semibold text-zinc-300",
                                )}
                              >
                                {item.title}
                              </p>

                              {!item.read && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded border border-lime-400/30">
                                    UNREAD
                                  </span>
                                  <span className="size-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.9)]" />
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {item.message}
                            </p>

                            <p className="text-[11px] text-zinc-500 font-medium">
                              {formatFormattedTime(item.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Row Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          {!item.read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(item.id)}
                              className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-lime-400/10 hover:text-lime-400 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="size-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteNotificationItem(item.id)}
                            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
