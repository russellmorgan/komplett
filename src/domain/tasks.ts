// Pure task logic. No React, no Firebase. Timestamps are epoch milliseconds.
import { type Session, sessionsNewestFirst } from "./sessions";

export type Repeat =
  | { kind: "daily" | "weekdays" }
  | { kind: "yearly"; anchor?: string } // MM-DD; absent on old tasks, which follow the due date
  | { kind: "weekly"; days: number[] }
  | { kind: "monthly"; dayOfMonth: number };

export type Task = {
  id: string;
  ownerId: string;
  listId: string;
  title: string;
  note: string;
  dueDate: string | null; // YYYY-MM-DD
  reminderAt: number | null;
  repeat: Repeat | null;
  important?: boolean; // absent on old tasks; means false
  sortOrder: number;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export function newTask(
  fields: Pick<Task, "ownerId" | "listId" | "title" | "sortOrder">,
  now: number,
): Omit<Task, "id"> {
  return {
    ...fields,
    note: "",
    dueDate: null,
    reminderAt: null,
    repeat: null,
    important: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

// Display order of open tasks: important ones first (soonest due, undated last, then oldest
// created), then the rest by sortOrder.
export function byImportance(a: Task, b: Task): number {
  if (!a.important !== !b.important) return a.important ? -1 : 1;
  if (!a.important) return a.sortOrder - b.sortOrder;
  return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.createdAt - b.createdAt;
}

export function activeTasks(tasks: Task[], listId: string): Task[] {
  return tasks.filter((t) => t.listId === listId && t.completedAt === null).sort(byImportance);
}

// Completed tasks, newest completedAt first. Pass listId to scope to one list; omit for all.
export function completedTasks(tasks: Task[], listId?: string): Task[] {
  return tasks
    .filter((t) => t.completedAt !== null && (listId === undefined || t.listId === listId))
    .sort((a, b) => (b.completedAt as number) - (a.completedAt as number));
}

// The automatic Today list: open tasks due exactly `today` (local YYYY-MM-DD), from any list.
// Computed, never stored — a task keeps its own list.
export function todayTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter((t) => t.completedAt === null && t.dueDate === today).sort(byImportance);
}

// Timer's "Up next": open tasks that are important, due today or overdue, among the last few you
// focused on, or in Inbox. One manual order across lists: important first, then by sortOrder (drag edits it).
export function upNext(
  tasks: Task[],
  sessions: Session[],
  today: string,
  inboxId: string,
  recent = 3,
): Task[] {
  const open = tasks.filter((t) => t.completedAt === null);
  const byId = new Map(open.map((t) => [t.id, t]));
  const focused = new Set(
    [...new Set(sessionsNewestFirst(sessions).map((s) => s.taskId))]
      .map((id) => (id ? byId.get(id) : undefined))
      .filter((t) => t !== undefined)
      .slice(0, recent),
  );
  return open
    .filter(
      (t) =>
        t.important ||
        t.listId === inboxId ||
        focused.has(t) ||
        (t.dueDate !== null && t.dueDate <= today),
    )
    .sort(byImportance);
}

export function nextSortOrder(items: { sortOrder: number }[]): number {
  return Math.max(0, ...items.map((t) => t.sortOrder)) + 1;
}

// A sortOrder that sorts before everything in `items` (new tasks that should land first).
export function firstSortOrder(items: { sortOrder: number }[]): number {
  return Math.min(1, ...items.map((t) => t.sortOrder)) - 1;
}

// New sortOrder for sorted[from] dropped at position `to` (index in the list as it will read after
// the move); null if nothing moves. Works for any sortOrder-carrying item (tasks, lists, folders) — sort first.
// ponytail: midpoint floats lose precision after ~50 moves between the same two neighbours; renumber if it ever happens.
export function movedSortOrder<T extends { sortOrder: number }>(
  sorted: T[],
  from: number,
  to: number,
): number | null {
  if (from === to || to < 0 || to >= sorted.length || !sorted[from]) return null;
  const rest = sorted.filter((_, i) => i !== from);
  const before = rest[to - 1]?.sortOrder;
  const after = rest[to]?.sortOrder;
  if (before === undefined) return (after as number) - 1;
  if (after === undefined) return before + 1;
  return (before + after) / 2;
}
