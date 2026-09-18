import {
  createContext,
  createElement,
  type Dispatch,
  type ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  focusSummary,
  initialTimer,
  remainingMs,
  type TimerAction,
  type TimerState,
  timerReducer,
} from "../domain/timer";
import type { Settings } from "../domain/user";
import { useUserDoc } from "./user";

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

function beep() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.frequency.value = 880;
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
  osc.onended = () => ctx.close();
}

function periodEnded(title: string, sound: boolean) {
  if ("Notification" in window && Notification.permission === "granted") new Notification(title);
  if (sound) beep();
}

export type PendingSession = ReturnType<typeof focusSummary>;

type TimerContextValue = {
  state: TimerState;
  dispatch: Dispatch<TimerAction>;
  settings: Settings | undefined;
  pending: PendingSession | null; // a finished focus awaiting its note
  clearPending: () => void;
};

const TimerContext = createContext<TimerContextValue | null>(null);

// One timer for the whole app. Owns period-end effects (notification, sound, auto-break) so they
// fire whichever screen is open, and captures the focus summary before the break overwrites it.
export function TimerProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [state, dispatch] = useTimer();
  const settings = useUserDoc(uid)?.settings;
  const [pending, setPending] = useState<PendingSession | null>(() =>
    state.phase === "focusDone" ? focusSummary(state, Date.now()) : null,
  );
  const prev = useRef(state);

  useEffect(() => {
    const was = prev.current;
    prev.current = state;
    if (was.phase === state.phase) return;
    const now = Date.now();
    if (was.phase === "focus" && state.phase === "focusDone") {
      setPending(focusSummary(state, now));
      if (!state.endedEarly) {
        periodEnded("Focus done — take a break", settings?.soundEnabled ?? true);
        dispatch({ type: "startBreak", now, breakMinutes: settings?.breakMinutes ?? 5 });
      }
    } else if (was.phase === "break" && state.phase === "idle" && remainingMs(was, now) === 0) {
      periodEnded("Break over", settings?.soundEnabled ?? true);
    }
  }, [state, dispatch, settings]);

  return createElement(
    TimerContext.Provider,
    { value: { state, dispatch, settings, pending, clearPending: () => setPending(null) } },
    children,
  );
}

export function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimerContext outside TimerProvider");
  return ctx;
}
