import { describe, expect, it } from "vitest";
import {
  nextMonths,
  type Session,
  sessionsByWeek,
  sessionsNewestFirst,
  taskStats,
  totalStats,
  weekStart,
  weeksWithin,
} from "./sessions";

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

describe("totalStats", () => {
  it("counts and sums minutes across all sessions", () => {
    const all = [session({ id: "a", focusMinutes: 25 }), session({ id: "b", focusMinutes: 10 })];
    expect(totalStats(all)).toEqual({ count: 2, minutes: 35 });
    expect(totalStats([])).toEqual({ count: 0, minutes: 0 });
  });
});

describe("sessionsByWeek", () => {
  it("groups by Monday-start week, newest week and session first", () => {
    const mon = new Date(2026, 8, 28, 9).getTime(); // Mon 28 Sep 2026
    const sun = new Date(2026, 8, 27, 23).getTime(); // previous Sunday
    const groups = sessionsByWeek([
      session({ id: "sun", startedAt: sun }),
      session({ id: "mon", startedAt: mon }),
      session({ id: "tue", startedAt: mon + 86_400_000 }),
    ]);
    expect(groups.map((g) => g.sessions.map((s) => s.id))).toEqual([["tue", "mon"], ["sun"]]);
    expect(groups[0]?.weekStart).toBe(weekStart(mon));
    expect(new Date(groups[0]?.weekStart ?? 0).getDay()).toBe(1);
  });
});

describe("weeksWithin / nextMonths", () => {
  const now = new Date(2026, 10, 6, 12).getTime(); // Fri 6 Nov 2026
  const at = (y: number, m: number, d: number) => new Date(y, m, d, 9).getTime();
  const weeks = sessionsByWeek([
    session({ id: "now", startedAt: now }),
    session({ id: "2m", startedAt: at(2026, 8, 10) }),
    session({ id: "5m", startedAt: at(2026, 5, 10) }),
    session({ id: "2y", startedAt: at(2024, 5, 10) }),
  ]);
  const ids = (ws: typeof weeks) => ws.flatMap((w) => w.sessions.map((s) => s.id));

  it("keeps only whole weeks inside the window", () => {
    expect(ids(weeksWithin(weeks, now, 3))).toEqual(["now", "2m"]);
    expect(ids(weeksWithin(weeks, now, 6))).toEqual(["now", "2m", "5m"]);
  });
  it("loads the next three months, skipping empty stretches", () => {
    expect(nextMonths(weeks, now, 3)).toBe(6);
    expect(nextMonths(weeks, now, 6)).toBe(30); // jumps the gap to the 2024 session
  });
  it("is null once nothing older remains", () => {
    expect(nextMonths(weeks, now, 30)).toBeNull();
    expect(nextMonths([], now, 3)).toBeNull();
  });
});
