import { useState } from "react";
import type { AuthUser } from "../data/auth";
import { addSession, useSessions } from "../data/sessions";
import { useTimerContext } from "../data/timer";
import { dotMatrix } from "../domain/dots";
import { formatMmSs, remainingMs } from "../domain/timer";
import { Icon } from "../icons";

const LABEL = {
  idle: "Ready to focus",
  focus: "Focus",
  focusDone: "Focus done",
  break: "Take a short break",
};

export function Timer({ user }: { user: AuthUser }) {
  const { state, dispatch, settings, pending, clearPending, startFocus } = useTimerContext();
  const [note, setNote] = useState<string | null>(null);
  const noteText = note ?? pending?.taskTitle ?? "";
  const now = Date.now();
  const running = state.phase === "focus" || state.phase === "break";
  const paused = state.pausedAt !== null;
  const startOfDay = new Date().setHours(0, 0, 0, 0);
  const sessionsToday = useSessions(user.uid).filter((s) => s.startedAt >= startOfDay).length;

  const total = state.phase === "idle" ? (settings?.focusMinutes ?? 25) * 60_000 : state.durationMs;
  const left = state.phase === "idle" ? total : remainingMs(state, now);
  const colon = !running || paused || Math.ceil(left / 1000) % 2 === 0;
  const dots = dotMatrix(left, total ? 1 - left / total : 0, colon);

  // Design sets the first third of the title in ink and the rest faint.
  const words = (
    state.phase === "break" ? LABEL.break : (state.task?.title ?? LABEL[state.phase])
  ).split(" ");
  const cut = Math.max(1, Math.ceil(words.length / 3));

  const save = async () => {
    if (!pending) return;
    await addSession({ ownerId: user.uid, note: noteText, ...pending });
    setNote(null);
    clearPending();
    dispatch({ type: "noteSaved" });
  };

  return (
    <section className="timer">
      <div className="timer-top">
        <h1>
          {words.slice(0, cut).join(" ")}
          <br />
          <span className="faint">{words.slice(cut).join(" ")}</span>
        </h1>
        <div className="segmented">
          <span aria-current={state.phase !== "break"}>Focus {settings?.focusMinutes ?? 25}</span>
          <span aria-current={state.phase === "break"}>Break {settings?.breakMinutes ?? 5}</span>
        </div>
      </div>

      <div className="timer-readout">
        <span>{formatMmSs(total - left)}</span>
        <span>{formatMmSs(total)}</span>
      </div>

      <div
        className={paused ? "dots paused" : "dots"}
        role="timer"
        aria-label={`${formatMmSs(left)} remaining`}
      >
        {dots.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size grid, position is identity
          <span key={i} className={d} />
        ))}
      </div>

      {!pending && (
        <div className="timer-controls">
          <button
            type="button"
            className="square"
            aria-label="Stop"
            disabled={!running}
            onClick={() => dispatch({ type: "stop", now })}
          >
            <Icon name="stop" size={16} />
          </button>
          {state.phase === "idle" ? (
            <button type="button" className="big" disabled={!settings} onClick={() => startFocus()}>
              <span className="big-icon">
                <Icon name="play" />
              </span>
              Start focus
            </button>
          ) : (
            <button
              type="button"
              className="big"
              onClick={() => dispatch({ type: paused ? "resume" : "pause", now })}
            >
              <span className="big-icon">
                <Icon name={paused ? "play" : "pause"} />
              </span>
              {paused ? "Resume" : "Pause"}
            </button>
          )}
          {state.phase === "break" ? (
            <button
              type="button"
              className="outline"
              onClick={() => dispatch({ type: "skipBreak" })}
            >
              Skip break
            </button>
          ) : (
            <div className="sessions-today">
              <strong>{sessionsToday}</strong>
              <span>sessions today</span>
            </div>
          )}
        </div>
      )}

      {pending && (
        <form
          className="card timer-note"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <span>
            {pending.focusMinutes} min focus{pending.endedEarly ? " (stopped early)" : ""}
            {pending.taskTitle && ` on “${pending.taskTitle}”`}. What did you do?
          </span>
          <textarea
            value={noteText}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            aria-label="Session note"
          />
          <button type="submit" className="primary">
            Save session
          </button>
        </form>
      )}
    </section>
  );
}
