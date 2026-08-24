"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sliders,
  Check,
  Globe,
  Clock,
  Bell,
  Moon,
  LoaderCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserPreferences } from "@/context/user-preferences-context";
import { useSession } from "@descope/nextjs-sdk/client";
import { connectCalendar } from "@/lib/connections";
import { UserPreferencesData } from "@/lib/user-preferences";
import { cn } from "@/lib/utils";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "(UTC+05:30) India Standard Time - Asia/Kolkata" },
  { value: "UTC", label: "(UTC+00:00) Universal Time - UTC" },
  { value: "Europe/London", label: "(UTC+00:00) GMT / BST - London" },
  { value: "Europe/Paris", label: "(UTC+01:00) CET - Paris" },
  { value: "America/New_York", label: "(UTC-05:00) Eastern Time - New York" },
  { value: "America/Chicago", label: "(UTC-06:00) Central Time - Chicago" },
  { value: "America/Denver", label: "(UTC-07:00) Mountain Time - Denver" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time - Los Angeles" },
  { value: "Asia/Tokyo", label: "(UTC+09:00) Japan Time - Tokyo" },
  { value: "Australia/Sydney", label: "(UTC+10:00) Eastern Time - Sydney" },
];

const DATE_FORMATS: Array<{ value: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"; label: string }> = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (24/08/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (08/24/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-08-24)" },
];

const TIME_FORMATS: Array<{ value: "12h" | "24h"; label: string }> = [
  { value: "24h", label: "24-hour (19:30)" },
  { value: "12h", label: "12-hour (7:30 PM)" },
];

const REMINDER_OPTIONS = [
  { minutes: 5, label: "5m" },
  { minutes: 10, label: "10m" },
  { minutes: 15, label: "15m" },
  { minutes: 30, label: "30m" },
  { minutes: 60, label: "1h" },
];

export function GeneralTab() {
  const { sessionToken } = useSession();
  const {
    preferences,
    calendars,
    isLoading,
    isSaving,
    error: globalError,
    saveSuccess,
    systemTimezone,
    savePreferences,
  } = useUserPreferences();

  // Local form state
  const [form, setForm] = useState<UserPreferencesData>({
    theme: "dark",
    defaultCalendarId: "primary",
    timezone: systemTimezone,
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    notifications: {
      dailyBriefing: true,
      eventReminder: true,
      reminderMinutes: 10,
    },
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [connectingCalendar, setConnectingCalendar] = useState(false);

  // Sync form state when backend preferences arrive
  useEffect(() => {
    if (preferences) {
      setForm(preferences);
    }
  }, [preferences]);

  // Compute dirty status
  const isDirty = useMemo(() => {
    if (!preferences) return false;
    return (
      form.theme !== preferences.theme ||
      form.defaultCalendarId !== preferences.defaultCalendarId ||
      form.timezone !== preferences.timezone ||
      form.dateFormat !== preferences.dateFormat ||
      form.timeFormat !== preferences.timeFormat ||
      form.notifications.dailyBriefing !== preferences.notifications.dailyBriefing ||
      form.notifications.eventReminder !== preferences.notifications.eventReminder ||
      form.notifications.reminderMinutes !== preferences.notifications.reminderMinutes
    );
  }, [form, preferences]);

  // Live date & time format preview
  const livePreviewText = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    let dateStr = `${day}/${month}/${year}`;
    if (form.dateFormat === "MM/DD/YYYY") dateStr = `${month}/${day}/${year}`;
    if (form.dateFormat === "YYYY-MM-DD") dateStr = `${year}-${month}-${day}`;

    let timeStr = "";
    if (form.timeFormat === "12h") {
      let hours = d.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const mins = String(d.getMinutes()).padStart(2, "0");
      timeStr = `${hours}:${mins} ${ampm}`;
    } else {
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      timeStr = `${hours}:${mins}`;
    }

    return `${dateStr}, ${timeStr}`;
  }, [form.dateFormat, form.timeFormat]);

  const handleCancel = () => {
    if (preferences) {
      setForm(preferences);
    }
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!isDirty || isSaving) return;
    setSaveError(null);

    try {
      await savePreferences(form);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save preferences. Please try again.");
    }
  };

  const handleConnectCalendar = async () => {
    if (!sessionToken || connectingCalendar) return;
    setConnectingCalendar(true);
    try {
      await connectCalendar(sessionToken);
    } catch {
      setSaveError("Failed to initiate Google Calendar connection.");
      setConnectingCalendar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 w-full" role="status" aria-label="Loading preferences">
        <div className="space-y-1.5">
          <div className="h-5 w-44 rounded bg-zinc-800 animate-pulse" />
          <div className="h-3 w-64 rounded bg-zinc-800/60 animate-pulse" />
        </div>

        <div className="rounded-xl border border-zinc-800/90 bg-[#101012] p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="h-12 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-12 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-12 rounded-xl bg-zinc-800/60 animate-pulse" />
          </div>
          <div className="h-9 rounded-xl bg-zinc-800/60 animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-9 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-9 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-9 rounded-xl bg-zinc-800/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            General Preferences
            <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-lime-400 uppercase tracking-widest">
              SYSTEM DEFAULTS
            </span>
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Configure application appearance, time zone defaults, and notification preferences.
          </p>
        </div>
      </div>

      {/* Main Preferences Panel */}
      <div className="rounded-xl border border-zinc-800/90 bg-[#101012] p-4 space-y-3.5 shadow-sm">
        {/* 1. Theme Preference Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Moon className="size-3.5 text-lime-400" />
            <span>Appearance</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: "dark", label: "Calby Dark", desc: "Default dark theme" },
              { id: "midnight", label: "Midnight OLED", desc: "Pure black contrast" },
              { id: "system", label: "System Default", desc: "Match OS settings" },
            ].map((t) => {
              const active = form.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, theme: t.id as any }))}
                  className={cn(
                    "relative flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-lime-400",
                    active
                      ? "border-lime-400/80 bg-lime-400/10 text-white shadow-[0_0_10px_rgba(163,230,53,0.12)]"
                      : "border-zinc-800/90 bg-zinc-950/70 text-zinc-400 hover:border-zinc-700/80 hover:bg-zinc-900/50 hover:text-zinc-200"
                  )}
                  aria-pressed={active}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white leading-tight">{t.label}</p>
                    <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{t.desc}</p>
                  </div>
                  <div
                    className={cn(
                      "size-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ml-2",
                      active
                        ? "border-lime-400 bg-lime-400 text-zinc-950"
                        : "border-zinc-700 bg-zinc-900"
                    )}
                  >
                    {active && <Check className="size-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Default Workspace Calendar Section */}
        <div className="space-y-2 pt-3 border-t border-zinc-800/60">
          <label className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Globe className="size-3.5 text-lime-400" />
            <span>Default Workspace Calendar</span>
          </label>

          {calendars.length > 0 ? (
            <select
              value={form.defaultCalendarId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, defaultCalendarId: e.target.value }))
              }
              className="w-full rounded-xl border border-zinc-800/90 bg-zinc-950 px-3 py-2 text-xs font-medium text-white focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-lime-400 cursor-pointer shadow-sm"
            >
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name} {cal.account ? `(${cal.account})` : ""}
                </option>
              ))}
            </select>
          ) : (
            /* Empty Calendar State */
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/60 px-3.5 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <CalendarIcon className="size-4 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">No connected calendars</p>
                  <p className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">
                    Connect Google Calendar to select a default workspace calendar.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleConnectCalendar}
                disabled={connectingCalendar}
                className="h-7 rounded-lg bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs px-3 shrink-0 shadow-sm inline-flex items-center gap-1"
              >
                {connectingCalendar ? (
                  <LoaderCircle className="size-3 animate-spin" />
                ) : (
                  <PlusCircle className="size-3" />
                )}
                <span>Connect Calendar</span>
              </Button>
            </div>
          )}
        </div>

        {/* 3. Time & Region Section */}
        <div className="space-y-2.5 pt-3 border-t border-zinc-800/60">
          <label className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Clock className="size-3.5 text-lime-400" />
            <span>Time & Region</span>
          </label>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
            {/* Timezone Select */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Time Zone
              </span>
              <select
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800/90 bg-zinc-950 px-3 py-2 text-xs font-medium text-white focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-lime-400 cursor-pointer shadow-sm truncate"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} {tz.value === systemTimezone ? " (Detected)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Format */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Date Format
              </span>
              <select
                value={form.dateFormat}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dateFormat: e.target.value as any }))
                }
                className="w-full rounded-xl border border-zinc-800/90 bg-zinc-950 px-3 py-2 text-xs font-medium text-white focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-lime-400 cursor-pointer shadow-sm"
              >
                {DATE_FORMATS.map((df) => (
                  <option key={df.value} value={df.value}>
                    {df.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Format */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Time Format
              </span>
              <select
                value={form.timeFormat}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, timeFormat: e.target.value as any }))
                }
                className="w-full rounded-xl border border-zinc-800/90 bg-zinc-950 px-3 py-2 text-xs font-medium text-white focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-lime-400 cursor-pointer shadow-sm"
              >
                {TIME_FORMATS.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Format Preview Bar */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/80 px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium text-[11px]">Live Format Preview:</span>
            <span className="font-mono text-lime-400 font-semibold text-xs">{livePreviewText}</span>
          </div>
        </div>

        {/* 4. Notifications Section */}
        <div className="space-y-2 pt-3 border-t border-zinc-800/60">
          <label className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Bell className="size-3.5 text-lime-400" />
            <span>Notification Preferences</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Daily Briefing Row */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-2.5">
              <div>
                <p className="text-xs font-semibold text-white leading-tight">Daily Briefing</p>
                <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                  Receive your daily schedule summary
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.notifications.dailyBriefing}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      dailyBriefing: !prev.notifications.dailyBriefing,
                    },
                  }))
                }
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-lime-400 ml-2",
                  form.notifications.dailyBriefing ? "bg-lime-400" : "bg-zinc-800"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-4 transform rounded-full bg-zinc-950 shadow-md ring-0 transition duration-200 ease-in-out",
                    form.notifications.dailyBriefing ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Event Reminders Row */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-2.5">
              <div>
                <p className="text-xs font-semibold text-white leading-tight">Event Reminders</p>
                <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                  Remind me before upcoming calendar events
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.notifications.eventReminder}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      eventReminder: !prev.notifications.eventReminder,
                    },
                  }))
                }
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-lime-400 ml-2",
                  form.notifications.eventReminder ? "bg-lime-400" : "bg-zinc-800"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-4 transform rounded-full bg-zinc-950 shadow-md ring-0 transition duration-200 ease-in-out",
                    form.notifications.eventReminder ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Conditional Reminder Minutes Pills */}
          {form.notifications.eventReminder && (
            <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-200">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 shrink-0">
                Reminder Time:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REMINDER_OPTIONS.map((opt) => {
                  const active = form.notifications.reminderMinutes === opt.minutes;
                  return (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            reminderMinutes: opt.minutes,
                          },
                        }))
                      }
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                        active
                          ? "border-lime-400 bg-lime-400/10 text-lime-400"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. Save & Cancel Action Bar */}
        {(saveError || globalError) && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-300 animate-in fade-in duration-150">
            <AlertCircle className="size-3.5 shrink-0 text-red-400" />
            <span>{saveError || globalError}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
          <div>
            {saveSuccess ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-400 animate-in fade-in duration-150">
                <Check className="size-3.5" />
                <span>General preferences saved!</span>
              </div>
            ) : isDirty ? (
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved changes
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500 font-medium">
                Changes persist automatically across devices
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white px-2.5 py-1 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="size-3" />
                <span>Cancel</span>
              </button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={cn(
                "h-7 rounded-lg font-semibold text-xs px-3.5 shadow-sm transition-all",
                isDirty
                  ? "bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-[0_0_10px_rgba(163,230,53,0.25)]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60 opacity-60"
              )}
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <LoaderCircle className="size-3 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
