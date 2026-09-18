// The shared task is a projection of the accountability task that the partner reads. Pure.

import type { Task } from "./tasks";

export const REACTION_EMOJI = ["👏", "🔥", "🎉", "💪", "❤️", "🙌", "⭐", "🚀"] as const;

export type Reaction = { emoji: string; byUserId: string; at: number };

export type SharedTask = {
  taskId: string;
  title: string;
  dueDate: string | null;
  completedAt: number | null;
  reactions: Reaction[];
  updatedAt: number;
};

// Reactions belong to one completion: they survive edits to the same completed task and are
// cleared when a different task takes over or the same task is completed again.
export function projectSharedTask(task: Task, prev: SharedTask | null, now: number): SharedTask {
  return {
    taskId: task.id,
    title: task.title,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    reactions:
      prev?.taskId === task.id && prev.completedAt === task.completedAt ? prev.reactions : [],
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

// One reaction per user: a new one replaces that user's previous one.
export function withReaction(
  reactions: Reaction[],
  byUserId: string,
  emoji: string,
  at: number,
): Reaction[] {
  return [...reactions.filter((r) => r.byUserId !== byUserId), { emoji, byUserId, at }];
}
