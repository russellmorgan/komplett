// Pure task logic. No React, no Firebase. Timestamps are epoch milliseconds.

export type Repeat =
  | { kind: "daily" | "weekdays" | "yearly" }
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
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function activeTasks(tasks: Task[], listId: string): Task[] {
  return tasks
    .filter((t) => t.listId === listId && t.completedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// Completed tasks, newest completedAt first. Pass listId to scope to one list; omit for all.
export function completedTasks(tasks: Task[], listId?: string): Task[] {
  return tasks
    .filter((t) => t.completedAt !== null && (listId === undefined || t.listId === listId))
    .sort((a, b) => (b.completedAt as number) - (a.completedAt as number));
}

export function nextSortOrder(items: { sortOrder: number }[]): number {
  return Math.max(0, ...items.map((t) => t.sortOrder)) + 1;
}

// New sortOrder for sorted[index] moved one step up (-1) or down (1); null if already at that edge.
// Works for any sortOrder-carrying item (tasks, lists, folders) — sort the list first.
// ponytail: midpoint floats lose precision after ~50 moves between the same two neighbours; renumber if it ever happens.
export function movedSortOrder<T extends { sortOrder: number }>(
  sorted: T[],
  index: number,
  direction: -1 | 1,
): number | null {
  const target = index + direction;
  if (target < 0 || target >= sorted.length) return null;
  const neighbour = sorted[target]?.sortOrder as number;
  const beyond = sorted[target + direction]?.sortOrder;
  if (beyond === undefined) return neighbour + direction;
  return (neighbour + beyond) / 2;
}
