// Pomodoro timer state machine. Pure: no React, no Firebase. Times are epoch ms passed in via
// actions so the reducer is deterministic and state survives a reload (see remainingMs).
export type Phase = "idle" | "focus" | "focusDone" | "break";

export type TimerState = {
  phase: Phase;
  startedAt: number | null; // start of the current period; null when idle
  pausedAt: number | null; // while paused: when the pause began; in focusDone: when focus ended
  pausedMs: number; // total ms of earlier pauses in this period
  durationMs: number;
  endedEarly: boolean;
};

export type TimerAction =
  | { type: "start"; now: number; focusMinutes: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "stop"; now: number }
  | { type: "tick"; now: number }
  | { type: "startBreak"; now: number; breakMinutes: number }
  | { type: "skipBreak" }
  | { type: "noteSaved" };

const MIN = 60_000;

export const initialTimer: TimerState = {
  phase: "idle",
  startedAt: null,
  pausedAt: null,
  pausedMs: 0,
  durationMs: 0,
  endedEarly: false,
};

function period(phase: Phase, now: number, minutes: number): TimerState {
  return { ...initialTimer, phase, startedAt: now, durationMs: minutes * MIN };
}

function focusDone(state: TimerState, now: number, endedEarly: boolean): TimerState {
  return { ...state, phase: "focusDone", pausedAt: now, endedEarly };
}

export function remainingMs(state: TimerState, now: number): number {
  if (state.startedAt === null || state.phase === "focusDone") return 0;
  const elapsed = (state.pausedAt ?? now) - state.startedAt - state.pausedMs;
  return Math.max(0, state.durationMs - elapsed);
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  const running = state.phase === "focus" || state.phase === "break";
  switch (action.type) {
    case "start":
      return state.phase === "idle" ? period("focus", action.now, action.focusMinutes) : state;
    case "pause":
      return running && state.pausedAt === null ? { ...state, pausedAt: action.now } : state;
    case "resume":
      return running && state.pausedAt !== null
        ? { ...state, pausedAt: null, pausedMs: state.pausedMs + action.now - state.pausedAt }
        : state;
    case "stop":
      if (state.phase === "focus") return focusDone(state, action.now, true);
      return state.phase === "break" ? initialTimer : state;
    case "tick":
      if (!running || state.pausedAt !== null || remainingMs(state, action.now) > 0) return state;
      // Deadline, not tick time: a late tick (reload, throttled tab) must not inflate the session.
      return state.phase === "focus"
        ? focusDone(state, (state.startedAt as number) + state.pausedMs + state.durationMs, false)
        : initialTimer;
    case "startBreak":
      return state.phase === "focusDone" ? period("break", action.now, action.breakMinutes) : state;
    case "skipBreak":
      return state.phase === "break" ? initialTimer : state;
    case "noteSaved":
      return state.phase === "focusDone" ? initialTimer : state;
  }
}

// What a session record needs from a focusDone state. focusMinutes is actual focused time
// (pauses excluded), so an early stop records what was really done.
export function focusSummary(
  state: TimerState,
  now: number,
): { startedAt: number; endedAt: number; focusMinutes: number; endedEarly: boolean } {
  const startedAt = state.startedAt ?? now;
  const endedAt = state.pausedAt ?? now;
  return {
    startedAt,
    endedAt,
    focusMinutes: Math.round((endedAt - startedAt - state.pausedMs) / MIN),
    endedEarly: state.endedEarly,
  };
}

export function formatMmSs(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
