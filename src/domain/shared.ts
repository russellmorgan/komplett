// The shared task is a projection of the accountability task that the partner reads. Pure.

import type { Task } from "./tasks";

export type Reaction = { uid: string; emoji: string };

export type SharedTask = {
  taskId: string;
  title: string;
  dueDate: string | null;
  completedAt: number | null;
  reactions: Reaction[];
  updatedAt: number;
};

// Reactions survive edits to the same task and are cleared when a different task takes over.
export function projectSharedTask(task: Task, prev: SharedTask | null, now: number): SharedTask {
  return {
    taskId: task.id,
    title: task.title,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    reactions: prev?.taskId === task.id ? prev.reactions : [],
    updatedAt: now,
  };
}

// Whether the stored doc needs rewriting; updatedAt is bookkeeping, not content.
export function sharedTaskChanged(stored: SharedTask | null, next: SharedTask): boolean {
  if (!stored) return true;
  return (
    stored.taskId !== next.taskId ||
    stored.title !== next.title ||
    stored.dueDate !== next.dueDate ||
    stored.completedAt !== next.completedAt
  );
}
