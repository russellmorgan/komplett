import { describe, expect, it } from "vitest";
import { advanceTask, completePatch, nextOccurrence } from "./repeat";
import type { Task } from "./tasks";

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

describe("nextOccurrence", () => {
  it("daily is tomorrow", () => {
    expect(nextOccurrence({ kind: "daily" }, "2026-01-31", "2026-01-31")).toBe("2026-02-01");
  });
  it("weekdays skips the weekend", () => {
    // 2026-01-30 is a Friday
    expect(nextOccurrence({ kind: "weekdays" }, "2026-01-30", "2026-01-30")).toBe("2026-02-02");
  });
  it("weekly with several days picks the nearest", () => {
    // 2026-01-05 is a Monday; Mon/Thu
    expect(nextOccurrence({ kind: "weekly", days: [1, 4] }, "2026-01-05", "2026-01-05")).toBe(
      "2026-01-08",
    );
    expect(nextOccurrence({ kind: "weekly", days: [1, 4] }, "2026-01-08", "2026-01-08")).toBe(
      "2026-01-12",
    );
  });
  it("monthly clamps 31st to the end of February", () => {
    expect(nextOccurrence({ kind: "monthly", dayOfMonth: 31 }, "2026-01-31", "2026-01-31")).toBe(
      "2026-02-28",
    );
    expect(nextOccurrence({ kind: "monthly", dayOfMonth: 31 }, "2026-02-28", "2026-02-28")).toBe(
      "2026-03-31",
    );
  });
  it("monthly respects leap years", () => {
    expect(nextOccurrence({ kind: "monthly", dayOfMonth: 31 }, "2028-01-31", "2028-01-31")).toBe(
      "2028-02-29",
    );
  });
  it("yearly keeps month/day, clamping Feb 29", () => {
    expect(nextOccurrence({ kind: "yearly" }, "2028-02-29", "2028-02-29")).toBe("2029-02-28");
    expect(nextOccurrence({ kind: "yearly" }, "2026-06-15", "2026-06-15")).toBe("2027-06-15");
  });
  it("overdue lands on the next future occurrence", () => {
    expect(nextOccurrence({ kind: "daily" }, "2026-01-01", "2026-03-10")).toBe("2026-03-11");
    // 2026-03-10 is a Tuesday; weekly Monday → 2026-03-16
    expect(nextOccurrence({ kind: "weekly", days: [1] }, "2026-01-05", "2026-03-10")).toBe(
      "2026-03-16",
    );
  });
});

describe("advanceTask", () => {
  it("moves due date and shifts the reminder by the same delta", () => {
    const t = task({
      dueDate: "2026-01-31",
      reminderAt: Date.UTC(2026, 0, 31, 9),
      repeat: { kind: "daily" },
    });
    expect(advanceTask(t, Date.UTC(2026, 0, 31, 12))).toEqual({
      dueDate: "2026-02-01",
      reminderAt: Date.UTC(2026, 1, 1, 9),
    });
  });
  it("uses today when there is no due date", () => {
    const t = task({ repeat: { kind: "daily" } });
    expect(advanceTask(t, Date.UTC(2026, 0, 31, 12))).toEqual({
      dueDate: "2026-02-01",
      reminderAt: null,
    });
  });
});

describe("completePatch", () => {
  it("completes non-repeating tasks", () => {
    expect(completePatch(task({}), 5)).toEqual({ completedAt: 5 });
  });
  it("advances repeating tasks", () => {
    expect(completePatch(task({ dueDate: "2026-01-01", repeat: { kind: "daily" } }), 0)).toEqual({
      dueDate: "2026-01-02",
      reminderAt: null,
    });
  });
});
