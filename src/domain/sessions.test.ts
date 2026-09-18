import { describe, expect, it } from "vitest";
import { type Session, sessionsNewestFirst } from "./sessions";

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
