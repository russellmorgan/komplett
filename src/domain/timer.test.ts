import { describe, expect, it } from "vitest";
import {
  focusSummary,
  formatMmSs,
  initialTimer,
  remainingMs,
  type TimerAction,
  type TimerState,
  timerReducer,
} from "./timer";

const MIN = 60_000;
const run = (actions: TimerAction[], from = initialTimer) => actions.reduce(timerReducer, from);

const focus = run([{ type: "start", now: 1000, focusMinutes: 25 }]);
const focusDone = run([{ type: "tick", now: 1000 + 25 * MIN }], focus);
const brk = run([{ type: "startBreak", now: 2000, breakMinutes: 5 }], focusDone);

describe("timerReducer transitions", () => {
  it("start: idle -> focus", () => {
    expect(focus).toEqual<TimerState>({
      phase: "focus",
      startedAt: 1000,
      pausedAt: null,
      pausedMs: 0,
      durationMs: 25 * MIN,
      endedEarly: false,
      task: null,
    });
  });
  it("tick: focus -> focusDone when remaining <= 0", () => {
    expect(run([{ type: "tick", now: 1000 + 25 * MIN - 1 }], focus).phase).toBe("focus");
    expect(focusDone.phase).toBe("focusDone");
    expect(focusDone.endedEarly).toBe(false);
  });
  it("stop: focus -> focusDone with endedEarly", () => {
    const s = run([{ type: "stop", now: 5000 }], focus);
    expect(s.phase).toBe("focusDone");
    expect(s.endedEarly).toBe(true);
  });
  it("startBreak: focusDone -> break", () => {
    expect(brk).toMatchObject({
      phase: "break",
      startedAt: 2000,
      durationMs: 5 * MIN,
      pausedMs: 0,
    });
  });
  it("noteSaved: focusDone -> idle", () => {
    expect(run([{ type: "noteSaved" }], focusDone)).toEqual(initialTimer);
  });
  it("tick: break -> idle when remaining <= 0", () => {
    expect(run([{ type: "tick", now: 2000 + 5 * MIN }], brk)).toEqual(initialTimer);
  });
  it("stop and skipBreak: break -> idle", () => {
    expect(run([{ type: "stop", now: 3000 }], brk)).toEqual(initialTimer);
    expect(run([{ type: "skipBreak" }], brk)).toEqual(initialTimer);
  });
});

describe("invalid transitions are no-ops", () => {
  const all: TimerAction[] = [
    { type: "start", now: 0, focusMinutes: 1 },
    { type: "pause", now: 0 },
    { type: "resume", now: 0 },
    { type: "stop", now: 0 },
    { type: "tick", now: 0 },
    { type: "startBreak", now: 0, breakMinutes: 1 },
    { type: "skipBreak" },
    { type: "noteSaved" },
  ];
  const cases: [string, TimerState, string[]][] = [
    ["idle", initialTimer, ["start"]],
    ["focus", focus, ["pause", "stop", "tick"]],
    ["focusDone", focusDone, ["startBreak", "noteSaved"]],
    ["break", brk, ["pause", "stop", "tick", "skipBreak"]],
  ];
  for (const [name, state, valid] of cases) {
    it(`${name} ignores everything but ${valid.join(", ")}`, () => {
      for (const a of all) {
        if (valid.includes(a.type)) continue;
        expect(timerReducer(state, a)).toBe(state);
      }
    });
  }
  it("tick before the end does not change state", () => {
    expect(timerReducer(focus, { type: "tick", now: 2000 })).toBe(focus);
  });
});

describe("pause / resume", () => {
  const paused = run([{ type: "pause", now: 1000 + 10 * MIN }], focus);
  const resumed = run([{ type: "resume", now: 1000 + 12 * MIN }], paused);

  it("pause records pausedAt and freezes remaining", () => {
    expect(paused.pausedAt).toBe(1000 + 10 * MIN);
    expect(remainingMs(paused, 1000 + 20 * MIN)).toBe(15 * MIN);
  });
  it("resume accumulates pausedMs and clears pausedAt", () => {
    expect(resumed).toMatchObject({ pausedAt: null, pausedMs: 2 * MIN });
    expect(remainingMs(resumed, 1000 + 12 * MIN)).toBe(15 * MIN);
  });
  it("second pause adds to pausedMs", () => {
    const again = run(
      [
        { type: "pause", now: 1000 + 14 * MIN },
        { type: "resume", now: 1000 + 15 * MIN },
      ],
      resumed,
    );
    expect(again.pausedMs).toBe(3 * MIN);
    expect(remainingMs(again, 1000 + 15 * MIN)).toBe(13 * MIN);
  });
  it("pause twice / resume when not paused are no-ops", () => {
    expect(timerReducer(paused, { type: "pause", now: 0 })).toBe(paused);
    expect(timerReducer(resumed, { type: "resume", now: 0 })).toBe(resumed);
  });
  it("tick does not complete while paused", () => {
    expect(timerReducer(paused, { type: "tick", now: 1000 + 60 * MIN })).toBe(paused);
  });
  it("stop while paused ends early", () => {
    expect(run([{ type: "stop", now: 0 }], paused)).toMatchObject({
      phase: "focusDone",
      endedEarly: true,
    });
  });
  it("works during break too", () => {
    const p = run([{ type: "pause", now: 2000 + MIN }], brk);
    expect(remainingMs(p, 2000 + 10 * MIN)).toBe(4 * MIN);
  });
});

describe("remainingMs", () => {
  it("reconstructs from the same state object after a 'reload' with a later now", () => {
    expect(remainingMs(focus, 1000)).toBe(25 * MIN);
    expect(remainingMs(focus, 1000 + 7 * MIN)).toBe(18 * MIN);
    expect(remainingMs(focus, 1000 + 99 * MIN)).toBe(0);
  });
  it("is 0 for idle and focusDone", () => {
    expect(remainingMs(initialTimer, 5)).toBe(0);
    expect(remainingMs(focusDone, 5)).toBe(0);
  });
});

describe("focusSummary", () => {
  it("describes a completed focus", () => {
    expect(focusSummary(focusDone, 1000 + 25 * MIN)).toEqual({
      startedAt: 1000,
      endedAt: 1000 + 25 * MIN,
      focusMinutes: 25,
      endedEarly: false,
      taskId: null,
      taskTitle: "",
    });
  });
  it("excludes paused time from focusMinutes", () => {
    const s = run(
      [
        { type: "pause", now: 1000 + 5 * MIN },
        { type: "resume", now: 1000 + 8 * MIN },
        { type: "stop", now: 1000 + 12 * MIN + 20_000 },
      ],
      focus,
    );
    expect(focusSummary(s, 0).focusMinutes).toBe(9);
  });
  it("uses the stop time and counts elapsed minutes on early stop", () => {
    const s = run([{ type: "stop", now: 1000 + 10 * MIN }], focus);
    expect(focusSummary(s, 1000 + 10 * MIN)).toEqual({
      startedAt: 1000,
      endedAt: 1000 + 10 * MIN,
      focusMinutes: 10,
      endedEarly: true,
      taskId: null,
      taskTitle: "",
    });
  });
});

describe("formatMmSs", () => {
  it("rounds up to whole seconds and pads", () => {
    expect(formatMmSs(25 * MIN)).toBe("25:00");
    expect(formatMmSs(61_500)).toBe("1:02");
    expect(formatMmSs(0)).toBe("0:00");
  });
});

describe("late tick", () => {
  it("ends focus at its deadline, not at the tick time", () => {
    const s = timerReducer(initialTimer, { type: "start", now: 0, focusMinutes: 25 });
    const done = timerReducer(s, { type: "tick", now: 3 * 60 * 60_000 });
    expect(done.phase).toBe("focusDone");
    expect(focusSummary(done, 3 * 60 * 60_000)).toMatchObject({
      endedAt: 25 * 60_000,
      focusMinutes: 25,
    });
  });
});

describe("linked task", () => {
  it("start carries the task through to focusSummary", () => {
    const task = { id: "t1", title: "Write report" };
    const s = timerReducer(initialTimer, { type: "start", now: 0, focusMinutes: 25, task });
    const done = timerReducer(s, { type: "stop", now: 60_000 });
    expect(focusSummary(done, 60_000)).toMatchObject({ taskId: "t1", taskTitle: "Write report" });
  });
  it("start without a task yields null id and empty title", () => {
    const s = timerReducer(initialTimer, { type: "start", now: 0, focusMinutes: 25 });
    expect(focusSummary(s, 0)).toMatchObject({ taskId: null, taskTitle: "" });
  });
});
