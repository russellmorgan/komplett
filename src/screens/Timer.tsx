import { useState } from "react";
import type { AuthUser } from "../data/auth";
import { requestNotificationPermission } from "../data/reminders";
import { addSession } from "../data/sessions";
import { useTimerContext } from "../data/timer";
import { formatMmSs, remainingMs } from "../domain/timer";

const LABEL = { idle: "Ready", focus: "Focus", focusDone: "Focus done", break: "Break" };

export function Timer({ user }: { user: AuthUser }) {
  const { state, dispatch, settings, pending, clearPending } = useTimerContext();
  const [note, setNote] = useState("");
  const now = Date.now();
  const running = state.phase === "focus" || state.phase === "break";
  const paused = state.pausedAt !== null;

  const save = async () => {
    if (!pending) return;
    await addSession({ ownerId: user.uid, taskId: null, taskTitle: "", note, ...pending });
    setNote("");
    clearPending();
    dispatch({ type: "noteSaved" });
  };

  return (
    <>
      <h1>Timer</h1>
      <p className="muted">{LABEL[state.phase]}</p>
      <p className="timer-clock">{formatMmSs(remainingMs(state, now))}</p>
      <div className="timer-actions">
        {state.phase === "idle" && (
          <button
            type="button"
            className="primary"
            disabled={!settings}
            onClick={() => {
              requestNotificationPermission();
              dispatch({ type: "start", now, focusMinutes: settings?.focusMinutes ?? 25 });
            }}
          >
            Start focus
          </button>
        )}
        {running && (
          <>
            <button
              type="button"
              onClick={() => dispatch({ type: paused ? "resume" : "pause", now })}
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button type="button" onClick={() => dispatch({ type: "stop", now })}>
              Stop
            </button>
          </>
        )}
        {state.phase === "break" && (
          <button type="button" onClick={() => dispatch({ type: "skipBreak" })}>
            Skip break
          </button>
        )}
      </div>
      {pending && (
        <form
          className="timer-note"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <p className="muted">
            {pending.focusMinutes} min focus{pending.endedEarly ? " (stopped early)" : ""}. What did
            you do?
          </p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <button type="submit" className="primary">
            Save session
          </button>
        </form>
      )}
    </>
  );
}
