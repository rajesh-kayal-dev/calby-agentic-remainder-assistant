import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import {
  createTaskList,
  getTaskList,
  listTaskLists,
  updateTaskList,
  deleteTaskList,
  createTask,
  getTask,
  listTasks,
  updateTask,
  completeTask,
  cancelTask,
  deleteTask,
  searchTasksByTitle,
} from "../services/task.service.js";
import { TaskStatus, TaskPriority, TaskListStatus } from "../repositories/task.repository.js";

export const taskRouter = Router();

// Apply auth middleware to all routes
taskRouter.use(requireSession);

// ==========================================
// TASK LIST ENDPOINTS
// ==========================================

// Create a task list
taskRouter.post("/task-lists", async (req, res) => {
  try {
    const { name, description } = req.body;
    const authUserId = req.authContext!.authUserId;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Task list name is required" });
      return;
    }

    const taskList = await createTaskList(authUserId, name, description);
    res.status(201).json({ taskList });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to create task list" });
  }
});

// List task lists
taskRouter.get("/task-lists", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const taskLists = await listTaskLists(authUserId);
    res.json({ taskLists });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to list task lists" });
  }
});

// Get task list details
taskRouter.get("/task-lists/:id", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const taskList = await getTaskList(authUserId, req.params.id);

    if (!taskList) {
      res.status(404).json({ error: "Task list not found" });
      return;
    }

    res.json({ taskList });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to fetch task list" });
  }
});

// Update task list details
taskRouter.patch("/task-lists/:id", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const { name, description, status } = req.body;

    const taskList = await updateTaskList(authUserId, req.params.id, {
      name: typeof name === "string" ? name : undefined,
      description: description === null ? null : typeof description === "string" ? description : undefined,
      status: status as TaskListStatus | undefined,
    });

    res.json({ taskList });
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("not found")) {
      res.status(404).json({ error: msg });
    } else {
      res.status(400).json({ error: msg });
    }
  }
});

// Delete task list
taskRouter.delete("/task-lists/:id", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const success = await deleteTaskList(authUserId, req.params.id);
    res.json({ success });
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("not found")) {
      res.status(404).json({ error: msg });
    } else {
      res.status(400).json({ error: msg });
    }
  }
});

// ==========================================
// TASK ENDPOINTS
// ==========================================

// Create a task
taskRouter.post("/tasks", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const { taskListId, title, description, contactId, priority, dueAt, recurrenceRule, recurrenceTimezone } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "Task title is required" });
      return;
    }

    const task = await createTask(authUserId, typeof taskListId === "string" ? taskListId : undefined, {
      title,
      description: description === null ? null : typeof description === "string" ? description : undefined,
      contactId: typeof contactId === "string" ? contactId : undefined,
      priority: priority as TaskPriority | undefined,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      recurrenceRule: recurrenceRule as any,
      recurrenceTimezone: typeof recurrenceTimezone === "string" ? recurrenceTimezone : undefined,
    });

    res.status(201).json({ task });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to create task" });
  }
});

// List or filter tasks
taskRouter.get("/tasks", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const { status, taskListId, contactId, priority, overdue, dueBefore, dueAfter, search } = req.query;

    const tasks = await listTasks(authUserId, {
      status: status as TaskStatus | undefined,
      taskListId: typeof taskListId === "string" ? taskListId : undefined,
      contactId: typeof contactId === "string" ? contactId : undefined,
      priority: priority as TaskPriority | undefined,
      overdue: overdue === "true",
      dueBefore: typeof dueBefore === "string" ? new Date(dueBefore) : undefined,
      dueAfter: typeof dueAfter === "string" ? new Date(dueAfter) : undefined,
      search: typeof search === "string" ? search : undefined,
    });

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to list tasks" });
  }
});

// Get task details
taskRouter.get("/tasks/:id", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const task = await getTask(authUserId, req.params.id);

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to fetch task" });
  }
});

// Update task details
taskRouter.patch("/tasks/:id", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const { title, description, contactId, taskListId, status, priority, dueAt, recurrenceRule, recurrenceTimezone } = req.body;

    const task = await updateTask(authUserId, req.params.id, {
      title: typeof title === "string" ? title : undefined,
      description: description === null ? null : typeof description === "string" ? description : undefined,
      contactId: contactId === null ? null : typeof contactId === "string" ? contactId : undefined,
      taskListId: typeof taskListId === "string" ? taskListId : undefined,
      status: status as TaskStatus | undefined,
      priority: priority as TaskPriority | undefined,
      dueAt: dueAt === null ? null : dueAt ? new Date(dueAt) : undefined,
      recurrenceRule: recurrenceRule as any,
      recurrenceTimezone: typeof recurrenceTimezone === "string" ? recurrenceTimezone : undefined,
    });

    res.json({ task });
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("not found")) {
      res.status(404).json({ error: msg });
    } else {
      res.status(400).json({ error: msg });
    }
  }
});

// Complete task
taskRouter.post("/tasks/:id/complete", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const task = await completeTask(authUserId, req.params.id);
    res.json({ task });
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("not found")) {
      res.status(404).json({ error: msg });
    } else {
      res.status(400).json({ error: msg });
    }
  }
});

// Cancel task
taskRouter.post("/tasks/:id/cancel", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const task = await cancelTask(authUserId, req.params.id);
    res.json({ task });
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("not found")) {
      res.status(404).json({ error: msg });
    } else {
      res.status(400).json({ error: msg });
    }
  }
});

// Delete task
taskRouter.delete("/tasks/:id", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const success = await deleteTask(authUserId, req.params.id);
    res.json({ success });
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("not found")) {
      res.status(404).json({ error: msg });
    } else {
      res.status(400).json({ error: msg });
    }
  }
});
