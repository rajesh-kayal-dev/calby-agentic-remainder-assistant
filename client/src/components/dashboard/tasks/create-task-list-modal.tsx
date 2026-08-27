"use client";

import { useState } from "react";
import { X, Plus, AlertCircle, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTaskList } from "@/lib/tasks";
import { TaskList } from "@/lib/types";

interface CreateTaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  onCreated: (newList: TaskList) => void;
}

export function CreateTaskListModal({
  isOpen,
  onClose,
  sessionToken,
  onCreated,
}: CreateTaskListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name for your task list");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createTaskList(sessionToken, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onCreated(res.taskList);
      onClose();
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err?.message || "Failed to create task list");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
              <ListTodo className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Create Task List</h2>
              <p className="text-[11px] text-zinc-400">Group related tasks under a custom list</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium text-zinc-300">List Name</label>
            <input
              type="text"
              placeholder="e.g., Rahul, Shopping, Work Tasks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-300">Description (optional)</label>
            <textarea
              placeholder="Add short notes about this list..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 animate-none"
            >
              {isSubmitting ? "Creating..." : "Create List"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
