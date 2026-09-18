import { describe, expect, it } from "vitest";
import {
  projectSharedTask,
  REACTION_EMOJI,
  type SharedTask,
  sharedTaskChanged,
  withReaction,
} from "./shared";
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
  it("keeps reactions while the same completed task is edited", () => {
    const prev: SharedTask = {
      ...projectSharedTask(task({ completedAt: 5 }), null, 1),
      reactions: [{ emoji: "🔥", byUserId: "p", at: 7 }],
    };
    const next = projectSharedTask(task({ completedAt: 5, title: "Ship it now" }), prev, 2);
    expect(next.reactions).toEqual(prev.reactions);
  });
  it("clears reactions on a new completion of the same task (repeat re-completed)", () => {
    const prev: SharedTask = {
      ...projectSharedTask(task({ completedAt: 5 }), null, 1),
      reactions: [{ emoji: "🔥", byUserId: "p", at: 7 }],
    };
    expect(projectSharedTask(task({ completedAt: 9 }), prev, 2).reactions).toEqual([]);
  });
  it("clears reactions when a different task becomes the accountability task", () => {
    const prev: SharedTask = {
      ...projectSharedTask(task({}), null, 1),
      reactions: [{ emoji: "🔥", byUserId: "p", at: 7 }],
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
    const prev = { ...done, completedAt: null, reactions: [{ emoji: "👏", byUserId: "p", at: 7 }] };
    const next = projectSharedTask(task({ dueDate: "2026-09-27" }), prev, 3);
    expect(next).toMatchObject({
      dueDate: "2026-09-27",
      completedAt: null,
      reactions: prev.reactions,
    });
    expect(sharedTaskChanged(prev, next)).toBe(true);
  });
});

describe("withReaction", () => {
  const done: SharedTask = {
    ...projectSharedTask(task({ completedAt: 5 }), null, 1),
    reactions: [{ emoji: "👏", byUserId: "other", at: 1 }],
  };
  it("adds the user's reaction alongside others", () => {
    expect(withReaction(done.reactions, "p", "🔥", 9)).toEqual([
      { emoji: "👏", byUserId: "other", at: 1 },
      { emoji: "🔥", byUserId: "p", at: 9 },
    ]);
  });
  it("replaces the user's previous reaction instead of adding a second", () => {
    const once = withReaction(done.reactions, "p", "🔥", 9);
    expect(withReaction(once, "p", "🎉", 10)).toEqual([
      { emoji: "👏", byUserId: "other", at: 1 },
      { emoji: "🎉", byUserId: "p", at: 10 },
    ]);
  });
  it("offers a fixed set of about eight emoji", () => {
    expect(REACTION_EMOJI.length).toBe(8);
    expect(new Set(REACTION_EMOJI).size).toBe(8);
  });
});
