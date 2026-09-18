import { describe, expect, it } from "vitest";
import { projectSharedTask, type SharedTask, sharedTaskChanged } from "./shared";
import type { Task } from "./tasks";

const task = (over: Partial<Task>): Task => ({
  id: "t1",
  ownerId: "u",
  listId: "inbox",
  title: "Ship it",
  note: "",
  dueDate: "2026-09-20",
  reminderAt: null,
  repeat: null,
  sortOrder: 0,
  completedAt: null,
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

describe("projectSharedTask", () => {
  it("copies title, due date and completion; starts with no reactions", () => {
    expect(projectSharedTask(task({}), null, 99)).toEqual<SharedTask>({
      taskId: "t1",
      title: "Ship it",
      dueDate: "2026-09-20",
      completedAt: null,
      reactions: [],
      updatedAt: 99,
    });
  });
  it("keeps reactions while the same task updates", () => {
    const prev: SharedTask = {
      ...projectSharedTask(task({}), null, 1),
      reactions: [{ uid: "p", emoji: "🔥" }],
    };
    expect(projectSharedTask(task({ completedAt: 5 }), prev, 2).reactions).toEqual(prev.reactions);
  });
  it("clears reactions when a different task becomes the accountability task", () => {
    const prev: SharedTask = {
      ...projectSharedTask(task({}), null, 1),
      reactions: [{ uid: "p", emoji: "🔥" }],
    };
    expect(projectSharedTask(task({ id: "t2" }), prev, 2).reactions).toEqual([]);
  });
});

describe("sharedTaskChanged", () => {
  const a = projectSharedTask(task({}), null, 1);
  it("ignores updatedAt", () => {
    expect(sharedTaskChanged(a, { ...a, updatedAt: 2 })).toBe(false);
  });
  it("detects an advanced repeating task (new due date, still active)", () => {
    expect(sharedTaskChanged(a, { ...a, dueDate: "2026-09-27" })).toBe(true);
  });
  it("treats a missing doc as changed", () => {
    expect(sharedTaskChanged(null, a)).toBe(true);
  });
});

describe("projection follows the task lifecycle", () => {
  const done = projectSharedTask(task({ completedAt: 5 }), null, 1);
  it("un-complete shows in progress again", () => {
    const next = projectSharedTask(task({ completedAt: null }), done, 2);
    expect(next.completedAt).toBeNull();
    expect(sharedTaskChanged(done, next)).toBe(true);
  });
  it("repeat advance: new due date, active, reactions kept", () => {
    const prev = { ...done, completedAt: null, reactions: [{ uid: "p", emoji: "👏" }] };
    const next = projectSharedTask(task({ dueDate: "2026-09-27" }), prev, 3);
    expect(next).toMatchObject({
      dueDate: "2026-09-27",
      completedAt: null,
      reactions: prev.reactions,
    });
    expect(sharedTaskChanged(prev, next)).toBe(true);
  });
});
