import { useState } from "react";
import type { AuthUser } from "../data/auth";
import { addSession } from "../data/sessions";
import { useTimerContext } from "../data/timer";
import { formatMmSs, remainingMs } from "../domain/timer";

const LABEL = { idle: "Ready", focus: "Focus", focusDone: "Focus done", break: "Break" };

export function Timer({ user }: { user: AuthUser }) {
  const { state, dispatch, settings, pending, clearPending, startFocus } = useTimerContext();
  const [note, setNote] = useState<string | null>(null);
  const noteText = note ?? pending?.taskTitle ?? "";
  const now = Date.now();
  const running = state.phase === "focus" || state.phase === "break";
  const paused = state.pausedAt !== null;

  const save = async () => {
    if (!pending) return;
    await addSession({ ownerId: user.uid, note: noteText, ...pending });
    setNote(null);
    clearPending();
    dispatch({ type: "noteSaved" });
  };

  return (
    <>
      <h1>Timer</h1>
      <p className="muted">
        {LABEL[state.phase]}
        {state.task && ` · ${state.task.title}`}
      </p>
      <p className="timer-clock">{formatMmSs(remainingMs(state, now))}</p>
      <div className="timer-actions">
        {state.phase === "idle" && (
          <button
            type="button"
            className="primary"
            disabled={!settings}
            onClick={() => startFocus()}
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
            {pending.focusMinutes} min focus{pending.endedEarly ? " (stopped early)" : ""}
            {pending.taskTitle && ` on “${pending.taskTitle}”`}. What did you do?
          </p>
          <textarea value={noteText} onChange={(e) => setNote(e.target.value)} rows={3} />
          <button type="submit" className="primary">
            Save session
          </button>
        </form>
      )}
    </>
  );
}
