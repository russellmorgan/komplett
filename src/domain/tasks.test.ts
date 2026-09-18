import { describe, expect, it } from "vitest";
import { activeTasks, movedSortOrder, nextSortOrder, type Task } from "./tasks";

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
      task({ id: "done", sortOrder: 0, completedAt: 1 }),
      task({ id: "other", sortOrder: 0, listId: "work" }),
      task({ id: "a", sortOrder: 1 }),
    ];
    expect(activeTasks(tasks, "inbox").map((t) => t.id)).toEqual(["a", "b"]);
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
  it("moves up to the midpoint of the two tasks above", () => {
    expect(movedSortOrder(sorted, 2, -1)).toBe(1.5);
  });
  it("moves down to the midpoint of the two tasks below", () => {
    expect(movedSortOrder(sorted, 0, 1)).toBe(2.5);
  });
  it("moves to before the first / after the last when there is only one neighbour", () => {
    expect(movedSortOrder(sorted, 1, -1)).toBe(0);
    expect(movedSortOrder(sorted, 1, 1)).toBe(4);
  });
  it("returns null at the edges", () => {
    expect(movedSortOrder(sorted, 0, -1)).toBeNull();
    expect(movedSortOrder(sorted, 2, 1)).toBeNull();
  });
});
