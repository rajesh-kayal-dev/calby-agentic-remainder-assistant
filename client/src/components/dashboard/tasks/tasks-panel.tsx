"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ListTodo,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  User,
  Calendar,
  Clock,
  ChevronRight,
  FolderPlus,
  Play,
  Pause,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Task, TaskList, TaskPriority, TaskStatus, TaskListStatus } from "@/lib/types";
import {
  fetchTaskLists,
  fetchTasks,
  completeTask,
  cancelTask,
  deleteTask,
  deleteTaskList,
  updateTask,
} from "@/lib/tasks";
import { fetchContactsApi, Contact } from "@/lib/contacts";
import { deleteReminderApi } from "@/lib/reminders";
import { CreateTaskListModal } from "./create-task-list-modal";
import { CreateTaskModal } from "./create-task-modal";
import { EditTaskModal } from "./edit-task-modal";
import { CreateReminderModal } from "../reminders/create-reminder-modal";
import { EditReminderModal } from "../reminders/edit-reminder-modal";

interface TasksPanelProps {
  sessionToken: string;
}

type FilterStatus = "all" | "pending" | "in_progress" | "completed" | "cancelled";

export function TasksPanel({ sessionToken }: TasksPanelProps) {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openListMenuId, setOpenListMenuId] = useState<string | null>(null);

  // Reminder Modals State
  const [isCreateReminderOpen, setIsCreateReminderOpen] = useState(false);
  const [isEditReminderOpen, setIsEditReminderOpen] = useState(false);
  const [reminderTaskId, setReminderTaskId] = useState<string | undefined>(undefined);
  const [reminderDefaultTitle, setReminderDefaultTitle] = useState("");
  const [editingReminder, setEditingReminder] = useState<any | null>(null);

  const loadData = async (selectNewListId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Load Task Lists
      const listRes = await fetchTaskLists(sessionToken);
      const lists = listRes.taskLists || [];
      setTaskLists(lists);

      // 2. Set selected list
      let activeListId = selectedListId;
      if (selectNewListId) {
        activeListId = selectNewListId;
        setSelectedListId(selectNewListId);
      } else if (!activeListId && lists.length > 0) {
        activeListId = lists[0].id;
        setSelectedListId(lists[0].id);
      }

      // 3. Load Tasks for active list
      if (activeListId) {
        const taskRes = await fetchTasks(sessionToken, { taskListId: activeListId });
        setTasks(taskRes.tasks || []);
      } else {
        setTasks([]);
      }

      // 4. Load Contacts (for name resolution)
      const contactRes = await fetchContactsApi(sessionToken);
      setContacts(contactRes.contacts || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load tasks data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionToken]);

  // Handle changing active list
  const handleSelectList = async (listId: string) => {
    setSelectedListId(listId);
    setIsLoading(true);
    setOpenMenuId(null);
    setOpenListMenuId(null);
    try {
      const taskRes = await fetchTasks(sessionToken, { taskListId: listId });
      setTasks(taskRes.tasks || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const currentList = useMemo(() => {
    return taskLists.find((l) => l.id === selectedListId) || null;
  }, [taskLists, selectedListId]);

  // Filtering & Search
  const filteredTasks = useMemo(() => {
    let list = tasks;

    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
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
  }, [tasks, statusFilter, searchQuery]);

  // Contacts mapping helper
  const getContactName = (contactId: string | null) => {
    if (!contactId) return null;
    const c = contacts.find((contact) => contact.id === contactId);
    return c ? c.name : null;
  };

  // Handlers for task mutations
  const handleToggleComplete = async (task: Task) => {
    const isCompleted = task.status === "completed";
    const newStatus: TaskStatus = isCompleted ? "pending" : "completed";
    const completedAt = isCompleted ? null : new Date().toISOString();

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: newStatus,
              completed_at: completedAt,
              reminder_status: newStatus === "completed" && t.reminder_id ? "cancelled" : t.reminder_status,
            }
          : t,
      ),
    );

    try {
      if (isCompleted) {
        // Revert to pending
        await updateTask(sessionToken, task.id, { status: "pending" });
      } else {
        await completeTask(sessionToken, task.id);
      }
    } catch {
      // Rollback
      handleSelectList(selectedListId);
    }
  };

  const handleCancelTask = async (id: string) => {
    setOpenMenuId(null);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "cancelled" as TaskStatus,
              reminder_status: t.reminder_id ? "cancelled" : t.reminder_status,
            }
          : t,
      ),
    );
    try {
      await cancelTask(sessionToken, id);
    } catch {
      handleSelectList(selectedListId);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setOpenMenuId(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTask(sessionToken, id);
    } catch {
      handleSelectList(selectedListId);
    }
  };

  const handleSetReminder = (task: Task) => {
    setOpenMenuId(null);
    setReminderTaskId(task.id);
    setReminderDefaultTitle(task.title);
    setIsCreateReminderOpen(true);
  };

  const handleEditReminder = (task: Task) => {
    setOpenMenuId(null);
    if (!task.reminder_id || !task.reminder_due_at) return;

    const dummyReminder = {
      id: task.reminder_id,
      title: task.title,
      description: task.description || "",
      due_at: task.reminder_due_at,
      next_run_at: task.reminder_due_at,
      status: (task.reminder_status as any) || "active",
      recurrence: "none",
      channel: task.reminder_channel || "in_app",
      timezone: "Asia/Kolkata",
      created_at: "",
      updated_at: "",
    };

    setEditingReminder(dummyReminder);
    setIsEditReminderOpen(true);
  };

  const handleRemoveReminder = async (task: Task) => {
    setOpenMenuId(null);
    if (!task.reminder_id) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              reminder_id: null,
              reminder_due_at: null,
              reminder_channel: null,
              reminder_status: null,
            }
          : t,
      ),
    );

    try {
      await deleteReminderApi(sessionToken, task.reminder_id);
    } catch {
      handleSelectList(selectedListId);
    }
  };

  const handleReminderCreated = (reminder: any) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === reminder.task_id
          ? {
              ...t,
              reminder_id: reminder.id,
              reminder_due_at: reminder.due_at,
              reminder_channel: reminder.channel,
              reminder_status: reminder.status,
            }
          : t,
      ),
    );
  };

  const handleReminderUpdated = (reminder: any) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.reminder_id === reminder.id
          ? {
              ...t,
              reminder_due_at: reminder.due_at,
              reminder_status: reminder.status,
              reminder_channel: reminder.channel,
            }
          : t,
      ),
    );
  };

  const handleDeleteList = async (listId: string) => {
    setOpenListMenuId(null);
    if (!confirm("Are you sure you want to delete this list and all its tasks?")) return;

    try {
      await deleteTaskList(sessionToken, listId);
      // Find another list to select
      const remaining = taskLists.filter((l) => l.id !== listId);
      setTaskLists(remaining);
      if (remaining.length > 0) {
        handleSelectList(remaining[0].id);
      } else {
        setSelectedListId("");
        setTasks([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to delete list");
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case "low":
        return "bg-zinc-800 text-zinc-400 border-zinc-700/55";
      case "medium":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "high":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "urgent":
        return "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse";
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-zinc-950">
      {/* 1. Left Sidebar: Task Lists */}
      <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-800/80 bg-[#0C0C0E]/95 p-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <ListTodo className="size-4 text-lime-400" />
            <h2 className="text-sm font-semibold text-white">Task Lists</h2>
          </div>
          <button
            onClick={() => setIsCreateListOpen(true)}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Create Task List"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* Task Lists Items */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-1 pr-1">
          {taskLists.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">No task lists yet.</div>
          ) : (
            taskLists.map((list) => (
              <div
                key={list.id}
                className={cn(
                  "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium border transition-all duration-150 cursor-pointer select-none",
                  selectedListId === list.id
                    ? "bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm"
                    : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
                )}
                onClick={() => handleSelectList(list.id)}
              >
                <span className="truncate">{list.name}</span>
                {/* List Action dropdown on hover */}
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenListMenuId(openListMenuId === list.id ? null : list.id);
                    }}
                    className="rounded-lg p-0.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200"
                  >
                    <MoreVertical className="size-3" />
                  </button>
                  {openListMenuId === list.id && (
                    <div className="absolute right-0 top-5 z-20 w-32 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-lg text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-red-400 hover:bg-red-400/10 text-[10px]"
                      >
                        <Trash2 className="size-3" />
                        Delete List
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Main Right pane: Tasks view */}
      <div className="flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        {/* Mobile Header indicator */}
        <div className="md:hidden flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
          <select
            value={selectedListId}
            onChange={(e) => handleSelectList(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            {taskLists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => setIsCreateListOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 p-2"
            >
              <FolderPlus className="size-4" />
            </Button>
          </div>
        </div>

        {/* Panel Header */}
        <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-white">
                {currentList?.name || "Tasks Manager"}
              </h1>
              {tasks.length > 0 && (
                <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-[10px] font-semibold text-lime-400">
                  {tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {currentList?.description || "Manage your task checklists, priority indicators, and due schedules."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => loadData()}
              variant="outline"
              size="sm"
              className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              onClick={() => {
                if (taskLists.length === 0) {
                  setError("Please create a task list first.");
                  return;
                }
                setIsCreateTaskOpen(true);
              }}
              className="rounded-xl bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 text-xs"
            >
              <Plus className="mr-1.5 size-4" />
              Create Task
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-1 text-xs overflow-x-auto">
            {(
              [
                { id: "pending", label: "Pending" },
                { id: "in_progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
                { id: "all", label: "All" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-medium transition-all whitespace-nowrap",
                  statusFilter === tab.id
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex items-center rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5">
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

        {/* Tasks Checklist Main Area */}
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/40"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <AlertCircle className="size-8 text-red-400" />
              <h3 className="mt-2 text-xs font-semibold text-white">Couldn&apos;t load tasks</h3>
              <p className="mt-1 text-[11px] text-zinc-400">{error}</p>
              <Button
                onClick={() => loadData()}
                size="sm"
                className="mt-4 rounded-xl bg-zinc-800 text-xs hover:bg-zinc-700"
              >
                Try Again
              </Button>
            </div>
          ) : taskLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10 text-lime-400 animate-bounce">
                <FolderPlus className="size-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">Create your first task list</h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-400">
                Create a task list to group your items (e.g. &quot;Personal&quot;, &quot;Work&quot;) before adding tasks.
              </p>
              <Button
                onClick={() => setIsCreateListOpen(true)}
                size="sm"
                className="mt-4 rounded-xl bg-lime-400 text-xs font-semibold text-zinc-950 hover:bg-lime-300"
              >
                <Plus className="mr-1.5 size-4" />
                Create List
              </Button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10 text-lime-400">
                <ListTodo className="size-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">
                {statusFilter === "completed"
                  ? "No completed tasks yet"
                  : statusFilter === "cancelled"
                    ? "No cancelled tasks yet"
                    : "No tasks here yet"}
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-400">
                {statusFilter === "pending"
                  ? "Add tasks to this list manually or tell Calby to do it in chat!"
                  : "Change the filter tab or add a new task."}
              </p>
              {statusFilter === "pending" && (
                <Button
                  onClick={() => setIsCreateTaskOpen(true)}
                  size="sm"
                  className="mt-4 rounded-xl bg-lime-400 text-xs font-semibold text-zinc-950 hover:bg-lime-300"
                >
                  <Plus className="mr-1.5 size-4" />
                  Create Task
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "group relative flex items-center justify-between rounded-xl border p-3 transition-all duration-200",
                    task.status === "completed"
                      ? "border-zinc-800/60 bg-zinc-950/60 opacity-60"
                      : task.status === "cancelled"
                        ? "border-zinc-800/40 bg-zinc-950/40 opacity-50"
                        : "border-zinc-850 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60",
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      disabled={task.status === "cancelled"}
                      className="mt-0.5 rounded-full p-0.5 hover:bg-zinc-800 text-zinc-500 hover:text-lime-400 transition-colors disabled:opacity-30 shrink-0"
                    >
                      <CheckCircle2
                        className={cn(
                          "size-5",
                          task.status === "completed"
                            ? "text-lime-400 fill-lime-400/10"
                            : "text-zinc-600",
                        )}
                      />
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Priority Badge */}
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                            getPriorityColor(task.priority),
                          )}
                        >
                          {task.priority}
                        </span>

                        {/* Recipient Contact Badge */}
                        {getContactName(task.contact_id) && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-[8px] font-semibold text-sky-400">
                            <User className="size-2" />
                            {getContactName(task.contact_id)}
                          </span>
                        )}

                        {/* Due Date Indicator */}
                        {task.due_at && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[8px] text-zinc-400">
                            <Clock className="size-2 text-lime-400" />
                            Due: {formatDate(task.due_at)}
                          </span>
                        )}

                        {/* Overdue Indicator */}
                        {((task.status === "pending" || task.status === "in_progress") && task.due_at && new Date(task.due_at) < new Date()) && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[8px] font-bold text-red-500 animate-pulse">
                            <AlertCircle className="size-2 shrink-0" />
                            Overdue
                          </span>
                        )}

                        {/* Recurrence Indicator */}
                        {task.recurrence_rule && task.recurrence_rule !== "none" && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-lime-400/20 bg-lime-400/5 px-1.5 py-0.5 text-[8px] font-semibold text-lime-400">
                            <RefreshCw className="size-2 shrink-0" />
                            Repeat: {task.recurrence_rule}
                            {task.next_occurrence_at && ` (Next: ${formatDate(task.next_occurrence_at)})`}
                          </span>
                        )}

                        {/* Reminder Indicator */}
                        {task.reminder_id && task.reminder_due_at && (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8px] font-semibold",
                            task.reminder_status === "cancelled" 
                              ? "border-zinc-800 bg-zinc-950 text-zinc-500 line-through" 
                              : "border-lime-400/30 bg-lime-400/10 text-lime-400"
                          )}>
                            <Bell className="size-2 shrink-0" />
                            Reminder: {formatDate(task.reminder_due_at)} ({task.reminder_channel})
                            {task.reminder_status === "paused" && " [Paused]"}
                          </span>
                        )}

                        {/* Completed At Indicator */}
                        {task.completed_at && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[8px] text-zinc-500 line-through">
                            Done: {formatDate(task.completed_at)}
                          </span>
                        )}
                      </div>

                      <h3
                        className={cn(
                          "text-xs font-semibold text-white truncate",
                          task.status === "completed" && "line-through text-zinc-500",
                          task.status === "cancelled" && "line-through text-zinc-600",
                        )}
                      >
                        {task.title}
                      </h3>

                      {task.description && (
                        <p
                          className={cn(
                            "line-clamp-1 text-[10px] text-zinc-400 font-light leading-relaxed",
                            task.status === "completed" && "text-zinc-650",
                          )}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative shrink-0 ml-3">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>

                    {openMenuId === task.id && (
                      <div className="absolute right-0 top-6 z-20 w-36 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-xl text-xs space-y-0.5 animate-enter">
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setEditingTask(task);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          <Pencil className="size-3.5 text-zinc-400" />
                          Edit Task
                        </button>

                        {task.status !== "completed" && task.status !== "cancelled" && (
                          <>
                            {task.reminder_id ? (
                              <>
                                <button
                                  onClick={() => handleEditReminder(task)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                >
                                  <Bell className="size-3.5 text-zinc-400" />
                                  Edit Reminder
                                </button>
                                <button
                                  onClick={() => handleRemoveReminder(task)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-amber-500 hover:bg-amber-500/10"
                                >
                                  <Bell className="size-3.5 text-amber-500" />
                                  Remove Reminder
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleSetReminder(task)}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                              >
                                <Bell className="size-3.5 text-zinc-400" />
                                Set Reminder
                              </button>
                            )}
                          </>
                        )}

                        {task.status !== "completed" && task.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancelTask(task.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-amber-400 hover:bg-amber-400/10"
                          >
                            <XCircle className="size-3.5" />
                            Cancel Task
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateTaskListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        sessionToken={sessionToken}
        onCreated={(newList) => {
          setTaskLists((prev) => [...prev, newList]);
          handleSelectList(newList.id);
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        sessionToken={sessionToken}
        taskLists={taskLists}
        defaultTaskListId={selectedListId}
        onCreated={(newTask) => setTasks((prev) => [newTask, ...prev])}
      />

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
          sessionToken={sessionToken}
          onUpdated={(updatedTask) => {
            // Update lists or task list selection if it was moved (but task panel currently filters by selected list, so if list didn't change just update)
            if (updatedTask.task_list_id === selectedListId) {
              setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
            } else {
              setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
            }
          }}
        />
      )}

      <CreateReminderModal
        isOpen={isCreateReminderOpen}
        onClose={() => {
          setIsCreateReminderOpen(false);
          setReminderTaskId(undefined);
        }}
        sessionToken={sessionToken}
        onCreated={handleReminderCreated}
        taskId={reminderTaskId}
        defaultTitle={reminderDefaultTitle}
      />

      {editingReminder && (
        <EditReminderModal
          reminder={editingReminder}
          isOpen={isEditReminderOpen}
          onClose={() => {
            setIsEditReminderOpen(false);
            setEditingReminder(null);
          }}
          sessionToken={sessionToken}
          onUpdated={handleReminderUpdated}
        />
      )}
    </div>
  );
}
