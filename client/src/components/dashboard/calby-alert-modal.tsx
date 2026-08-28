"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Square,
  Sparkles,
  Tag,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { playAlarmSound, stopAlarmSound } from "@/lib/alert-sound";
import { snoozeReminderApi, completeReminderApi } from "@/lib/reminders";
import { NotificationItem } from "@/lib/notifications";
import { useNotifications } from "@/context/notification-context";
import { useUserPreferences } from "@/context/user-preferences-context";

interface CalbyAlertModalProps {
  sessionToken: string;
}

interface ActiveAlertItem {
  id: string; // notification ID
  reminderId?: string;
  taskId?: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

function isWithinQuietHours(startStr?: string, endStr?: string): boolean {
  if (!startStr || !endStr) return false;
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range (e.g., 22:00 to 07:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch {
    return false;
  }
}

// Track alerts we've already sounded during this session
const seenAlertIds = new Set<string>();

export function CalbyAlertModal({ sessionToken }: CalbyAlertModalProps) {
  const { notifications, markAsRead, refetchNotifications } = useNotifications();
  const { preferences } = useUserPreferences();
  const [activeAlert, setActiveAlert] = useState<ActiveAlertItem | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Request browser desktop notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Check incoming unread notifications for newly due reminders
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Check user global alerts toggle
    if (preferences && preferences.alertsEnabled === false) return;

    // Find the latest unread reminder alert that hasn't been shown yet
    const dueNotification = notifications.find((n) => {
      if (n.read || seenAlertIds.has(n.id)) return false;
      const isDue = n.type === "REMINDER_DUE" || (n.metadata as any)?.isDue;
      if (!isDue) return false;

      // Filter by alert type if configured
      if (preferences) {
        if (n.type === "CALENDAR_REMINDER" && preferences.alertCalendar === false) return false;
        if ((n.metadata as any)?.taskId && preferences.alertTasks === false) return false;
      }
      return true;
    });

    if (dueNotification && !activeAlert) {
      seenAlertIds.add(dueNotification.id);
      const reminderId = (dueNotification.metadata as any)?.reminderId || (dueNotification.metadata as any)?.id;
      const taskId = (dueNotification.metadata as any)?.taskId;

      const item: ActiveAlertItem = {
        id: dueNotification.id,
        reminderId,
        taskId,
        title: dueNotification.title,
        message: dueNotification.message,
        type: dueNotification.type,
        metadata: dueNotification.metadata,
        createdAt: dueNotification.createdAt,
      };

      setActiveAlert(item);
      setIsMuted(false);

      // Check quiet hours before playing audible alarm
      const inQuietHours =
        Boolean(preferences?.quietHoursEnabled) &&
        isWithinQuietHours(preferences?.quietHoursStart, preferences?.quietHoursEnd);

      if (!inQuietHours) {
        const ringtone = (item.metadata?.ringtone || preferences?.alertSound || "calby_bell") as any;
        const volume = preferences?.alertVolume ?? 70;
        playAlarmSound(10, ringtone, volume);
      }

      // Show Desktop Notification if permitted
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          const desktopNotif = new Notification(`🔔 Calby Reminder: ${dueNotification.title}`, {
            body: dueNotification.message || "Your scheduled reminder is due now.",
            icon: "/icon.png",
            tag: dueNotification.id,
            requireInteraction: true,
          });

          desktopNotif.onclick = () => {
            window.focus();
            desktopNotif.close();
          };
        } catch {
          // ignore
        }
      }
    }
  }, [notifications, activeAlert]);

  // Handler: Stop Alarm & Dismiss Popup (Keep Pending)
  const handleStop = useCallback(() => {
    stopAlarmSound();
    setActiveAlert(null);
  }, []);

  // Handler: Snooze (10 minutes)
  const handleSnooze = useCallback(async (minutes = 10) => {
    if (!activeAlert || !sessionToken) return;
    stopAlarmSound();
    setActionLoading(true);

    try {
      if (activeAlert.reminderId) {
        await snoozeReminderApi(sessionToken, activeAlert.reminderId, minutes);
      }
      await markAsRead(activeAlert.id);
      await refetchNotifications();
    } catch (err) {
      console.warn("Snooze reminder error:", err);
    } finally {
      setActionLoading(false);
      setActiveAlert(null);
    }
  }, [activeAlert, sessionToken, markAsRead, refetchNotifications]);

  // Handler: Complete Permanently
  const handleComplete = useCallback(async () => {
    if (!activeAlert || !sessionToken) return;
    stopAlarmSound();
    setActionLoading(true);

    try {
      if (activeAlert.reminderId) {
        await completeReminderApi(sessionToken, activeAlert.reminderId);
      }
      await markAsRead(activeAlert.id);
      await refetchNotifications();
    } catch (err) {
      console.warn("Complete reminder error:", err);
    } finally {
      setActionLoading(false);
      setActiveAlert(null);
    }
  }, [activeAlert, sessionToken, markAsRead, refetchNotifications]);

  // Handler: Toggle Audio Mute
  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      playAlarmSound(10);
      setIsMuted(false);
    } else {
      stopAlarmSound();
      setIsMuted(true);
    }
  }, [isMuted]);

  // Stop sound on unmount
  useEffect(() => {
    return () => {
      stopAlarmSound();
    };
  }, []);

  if (!activeAlert) return null;

  return (
    <div
      onClick={handleStop}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()} // Prevent click inside from dismissing
        className="w-full max-w-md rounded-3xl border border-lime-400/40 bg-[#0E0F14] p-6 shadow-[0_0_50px_rgba(163,230,53,0.25)] space-y-5 ring-1 ring-lime-400/20"
      >
        {/* Header with Pulsing Alert Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-2xl bg-lime-400/15 border border-lime-400/40 text-lime-400 shadow-sm animate-bounce">
              <Bell className="size-5" />
              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-lime-400 animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/40">
                  CALBY ALERT
                </span>
                <span className="text-xs font-semibold text-zinc-400">Due Now</span>
              </div>
              <h2 className="text-base font-bold text-white mt-1 leading-snug break-words">
                {activeAlert.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleMute}
              className="size-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title={isMuted ? "Unmute Alarm" : "Mute Alarm"}
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-lime-400 animate-pulse" />}
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="size-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Details Card */}
        {activeAlert.message && (
          <div className="rounded-2xl border border-zinc-800/80 bg-[#13141B] p-4 text-xs text-zinc-300 leading-relaxed">
            <p>{activeAlert.message}</p>
          </div>
        )}

        {/* Action Controls (Reference Design Section 4) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2.5">
            {/* Snooze 10m */}
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleSnooze(10)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="size-3.5 text-amber-400" />
              <span>Snooze (10m)</span>
            </button>

            {/* Complete */}
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleComplete}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-lime-400/40 bg-lime-400/20 px-3 py-2.5 text-xs font-bold text-lime-400 hover:bg-lime-400 hover:text-zinc-950 transition-all cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Complete</span>
            </button>

            {/* Dismiss */}
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <X className="size-3.5" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
