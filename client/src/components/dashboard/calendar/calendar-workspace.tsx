"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Maximize2,
  Minimize2,
  Plus,
  Search,
  Share2,
  Sparkles,
  Users,
  Video,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  ListTodo,
  Bell,
  CalendarDays,
  Grid3X3,
  Columns3,
  CalendarRange,
  LoaderCircle,
  Tag,
  Repeat,
  FileText,
  Volume2,
  Smile,
  Link as LinkIcon,
  UserPlus,
  Play,
  SlidersHorizontal,
  Globe,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClockTimePicker } from "./clock-time-picker";
import { CalendarBackground } from "./calendar-background";
import { MiniCalendar } from "./mini-calendar";
import { ConnectedCalendars } from "./connected-calendars";
import { Button } from "@/components/ui/button";
import { CalbyTooltip } from "@/components/ui/calby-tooltip";
import {
  CalendarEventItem,
  CalendarSummaryDTO,
  EventCategory,
  EventPriority,
  EventRecurrence,
  createCalendarEventApi,
  deleteCalendarEventApi,
  fetchCalendarEvents,
  fetchCalendarSummaryApi,
  updateCalendarEventApi,
} from "@/lib/calendar";
import { completeTask } from "@/lib/tasks";
import { previewRingtone, RingtoneOption, RINGTONE_LABELS } from "@/lib/alert-sound";
import { useUserPreferences } from "@/context/user-preferences-context";
import { useNotifications } from "@/context/notification-context";

type ViewMode = "month" | "week" | "day";

const HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const CATEGORY_COLORS: Record<
  EventCategory,
  { bg: string; border: string; text: string; ring: string; badgeBg: string }
> = {
  work: {
    bg: "bg-emerald-500/15 hover:bg-emerald-500/25",
    border: "border-l-emerald-400 border-emerald-500/30",
    text: "text-emerald-300",
    ring: "ring-emerald-400/30",
    badgeBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  meeting: {
    bg: "bg-sky-500/15 hover:bg-sky-500/25",
    border: "border-l-sky-400 border-sky-500/30",
    text: "text-sky-300",
    ring: "ring-sky-400/30",
    badgeBg: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  },
  personal: {
    bg: "bg-amber-500/15 hover:bg-amber-500/25",
    border: "border-l-amber-400 border-amber-500/30",
    text: "text-amber-300",
    ring: "ring-amber-400/30",
    badgeBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  focus: {
    bg: "bg-purple-500/15 hover:bg-purple-500/25",
    border: "border-l-purple-400 border-purple-500/30",
    text: "text-purple-300",
    ring: "ring-purple-400/30",
    badgeBg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  other: {
    bg: "bg-zinc-700/20 hover:bg-zinc-700/30",
    border: "border-l-zinc-400 border-zinc-600/30",
    text: "text-zinc-300",
    ring: "ring-zinc-400/30",
    badgeBg: "bg-zinc-700/30 text-zinc-300 border-zinc-600/30",
  },
};

type Props = {
  sessionToken: string;
  userLabel?: string;
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
  onAskCalby?: (prompt: string) => void;
  className?: string;
};

export function CalendarWorkspace({
  sessionToken,
  userLabel,
  isFullscreen,
  onExitFullscreen,
  onAskCalby,
  className,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Live Data State
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [summary, setSummary] = useState<CalendarSummaryDTO>({
    todayEvents: [],
    pendingTasks: [],
    activeReminders: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected Event / Detail Modal
  const [activeEvent, setActiveEvent] = useState<CalendarEventItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [showClockPicker, setShowClockPicker] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isStartTimePickerOpen, setIsStartTimePickerOpen] = useState<boolean>(false);
  const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState<boolean>(false);
  const [isRepeatPickerOpen, setIsRepeatPickerOpen] = useState<boolean>(false);
  const [isCustomRepeatOpen, setIsCustomRepeatOpen] = useState<boolean>(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(new Date());
  const [startTimeText, setStartTimeText] = useState<string>("");
  const [endTimeText, setEndTimeText] = useState<string>("");

  const dateTimeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dateTimeContainerRef.current &&
        !dateTimeContainerRef.current.contains(e.target as Node)
      ) {
        setIsDatePickerOpen(false);
        setIsStartTimePickerOpen(false);
        setIsEndTimePickerOpen(false);
        setIsRepeatPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Form State for Create/Edit Modal
  const [formData, setFormData] = useState({
    entryType: "event" as "event" | "task" | "appointment",
    title: "",
    description: "",
    location: "",
    category: "meeting" as EventCategory,
    priority: "medium" as EventPriority,
    startDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endDate: new Date().toISOString().split("T")[0],
    endTime: "10:00",
    allDay: false,
    timezone: "system",
    timezoneEnabled: false,
    repeatEnabled: false,
    priorityEnabled: false,
    alertEnabled: false,
    locationEnabled: false,
    attendeesEnabled: false,
    notesEnabled: false,
    recurrence: "none" as EventRecurrence,
    remindOption: "15" as "5" | "10" | "15" | "30" | "60" | "custom",
    customRemindMinutes: 15,
    ringtone: "calby_bell" as RingtoneOption,
    attendees: "",
    addGoogleMeet: false,
    syncToGoogle: false,
  });

  // Helper to parse user typed time string into HH:mm 24h format
  const parseTimeStringTo24h = useCallback((str: string): string | null => {
    if (!str) return null;
    const s = str.trim().toLowerCase();
    const ampmMatch = s.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/);
    if (!ampmMatch) return null;

    let h = parseInt(ampmMatch[1], 10);
    let m = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const ampm = ampmMatch[3];

    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;

    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, []);

  // Generate 15-minute start times (00:00 to 23:45)
  const startTimesList = useMemo(() => {
    const times: Array<{ time24: string; label: string }> = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const time24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        let hour12 = h % 12;
        if (hour12 === 0) hour12 = 12;
        const ampm = h >= 12 ? "pm" : "am";
        const label = `${hour12}:${String(m).padStart(2, "0")}${ampm}`;
        times.push({ time24, label });
      }
    }
    return times;
  }, []);

  // Generate end times with duration hints based on startTime
  const endTimeOptionsList = useMemo(() => {
    const [startH, startM] = (formData.startTime || "09:00").split(":").map(Number);
    const startTotalMins = (startH || 0) * 60 + (startM || 0);

    const times: Array<{ time24: string; label: string; durationHint: string }> = [];

    for (let step = 15; step <= 720; step += 15) {
      const endTotalMins = (startTotalMins + step) % (24 * 60);
      const endH = Math.floor(endTotalMins / 60);
      const endM = endTotalMins % 60;
      const time24 = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      let hour12 = endH % 12;
      if (hour12 === 0) hour12 = 12;
      const ampm = endH >= 12 ? "pm" : "am";
      const timeLabel = `${hour12}:${String(endM).padStart(2, "0")}${ampm}`;

      const hours = Math.floor(step / 60);
      const mins = step % 60;
      let hint = "";
      if (hours > 0 && mins > 0) hint = `${hours} hr ${mins} mins`;
      else if (hours > 0) hint = `${hours === 1 ? "1 hr" : `${hours} hrs`}`;
      else hint = `${mins} mins`;

      times.push({
        time24,
        label: timeLabel,
        durationHint: `${timeLabel} (${hint})`,
      });
    }
    return times;
  }, [formData.startTime]);

  // Calculate Date Range based on viewMode and selectedDate
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (viewMode === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "week") {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // Day view
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }, [selectedDate, viewMode]);

  // Fetch Events from real backend
  const loadEvents = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, summaryRes] = await Promise.all([
        fetchCalendarEvents(sessionToken, {
          start: dateRange.startIso,
          end: dateRange.endIso,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        }),
        fetchCalendarSummaryApi(sessionToken),
      ]);

      if (eventsRes.success) {
        setEvents(eventsRes.events);
      }
      if (summaryRes.success) {
        setSummary(summaryRes);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, dateRange, selectedCategory]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Filter events matching search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const { preferences } = useUserPreferences();
  const { refetchNotifications } = useNotifications();

  // Open Create Modal with default or pre-filled values
  const handleOpenCreateModal = (dateStr?: string, timeSlot?: string) => {
    const targetDate = dateStr || selectedDate.toISOString().split("T")[0];
    let startTime = "09:00";
    let endTime = "10:00";

    if (timeSlot) {
      const parts = timeSlot.split(" - ");
      if (parts[0]) startTime = parts[0].padStart(5, "0");
      if (parts[1]) endTime = parts[1].padStart(5, "0");
      else {
        const hour = parseInt(startTime.split(":")[0] || "9", 10);
        endTime = `${String(hour + 1).padStart(2, "0")}:00`;
      }
    }

    const defaultMin = preferences?.defaultReminderMinutes ?? 15;
    const defaultRingtone = ((preferences?.alertSound as string) || "calby_bell") as any;
    const standardOptions = [5, 10, 15, 30, 60];
    const isStandard = standardOptions.includes(defaultMin);

    setFormData({
      entryType: "event",
      title: "",
      description: "",
      location: "",
      category: "meeting",
      priority: "medium",
      startDate: targetDate,
      startTime,
      endDate: targetDate,
      endTime,
      allDay: false,
      timezone: "system",
      timezoneEnabled: false,
      repeatEnabled: false,
      priorityEnabled: false,
      alertEnabled: false,
      locationEnabled: false,
      attendeesEnabled: false,
      notesEnabled: false,
      recurrence: "none",
      remindOption: isStandard ? (String(defaultMin) as any) : "custom",
      customRemindMinutes: defaultMin,
      ringtone: defaultRingtone,
      attendees: "",
      addGoogleMeet: false,
      syncToGoogle: false,
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal for active event
  const handleOpenEditModal = (event: CalendarEventItem) => {
    const startObj = new Date(event.start);
    const endObj = new Date(event.end);
    const hasRepeat = Boolean(event.recurrence && event.recurrence !== "none");
    const hasPriority = Boolean(event.priority && event.priority !== "medium");
    const hasAlert = Boolean(event.remindMinutesBefore && event.remindMinutesBefore > 0);
    const hasLocation = Boolean(event.location && event.location.trim());
    const hasAttendees = Boolean(event.attendees && event.attendees.length > 0);
    const hasNotes = Boolean(event.description && event.description.trim());
    const standardOptions = [5, 10, 15, 30, 60];
    const isStandard = standardOptions.includes(event.remindMinutesBefore || 0);

    setFormData({
      entryType: "event",
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      category: event.category || "work",
      priority: event.priority || "medium",
      startDate: startObj.toISOString().split("T")[0],
      startTime: startObj.toTimeString().slice(0, 5),
      endDate: endObj.toISOString().split("T")[0],
      endTime: endObj.toTimeString().slice(0, 5),
      allDay: Boolean(event.allDay),
      timezone: "system",
      timezoneEnabled: false,
      repeatEnabled: hasRepeat,
      priorityEnabled: hasPriority,
      alertEnabled: hasAlert,
      locationEnabled: hasLocation,
      attendeesEnabled: hasAttendees,
      notesEnabled: hasNotes,
      recurrence: (event.recurrence as EventRecurrence) || "none",
      remindOption: hasAlert ? (isStandard ? (String(event.remindMinutesBefore) as any) : "custom") : "15",
      customRemindMinutes: event.remindMinutesBefore || 15,
      ringtone: ((event.metadata as any)?.ringtone as RingtoneOption) || "calby_bell",
      attendees: (event.attendees || []).map((a) => a.email || a.name).join(", "),
      addGoogleMeet: Boolean(event.metadata?.meetLink),
      syncToGoogle: false,
    });
    setIsEditModalOpen(true);
  };

  // Save New Event
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      const startIso = new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString();
      const endIso = new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString();
      const attendeeList = formData.attendees
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const finalRemindMinutes = formData.alertEnabled
        ? formData.remindOption === "custom"
          ? Math.max(1, Number(formData.customRemindMinutes) || 15)
          : Number(formData.remindOption)
        : 0;

      const res = await createCalendarEventApi(sessionToken, {
        title: formData.title.trim(),
        description: formData.notesEnabled ? formData.description.trim() || undefined : undefined,
        location: formData.locationEnabled ? formData.location.trim() || undefined : undefined,
        category: formData.category,
        priority: formData.priorityEnabled ? formData.priority : "medium",
        start: startIso,
        end: endIso,
        allDay: formData.allDay,
        recurrence: formData.repeatEnabled ? formData.recurrence : "none",
        remindMinutesBefore: finalRemindMinutes,
        ringtone: formData.ringtone,
        attendees: formData.attendeesEnabled ? attendeeList : [],
        addGoogleMeet: formData.addGoogleMeet,
        syncToGoogle: formData.syncToGoogle,
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        await loadEvents();
        await refetchNotifications();
      }
    } catch (err: any) {
      alert(err?.message || "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  // Update Event
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !formData.title.trim()) return;

    setSaving(true);
    try {
      const startIso = new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString();
      const endIso = new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString();
      const attendeeList = formData.attendees
        .split(",")
        .map((a) => ({ email: a.trim() }))
        .filter((a) => Boolean(a.email));

      const finalRemindMinutes = formData.alertEnabled
        ? formData.remindOption === "custom"
          ? Math.max(1, Number(formData.customRemindMinutes) || 15)
          : Number(formData.remindOption)
        : 0;

      const res = await updateCalendarEventApi(sessionToken, activeEvent.id, {
        title: formData.title.trim(),
        description: formData.notesEnabled ? formData.description.trim() || null : null,
        location: formData.locationEnabled ? formData.location.trim() || null : null,
        category: formData.category,
        priority: formData.priorityEnabled ? formData.priority : "medium",
        start: startIso,
        end: endIso,
        allDay: formData.allDay,
        recurrence: formData.repeatEnabled ? formData.recurrence : "none",
        remindMinutesBefore: finalRemindMinutes,
        ringtone: formData.ringtone,
        attendees: formData.attendeesEnabled ? attendeeList : [],
      });

      if (res.success) {
        setIsEditModalOpen(false);
        setActiveEvent(res.event);
        await loadEvents();
        await refetchNotifications();
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteCalendarEventApi(sessionToken, eventId);
      setActiveEvent(null);
      await loadEvents();
    } catch (err: any) {
      alert(err?.message || "Failed to delete event");
    }
  };

  // Complete Task quick action
  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(sessionToken, taskId);
      await loadEvents();
    } catch {
      // ignore
    }
  };

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Compute Week Days for Week View
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const startOfWeek = new Date(current.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const isToday = d.toDateString() === new Date().toDateString();
      const isSelected = d.toDateString() === selectedDate.toDateString();

      return {
        date: d,
        dayOfWeekIndex: d.getDay(),
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: d.getDate(),
        dateStr: d.toISOString().split("T")[0],
        isToday,
        isSelected,
      };
    });
  }, [selectedDate]);

  // Compute Month Days for Month View
  const monthGridDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayIndex = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDay.getDate();

    const days = [];
    // Previous month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }
    // Next month padding to fill complete weeks
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [selectedDate]);

  // Header Title
  const headerDateTitle = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className={cn("relative min-h-[calc(100vh-4rem)] w-full flex flex-col select-none", className)}>
      <CalendarBackground />

      {/* TOP WORKSPACE NAVIGATION & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl px-5 py-3.5 z-10">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shadow-sm">
              <CalendarIcon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">Calendar</h1>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">{headerDateTitle}</p>
            </div>
          </div>
        </div>

        {/* Center: Search & Category Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md mx-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule, meetings, tasks..."
              className="w-full rounded-xl border border-zinc-800 bg-[#121317] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-[#121317] px-2.5 py-1.5 text-xs text-zinc-300 focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/30 cursor-pointer"
          >
            <option value="all">All Tags</option>
            <option value="work">Work</option>
            <option value="meeting">Meetings</option>
            <option value="personal">Personal</option>
            <option value="focus">Focus</option>
          </select>
        </div>

        {/* Right: View Switcher, Navigation, New Event Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Switcher */}
          <div className="flex rounded-xl border border-zinc-800 bg-[#121317] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all",
                viewMode === "month"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all",
                viewMode === "week"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all",
                viewMode === "day"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Day
            </button>
          </div>

          {/* Prev / Today / Next */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-[#121317] p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Next"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* New Event Button */}
          <Button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="h-8 rounded-xl bg-lime-400 px-3.5 text-xs font-bold text-zinc-950 hover:bg-lime-300 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>New Event</span>
          </Button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadEvents}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-800 bg-[#121317] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            title="Refresh Schedule"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin text-lime-400")} />
          </button>
        </div>
      </div>

      {/* MAIN 2-COLUMN LAYOUT: SIDEBAR + CALENDAR VIEW GRID */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* LEFT SIDEBAR: MiniCalendar + Connected Calendars + Tasks & Reminders */}
        <div className="w-[280px] shrink-0 border-r border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md p-4 space-y-5 overflow-y-auto hidden lg:block">
          {/* Mini Calendar Navigator */}
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
            }}
          />

          <hr className="border-zinc-800/80" />

          {/* Google Calendar Connector */}
          <ConnectedCalendars sessionToken={sessionToken} />

          <hr className="border-zinc-800/80" />

          {/* UPCOMING TASKS (Live from backend) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                <ListTodo className="size-3.5 text-lime-400" />
                <span>Pending Tasks</span>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                {summary.pendingTasks.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {summary.pendingTasks.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-500 text-[11px]">
                  No pending tasks
                </div>
              ) : (
                summary.pendingTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2 text-xs transition-colors hover:border-zinc-700"
                  >
                    <button
                      type="button"
                      onClick={() => handleCompleteTask(task.id)}
                      className="mt-0.5 size-3.5 rounded border border-zinc-600 flex items-center justify-center hover:border-lime-400 hover:bg-lime-400/20 text-lime-400 transition-colors"
                      title="Mark as completed"
                    >
                      <CheckCircle2 className="size-2.5 opacity-0 group-hover:opacity-100" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-200">{task.title}</p>
                      {task.due_at && (
                        <p className="text-[10px] text-zinc-500">
                          Due {new Date(task.due_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="border-zinc-800/80" />

          {/* NEXT UP REMINDERS (Live from backend) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                <Bell className="size-3.5 text-amber-400" />
                <span>Next Up Reminders</span>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                {summary.activeReminders.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {summary.activeReminders.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-500 text-[11px]">
                  No active reminders
                </div>
              ) : (
                summary.activeReminders.slice(0, 3).map((rem) => (
                  <div
                    key={rem.id}
                    className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2 text-xs"
                  >
                    <div className="size-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-200">{rem.title}</p>
                      <p className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                        {new Date(rem.due_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT CALENDAR VIEW CONTAINER */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="size-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW: WEEK VIEW */}
          {viewMode === "week" && (
            <div className="w-full min-w-[640px] overflow-x-auto">
              {/* Days Header */}
              <div
                className="grid gap-2 mb-3 px-1"
                style={{ gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))" }}
              >
                <div className="text-xs text-zinc-500 font-mono" />
                {weekDays.map((item) => (
                  <div
                    key={item.dateStr}
                    onClick={() => {
                      setSelectedDate(item.date);
                      setViewMode("day");
                    }}
                    className={cn(
                      "rounded-xl py-2 px-1 text-center transition-all border cursor-pointer",
                      item.isToday
                        ? "bg-lime-400/10 border-lime-400/40 text-lime-400 shadow-sm"
                        : item.isSelected
                        ? "bg-zinc-800/80 border-zinc-700 text-white font-semibold"
                        : "border-transparent text-zinc-300 hover:bg-zinc-900/60"
                    )}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider block text-zinc-400">
                      {item.dayName}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold block",
                        item.isToday ? "text-lime-400" : "text-white"
                      )}
                    >
                      {item.dayNumber}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hourly Grid */}
              <div
                className="grid relative border border-zinc-800/80 rounded-2xl bg-zinc-950/50 backdrop-blur-sm overflow-hidden divide-y divide-zinc-800/40"
                style={{
                  gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))",
                  gridAutoRows: "64px",
                }}
              >
                {HOURS.map((hour, hourIdx) => {
                  const gridRow = hourIdx + 1;
                  const hourNum = parseInt(hour.slice(0, 2), 10);

                  return (
                    <div key={hour} className="contents">
                      {/* Hour Label */}
                      <div
                        className="flex items-center justify-end pr-3 text-[11px] font-mono text-zinc-500 border-r border-zinc-800/70 bg-[#0C0C0E]/40 select-none"
                        style={{ gridRow }}
                      >
                        {hour}
                      </div>

                      {/* 7 Day Columns */}
                      {weekDays.map((dayItem) => {
                        const dayEvents = filteredEvents.filter((evt) => {
                          const evtDate = new Date(evt.start);
                          return (
                            evtDate.toISOString().split("T")[0] === dayItem.dateStr &&
                            evtDate.getHours() === hourNum
                          );
                        });

                        return (
                          <div
                            key={`${dayItem.dateStr}-${hour}`}
                            className={cn(
                              "relative p-1 border-r border-zinc-800/40 last:border-r-0 hover:bg-zinc-900/30 transition-colors group",
                              dayItem.isToday && "bg-lime-400/[0.02]"
                            )}
                            style={{ gridRow }}
                          >
                            {dayEvents.length > 0 ? (
                              <div className="space-y-1 h-full">
                                {dayEvents.map((evt) => {
                                  const categoryStyle =
                                    CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.work;

                                  const startFormatted = new Date(evt.start).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  );
                                  const endFormatted = new Date(evt.end).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  });

                                  return (
                                    <div
                                      key={evt.id}
                                      onClick={() => setActiveEvent(evt)}
                                      className={cn(
                                        "h-full rounded-xl border border-l-4 p-1.5 cursor-pointer transition-all shadow-sm flex flex-col justify-between overflow-hidden",
                                        categoryStyle.bg,
                                        categoryStyle.border,
                                        activeEvent?.id === evt.id &&
                                          "ring-2 ring-lime-400 scale-[1.02] shadow-[0_0_12px_rgba(163,230,53,0.3)] z-20"
                                      )}
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                          <p className="text-[11px] font-bold text-white truncate">
                                            {evt.title}
                                          </p>
                                          {evt.source === "google" && (
                                            <span
                                              className="text-[9px] font-extrabold text-blue-400 shrink-0"
                                              title="Synced from Google Calendar"
                                            >
                                              G
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[9px] font-mono text-zinc-400 mt-0.5">
                                          {startFormatted} - {endFormatted}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* Empty Slot Quick Add Button */
                              <button
                                type="button"
                                onClick={() => handleOpenCreateModal(dayItem.dateStr, `${hour}:00`)}
                                className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg border border-dashed border-zinc-700 text-[10px] text-zinc-500 hover:text-lime-400 hover:border-lime-400/50 hover:bg-zinc-900/60 transition-all"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: MONTH VIEW */}
          {viewMode === "month" && (
            <div className="w-full space-y-2">
              {/* Day Headers (Mon - Sun) */}
              <div className="grid grid-cols-7 gap-2 px-1 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="text-xs font-bold text-zinc-400 uppercase py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-2">
                {monthGridDays.map(({ date, isCurrentMonth }, idx) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = date.toDateString() === selectedDate.toDateString();

                  const dayEvents = filteredEvents.filter(
                    (e) => new Date(e.start).toISOString().split("T")[0] === dateStr
                  );

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(date);
                      }}
                      className={cn(
                        "min-h-[105px] rounded-2xl border p-2 flex flex-col justify-between transition-all cursor-pointer",
                        isToday
                          ? "bg-lime-400/10 border-lime-400/40 shadow-sm"
                          : isSelected
                          ? "bg-zinc-800/70 border-zinc-600"
                          : isCurrentMonth
                          ? "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700"
                          : "bg-zinc-950/40 border-zinc-900 text-zinc-600"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-xs font-bold size-6 rounded-full flex items-center justify-center",
                            isToday
                              ? "bg-lime-400 text-zinc-950 font-black shadow-sm"
                              : isCurrentMonth
                              ? "text-zinc-200"
                              : "text-zinc-600"
                          )}
                        >
                          {date.getDate()}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreateModal(dateStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-lime-400 text-zinc-500 text-xs p-0.5"
                          title="Add event on this date"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      {/* Day's Event Badges */}
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 3).map((evt) => {
                          const categoryStyle =
                            CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.work;

                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveEvent(evt);
                              }}
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate border flex items-center gap-1",
                                categoryStyle.badgeBg
                              )}
                            >
                              <span className="size-1.5 rounded-full bg-current shrink-0" />
                              <span className="truncate">{evt.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] font-bold text-zinc-400 block px-1">
                            +{dayEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: DAY VIEW */}
          {viewMode === "day" && (
            <div className="w-full max-w-3xl space-y-4">
              <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                <div>
                  <h2 className="text-base font-bold text-white">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {filteredEvents.length} events scheduled for this day
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() =>
                    handleOpenCreateModal(selectedDate.toISOString().split("T")[0])
                  }
                  className="rounded-xl bg-lime-400 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-lime-300"
                >
                  <Plus className="size-3.5 mr-1" />
                  Add Event
                </Button>
              </div>

              {/* Day Hourly List */}
              <div className="space-y-2">
                {filteredEvents.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-12 text-center space-y-3">
                    <div className="size-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
                      <CalendarDays className="size-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">No Events on this Day</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Click "+ Add Event" or ask Calby AI to schedule your tasks.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredEvents.map((evt) => {
                    const categoryStyle =
                      CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.work;

                    const startTime = new Date(evt.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const endTime = new Date(evt.end).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={evt.id}
                        onClick={() => setActiveEvent(evt)}
                        className={cn(
                          "rounded-2xl border border-l-4 p-4 flex items-start justify-between gap-4 cursor-pointer transition-all hover:bg-zinc-900/60 shadow-sm",
                          categoryStyle.bg,
                          categoryStyle.border
                        )}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-white">{evt.title}</h3>
                            <span
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                categoryStyle.badgeBg
                              )}
                            >
                              {evt.category}
                            </span>
                            {evt.source === "google" && (
                              <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full">
                                Google Calendar
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5 text-zinc-500" />
                              {startTime} - {endTime}
                            </span>
                            {evt.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3.5 text-zinc-500" />
                                {evt.location}
                              </span>
                            )}
                          </div>

                          {evt.description && (
                            <p className="text-xs text-zinc-300 mt-1">{evt.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(evt);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Edit Event"
                          >
                            <Edit3 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(evt.id);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EVENT DETAILS / QUICK ACTION MODAL */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0E0F13] p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      (CATEGORY_COLORS[activeEvent.category] || CATEGORY_COLORS.work).badgeBg
                    )}
                  >
                    {activeEvent.category}
                  </span>
                  {activeEvent.source === "google" && (
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      Google Calendar
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white mt-1.5">{activeEvent.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveEvent(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Time & Location Details */}
            <div className="space-y-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="size-4 text-lime-400 shrink-0" />
                <span>
                  {new Date(activeEvent.start).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  -{" "}
                  {new Date(activeEvent.end).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {activeEvent.location && (
                <div className="flex items-center gap-2 text-zinc-300">
                  <MapPin className="size-4 text-sky-400 shrink-0" />
                  <span>{activeEvent.location}</span>
                </div>
              )}

              {activeEvent.remindMinutesBefore && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Bell className="size-4 text-amber-400 shrink-0" />
                  <span>Reminder: {activeEvent.remindMinutesBefore} minutes before</span>
                </div>
              )}
            </div>

            {/* Description */}
            {activeEvent.description && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-400">Description</p>
                <p className="text-xs text-zinc-200 leading-relaxed rounded-xl bg-zinc-900/40 p-3 border border-zinc-800/60">
                  {activeEvent.description}
                </p>
              </div>
            )}

            {/* Attendees */}
            {activeEvent.attendees && activeEvent.attendees.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-zinc-400">Attendees</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeEvent.attendees.map((a, i) => (
                    <span
                      key={i}
                      className="text-[11px] rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-zinc-200"
                    >
                      {a.email || a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleDeleteEvent(activeEvent.id)}
                className="text-red-400 hover:bg-red-950/30 hover:text-red-300 text-xs font-semibold"
              >
                <Trash2 className="size-3.5 mr-1" />
                Delete Event
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleOpenEditModal(activeEvent);
                  }}
                  className="rounded-xl border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  <Edit3 className="size-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveEvent(null)}
                  className="rounded-xl bg-lime-400 text-zinc-950 hover:bg-lime-300 text-xs font-bold px-4"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT EVENT MODAL (Google Calendar Inspired Design) */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800/90 bg-[#0D0E12] p-5 shadow-2xl space-y-4 my-auto max-h-[96vh] overflow-y-auto">
            {/* Header Drag & Close Bar */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 text-zinc-500">
                <SlidersHorizontal className="size-4" />
                <span className="text-[11px] font-semibold text-zinc-400">Calby Calendar</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="size-7 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={isCreateModalOpen ? handleSaveCreate : handleSaveEdit} className="space-y-4">
              {/* Title Field (Google Calendar Style Underlined Input) */}
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Add title"
                  className="w-full bg-transparent text-xl font-medium text-white placeholder:text-zinc-500 border-b border-zinc-800/90 pb-2 focus:border-lime-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Segmented Type Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#14151D] border border-zinc-800/80 w-fit">
                {[
                  { id: "event", label: "Event" },
                  { id: "task", label: "Task" },
                  { id: "appointment", label: "Appointment schedule", badge: "New" },
                ].map((tab) => {
                  const isSelected = formData.entryType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, entryType: tab.id as any })}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-lime-400 text-zinc-950 shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                      )}
                    >
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase",
                            isSelected ? "bg-zinc-950 text-lime-400" : "bg-lime-400/20 text-lime-400"
                          )}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Date & Time Row with Google Calendar-style Popovers */}
              <div ref={dateTimeContainerRef} className="space-y-2.5 p-3 rounded-2xl bg-[#12131A] border border-zinc-800/80">
                <div className="flex items-start gap-3">
                  <Clock className="size-4 text-zinc-400 shrink-0 mt-2" />

                  <div className="space-y-2.5 flex-1">
                    {/* Date & Time Buttons Row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Date Button & Popover */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !isDatePickerOpen;
                            if (nextState && formData.startDate) {
                              try {
                                const dateParts = formData.startDate.split("-").map(Number);
                                if (dateParts.length === 3) {
                                  setCalendarViewMonth(new Date(dateParts[0], dateParts[1] - 1, 1));
                                }
                              } catch {}
                            }
                            setIsDatePickerOpen(nextState);
                            setIsStartTimePickerOpen(false);
                            setIsEndTimePickerOpen(false);
                            setIsRepeatPickerOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                            isDatePickerOpen
                              ? "border-lime-400 bg-[#161722] text-white shadow-sm ring-1 ring-lime-400"
                              : "border-zinc-800 bg-[#161722] text-white hover:border-zinc-700"
                          )}
                        >
                          <span>
                            {(() => {
                              try {
                                const d = new Date(`${formData.startDate}T00:00:00`);
                                return d.toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                });
                              } catch {
                                return formData.startDate;
                              }
                            })()}
                          </span>
                          <ChevronDown className="size-3 text-zinc-400" />
                        </button>

                        {/* Mini Calendar Popover */}
                        {isDatePickerOpen && (
                          <div className="absolute top-full left-0 mt-1 z-50 p-3 rounded-2xl border border-zinc-800 bg-[#12131C] shadow-2xl space-y-2 w-[240px] animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                              <span className="text-xs font-bold text-white">
                                {calendarViewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const m = new Date(calendarViewMonth);
                                    m.setMonth(m.getMonth() - 1);
                                    setCalendarViewMonth(m);
                                  }}
                                  className="size-6 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                                >
                                  <ChevronLeft className="size-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const m = new Date(calendarViewMonth);
                                    m.setMonth(m.getMonth() + 1);
                                    setCalendarViewMonth(m);
                                  }}
                                  className="size-6 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                                >
                                  <ChevronRight className="size-3" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-zinc-500">
                              {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                                <span key={idx}>{day}</span>
                              ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                              {(() => {
                                const year = calendarViewMonth.getFullYear();
                                const month = calendarViewMonth.getMonth();
                                const firstDay = new Date(year, month, 1).getDay();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();

                                const cells = [];
                                for (let i = 0; i < firstDay; i++) {
                                  cells.push(<div key={`empty-${i}`} />);
                                }
                                for (let d = 1; d <= daysInMonth; d++) {
                                  const monthStr = String(month + 1).padStart(2, "0");
                                  const dayStr = String(d).padStart(2, "0");
                                  const dateStr = `${year}-${monthStr}-${dayStr}`;
                                  const isSelected = dateStr === formData.startDate;
                                  cells.push(
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => {
                                        setFormData({ ...formData, startDate: dateStr, endDate: dateStr });
                                        setIsDatePickerOpen(false);
                                      }}
                                      className={cn(
                                        "size-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all cursor-pointer mx-auto",
                                        isSelected
                                          ? "bg-lime-400 text-zinc-950 font-bold shadow-sm scale-105"
                                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                      )}
                                    >
                                      {d}
                                    </button>
                                  );
                                }
                                return cells;
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {!formData.allDay && (
                        <>
                          {/* Start Time Pill with Typing Input & Popover */}
                          <div className="relative">
                            <input
                              type="text"
                              value={
                                isStartTimePickerOpen
                                  ? startTimeText
                                  : (() => {
                                      const [h, m] = (formData.startTime || "09:00").split(":").map(Number);
                                      let hour12 = (h || 0) % 12;
                                      if (hour12 === 0) hour12 = 12;
                                      const ampm = (h || 0) >= 12 ? "pm" : "am";
                                      return `${hour12}:${String(m || 0).padStart(2, "0")}${ampm}`;
                                    })()
                              }
                              onFocus={() => {
                                setIsStartTimePickerOpen(true);
                                setIsDatePickerOpen(false);
                                setIsEndTimePickerOpen(false);
                                setIsRepeatPickerOpen(false);
                                const [h, m] = (formData.startTime || "09:00").split(":").map(Number);
                                let hour12 = (h || 0) % 12;
                                if (hour12 === 0) hour12 = 12;
                                const ampm = (h || 0) >= 12 ? "pm" : "am";
                                setStartTimeText(`${hour12}:${String(m || 0).padStart(2, "0")}${ampm}`);
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                setStartTimeText(val);
                                const parsed = parseTimeStringTo24h(val);
                                if (parsed) {
                                  setFormData({ ...formData, startTime: parsed });
                                }
                              }}
                              className={cn(
                                "w-20 px-2 py-1.5 rounded-xl border text-xs font-bold text-center transition-all cursor-text focus:outline-none",
                                isStartTimePickerOpen
                                  ? "border-lime-400 bg-[#161722] text-lime-400 ring-1 ring-lime-400"
                                  : "border-zinc-800 bg-[#161722] text-lime-400 hover:border-zinc-700"
                              )}
                            />

                            {/* Start Time Popover (Custom Tuner + 15m Presets) */}
                            {isStartTimePickerOpen && (
                              <div className="absolute top-full left-0 mt-1 z-50 rounded-2xl border border-zinc-800 bg-[#12131C] shadow-2xl w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                {/* Tuner Bar */}
                                {(() => {
                                  const [h, m] = (formData.startTime || "09:00").split(":").map(Number);
                                  const isPm = (h || 0) >= 12;
                                  let hour12 = (h || 0) % 12;
                                  if (hour12 === 0) hour12 = 12;

                                  const updateStartHMAPM = (newH12: number, newM: number, newIsPm: boolean) => {
                                    let h24 = newH12 % 12;
                                    if (newIsPm) h24 += 12;
                                    const time24 = `${String(h24).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
                                    setFormData({ ...formData, startTime: time24 });
                                  };

                                  return (
                                    <div className="p-2 border-b border-zinc-800 bg-[#161720] space-y-1.5">
                                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 text-center">
                                        Hours : Minutes
                                      </div>
                                      <div className="flex items-center justify-center gap-1">
                                        <select
                                          value={hour12}
                                          onChange={(e) => updateStartHMAPM(Number(e.target.value), m || 0, isPm)}
                                          className="bg-zinc-900 border border-zinc-700 text-lime-400 font-mono text-xs font-bold rounded-lg px-1.5 py-1 focus:border-lime-400 focus:outline-none cursor-pointer"
                                        >
                                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hOpt) => (
                                            <option key={hOpt} value={hOpt}>
                                              {String(hOpt).padStart(2, "0")}
                                            </option>
                                          ))}
                                        </select>

                                        <span className="text-zinc-500 font-bold">:</span>

                                        <select
                                          value={m || 0}
                                          onChange={(e) => updateStartHMAPM(hour12, Number(e.target.value), isPm)}
                                          className="bg-zinc-900 border border-zinc-700 text-lime-400 font-mono text-xs font-bold rounded-lg px-1.5 py-1 focus:border-lime-400 focus:outline-none cursor-pointer"
                                        >
                                          {Array.from({ length: 60 }, (_, i) => i).map((mOpt) => (
                                            <option key={mOpt} value={mOpt}>
                                              {String(mOpt).padStart(2, "0")}
                                            </option>
                                          ))}
                                        </select>

                                        <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 ml-0.5">
                                          <button
                                            type="button"
                                            onClick={() => updateStartHMAPM(hour12, m || 0, false)}
                                            className={cn(
                                              "px-1.5 py-0.5 rounded text-[10px] font-extrabold cursor-pointer transition-all",
                                              !isPm ? "bg-lime-400 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"
                                            )}
                                          >
                                            AM
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => updateStartHMAPM(hour12, m || 0, true)}
                                            className={cn(
                                              "px-1.5 py-0.5 rounded text-[10px] font-extrabold cursor-pointer transition-all",
                                              isPm ? "bg-lime-400 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"
                                            )}
                                          >
                                            PM
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Preset List */}
                                <div className="max-h-40 overflow-y-auto py-1 no-scrollbar">
                                  {startTimesList.map((item) => {
                                    const isSelected = item.time24 === formData.startTime;
                                    return (
                                      <button
                                        key={item.time24}
                                        type="button"
                                        onClick={() => {
                                          setFormData({ ...formData, startTime: item.time24 });
                                          setIsStartTimePickerOpen(false);
                                        }}
                                        className={cn(
                                          "w-full px-3 py-1.5 text-left text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
                                          isSelected
                                            ? "bg-[#1E202B] text-lime-400 font-bold border-l-2 border-lime-400"
                                            : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
                                        )}
                                      >
                                        <span>{item.label}</span>
                                        {isSelected && <Check className="size-3 text-lime-400" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <span className="text-zinc-500 font-bold">–</span>

                          {/* End Time Pill with Typing Input & Popover */}
                          <div className="relative">
                            <input
                              type="text"
                              value={
                                isEndTimePickerOpen
                                  ? endTimeText
                                  : (() => {
                                      const [h, m] = (formData.endTime || "10:00").split(":").map(Number);
                                      let hour12 = (h || 0) % 12;
                                      if (hour12 === 0) hour12 = 12;
                                      const ampm = (h || 0) >= 12 ? "pm" : "am";
                                      return `${hour12}:${String(m || 0).padStart(2, "0")}${ampm}`;
                                    })()
                              }
                              onFocus={() => {
                                setIsEndTimePickerOpen(true);
                                setIsDatePickerOpen(false);
                                setIsStartTimePickerOpen(false);
                                setIsRepeatPickerOpen(false);
                                const [h, m] = (formData.endTime || "10:00").split(":").map(Number);
                                let hour12 = (h || 0) % 12;
                                if (hour12 === 0) hour12 = 12;
                                const ampm = (h || 0) >= 12 ? "pm" : "am";
                                setEndTimeText(`${hour12}:${String(m || 0).padStart(2, "0")}${ampm}`);
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEndTimeText(val);
                                const parsed = parseTimeStringTo24h(val);
                                if (parsed) {
                                  setFormData({ ...formData, endTime: parsed });
                                }
                              }}
                              className={cn(
                                "w-20 px-2 py-1.5 rounded-xl border text-xs font-bold text-center transition-all cursor-text focus:outline-none",
                                isEndTimePickerOpen
                                  ? "border-lime-400 bg-[#161722] text-lime-400 ring-1 ring-lime-400"
                                  : "border-zinc-800 bg-[#161722] text-lime-400 hover:border-zinc-700"
                              )}
                            />

                            {/* End Time Popover */}
                            {isEndTimePickerOpen && (
                              <div className="absolute top-full left-0 mt-1 z-50 rounded-2xl border border-zinc-800 bg-[#12131C] shadow-2xl w-52 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                {/* Tuner Bar */}
                                {(() => {
                                  const [h, m] = (formData.endTime || "10:00").split(":").map(Number);
                                  const isPm = (h || 0) >= 12;
                                  let hour12 = (h || 0) % 12;
                                  if (hour12 === 0) hour12 = 12;

                                  const updateEndHMAPM = (newH12: number, newM: number, newIsPm: boolean) => {
                                    let h24 = newH12 % 12;
                                    if (newIsPm) h24 += 12;
                                    const time24 = `${String(h24).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
                                    setFormData({ ...formData, endTime: time24 });
                                  };

                                  return (
                                    <div className="p-2 border-b border-zinc-800 bg-[#161720] space-y-1.5">
                                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 text-center">
                                        Hours : Minutes
                                      </div>
                                      <div className="flex items-center justify-center gap-1">
                                        <select
                                          value={hour12}
                                          onChange={(e) => updateEndHMAPM(Number(e.target.value), m || 0, isPm)}
                                          className="bg-zinc-900 border border-zinc-700 text-lime-400 font-mono text-xs font-bold rounded-lg px-1.5 py-1 focus:border-lime-400 focus:outline-none cursor-pointer"
                                        >
                                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hOpt) => (
                                            <option key={hOpt} value={hOpt}>
                                              {String(hOpt).padStart(2, "0")}
                                            </option>
                                          ))}
                                        </select>

                                        <span className="text-zinc-500 font-bold">:</span>

                                        <select
                                          value={m || 0}
                                          onChange={(e) => updateEndHMAPM(hour12, Number(e.target.value), isPm)}
                                          className="bg-zinc-900 border border-zinc-700 text-lime-400 font-mono text-xs font-bold rounded-lg px-1.5 py-1 focus:border-lime-400 focus:outline-none cursor-pointer"
                                        >
                                          {Array.from({ length: 60 }, (_, i) => i).map((mOpt) => (
                                            <option key={mOpt} value={mOpt}>
                                              {String(mOpt).padStart(2, "0")}
                                            </option>
                                          ))}
                                        </select>

                                        <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 ml-0.5">
                                          <button
                                            type="button"
                                            onClick={() => updateEndHMAPM(hour12, m || 0, false)}
                                            className={cn(
                                              "px-1.5 py-0.5 rounded text-[10px] font-extrabold cursor-pointer transition-all",
                                              !isPm ? "bg-lime-400 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"
                                            )}
                                          >
                                            AM
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => updateEndHMAPM(hour12, m || 0, true)}
                                            className={cn(
                                              "px-1.5 py-0.5 rounded text-[10px] font-extrabold cursor-pointer transition-all",
                                              isPm ? "bg-lime-400 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"
                                            )}
                                          >
                                            PM
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Preset List with Durations */}
                                <div className="max-h-40 overflow-y-auto py-1 no-scrollbar">
                                  {endTimeOptionsList.map((item) => {
                                    const isSelected = item.time24 === formData.endTime;
                                    return (
                                      <button
                                        key={item.time24}
                                        type="button"
                                        onClick={() => {
                                          setFormData({ ...formData, endTime: item.time24 });
                                          setIsEndTimePickerOpen(false);
                                        }}
                                        className={cn(
                                          "w-full px-3 py-1.5 text-left text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
                                          isSelected
                                            ? "bg-[#1E202B] text-lime-400 font-bold border-l-2 border-lime-400"
                                            : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
                                        )}
                                      >
                                        <span>{item.durationHint}</span>
                                        {isSelected && <Check className="size-3 text-lime-400" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Sub-row: All-Day Checkbox & Timezone Link */}
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allDay}
                          onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                          className="rounded border-zinc-700 bg-zinc-900 text-lime-400 focus:ring-lime-400 size-3.5 cursor-pointer"
                        />
                        <span>All day</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, timezoneEnabled: !formData.timezoneEnabled })}
                        className="text-xs font-semibold text-lime-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Globe className="size-3" />
                        <span>Time zone</span>
                      </button>
                    </div>

                    {/* Timezone Selector Dropdown */}
                    {formData.timezoneEnabled && (
                      <div className="pt-1 animate-in fade-in duration-150">
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full rounded-xl border border-zinc-800 bg-[#161722] px-3 py-1.5 text-xs text-white focus:border-lime-400 focus:outline-none cursor-pointer"
                        >
                          <option value="system">
                            System Default ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                          </option>
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                        </select>
                      </div>
                    )}

                    {/* Repeat Pill Button & Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRepeatPickerOpen(!isRepeatPickerOpen);
                          setIsDatePickerOpen(false);
                          setIsStartTimePickerOpen(false);
                          setIsEndTimePickerOpen(false);
                        }}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-zinc-800 bg-[#161722] hover:border-zinc-700 text-xs font-medium text-white transition-all cursor-pointer w-fit min-w-[150px]"
                      >
                        <span>
                          {formData.recurrence === "none"
                            ? "Does not repeat"
                            : formData.recurrence === "daily"
                            ? "Daily"
                            : formData.recurrence === "weekly"
                            ? "Weekly"
                            : formData.recurrence === "monthly"
                            ? "Monthly"
                            : formData.recurrence === "yearly"
                            ? "Annually"
                            : "Custom"}
                        </span>
                        <ChevronDown className="size-3 text-zinc-400" />
                      </button>

                      {/* Repeat Options Popover */}
                      {isRepeatPickerOpen && (
                        <div className="absolute top-full left-0 mt-1 z-50 py-1 rounded-2xl border border-zinc-800 bg-[#12131C] shadow-2xl w-56 animate-in fade-in zoom-in-95 duration-150">
                          {[
                            { id: "none", label: "Does not repeat" },
                            { id: "daily", label: "Daily" },
                            { id: "weekly", label: "Weekly" },
                            { id: "monthly", label: "Monthly" },
                            { id: "yearly", label: "Annually" },
                            { id: "custom", label: "Custom..." },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setIsRepeatPickerOpen(false);
                                if (opt.id === "custom") {
                                  setIsCustomRepeatOpen(true);
                                } else {
                                  setFormData({
                                    ...formData,
                                    recurrence: opt.id as EventRecurrence,
                                    repeatEnabled: opt.id !== "none",
                                  });
                                }
                              }}
                              className={cn(
                                "w-full px-3.5 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
                                formData.recurrence === opt.id
                                  ? "bg-[#1E202B] text-lime-400 font-bold border-l-2 border-lime-400"
                                  : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
                              )}
                            >
                              <span>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Clock Picker (Optional Toggle) */}
              {showClockPicker && (
                <div className="animate-in fade-in duration-150">
                  <ClockTimePicker
                    startDate={formData.startDate}
                    startTime={formData.startTime}
                    endDate={formData.endDate}
                    endTime={formData.endTime}
                    allDay={formData.allDay}
                    onStartChange={(d, t) => setFormData((prev) => ({ ...prev, startDate: d, startTime: t }))}
                    onEndChange={(d, t) => setFormData((prev) => ({ ...prev, endDate: d, endTime: t }))}
                    onAllDayToggle={(val) => setFormData((prev) => ({ ...prev, allDay: val }))}
                  />
                </div>
              )}

              {/* Collapsible Action Items List */}
              <div className="space-y-1 pt-1">
                {/* 1. Add Guests */}
                {!formData.attendeesEnabled ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, attendeesEnabled: true })}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer text-left"
                  >
                    <Users className="size-4 text-zinc-400 shrink-0" />
                    <span>Add guests</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-2xl border border-zinc-800 bg-[#12131A] space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Users className="size-4 text-lime-400" />
                        Add Guests (Emails)
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, attendeesEnabled: false, attendees: "" })}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.attendees}
                      onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                      placeholder="alex@company.com, sarah@calby.ai"
                      className="w-full rounded-xl border border-zinc-800 bg-[#161722] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none"
                    />
                  </div>
                )}

                {/* 2. Add Google Meet Video Conferencing */}
                {!formData.addGoogleMeet ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, addGoogleMeet: true, location: "Google Meet", locationEnabled: true })}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold text-lime-400 hover:bg-lime-400/10 transition-colors cursor-pointer text-left"
                  >
                    <Video className="size-4 text-lime-400 shrink-0" />
                    <span>Add Google Meet video conferencing</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-lime-400/30 bg-lime-400/10 text-xs font-bold text-lime-400">
                    <div className="flex items-center gap-2">
                      <Video className="size-4" />
                      <span>Google Meet video link will be created</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, addGoogleMeet: false })}
                      className="text-zinc-400 hover:text-white text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* 3. Add Location */}
                {!formData.locationEnabled ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, locationEnabled: true })}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer text-left"
                  >
                    <MapPin className="size-4 text-zinc-400 shrink-0" />
                    <span>Add location</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-2xl border border-zinc-800 bg-[#12131A] space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <MapPin className="size-4 text-lime-400" />
                        Location
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, locationEnabled: false, location: "" })}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Conference Room 2, Zoom, Starbucks"
                      className="w-full rounded-xl border border-zinc-800 bg-[#161722] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none"
                    />
                  </div>
                )}

                {/* 4. Add Description or Prep Notes */}
                {!formData.notesEnabled ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, notesEnabled: true })}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer text-left"
                  >
                    <FileText className="size-4 text-zinc-400 shrink-0" />
                    <span>Add description or prep notes</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-2xl border border-zinc-800 bg-[#12131A] space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <FileText className="size-4 text-lime-400" />
                        Description / Prep Notes
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, notesEnabled: false, description: "" })}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Add details, talking points, or prep notes..."
                        className="w-full rounded-xl border border-zinc-800 bg-[#161722] p-2.5 pr-8 text-xs text-white placeholder:text-zinc-600 focus:border-lime-400 focus:outline-none resize-none"
                      />
                      <div className="absolute bottom-2.5 right-3 text-lime-400 cursor-pointer hover:opacity-80" title="AI suggestion">
                        <Sparkles className="size-3.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Notify & Remind */}
                {!formData.alertEnabled ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, alertEnabled: true })}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer text-left"
                  >
                    <Bell className="size-4 text-zinc-400 shrink-0" />
                    <span>Notify & Remind</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-2xl border border-zinc-800 bg-[#12131A] space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Bell className="size-4 text-lime-400" />
                        Alert & Reminders
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, alertEnabled: false })}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Remind me</span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { id: "5", label: "5m before" },
                          { id: "10", label: "10m before" },
                          { id: "15", label: "15m before" },
                          { id: "30", label: "30m before" },
                          { id: "60", label: "1h before" },
                          { id: "custom", label: "Custom" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, remindOption: opt.id as any })}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer select-none",
                              formData.remindOption === opt.id
                                ? "bg-lime-400 text-zinc-950 border-lime-400"
                                : "bg-[#161722] border-zinc-800 text-zinc-400 hover:text-white"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Ringtone</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={formData.ringtone}
                          onChange={(e) => setFormData({ ...formData, ringtone: e.target.value as RingtoneOption })}
                          className="flex-1 rounded-xl border border-zinc-800 bg-[#161722] px-3 py-1.5 text-xs text-white focus:border-lime-400 cursor-pointer"
                        >
                          {RINGTONE_LABELS.map((rt) => (
                            <option key={rt.id} value={rt.id}>
                              {rt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => previewRingtone(formData.ringtone)}
                          className="size-8 rounded-xl bg-zinc-900 border border-zinc-700 text-lime-400 hover:bg-zinc-800 flex items-center justify-center cursor-pointer shrink-0"
                        >
                          <Play className="size-3.5 fill-lime-400 text-lime-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Priority & Category */}
                {!formData.priorityEnabled ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priorityEnabled: true })}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer text-left"
                  >
                    <Tag className="size-4 text-zinc-400 shrink-0" />
                    <span>Priority & Category</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-2xl border border-zinc-800 bg-[#12131A] space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Tag className="size-4 text-lime-400" />
                        Priority & Category
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, priorityEnabled: false })}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Priority</span>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as EventPriority })}
                          className="w-full mt-1 rounded-xl border border-zinc-800 bg-[#161722] px-2.5 py-1.5 text-xs text-white focus:border-lime-400 cursor-pointer"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Category</span>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                          className="w-full mt-1 rounded-xl border border-zinc-800 bg-[#161722] px-2.5 py-1.5 text-xs text-white focus:border-lime-400 cursor-pointer"
                        >
                          <option value="work">Work</option>
                          <option value="meeting">Meeting</option>
                          <option value="personal">Personal</option>
                          <option value="focus">Focus Block</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowClockPicker(!showClockPicker)}
                  className="text-xs font-bold text-lime-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="size-3.5" />
                  <span>{showClockPicker ? "Hide Clock Dial" : "Visual Clock Dial"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="rounded-full border-zinc-700 bg-transparent text-xs font-semibold text-zinc-300 hover:bg-zinc-800 px-5 h-9 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-[#a3e635] text-zinc-950 hover:bg-[#86efac] text-xs font-bold px-6 h-9 transition-all shadow-md cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle className="size-3.5 animate-spin mr-1.5" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{isCreateModalOpen ? "Save" : "Save Changes"}</span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM RECURRENCE MODAL (Google Calendar Inspired) */}
      {isCustomRepeatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#12131A] p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Custom recurrence</h3>

            {/* Repeat Every */}
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <span>Repeat every</span>
              <input
                type="number"
                min={1}
                max={99}
                defaultValue={1}
                className="w-12 rounded-xl border border-zinc-800 bg-[#1A1C28] px-2 py-1 text-center font-bold text-lime-400 focus:outline-none"
              />
              <select className="rounded-xl border border-zinc-800 bg-[#1A1C28] px-3 py-1 text-xs text-white focus:outline-none cursor-pointer">
                <option value="day">day</option>
                <option value="week">week</option>
                <option value="month">month</option>
                <option value="year">year</option>
              </select>
            </div>

            {/* Repeat On Days */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-400">Repeat on</span>
              <div className="flex items-center justify-between gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => {
                  const isSelected = idx === 5; // Friday default
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={cn(
                        "size-7 rounded-full text-xs font-bold transition-all cursor-pointer",
                        isSelected
                          ? "bg-lime-400 text-zinc-950 shadow-sm"
                          : "bg-zinc-900 text-zinc-400 hover:text-white"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ends */}
            <div className="space-y-2 text-xs text-zinc-300">
              <span className="font-semibold text-zinc-400">Ends</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="custom-ends" defaultChecked className="accent-lime-400" />
                <span>Never</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="custom-ends" className="accent-lime-400" />
                <span>On {formData.startDate}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="custom-ends" className="accent-lime-400" />
                <span>After 13 occurrences</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomRepeatOpen(false)}
                className="rounded-full border-zinc-700 bg-transparent text-xs text-zinc-300 px-4 h-8 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, recurrence: "weekly", repeatEnabled: true });
                  setIsCustomRepeatOpen(false);
                }}
                className="rounded-full bg-lime-400 text-zinc-950 font-bold text-xs px-5 h-8 hover:bg-lime-300 cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
