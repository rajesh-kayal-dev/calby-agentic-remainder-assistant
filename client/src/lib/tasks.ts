import { apiFetch } from "./api";
import { Task, TaskList, TaskPriority, TaskStatus, TaskListStatus } from "./types";

export async function fetchTaskLists(token: string): Promise<{ taskLists: TaskList[] }> {
  return apiFetch<{ taskLists: TaskList[] }>("/api/task-lists", { token });
}

export async function createTaskList(
  token: string,
  body: { name: string; description?: string },
): Promise<{ taskList: TaskList }> {
  return apiFetch<{ taskList: TaskList }>("/api/task-lists", {
    method: "POST",
    token,
    body,
  });
}

export async function updateTaskList(
  token: string,
  taskListId: string,
  body: { name?: string; description?: string | null; status?: TaskListStatus },
): Promise<{ taskList: TaskList }> {
  return apiFetch<{ taskList: TaskList }>(`/api/task-lists/${taskListId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function deleteTaskList(
  token: string,
  taskListId: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/task-lists/${taskListId}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchTasks(
  token: string,
  filters?: {
    status?: TaskStatus;
    taskListId?: string;
    contactId?: string;
    search?: string;
    priority?: TaskPriority;
    overdue?: boolean;
    dueBefore?: string;
    dueAfter?: string;
  },
): Promise<{ tasks: Task[] }> {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.taskListId) queryParams.append("taskListId", filters.taskListId);
  if (filters?.contactId) queryParams.append("contactId", filters.contactId);
  if (filters?.search) queryParams.append("search", filters.search);
  if (filters?.priority) queryParams.append("priority", filters.priority);
  if (filters?.overdue) queryParams.append("overdue", String(filters.overdue));
  if (filters?.dueBefore) queryParams.append("dueBefore", filters.dueBefore);
  if (filters?.dueAfter) queryParams.append("dueAfter", filters.dueAfter);

  const queryString = queryParams.toString();
  const path = `/api/tasks${queryString ? `?${queryString}` : ""}`;

  return apiFetch<{ tasks: Task[] }>(path, { token });
}

export async function fetchTask(token: string, taskId: string): Promise<{ task: Task }> {
  return apiFetch<{ task: Task }>(`/api/tasks/${taskId}`, { token });
}

export async function createTask(
  token: string,
  body: {
    taskListId: string;
    title: string;
    description?: string | null;
    contactId?: string | null;
    priority?: TaskPriority;
    dueAt?: string | null;
    recurrenceRule?: "none" | "daily" | "weekly" | "monthly";
    recurrenceTimezone?: string;
  },
): Promise<{ task: Task }> {
  return apiFetch<{ task: Task }>("/api/tasks", {
    method: "POST",
    token,
    body,
  });
}

export async function updateTask(
  token: string,
  taskId: string,
  body: {
    title?: string;
    description?: string | null;
    contactId?: string | null;
    taskListId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueAt?: string | null;
    recurrenceRule?: "none" | "daily" | "weekly" | "monthly";
    recurrenceTimezone?: string;
  },
): Promise<{ task: Task }> {
  return apiFetch<{ task: Task }>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function completeTask(token: string, taskId: string): Promise<{ task: Task }> {
  return apiFetch<{ task: Task }>(`/api/tasks/${taskId}/complete`, {
    method: "POST",
    token,
  });
}

export async function cancelTask(token: string, taskId: string): Promise<{ task: Task }> {
  return apiFetch<{ task: Task }>(`/api/tasks/${taskId}/cancel`, {
    method: "POST",
    token,
  });
}

export async function deleteTask(token: string, taskId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/tasks/${taskId}`, {
    method: "DELETE",
    token,
  });
}
