"use client";

import { useEffect, useState } from "react";
import { Trash2, Play, Pause, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduledReport {
  id: string;
  report_type: string;
  channel: string;
  schedule_definition: any;
  enabled: boolean;
  next_run_at: string;
}

export function ReportsPanel({ sessionToken }: { sessionToken: string }) {
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    // Dummy fetch since we don't have the explicit endpoint for this in instructions
    // However, the AI Tools can do this via `report.schedule_list`.
    // In a real UI, this would fetch from a dedicated API endpoint.
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    // API call to toggle
  };

  const handleDelete = async (id: string) => {
    // API call to delete
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0C0C0E] text-zinc-100 overflow-hidden">
      <header className="flex h-14 items-center justify-between border-b border-zinc-800/80 px-6 shrink-0 bg-[#0C0C0E]/95 backdrop-blur-md">
        <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
          Scheduled Reports
        </h1>
        <Button variant="ghost" size="icon" onClick={fetchSchedules}>
          <RefreshCcw className="size-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="text-sm text-zinc-500">Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="text-sm text-zinc-500">No scheduled reports found.</div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase">{schedule.report_type.replace('_', ' ')}</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Frequency: {schedule.schedule_definition.frequency} | Channel: {schedule.channel}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Next run: {new Date(schedule.next_run_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-zinc-800 border-zinc-700 text-zinc-300"
                  onClick={() => handleToggle(schedule.id, schedule.enabled)}
                >
                  {schedule.enabled ? <Pause className="size-4 mr-2" /> : <Play className="size-4 mr-2" />}
                  {schedule.enabled ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-950/30 border-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300"
                  onClick={() => handleDelete(schedule.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
