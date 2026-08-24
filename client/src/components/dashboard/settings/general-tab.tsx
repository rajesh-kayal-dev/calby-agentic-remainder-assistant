"use client";

import { useState } from "react";
import { Sliders, Check, Globe, Clock, Bell, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GeneralTab() {
  const [theme, setTheme] = useState("dark");
  const [defaultCal, setDefaultCal] = useState("google");
  const [timeZone, setTimeZone] = useState("UTC+05:30");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          General Preferences
          <span className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-xs font-semibold text-lime-400 uppercase">
            System Defaults
          </span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configure application appearance, time zone defaults, and notification preferences.
        </p>
      </div>

      {/* Preferences Form Card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#101012] p-5 space-y-5 shadow-sm">
        {/* Theme Preference */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white flex items-center gap-2">
            <Moon className="size-4 text-lime-400" />
            <span>Theme Preference</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "dark", label: "Calby Dark (Default)" },
              { id: "midnight", label: "Midnight OLED" },
              { id: "system", label: "System Default" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`rounded-xl border p-3 text-xs font-medium text-left transition-all ${
                  theme === t.id
                    ? "border-lime-400/60 bg-lime-400/10 text-white font-semibold"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Default Calendar */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/60">
          <label className="text-xs font-semibold text-white flex items-center gap-2">
            <Globe className="size-4 text-lime-400" />
            <span>Default Workspace Calendar</span>
          </label>
          <select
            value={defaultCal}
            onChange={(e) => setDefaultCal(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-white focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-lime-400 cursor-pointer"
          >
            <option value="google">Google Calendar (Primary Account)</option>
            <option value="calby">Calby Native Workspace</option>
          </select>
        </div>

        {/* Time Zone & Date Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/60">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white flex items-center gap-2">
              <Clock className="size-4 text-lime-400" />
              <span>Time Zone</span>
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-white focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-lime-400 cursor-pointer"
            >
              <option value="UTC+05:30">(UTC+05:30) India Standard Time - IST</option>
              <option value="UTC+00:00">(UTC+00:00) Greenwich Mean Time - GMT</option>
              <option value="UTC-05:00">(UTC-05:00) Eastern Time - EST</option>
              <option value="UTC-08:00">(UTC-08:00) Pacific Time - PST</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white flex items-center gap-2">
              <Sliders className="size-4 text-lime-400" />
              <span>Date & Time Format</span>
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-white focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-lime-400 cursor-pointer"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (24 Aug 2026, 14:30)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (Aug 24 2026, 2:30 PM)</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/60">
          <label className="text-xs font-semibold text-white flex items-center gap-2">
            <Bell className="size-4 text-lime-400" />
            <span>Notification Preferences</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                className="size-4 rounded border-zinc-700 bg-zinc-950 text-lime-400 focus:ring-lime-400"
              />
              <span>Send AI daily briefing digest emails every morning</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                className="size-4 rounded border-zinc-700 bg-zinc-950 text-lime-400 focus:ring-lime-400"
              />
              <span>Remind 10 minutes before upcoming Google Calendar events</span>
            </label>
          </div>
        </div>

        {/* Actions & Feedback */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
          {savedSuccess ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 animate-in fade-in duration-150">
              <Check className="size-4" />
              <span>General preferences saved!</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500 font-medium">
              Changes apply automatically across devices
            </span>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-semibold text-xs px-4 shadow-sm"
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
