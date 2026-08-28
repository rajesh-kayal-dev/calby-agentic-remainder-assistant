"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "@descope/nextjs-sdk/client";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationApi,
  clearAllNotificationsApi,
  NotificationItem,
} from "@/lib/notifications";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotificationItem: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, sessionToken, isSessionLoading } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !sessionToken) {
      if (!isSessionLoading) {
        setIsLoading(false);
      }
      return;
    }

    setError(null);

    try {
      const data = await fetchNotifications(sessionToken);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: any) {
      setError(err?.message || "Couldn't load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, sessionToken, isSessionLoading]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Fast periodic polling for real-time notification updates (every 3 seconds)
  useEffect(() => {
    if (!isAuthenticated || !sessionToken) return;
    const interval = setInterval(() => {
      loadNotifications();
    }, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated, sessionToken, loadNotifications]);

  const markAsRead = async (id: string) => {
    if (!sessionToken) return;
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await markNotificationRead(sessionToken, id);
      setUnreadCount(res.unreadCount);
    } catch {
      // Revert if API fails
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!sessionToken) return;
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const res = await markAllNotificationsRead(sessionToken);
      setUnreadCount(res.unreadCount);
    } catch {
      loadNotifications();
    }
  };

  const deleteNotificationItem = async (id: string) => {
    if (!sessionToken) return;
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await deleteNotificationApi(sessionToken, id);
      setUnreadCount(res.unreadCount);
    } catch {
      loadNotifications();
    }
  };

  const clearAllNotifications = async () => {
    if (!sessionToken) return;
    setNotifications([]);
    setUnreadCount(0);

    try {
      await clearAllNotificationsApi(sessionToken);
    } catch {
      loadNotifications();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading: isLoading || isSessionLoading,
        error,
        refetchNotifications: loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotificationItem,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
