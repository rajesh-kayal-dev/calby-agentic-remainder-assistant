import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

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
  listPendingTasks,
  listTasksForContact,
} from "../task.service.js";

import { createContact, deleteContact } from "../contact.service.js";
import { ensureUser } from "../../repositories/user.repository.js";
import { closePool } from "../../db/pool.js";

const USER_A = "user_task_test_a";
const USER_B = "user_task_test_b";

before(async () => {
  await ensureUser({ authUserId: USER_A, email: "usera@example.com" });
  await ensureUser({ authUserId: USER_B, email: "userb@example.com" });
});

after(async () => {
  await closePool();
});

test("1. User can create a task list", async () => {
  const list = await createTaskList(USER_A, "Work Checklist", "Tasks related to coding projects");
  assert.ok(list.id);
  assert.equal(list.auth_user_id, USER_A);
  assert.equal(list.name, "Work Checklist");
  assert.equal(list.description, "Tasks related to coding projects");
  assert.equal(list.status, "active");

  // Clean up
  await deleteTaskList(USER_A, list.id);
});

test("2. User can create a task", async () => {
  const list = await createTaskList(USER_A, "Personal List");
  const task = await createTask(USER_A, list.id, {
    title: "buy milk",
    description: "2% fat",
    priority: "high",
    dueAt: new Date(Date.now() + 86400000), // tomorrow
  });

  assert.ok(task.id);
  assert.equal(task.auth_user_id, USER_A);
  assert.equal(task.task_list_id, list.id);
  assert.equal(task.title, "buy milk");
  assert.equal(task.description, "2% fat");
  assert.equal(task.status, "pending");
  assert.equal(task.priority, "high");
  assert.ok(task.due_at);
  assert.equal(task.completed_at, null);

  // Clean up
  await deleteTask(USER_A, task.id);
  await deleteTaskList(USER_A, list.id);
});

test("3. User can list their own tasks", async () => {
  const list = await createTaskList(USER_A, "List A");
  const t1 = await createTask(USER_A, list.id, { title: "task 1" });
  const t2 = await createTask(USER_A, list.id, { title: "task 2" });

  const tasks = await listTasks(USER_A, { taskListId: list.id });
  assert.equal(tasks.length, 2);
  const titles = tasks.map((t) => t.title);
  assert.ok(titles.includes("task 1"));
  assert.ok(titles.includes("task 2"));

  // Clean up
  await deleteTask(USER_A, t1.id);
  await deleteTask(USER_A, t2.id);
  await deleteTaskList(USER_A, list.id);
});

test("4. User cannot read another user's task or task list", async () => {
  const listA = await createTaskList(USER_A, "List A");
  const tA = await createTask(USER_A, listA.id, { title: "secret task" });

  // Try to read list
  const listResult = await getTaskList(USER_B, listA.id);
  assert.equal(listResult, null);

  // Try to read task
  const taskResult = await getTask(USER_B, tA.id);
  assert.equal(taskResult, null);

  // Clean up
  await deleteTask(USER_A, tA.id);
  await deleteTaskList(USER_A, listA.id);
});

test("5. User cannot update another user's task or task list", async () => {
  const listA = await createTaskList(USER_A, "List A");
  const tA = await createTask(USER_A, listA.id, { title: "original title" });

  // Try to update list
  await assert.rejects(
    async () => {
      await updateTaskList(USER_B, listA.id, { name: "hacked list" });
    },
    { message: "Task list not found" }
  );

  // Try to update task
  await assert.rejects(
    async () => {
      await updateTask(USER_B, tA.id, { title: "hacked task" });
    },
    { message: "Task not found" }
  );

  // Clean up
  await deleteTask(USER_A, tA.id);
  await deleteTaskList(USER_A, listA.id);
});

test("6. User cannot delete another user's task or task list", async () => {
  const listA = await createTaskList(USER_A, "List A");
  const tA = await createTask(USER_A, listA.id, { title: "to be deleted" });

  // Try to delete list
  await assert.rejects(
    async () => {
      await deleteTaskList(USER_B, listA.id);
    },
    { message: "Task list not found" }
  );

  // Try to delete task
  await assert.rejects(
    async () => {
      await deleteTask(USER_B, tA.id);
    },
    { message: "Task not found" }
  );

  // Clean up
  await deleteTask(USER_A, tA.id);
  await deleteTaskList(USER_A, listA.id);
});

test("7. User cannot attach another user's contact", async () => {
  const contactB = await createContact(USER_B, { name: "Bob" });
  const listA = await createTaskList(USER_A, "List A");

  // Try to create task with User B's contact
  await assert.rejects(
    async () => {
      await createTask(USER_A, listA.id, {
        title: "call Bob",
        contactId: contactB.id,
      });
    },
    { message: "Contact not found or access denied" }
  );

  // Create normal task
  const tA = await createTask(USER_A, listA.id, { title: "normal task" });

  // Try to update task with User B's contact
  await assert.rejects(
    async () => {
      await updateTask(USER_A, tA.id, { contactId: contactB.id });
    },
    { message: "Contact not found or access denied" }
  );

  // Clean up
  await deleteTask(USER_A, tA.id);
  await deleteTaskList(USER_A, listA.id);
  await deleteContact(USER_B, contactB.id);
});

test("8. Completing a task sets completed_at", async () => {
  const list = await createTaskList(USER_A, "List A");
  const task = await createTask(USER_A, list.id, { title: "do chores" });

  assert.equal(task.completed_at, null);

  const completed = await completeTask(USER_A, task.id);
  assert.equal(completed.status, "completed");
  assert.ok(completed.completed_at instanceof Date);

  // Try to transition away from terminal status (completed)
  await assert.rejects(
    async () => {
      await updateTask(USER_A, task.id, { status: "pending" });
    },
    { message: /Cannot transition task from terminal status 'completed'/ }
  );

  // Clean up
  await deleteTask(USER_A, task.id);
  await deleteTaskList(USER_A, list.id);
});

test("9. Cancelling a task works correctly", async () => {
  const list = await createTaskList(USER_A, "List A");
  const task = await createTask(USER_A, list.id, { title: "cancel me" });

  const cancelled = await cancelTask(USER_A, task.id);
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.completed_at, null);

  // Try to transition away from terminal status (cancelled)
  await assert.rejects(
    async () => {
      await updateTask(USER_A, task.id, { status: "in_progress" });
    },
    { message: /Cannot transition task from terminal status 'cancelled'/ }
  );

  // Clean up
  await deleteTask(USER_A, task.id);
  await deleteTaskList(USER_A, list.id);
});

test("10. Invalid task status/priority is rejected", async () => {
  const list = await createTaskList(USER_A, "List A");

  // Invalid priority on create
  await assert.rejects(
    async () => {
      await createTask(USER_A, list.id, {
        title: "test",
        priority: "critical" as any,
      });
    },
    { message: /Invalid task priority/ }
  );

  const task = await createTask(USER_A, list.id, { title: "valid" });

  // Invalid status on update
  await assert.rejects(
    async () => {
      await updateTask(USER_A, task.id, { status: "unknown" as any });
    },
    { message: /Invalid task status/ }
  );

  // Invalid priority on update
  await assert.rejects(
    async () => {
      await updateTask(USER_A, task.id, { priority: "highest" as any });
    },
    { message: /Invalid task priority/ }
  );

  // Clean up
  await deleteTask(USER_A, task.id);
  await deleteTaskList(USER_A, list.id);
});

test("11. Deleting a contact does not destroy task history", async () => {
  const contact = await createContact(USER_A, { name: "Rahul" });
  const list = await createTaskList(USER_A, "List A");

  const task = await createTask(USER_A, list.id, {
    title: "call Rahul",
    contactId: contact.id,
  });

  assert.equal(task.contact_id, contact.id);

  // Delete contact
  await deleteContact(USER_A, contact.id);

  // Fetch the task again
  const retrieved = await getTask(USER_A, task.id);
  assert.ok(retrieved);
  assert.equal(retrieved.title, "call Rahul");
  assert.equal(retrieved.contact_id, null); // ON DELETE SET NULL worked

  // Clean up
  await deleteTask(USER_A, task.id);
  await deleteTaskList(USER_A, list.id);
});
