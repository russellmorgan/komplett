import { describe, expect, it } from "vitest";
import { type Session, sessionsNewestFirst, taskStats } from "./sessions";

const session = (over: Partial<Session>): Session => ({
  id: "s",
  ownerId: "u",
  taskId: null,
  taskTitle: "Write report",
  note: "",
  focusMinutes: 25,
  startedAt: 0,
  endedAt: 0,
  endedEarly: false,
  ...over,
});

describe("sessionsNewestFirst", () => {
  it("sorts by startedAt, newest first", () => {
    const sessions = [
      session({ id: "old", startedAt: 1 }),
      session({ id: "new", startedAt: 3 }),
      session({ id: "mid", startedAt: 2 }),
    ];
    expect(sessionsNewestFirst(sessions).map((s) => s.id)).toEqual(["new", "mid", "old"]);
  });
});

describe("taskStats", () => {
  it("counts sessions and sums focus minutes for one task", () => {
    const all = [
      session({ id: "a", taskId: "t1", focusMinutes: 25 }),
      session({ id: "b", taskId: "t1", focusMinutes: 10 }),
      session({ id: "c", taskId: "t2", focusMinutes: 25 }),
    ];
    expect(taskStats(all, "t1")).toEqual({ count: 2, minutes: 35 });
    expect(taskStats(all, "none")).toEqual({ count: 0, minutes: 0 });
  });
});
