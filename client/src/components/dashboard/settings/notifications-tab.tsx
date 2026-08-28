"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  Calendar,
  CheckSquare,
  Clock,
  Music,
  Play,
  Volume2,
  Moon,
  Info,
  ArrowRight,
  Check,
  RotateCcw,
  LoaderCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUserPreferences } from "@/context/user-preferences-context";
import { previewRingtone, RINGTONE_OPTIONS } from "@/lib/alert-sound";
import { UserPreferencesData } from "@/lib/user-preferences";

const REMINDER_TIME_OPTIONS = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
];

function PillToggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer select-none",
        checked
          ? "bg-lime-400 text-zinc-950 font-bold border border-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.3)]"
          : "bg-[#181920] border border-zinc-700/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 font-semibold disabled:opacity-40 disabled:pointer-events-none"
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          checked ? "bg-zinc-950" : "bg-zinc-500"
        )}
      />
      <span>{checked ? "ON" : "OFF"}</span>
    </button>
  );
}

export function NotificationsTab() {
  const { preferences, savePreferences, isLoading, isSaving, saveSuccess } = useUserPreferences();

  // Local form state
  const [form, setForm] = useState({
    alertsEnabled: true,
    alertCalendar: true,
    alertTasks: true,
    alertFollowups: true,
    defaultReminderMinutes: 15,
    alertSound: "calby_bell",
    alertVolume: 70,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });

  const [hasLoaded, setHasLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize when persistent preferences arrive from backend
  useEffect(() => {
    if (preferences) {
      setForm({
        alertsEnabled: preferences.alertsEnabled ?? true,
        alertCalendar: preferences.alertCalendar ?? true,
        alertTasks: preferences.alertTasks ?? true,
        alertFollowups: preferences.alertFollowups ?? true,
        defaultReminderMinutes: preferences.defaultReminderMinutes ?? 15,
        alertSound: (preferences.alertSound as string) || "calby_bell",
        alertVolume: preferences.alertVolume ?? 70,
        quietHoursEnabled: preferences.quietHoursEnabled ?? false,
        quietHoursStart: preferences.quietHoursStart || "22:00",
        quietHoursEnd: preferences.quietHoursEnd || "07:00",
      });
      setHasLoaded(true);
    }
  }, [preferences]);

  // Compute dirty status
  const isDirty = useMemo(() => {
    if (!preferences) return false;
    return (
      form.alertsEnabled !== (preferences.alertsEnabled ?? true) ||
      form.alertCalendar !== (preferences.alertCalendar ?? true) ||
      form.alertTasks !== (preferences.alertTasks ?? true) ||
      form.alertFollowups !== (preferences.alertFollowups ?? true) ||
      form.defaultReminderMinutes !== (preferences.defaultReminderMinutes ?? 15) ||
      form.alertSound !== ((preferences.alertSound as string) || "calby_bell") ||
      form.alertVolume !== (preferences.alertVolume ?? 70) ||
      form.quietHoursEnabled !== (preferences.quietHoursEnabled ?? false) ||
      form.quietHoursStart !== (preferences.quietHoursStart || "22:00") ||
      form.quietHoursEnd !== (preferences.quietHoursEnd || "07:00")
    );
  }, [form, preferences]);

  // Toggle handler
  const handleToggle = (key: keyof typeof form) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
    setErrorMessage(null);
  };

  // Field change handler
  const handleChange = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrorMessage(null);
  };

  // Discard / Reset handler
  const handleCancel = () => {
    if (preferences) {
      setForm({
        alertsEnabled: preferences.alertsEnabled ?? true,
        alertCalendar: preferences.alertCalendar ?? true,
        alertTasks: preferences.alertTasks ?? true,
        alertFollowups: preferences.alertFollowups ?? true,
        defaultReminderMinutes: preferences.defaultReminderMinutes ?? 15,
        alertSound: (preferences.alertSound as string) || "calby_bell",
        alertVolume: preferences.alertVolume ?? 70,
        quietHoursEnabled: preferences.quietHoursEnabled ?? false,
        quietHoursStart: preferences.quietHoursStart || "22:00",
        quietHoursEnd: preferences.quietHoursEnd || "07:00",
      });
    }
    setErrorMessage(null);
  };

  // Save changes handler
  const handleSave = async () => {
    if (!preferences) return;
    setErrorMessage(null);

    const fullUpdated: UserPreferencesData = {
      ...preferences,
      alertsEnabled: form.alertsEnabled,
      alertCalendar: form.alertCalendar,
      alertTasks: form.alertTasks,
      alertFollowups: form.alertFollowups,
      defaultReminderMinutes: form.defaultReminderMinutes,
      alertSound: form.alertSound,
      alertVolume: form.alertVolume,
      quietHoursEnabled: form.quietHoursEnabled,
      quietHoursStart: form.quietHoursStart,
      quietHoursEnd: form.quietHoursEnd,
    };

    try {
      await savePreferences(fullUpdated);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save alert settings. Please try again.");
    }
  };

  if (isLoading && !hasLoaded) {
    return (
      <div className="space-y-4 max-w-2xl select-none" role="status">
        <div className="h-6 w-32 bg-zinc-800/60 rounded animate-pulse" />
        <div className="h-4 w-64 bg-zinc-800/40 rounded animate-pulse" />
        <div className="h-20 bg-zinc-900/60 rounded-2xl animate-pulse border border-zinc-800/80 mt-6" />
        <div className="h-48 bg-zinc-900/60 rounded-2xl animate-pulse border border-zinc-800/80" />
        <div className="h-28 bg-zinc-900/60 rounded-2xl animate-pulse border border-zinc-800/80" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl select-none pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Alerts</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage how Calby alerts and reminds you.
          </p>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-400 animate-in fade-in duration-150">
              <Check className="size-3.5" />
              <span>Saved!</span>
            </div>
          ) : isDirty ? (
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          ) : null}
        </div>
      </div>

      {/* 1. Global Alerts Toggle Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#101014] p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 shadow-sm">
            <Bell className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Alerts</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Turn on or off all alerts from Calby.
            </p>
          </div>
        </div>

        <PillToggle
          checked={form.alertsEnabled}
          onChange={() => handleToggle("alertsEnabled")}
        />
      </div>

      {/* 2. Alert Types Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#101014] p-4 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-white leading-tight">Alert types</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Choose what you want to be alerted for.
          </p>
        </div>

        <div className="divide-y divide-zinc-800/60 pt-1">
          {/* Calendar reminders */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 shadow-sm">
                <Calendar className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Calendar reminders</h4>
                <p className="text-[11px] text-zinc-400">
                  Get alerts for upcoming events and meetings.
                </p>
              </div>
            </div>

            <PillToggle
              checked={form.alertCalendar && form.alertsEnabled}
              disabled={!form.alertsEnabled}
              onChange={() => handleToggle("alertCalendar")}
            />
          </div>

          {/* Task reminders */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 shadow-sm">
                <CheckSquare className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Task reminders</h4>
                <p className="text-[11px] text-zinc-400">
                  Get alerts for tasks and to-dos.
                </p>
              </div>
            </div>

            <PillToggle
              checked={form.alertTasks && form.alertsEnabled}
              disabled={!form.alertsEnabled}
              onChange={() => handleToggle("alertTasks")}
            />
          </div>

          {/* Follow-ups */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 shadow-sm">
                <Bell className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Follow-ups</h4>
                <p className="text-[11px] text-zinc-400">
                  Get alerts for follow-ups and important messages.
                </p>
              </div>
            </div>

            <PillToggle
              checked={form.alertFollowups && form.alertsEnabled}
              disabled={!form.alertsEnabled}
              onChange={() => handleToggle("alertFollowups")}
            />
          </div>
        </div>
      </div>

      {/* 3. Default Reminder Time Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#101014] p-4 space-y-3 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-white leading-tight">Default reminder time</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Set the default time for reminders when creating events or tasks.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Clock className="size-4" />
          </div>
          <select
            value={form.defaultReminderMinutes}
            onChange={(e) => handleChange("defaultReminderMinutes", Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-800 bg-[#14151B] pl-10 pr-4 py-2.5 text-xs text-white focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 cursor-pointer appearance-none"
          >
            {REMINDER_TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
            <span className="text-[10px]">▼</span>
          </div>
        </div>
      </div>

      {/* 4. Alert Sound Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#101014] p-4 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-white leading-tight">Alert sound</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Choose a ringtone for your alerts.</p>
        </div>

        {/* Ringtone Dropdown & Preview Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-lime-400">
              <Music className="size-4" />
            </div>
            <select
              value={form.alertSound}
              onChange={(e) => handleChange("alertSound", e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-[#14151B] pl-10 pr-4 py-2.5 text-xs text-white focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 cursor-pointer appearance-none"
            >
              {RINGTONE_OPTIONS.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
              <span className="text-[10px]">▼</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => previewRingtone(form.alertSound, form.alertVolume)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 hover:text-lime-400 text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Play className="size-3 fill-lime-400 text-lime-400" />
            <span>Preview</span>
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-2 text-zinc-400 shrink-0">
            <Volume2 className="size-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300">Volume</span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={form.alertVolume}
            onChange={(e) => handleChange("alertVolume", Number(e.target.value))}
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
          />

          <span className="text-xs font-mono text-zinc-400 w-10 text-right font-semibold">
            {form.alertVolume}%
          </span>
        </div>
      </div>

      {/* 5. Quiet Hours Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#101014] p-4 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Quiet hours</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pause alerts during selected hours.
            </p>
          </div>

          <PillToggle
            checked={form.quietHoursEnabled}
            onChange={() => handleToggle("quietHoursEnabled")}
          />
        </div>

        {/* Time Inputs */}
        <div className={cn("grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1", !form.quietHoursEnabled && "opacity-40 pointer-events-none")}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Moon className="size-3.5" />
            </div>
            <input
              type="time"
              value={form.quietHoursStart}
              onChange={(e) => handleChange("quietHoursStart", e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-[#14151B] pl-9 pr-3 py-2 text-xs text-white focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 cursor-pointer"
            />
          </div>

          <div className="text-zinc-500 flex items-center justify-center">
            <ArrowRight className="size-3.5" />
          </div>

          <div>
            <input
              type="time"
              value={form.quietHoursEnd}
              onChange={(e) => handleChange("quietHoursEnd", e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-[#14151B] px-3 py-2 text-xs text-white focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 6. Bottom Info Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#101014] p-3.5 flex items-center gap-3 shadow-sm">
        <Info className="size-4 text-lime-400 shrink-0" />
        <p className="text-xs text-zinc-400">
          Alerts will still appear for important system messages, even during quiet hours.
        </p>
      </div>

      {/* 7. Error Message (if any) */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {errorMessage}
        </div>
      )}

      {/* 8. Save Changes Action Footer Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
        <div>
          {saveSuccess ? (
            <span className="text-xs font-semibold text-lime-400 flex items-center gap-1.5 animate-in fade-in">
              <Check className="size-3.5" />
              <span>Alert preferences saved successfully!</span>
            </span>
          ) : isDirty ? (
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500 font-medium">
              Settings persist across all your devices
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-colors disabled:opacity-50 cursor-pointer"
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
              "h-8 rounded-xl font-bold text-xs px-5 shadow-sm transition-all cursor-pointer",
              isDirty
                ? "bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60 opacity-60"
            )}
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <LoaderCircle className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </span>
            ) : (
              <span>Save Changes</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Export alias for clean nomenclature
export const AlertsTab = NotificationsTab;
