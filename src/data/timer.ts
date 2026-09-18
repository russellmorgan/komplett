import { type Dispatch, useEffect, useReducer } from "react";
import { initialTimer, type TimerAction, type TimerState, timerReducer } from "../domain/timer";

const KEY = "komplett:timer";

function hydrate(): TimerState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initialTimer, ...JSON.parse(raw) } : initialTimer;
  } catch {
    return initialTimer;
  }
}

// Running timer lives in localStorage only (CONTEXT.md invariant); finished sessions go to
// Firestore elsewhere. Ticks once a second while focus/break is running and not paused.
export function useTimer(): [TimerState, Dispatch<TimerAction>] {
  const [state, dispatch] = useReducer(timerReducer, undefined, hydrate);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const running = (state.phase === "focus" || state.phase === "break") && state.pausedAt === null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => dispatch({ type: "tick", now: Date.now() }), 1000);
    return () => clearInterval(id);
  }, [running]);

  return [state, dispatch];
}
