"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sliders,
  Check,
  Globe,
  Clock,
  Moon,
  LoaderCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  PlusCircle,
  Sparkles,
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
  { value: "12h", label: "12-hour (7:30 PM)" },
  { value: "24h", label: "24-hour (19:30)" },
];

export function GeneralTab() {
  const { sessionToken } = useSession();
  const {
    preferences,
    calendars,
    isLoading,
    isSaving,
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
    timeFormat: "12h",
    notifications: {
      dailyBriefing: true,
      eventReminder: true,
      reminderMinutes: 10,
    },
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

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
      form.timeFormat !== preferences.timeFormat
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

  const handleSave = async (updatedForm?: UserPreferencesData) => {
    const payload = updatedForm || form;
    setSaveError(null);

    try {
      const success = await savePreferences(payload);
      if (success) {
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
      }
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save preferences. Please try again.");
    }
  };

  const handleAutoDetectTimezone = () => {
    const detected = systemTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const newForm = { ...form, timezone: detected };
    setForm(newForm);
    handleSave(newForm);
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

        <div className="rounded-2xl border border-zinc-800/90 bg-[#12131A] p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-12 rounded-xl bg-zinc-800/60 animate-pulse" />
          </div>
          <div className="h-10 rounded-xl bg-zinc-800/60 animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-10 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-10 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-10 rounded-xl bg-zinc-800/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full select-none max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            General Preferences
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure global appearance, regional time formats, and default calendar workspace.
          </p>
        </div>

        {(saveSuccess || showSaveToast) && (
          <div className="flex items-center gap-1.5 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-semibold text-lime-400 animate-in fade-in duration-150">
            <Check className="size-3.5 stroke-[3]" />
            <span>Saved</span>
          </div>
        )}
      </div>

      {saveError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Preferences Form Container */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#12131A] p-5 space-y-5 shadow-lg">
        {/* 1. Appearance Section */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Moon className="size-3.5 text-lime-400" />
            <span>Appearance</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: "dark", label: "Dark Theme", desc: "Default sleek dark interface" },
              { id: "system", label: "System Default", desc: "Match operating system theme" },
            ].map((t) => {
              const active = form.theme === t.id || (t.id === "dark" && form.theme === "midnight");
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const newForm = { ...form, theme: t.id as any };
                    setForm(newForm);
                    handleSave(newForm);
                  }}
                  className={cn(
                    "relative flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer focus:outline-none",
                    active
                      ? "border-lime-400 bg-lime-400/10 text-white shadow-[0_0_12px_rgba(163,230,53,0.12)]"
                      : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  )}
                >
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{t.label}</p>
                    <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{t.desc}</p>
                  </div>
                  <div
                    className={cn(
                      "size-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ml-2",
                      active
                        ? "border-lime-400 bg-lime-400 text-black"
                        : "border-zinc-700 bg-zinc-800"
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
        <div className="space-y-2.5 pt-4 border-t border-zinc-800/80">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="size-3.5 text-lime-400" />
            <span>Default Calendar</span>
          </label>

          {calendars.length > 0 ? (
            <select
              value={form.defaultCalendarId}
              onChange={(e) => {
                const newForm = { ...form, defaultCalendarId: e.target.value };
                setForm(newForm);
                handleSave(newForm);
              }}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs font-medium text-white focus:border-lime-400 focus:outline-none cursor-pointer shadow-sm"
            >
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name} {cal.account ? `(${cal.account})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <CalendarIcon className="size-4 text-lime-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">Primary Calby Calendar</p>
                  <p className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">
                    Connect Google Calendar to sync external events.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleConnectCalendar}
                disabled={connectingCalendar}
                className="h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs px-3.5 shrink-0 shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                {connectingCalendar ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="size-3.5 stroke-[2.5]" />
                )}
                <span>Connect Google Calendar</span>
              </Button>
            </div>
          )}
        </div>

        {/* 3. Time Zone, Date Format & Time Format */}
        <div className="space-y-3 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="size-3.5 text-lime-400" />
              <span>Time & Region Settings</span>
            </label>
            <button
              type="button"
              onClick={handleAutoDetectTimezone}
              className="text-[11px] font-semibold text-lime-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="size-3" />
              <span>Auto-detect Timezone</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Timezone Select */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Time Zone
              </span>
              <select
                value={form.timezone}
                onChange={(e) => {
                  const newForm = { ...form, timezone: e.target.value };
                  setForm(newForm);
                  handleSave(newForm);
                }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-white focus:border-lime-400 focus:outline-none cursor-pointer shadow-sm truncate"
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
                onChange={(e) => {
                  const newForm = { ...form, dateFormat: e.target.value as any };
                  setForm(newForm);
                  handleSave(newForm);
                }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-white focus:border-lime-400 focus:outline-none cursor-pointer shadow-sm"
              >
                {DATE_FORMATS.map((df) => (
                  <option key={df.value} value={df.value}>
                    {df.label}
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
                onChange={(e) => {
                  const newForm = { ...form, timeFormat: e.target.value as any };
                  setForm(newForm);
                  handleSave(newForm);
                }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-white focus:border-lime-400 focus:outline-none cursor-pointer shadow-sm"
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
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium text-xs">Live Format Preview:</span>
            <span className="font-mono text-lime-400 font-bold text-xs">{livePreviewText}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
          <p className="text-[11px] text-zinc-500">
            Changes save automatically and sync across your devices.
          </p>

          <Button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || !isDirty}
            className="rounded-xl bg-lime-400 px-5 py-2 text-xs font-bold text-black hover:bg-lime-300 transition-all cursor-pointer shadow-lg shadow-lime-400/20 disabled:opacity-40"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <LoaderCircle className="size-3.5 animate-spin" /> Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
