"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  Calendar,
  Clock,
  Check,
  Star,
  Tag,
  Flag,
  RotateCw,
  Bell,
  CheckSquare,
  Sparkles,
  Layers,
  TrendingUp,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Task, TaskList, TaskPriority, TaskStatus } from "@/lib/types";
import {
  fetchTaskLists,
  fetchTasks,
  completeTask,
  cancelTask,
  deleteTask,
  updateTask,
} from "@/lib/tasks";
import { CreateTaskModal } from "./create-task-modal";
import { EditTaskModal } from "./edit-task-modal";

interface TasksPanelProps {
  sessionToken: string;
}

type TabCategory = "today" | "upcoming" | "all" | "completed" | "cancelled";

function formatDueDateDisplay(dueAtStr?: string | null): string {
  if (!dueAtStr) return "No due date";
  try {
    const d = new Date(dueAtStr);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const isTomorrow =
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear();

    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;

    const dateStr = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return dueAtStr;
  }
}

export function TasksPanel({ sessionToken }: TasksPanelProps) {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabCategory>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch task lists & tasks
      const [listRes, taskRes] = await Promise.all([
        fetchTaskLists(sessionToken).catch(() => ({ taskLists: [] })),
        fetchTasks(sessionToken).catch(() => ({ tasks: [] })),
      ]);

      setTaskLists(listRes.taskLists || []);
      setTasks(taskRes.tasks || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionToken]);

  // Tab Filtering & Search Logic
  const filteredTasks = useMemo(() => {
    let list = tasks;

    const todayStr = new Date().toISOString().split("T")[0];

    if (activeTab === "today") {
      list = list.filter((t) => t.due_at && t.due_at.startsWith(todayStr));
    } else if (activeTab === "upcoming") {
      list = list.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    } else if (activeTab === "completed") {
      list = list.filter((t) => t.status === "completed");
    } else if (activeTab === "cancelled") {
      list = list.filter((t) => t.status === "cancelled");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [tasks, activeTab, searchQuery]);

  const activeTaskCount = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;

  const handleToggleComplete = async (task: Task) => {
    const isCompleted = task.status === "completed";
    const nextStatus: TaskStatus = isCompleted ? "pending" : "completed";

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
    );

    try {
      if (isCompleted) {
        await updateTask(sessionToken, task.id, { status: "pending" });
      } else {
        await completeTask(sessionToken, task.id);
      }
    } catch {
      loadData();
    }
  };

  const handleToggleStar = async (task: Task) => {
    const nextStar = !task.is_important;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_important: nextStar } : t)),
    );
  };

  const handleChangeStatus = async (task: Task, newStatus: TaskStatus) => {
    setOpenMenuId(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );
    try {
      await updateTask(sessionToken, task.id, { status: newStatus });
    } catch {
      loadData();
    }
  };

  const handleDelete = async (taskId: string) => {
    setOpenMenuId(null);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(sessionToken, taskId);
    } catch {
      loadData();
    }
  };

  const getListName = (listId: string) => {
    const found = taskLists.find((l) => l.id === listId);
    return found ? found.name : "Work";
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#0A0B0E] p-4 sm:p-6 text-white select-none">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">Tasks Manager</h1>
            <span className="rounded-full border border-lime-400/40 bg-lime-400/15 px-2.5 py-0.5 text-xs font-bold text-lime-400">
              {activeTaskCount} {activeTaskCount === 1 ? "Task" : "Tasks"}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Organize, prioritize, and track your tasks
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData()}
            className="flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            title="Refresh tasks"
          >
            <RefreshCw className="size-4" />
          </button>
          <Button
            type="button"
            onClick={() => setIsCreateTaskOpen(true)}
            className="rounded-full bg-lime-400 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-lime-300 transition-all shadow-md cursor-pointer"
          >
            <Plus className="mr-1.5 size-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Tabs & Search Row */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-2xl border border-zinc-800/80 bg-[#12131A] p-1 text-xs">
          {(
            [
              { id: "today", label: "Today" },
              { id: "upcoming", label: "Upcoming" },
              { id: "all", label: "All" },
              { id: "completed", label: "Completed" },
              { id: "cancelled", label: "Cancelled" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-xl px-4 py-1.5 font-bold transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-lime-400 text-zinc-950 shadow-[0_0_10px_rgba(163,230,53,0.3)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex items-center rounded-xl border border-zinc-800 bg-[#12131A] px-3 py-2 sm:w-64">
          <Search className="size-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/40"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-[#12131A] p-10 text-center space-y-3">
            <AlertCircle className="size-8 text-red-400" />
            <h3 className="text-xs font-bold text-white">Couldn't load tasks</h3>
            <p className="text-xs text-zinc-400">{error}</p>
            <Button
              type="button"
              onClick={loadData}
              size="sm"
              className="rounded-xl bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 cursor-pointer"
            >
              Try Again
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800/80 bg-[#12131A] p-12 text-center my-6 space-y-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-lime-400/30 bg-lime-400/10 text-lime-400 shadow-md">
              <CheckSquare className="size-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No tasks found</h3>
              <p className="max-w-xs text-xs text-zinc-400 leading-relaxed">
                {searchQuery
                  ? "No tasks match your search filter."
                  : "All clear! Create a task to start tracking your work."}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setIsCreateTaskOpen(true)}
              className="rounded-full bg-lime-400 px-6 text-xs font-bold text-zinc-950 hover:bg-lime-300 shadow-md cursor-pointer"
            >
              <Plus className="mr-1.5 size-4" />
              Create Task
            </Button>
          </div>
        ) : (
          /* Reference Design Table Layout */
          <div className="space-y-2 pb-6">
            {/* Table Header Row */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/60">
              <div className="col-span-5 flex items-center gap-2">
                <span className="size-4 border border-zinc-700 rounded-sm" />
                <span>Task</span>
              </div>
              <div className="col-span-2">List</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-2">Due</div>
              <div className="col-span-2 text-right pr-4">Status</div>
            </div>

            {/* Table Data Rows */}
            {filteredTasks.map((task) => {
              const isCompleted = task.status === "completed";
              const listName = getListName(task.task_list_id);

              return (
                <div
                  key={task.id}
                  onClick={() => setEditingTask(task)}
                  className={cn(
                    "group relative grid grid-cols-12 items-center gap-3 rounded-2xl border px-4 py-3 text-xs transition-all duration-150 cursor-pointer",
                    isCompleted
                      ? "border-zinc-800/50 bg-[#101117]/60 opacity-60"
                      : "border-zinc-800/80 bg-[#12131A] hover:border-zinc-700 hover:bg-[#161722]",
                  )}
                >
                  {/* Column 1: Checkbox + Title + Description */}
                  <div className="col-span-5 flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(task);
                      }}
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer",
                        isCompleted
                          ? "border-lime-400 bg-lime-400 text-zinc-950 font-bold"
                          : "border-zinc-700 bg-zinc-900 hover:border-lime-400/60 text-transparent",
                      )}
                    >
                      <Check className="size-3 stroke-[3]" />
                    </button>

                    <div className="min-w-0 space-y-0.5">
                      <h3
                        className={cn(
                          "font-bold truncate leading-snug",
                          isCompleted ? "line-through text-zinc-500" : "text-white",
                        )}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-[11px] text-zinc-400 truncate max-w-sm">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Column 2: List Category Tag */}
                  <div className="col-span-2">
                    <span
                      className={cn(
                        "inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold capitalize border",
                        listName.toLowerCase().includes("work")
                          ? "bg-sky-400/10 text-sky-400 border-sky-400/30"
                          : listName.toLowerCase().includes("personal")
                            ? "bg-purple-400/10 text-purple-400 border-purple-400/30"
                            : listName.toLowerCase().includes("health")
                              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
                              : "bg-amber-400/10 text-amber-400 border-amber-400/30",
                      )}
                    >
                      {listName}
                    </span>
                  </div>

                  {/* Column 3: Priority */}
                  <div className="col-span-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-bold text-[11px] capitalize",
                        task.priority === "high" || task.priority === "urgent"
                          ? "text-red-400"
                          : task.priority === "medium"
                            ? "text-amber-400"
                            : "text-emerald-400",
                      )}
                    >
                      ↑ {task.priority}
                    </span>
                  </div>

                  {/* Column 4: Due Date */}
                  <div className="col-span-2 text-zinc-300 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{formatDueDateDisplay(task.due_at)}</span>
                    </div>
                  </div>

                  {/* Column 5: Status Badge + Star + Options */}
                  <div className="col-span-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize border",
                        task.status === "in_progress"
                          ? "bg-sky-400/15 text-sky-400 border-sky-400/30"
                          : task.status === "completed"
                            ? "bg-lime-400/15 text-lime-400 border-lime-400/30"
                            : task.status === "cancelled"
                              ? "bg-red-500/15 text-red-400 border-red-500/30"
                              : "bg-zinc-800 text-zinc-300 border-zinc-700/60",
                      )}
                    >
                      {task.status === "in_progress" ? "In Progress" : task.status}
                    </span>

                    {/* Star Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStar(task)}
                      className={cn(
                        "p-1 rounded-lg transition-colors cursor-pointer",
                        task.is_important
                          ? "text-amber-400"
                          : "text-zinc-500 hover:text-zinc-300",
                      )}
                    >
                      <Star className="size-3.5 fill-current" />
                    </button>

                    {/* Options Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>

                      {openMenuId === task.id && (
                        <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-2xl border border-zinc-800 bg-[#161722] p-1 shadow-2xl backdrop-blur-xl text-xs space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setEditingTask(task);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                          >
                            <Pencil className="size-3.5 text-zinc-400" />
                            Edit Task
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChangeStatus(task, "in_progress")}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sky-400 hover:bg-sky-400/10 transition-colors cursor-pointer"
                          >
                            <Clock className="size-3.5" />
                            In Progress
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChangeStatus(task, "completed")}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-lime-400 hover:bg-lime-400/10 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Complete
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* End of list message */}
            <div className="py-4 text-center text-xs font-semibold text-zinc-500">
              That&apos;s all for now! 🎉
            </div>
          </div>
        )}

        {/* Reference Design 4 Info Cards Row */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-zinc-800/60">
          <div className="flex gap-3 rounded-2xl border border-zinc-800/80 bg-[#12131A] p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
              <CheckSquare className="size-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">What is Task Manager?</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Keep track of all your tasks, set priorities, due dates, and reminders to get things done on time.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-zinc-800/80 bg-[#12131A] p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
              <Layers className="size-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Create & Organize</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Create tasks, assign them to lists, set priorities, and organize them your way.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-zinc-800/80 bg-[#12131A] p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
              <Bell className="size-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Stay on Track</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Get reminders, track progress, and never miss an important task again.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-zinc-800/80 bg-[#12131A] p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
              <TrendingUp className="size-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Boost Productivity</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Break down big goals into smaller tasks and achieve more every day with Calby.
              </p>
            </div>
          </div>
        </div>

        {/* Legend / Icons Used Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800/80 bg-[#12131A] px-4 py-3 text-[11px] font-medium text-zinc-400">
          <span className="font-bold text-zinc-300">Legend / Icons Used</span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="size-3 border border-zinc-600 rounded-sm" /> Task</span>
            <span className="flex items-center gap-1.5"><Calendar className="size-3 text-zinc-500" /> Due Date</span>
            <span className="flex items-center gap-1.5"><Flag className="size-3 text-zinc-500" /> Priority</span>
            <span className="flex items-center gap-1.5"><Tag className="size-3 text-zinc-500" /> Task List</span>
            <span className="flex items-center gap-1.5"><Bell className="size-3 text-zinc-500" /> Reminder</span>
            <span className="flex items-center gap-1.5"><RotateCw className="size-3 text-zinc-500" /> Repeat</span>
            <span className="flex items-center gap-1.5"><Circle className="size-3 text-zinc-500" /> Status</span>
            <span className="flex items-center gap-1.5"><Star className="size-3 text-amber-400 fill-amber-400" /> Important</span>
            <span className="flex items-center gap-1.5"><MoreVertical className="size-3 text-zinc-500" /> More Actions</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        sessionToken={sessionToken}
        taskLists={taskLists}
        onCreated={(newTask) => setTasks((prev) => [newTask, ...prev])}
      />

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
          sessionToken={sessionToken}
          taskLists={taskLists}
          onUpdated={(updatedTask) =>
            setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
          }
        />
      )}
    </div>
  );
}
