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

export function activeTasks(tasks: Task[], listId: string): Task[] {
  return tasks
    .filter((t) => t.listId === listId && t.completedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function nextSortOrder(tasks: Task[]): number {
  return Math.max(0, ...tasks.map((t) => t.sortOrder)) + 1;
}

// New sortOrder for sorted[index] moved one step up (-1) or down (1); null if already at that edge.
// ponytail: midpoint floats lose precision after ~50 moves between the same two neighbours; renumber if it ever happens.
export function movedSortOrder(sorted: Task[], index: number, direction: -1 | 1): number | null {
  const target = index + direction;
  if (target < 0 || target >= sorted.length) return null;
  const near = sorted[target]?.sortOrder as number;
  const far = sorted[target + direction]?.sortOrder;
  if (far === undefined) return near + direction;
  return (near + far) / 2;
}
