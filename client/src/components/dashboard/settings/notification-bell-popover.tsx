"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Calendar,
  Bot,
  Shield,
  Sparkles,
  AlertCircle,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/context/notification-context";
import { NotificationItem, NotificationType } from "@/lib/notifications";

interface NotificationBellPopoverProps {
  onOpenFullPage?: () => void;
}

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

function formatRelativeTime(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return `${hours}${hours === 1 ? "h" : "h"} ago`;
    }
    if (diffSec < 172800) return "Yesterday";
    const days = Math.floor(diffSec / 86400);
    return `${days}d ago`;
  } catch {
    return "Recently";
  }
}

export function NotificationBellPopover({ onOpenFullPage }: NotificationBellPopoverProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotificationItem,
    clearAllNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Display top 5 recent notifications in popover
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div ref={containerRef} className="relative select-none">
      {/* Header Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-xl border transition-all duration-150 shadow-sm cursor-pointer",
          unreadCount > 0
            ? "border-lime-400/40 bg-zinc-900/90 text-lime-400 hover:bg-zinc-800 hover:border-lime-400/70"
            : "border-zinc-800/90 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white",
          isOpen && "bg-zinc-800 border-lime-400 text-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.25)]",
        )}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
      >
        <Bell className={cn("size-4 transition-transform group-hover:scale-105", unreadCount > 0 ? "text-lime-400" : "text-zinc-300")} />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-lime-400 px-1 text-[10px] font-bold text-zinc-950 shadow-[0_0_10px_rgba(163,230,53,0.9)] animate-in zoom-in-75 duration-150">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Anchored Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[360px] sm:w-[400px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#121214] p-0 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-[#121214]">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Bell className="size-3.5 text-lime-400" />
                <span>Notifications</span>
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full border border-lime-400/40 bg-lime-400/10 px-2 py-0.5 text-[10px] font-bold text-lime-400">
                  {unreadCount} UNREAD
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime-400 hover:text-lime-300 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="size-3.5" />
                  <span>Mark all as read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllNotifications()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="size-3" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>

          {/* Popover Body Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-800/50">
            {isLoading ? (
              /* Loading Skeleton */
              <div className="p-4 space-y-3" role="status" aria-label="Loading notifications">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="size-8 shrink-0 rounded-xl bg-zinc-800/80 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-32 rounded bg-zinc-800/80 animate-pulse" />
                      <div className="h-3 w-48 rounded bg-zinc-800/60 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error && notifications.length === 0 ? (
              /* Error State */
              <div className="p-6 text-center space-y-3">
                <AlertCircle className="size-6 text-red-400 mx-auto" />
                <p className="text-xs font-semibold text-white">Couldn't load notifications</p>
                <button
                  type="button"
                  onClick={() => refetchNotifications()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-lime-400 hover:underline"
                >
                  <RefreshCcw className="size-3" />
                  <span>Retry</span>
                </button>
              </div>
            ) : notifications.length === 0 ? (
              /* Empty State */
              <div className="p-8 text-center space-y-2">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20">
                  <CheckCheck className="size-5" />
                </div>
                <p className="text-xs font-bold text-white">You're all caught up</p>
                <p className="text-[11px] text-zinc-400">No new notifications yet.</p>
              </div>
            ) : (
              /* Notification Items */
              recentNotifications.map((item) => {
                const icon = getNotificationIcon(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.read) markAsRead(item.id);
                    }}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer group border-l-2",
                      !item.read
                        ? "border-l-lime-400 bg-lime-400/5 hover:bg-lime-400/10"
                        : "border-l-transparent bg-transparent hover:bg-zinc-900/60",
                    )}
                  >
                    {/* Type Icon Box */}
                    <div className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-sm mt-0.5",
                      !item.read ? "bg-lime-400/10 border-lime-400/30" : "bg-zinc-900 border-zinc-800/90"
                    )}>
                      {icon}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs truncate leading-tight flex items-center gap-1.5",
                            !item.read
                              ? "font-bold text-white"
                              : "font-semibold text-zinc-300",
                          )}
                        >
                          <span>{item.title}</span>
                        </p>

                        {!item.read && (
                          <span className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded border border-lime-400/30">
                              NEW
                            </span>
                            <span className="size-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.9)]" />
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-normal">
                        {item.message}
                      </p>

                      <p className="text-[10px] text-zinc-500 font-medium pt-0.5">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>

                    {/* Single Item Delete Trash Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotificationItem(item.id);
                      }}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer self-center"
                      title="Delete notification"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
