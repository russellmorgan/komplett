import { describe, expect, it } from "vitest";
import {
  activeTasks,
  completedTasks,
  firstSortOrder,
  movedSortOrder,
  nextSortOrder,
  type Task,
  todayTasks,
  upNext,
} from "./tasks";

const task = (over: Partial<Task>): Task => ({
  id: "t",
  ownerId: "u",
  listId: "inbox",
  title: "x",
  note: "",
  dueDate: null,
  reminderAt: null,
  repeat: null,
  sortOrder: 0,
  completedAt: null,
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

describe("activeTasks", () => {
  it("keeps only uncompleted tasks of the list, sorted by sortOrder", () => {
    const tasks = [
      task({ id: "b", sortOrder: 2 }),
      task({ id: "completed", sortOrder: 0, completedAt: 1 }),
      task({ id: "other", sortOrder: 0, listId: "work" }),
      task({ id: "a", sortOrder: 1 }),
    ];
    expect(activeTasks(tasks, "inbox").map((t) => t.id)).toEqual(["a", "b"]);
  });
});

describe("important tasks", () => {
  it("lead the list: soonest due first, undated last, then oldest created; the rest by sortOrder", () => {
    const tasks = [
      task({ id: "plain1", sortOrder: 1 }),
      task({ id: "plain0", sortOrder: 0 }),
      task({ id: "impNewer", important: true, sortOrder: 9, createdAt: 20 }),
      task({ id: "impOlder", important: true, sortOrder: 8, createdAt: 10 }),
      task({ id: "impLater", important: true, dueDate: "2026-10-09", createdAt: 1 }),
      task({ id: "impSoon", important: true, dueDate: "2026-10-01", createdAt: 99 }),
    ];
    expect(activeTasks(tasks, "inbox").map((t) => t.id)).toEqual([
      "impSoon",
      "impLater",
      "impOlder",
      "impNewer",
      "plain0",
      "plain1",
    ]);
  });
});

describe("completedTasks", () => {
  it("keeps only completed tasks, newest completedAt first, optionally scoped to a list", () => {
    const tasks = [
      task({ id: "old", completedAt: 1 }),
      task({ id: "new", completedAt: 3 }),
      task({ id: "active" }),
      task({ id: "other-list", listId: "work", completedAt: 2 }),
    ];
    expect(completedTasks(tasks).map((t) => t.id)).toEqual(["new", "other-list", "old"]);
    expect(completedTasks(tasks, "inbox").map((t) => t.id)).toEqual(["new", "old"]);
  });
});

describe("nextSortOrder", () => {
  it("places a new task after the last one", () => {
    expect(nextSortOrder([task({ sortOrder: 3 }), task({ sortOrder: 7 })])).toBe(8);
  });
  it("starts at 1 for an empty list", () => {
    expect(nextSortOrder([])).toBe(1);
  });
});

describe("movedSortOrder", () => {
  const sorted = [task({ sortOrder: 1 }), task({ sortOrder: 2 }), task({ sortOrder: 3 })];
  it("moves one step to the midpoint of the new neighbours", () => {
    expect(movedSortOrder(sorted, 2, 1)).toBe(1.5);
    expect(movedSortOrder(sorted, 0, 1)).toBe(2.5);
  });
  it("drags across several rows", () => {
    expect(movedSortOrder(sorted, 2, 0)).toBe(0);
    expect(movedSortOrder(sorted, 0, 2)).toBe(4);
  });
  it("moves to before the first / after the last when there is only one neighbour", () => {
    expect(movedSortOrder(sorted, 1, 0)).toBe(0);
    expect(movedSortOrder(sorted, 1, 2)).toBe(4);
  });
  it("returns null when nothing moves or the target is out of range", () => {
    expect(movedSortOrder(sorted, 1, 1)).toBeNull();
    expect(movedSortOrder(sorted, 0, -1)).toBeNull();
    expect(movedSortOrder(sorted, 2, 3)).toBeNull();
  });
});

describe("upNext", () => {
  const s = (taskId: string | null, startedAt: number) => ({
    id: `s${startedAt}`,
    ownerId: "u",
    taskId,
    taskTitle: "",
    note: "",
    focusMinutes: 25,
    startedAt,
    endedAt: startedAt,
    endedEarly: false,
  });

  it("lists Inbox, due-today/overdue and recently focused tasks, important first then by sortOrder", () => {
    const tasks = [
      task({ id: "inbox2", sortOrder: 2 }),
      task({ id: "inbox1", sortOrder: 1 }),
      task({ id: "future", listId: "work", dueDate: "2026-10-05" }),
      task({ id: "star", listId: "work", important: true, sortOrder: 9 }),
      task({ id: "today", listId: "work", dueDate: "2026-09-28", sortOrder: 3 }),
      task({ id: "overdue", listId: "work", dueDate: "2026-09-01", important: true }),
      task({ id: "focusedOld", listId: "work", sortOrder: 5 }),
      task({ id: "focusedNew", listId: "work", dueDate: "2026-09-28", sortOrder: 4 }),
      task({ id: "done", completedAt: 1 }),
      task({ id: "undated", listId: "work" }),
    ];
    const sessions = [
      s("focusedOld", 1),
      s("done", 2),
      s(null, 3),
      s("focusedNew", 4),
      s("focusedOld", 5),
    ];
    expect(upNext(tasks, sessions, "2026-09-28", "inbox").map((t) => t.id)).toEqual([
      "overdue",
      "star",
      "inbox1",
      "inbox2",
      "today",
      "focusedNew",
      "focusedOld",
    ]);
  });
});

describe("firstSortOrder", () => {
  it("sorts before every item, including negatives and an empty list", () => {
    expect(firstSortOrder([{ sortOrder: 3 }, { sortOrder: -2 }])).toBe(-3);
    expect(firstSortOrder([{ sortOrder: 5 }])).toBe(0);
    expect(firstSortOrder([])).toBe(0);
  });
});

describe("todayTasks", () => {
  it("keeps open tasks due exactly today from any list, regardless of list", () => {
    const tasks = [
      task({ id: "a", listId: "work", dueDate: "2026-09-30", sortOrder: 2 }),
      task({ id: "b", dueDate: "2026-09-30", sortOrder: 1 }),
      task({ id: "overdue", dueDate: "2026-09-29" }),
      task({ id: "future", dueDate: "2026-10-01" }),
      task({ id: "done", dueDate: "2026-09-30", completedAt: 1 }),
      task({ id: "undated" }),
    ];
    expect(todayTasks(tasks, "2026-09-30").map((t) => t.id)).toEqual(["b", "a"]);
  });
});
