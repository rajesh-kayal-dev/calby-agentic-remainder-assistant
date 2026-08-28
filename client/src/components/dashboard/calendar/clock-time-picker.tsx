"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { Clock, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClockTimePickerProps {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h format)
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm (24h format)
  allDay: boolean;
  onStartChange: (date: string, time: string) => void;
  onEndChange: (date: string, time: string) => void;
  onAllDayToggle: (allDay: boolean) => void;
}

export function ClockTimePicker({
  startDate,
  startTime,
  endDate,
  endTime,
  allDay,
  onStartChange,
  onEndChange,
  onAllDayToggle,
}: ClockTimePickerProps) {
  // Active target: editing start or end time
  const [activeTarget, setActiveTarget] = useState<"start" | "end">("start");
  // Selection mode: editing hours or minutes
  const [mode, setMode] = useState<"hours" | "minutes">("hours");
  // Mouse/Touch dragging flag for clock dial
  const [isDraggingClock, setIsDraggingClock] = useState<boolean>(false);

  const dialRef = useRef<HTMLDivElement>(null);

  // Helper to parse HH:mm (24h) string into 12h components
  const parseTime = useCallback((timeStr: string) => {
    const [hStr, mStr] = (timeStr || "09:00").split(":");
    let h = parseInt(hStr || "9", 10);
    const m = parseInt(mStr || "0", 10);
    const isPm = h >= 12;
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return { hour24: h, hour12, minutes: m, isPm };
  }, []);

  const startParsed = parseTime(startTime);
  const endParsed = parseTime(endTime);
  const currentParsed = activeTarget === "start" ? startParsed : endParsed;

  // Duration computation
  const durationText = useMemo(() => {
    try {
      const s = new Date(`${startDate}T${startTime}:00`).getTime();
      const e = new Date(`${endDate}T${endTime}:00`).getTime();
      const diffMs = e - s;
      if (isNaN(diffMs) || diffMs <= 0) return "1 hr";
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0 && mins > 0) return `${hours} hr ${mins} m`;
      if (hours > 0) return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
      return `${mins} min`;
    } catch {
      return "1 hr";
    }
  }, [startDate, startTime, endDate, endTime]);

  // Formatted display date (e.g. "Tue, 11 Aug 2026")
  const formattedDateDisplay = useMemo(() => {
    try {
      const d = new Date(`${startDate}T00:00:00`);
      return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return startDate;
    }
  }, [startDate]);

  // Update time for active target
  const updateActiveTime = useCallback(
    (newHour12: number, newMin: number, newIsPm: boolean) => {
      let h24 = newHour12 % 12;
      if (newIsPm) h24 += 12;

      const timeStr = `${String(h24).padStart(2, "0")}:${String(newMin).padStart(2, "0")}`;

      if (activeTarget === "start") {
        onStartChange(startDate, timeStr);
        // Auto-shift end time to preserve duration if end time is before new start time
        const startMs = new Date(`${startDate}T${timeStr}:00`).getTime();
        const endMs = new Date(`${endDate}T${endTime}:00`).getTime();
        if (endMs <= startMs) {
          const endH24 = (h24 + 1) % 24;
          const endStr = `${String(endH24).padStart(2, "0")}:${String(newMin).padStart(2, "0")}`;
          onEndChange(endDate, endStr);
        }
      } else {
        onEndChange(endDate, timeStr);
      }
    },
    [activeTarget, startDate, endDate, endTime, onStartChange, onEndChange]
  );

  // Toggle AM / PM
  const handleToggleAmPm = (targetAmPm: "AM" | "PM") => {
    const isPm = targetAmPm === "PM";
    updateActiveTime(currentParsed.hour12, currentParsed.minutes, isPm);
  };

  // Process clock dial angle
  const processAngle = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = clientX - cx;
      const dy = clientY - cy;

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      if (mode === "hours") {
        let hour = Math.round(angle / 30);
        if (hour === 0) hour = 12;
        updateActiveTime(hour, currentParsed.minutes, currentParsed.isPm);
      } else {
        let minute = Math.round(angle / 6) % 60;
        updateActiveTime(currentParsed.hour12, minute, currentParsed.isPm);
      }
    },
    [mode, currentParsed, updateActiveTime]
  );

  // Clock drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingClock(true);
    processAngle(e.clientX, e.clientY);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingClock) return;
      processAngle(e.clientX, e.clientY);
    },
    [isDraggingClock, processAngle]
  );

  const handlePointerUp = useCallback(() => {
    if (isDraggingClock) {
      setIsDraggingClock(false);
      if (mode === "hours") {
        setMode("minutes");
      }
    }
  }, [isDraggingClock, mode]);

  useEffect(() => {
    if (isDraggingClock) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingClock, handlePointerMove, handlePointerUp]);

  // Compute positions for clock numbers (170px dial, radius 56px, cx=85, cy=85)
  const dialNumbers = useMemo(() => {
    const radius = 56;
    const cx = 85;
    const cy = 85;

    if (mode === "hours") {
      return [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
        const angleDeg = num * 30 - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        return {
          label: String(num),
          val: num,
          x: cx + radius * Math.cos(angleRad),
          y: cy + radius * Math.sin(angleRad),
        };
      });
    } else {
      return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((num) => {
        const angleDeg = (num / 5) * 30 - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        return {
          label: String(num).padStart(2, "0"),
          val: num,
          x: cx + radius * Math.cos(angleRad),
          y: cy + radius * Math.sin(angleRad),
        };
      });
    }
  }, [mode]);

  // Hand angle calculation
  const handAngleDeg = useMemo(() => {
    if (mode === "hours") {
      return ((currentParsed.hour12 % 12) * 30) - 90;
    } else {
      return ((currentParsed.minutes % 60) * 6) - 90;
    }
  }, [mode, currentParsed]);

  const handRad = (handAngleDeg * Math.PI) / 180;
  const tipX = 85 + 56 * Math.cos(handRad);
  const tipY = 85 + 56 * Math.sin(handRad);

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-[#0F1015] p-3 space-y-2.5 select-none shadow-sm">
      {/* Top Header: Compact Title & All-Day Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-lime-400" />
          <span className="text-[11px] font-bold text-white tracking-wide">Date & Time</span>
          <span className="px-1.5 py-0.5 rounded-full bg-lime-400/10 text-lime-400 text-[9px] font-bold border border-lime-400/20">
            {durationText}
          </span>
        </div>

        {/* All Day Switch */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <span className="text-[10px] font-semibold text-zinc-400">All day</span>
          <button
            type="button"
            onClick={() => onAllDayToggle(!allDay)}
            className={cn(
              "flex items-center rounded-full p-0.5 w-7 h-4 transition-colors cursor-pointer",
              allDay ? "bg-lime-400 justify-end" : "bg-zinc-800 border border-zinc-700 justify-start"
            )}
          >
            <span className={cn("size-3 rounded-full shadow-sm", allDay ? "bg-zinc-950" : "bg-zinc-400")} />
          </button>
        </label>
      </div>

      {!allDay && (
        <>
          {/* Start / End Time Target Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#14151D] border border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveTarget("start");
                setMode("hours");
              }}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer",
                activeTarget === "start"
                  ? "bg-zinc-800 text-white shadow-sm ring-1 ring-lime-400/40"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Starts</span>
              <span className="text-[11px] font-bold text-lime-400 mt-0.5">
                {String(startParsed.hour12).padStart(2, "0")}:{String(startParsed.minutes).padStart(2, "0")}{" "}
                {startParsed.isPm ? "PM" : "AM"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTarget("end");
                setMode("hours");
              }}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer",
                activeTarget === "end"
                  ? "bg-zinc-800 text-white shadow-sm ring-1 ring-lime-400/40"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Ends</span>
              <span className="text-[11px] font-bold text-lime-400 mt-0.5">
                {String(endParsed.hour12).padStart(2, "0")}:{String(endParsed.minutes).padStart(2, "0")}{" "}
                {endParsed.isPm ? "PM" : "AM"}
              </span>
            </button>
          </div>

          {/* Large Digital Display & AM/PM Toggle */}
          <div className="flex items-center justify-between px-2 py-1 bg-[#13141B] rounded-xl border border-zinc-800/60">
            {/* Digital Readout ([09] : [20]) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMode("hours")}
                className={cn(
                  "text-xl font-extrabold font-mono px-2 py-0.5 rounded-lg transition-all cursor-pointer",
                  mode === "hours"
                    ? "bg-lime-400 text-zinc-950 shadow-[0_0_10px_rgba(163,230,53,0.3)] scale-105"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800"
                )}
              >
                {String(currentParsed.hour12).padStart(2, "0")}
              </button>
              <span className="text-base font-bold text-zinc-500">:</span>
              <button
                type="button"
                onClick={() => setMode("minutes")}
                className={cn(
                  "text-xl font-extrabold font-mono px-2 py-0.5 rounded-lg transition-all cursor-pointer",
                  mode === "minutes"
                    ? "bg-lime-400 text-zinc-950 shadow-[0_0_10px_rgba(163,230,53,0.3)] scale-105"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800"
                )}
              >
                {String(currentParsed.minutes).padStart(2, "0")}
              </button>
            </div>

            {/* Mode & AM/PM Segmented Control */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                {mode === "hours" ? "Hours" : "Minutes"}
              </span>

              <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
                <button
                  type="button"
                  onClick={() => handleToggleAmPm("AM")}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer select-none",
                    !currentParsed.isPm
                      ? "bg-lime-400 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAmPm("PM")}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer select-none",
                    currentParsed.isPm
                      ? "bg-lime-400 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Compact Interactive Clock Dial (170px) */}
          <div className="flex justify-center py-0.5">
            <div
              ref={dialRef}
              onPointerDown={handlePointerDown}
              className="relative size-[170px] rounded-full bg-[#12131A] border border-zinc-800/80 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            >
              <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 170 170">
                {/* Outer guide ring */}
                <circle cx="85" cy="85" r="56" fill="none" stroke="#1f202b" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx="85" cy="85" r="3" fill="#a3e635" />

                {/* Clock Hand Line */}
                <line
                  x1="85"
                  y1="85"
                  x2={tipX}
                  y2={tipY}
                  stroke="#a3e635"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Tip Knob Circle */}
                <circle
                  cx={tipX}
                  cy={tipY}
                  r="13"
                  fill="#a3e635"
                  className="shadow-lg"
                />
              </svg>

              {/* Dial Numbers */}
              {dialNumbers.map((item) => {
                const isSelected =
                  mode === "hours"
                    ? currentParsed.hour12 === item.val
                    : currentParsed.minutes === item.val;

                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mode === "hours") {
                        updateActiveTime(item.val, currentParsed.minutes, currentParsed.isPm);
                        setMode("minutes");
                      } else {
                        updateActiveTime(currentParsed.hour12, item.val, currentParsed.isPm);
                      }
                    }}
                    style={{ left: `${item.x}px`, top: `${item.y}px` }}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer z-10 select-none",
                      isSelected
                        ? "text-zinc-950 font-extrabold scale-110 z-20"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Simple Clean Date Display Badge */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#14151C] px-3 py-2 text-xs font-bold text-white">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-3.5 text-lime-400" />
          <span>{formattedDateDisplay}</span>
        </div>
      </div>
    </div>
  );
}
