import { type CSSProperties, useEffect, useState } from "react";
import type { AuthUser } from "../data/auth";
import { addSession, useSessions } from "../data/sessions";
import { useTimerContext } from "../data/timer";
import { ITEMS, type Item, PANELS, PRESETS, useTimerView } from "../data/timerView";
import { DENSITIES, type Density, dotMatrix, gridOf } from "../domain/dots";
import { formatMmSs, remainingMs } from "../domain/timer";
import { Icon } from "../icons";
import { useReorder } from "../reorder";
import { TimerPanel } from "./TimerPanels";

const LABEL = {
  idle: "Ready to focus",
  focus: "Focus",
  focusDone: "Focus done",
  break: "Take a short break",
};
const isPanel = (k: Item) => PANELS.some(([p]) => p === k);

export function Timer({ user }: { user: AuthUser }) {
  const { state, dispatch, settings, pending, clearPending, startFocus } = useTimerContext();
  const [note, setNote] = useState<string | null>(null);
  const [view, setView] = useTimerView();
  const noteText = note ?? pending?.taskTitle ?? "";
  const now = Date.now();
  const running = state.phase === "focus" || state.phase === "break";
  const paused = state.pausedAt !== null;
  const startOfDay = new Date().setHours(0, 0, 0, 0);
  const sessionsToday = useSessions(user.uid).filter((s) => s.startedAt >= startOfDay).length;

  // What's visible: focus mode keeps only the dots (and progress row); Details off hides panels.
  const has = (k: Item) =>
    view.shown.includes(k) && (!view.focus || k === "progress") && (view.details || !isPanel(k));
  const panels = view.order.filter(has);
  const hiddenPanels = PANELS.filter(([k]) => !view.shown.includes(k));
  const reorder = useReorder(panels.length, (from, to) => {
    const moved = [...panels];
    moved.splice(to, 0, ...moved.splice(from, 1));
    let i = 0;
    setView({ order: view.order.map((k) => (panels.includes(k) ? (moved[i++] ?? k) : k)) });
  });

  // The header lives in App; hide it through a class on <body> while nav is off or focusing.
  const hideNav = view.focus || !view.shown.includes("nav");
  useEffect(() => {
    document.body.classList.toggle("hide-nav", hideNav);
    return () => document.body.classList.remove("hide-nav");
  }, [hideNav]);
  useEffect(() => {
    if (!view.focus) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setView({ focus: false });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view.focus, setView]);

  const total = state.phase === "idle" ? (settings?.focusMinutes ?? 25) * 60_000 : state.durationMs;
  const left = state.phase === "idle" ? total : remainingMs(state, now);
  const colon = !running || paused || Math.ceil(left / 1000) % 2 === 0;
  const progress = has("progress") ? (total ? 1 - left / total : 0) : null;
  const dots = dotMatrix(left, progress, colon, view.density);
  const gridStyle = { "--cols": gridOf(view.density).cols } as CSSProperties;
  const togglePause = () => {
    if (state.phase === "idle") startFocus();
    else if (running) dispatch({ type: paused ? "resume" : "pause", now });
  };

  // Design sets the first third of the title in ink and the rest faint.
  const words = (
    state.phase === "break" ? LABEL.break : (state.task?.title ?? LABEL[state.phase])
  ).split(" ");
  const cut = Math.max(1, Math.ceil(words.length / 3));

  const save = (takeBreak: boolean) => {
    if (!pending) return;
    // Not awaited: offline the write only resolves on server ack, but it's already in the local cache.
    addSession({ ownerId: user.uid, note: noteText, ...pending }).catch(console.error);
    setNote(null);
    clearPending();
    dispatch(
      takeBreak
        ? { type: "startBreak", now: Date.now(), breakMinutes: settings?.breakMinutes ?? 5 }
        : { type: "noteSaved" },
    );
  };

  const dotCells = dots.map((d, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size grid, position is identity
    <span key={i} className={d} />
  ));

  return (
    <section className={view.focus ? "timer focus" : "timer"}>
      {view.focus ? (
        <button type="button" className="exit-focus" onClick={() => setView({ focus: false })}>
          Exit focus <span className="faint">Esc</span>
        </button>
      ) : (
        <div className="timer-toolbar">
          <button
            type="button"
            className={view.details ? "ink" : "outline"}
            aria-pressed={view.details}
            onClick={() => setView({ details: !view.details })}
          >
            Details
          </button>
          <button type="button" className="outline" onClick={() => setView({ focus: true })}>
            Focus mode
          </button>
          <button type="button" className="outline" popoverTarget="timer-view">
            View <Icon name="down" size={14} />
          </button>
          <ViewPanel
            shown={view.shown}
            density={view.density}
            onToggle={(k) =>
              setView({
                shown: view.shown.includes(k)
                  ? view.shown.filter((x) => x !== k)
                  : [...view.shown, k],
              })
            }
            set={setView}
          />
        </div>
      )}

      {(has("task") || has("phase")) && (
        <div className="timer-top">
          {has("task") && (
            <h1>
              {words.slice(0, cut).join(" ")}
              <br />
              <span className="faint">{words.slice(cut).join(" ")}</span>
            </h1>
          )}
          {has("phase") && (
            <div className="segmented">
              <span aria-current={state.phase !== "break"}>
                Focus {settings?.focusMinutes ?? 25}
              </span>
              <span aria-current={state.phase === "break"}>
                Break {settings?.breakMinutes ?? 5}
              </span>
            </div>
          )}
        </div>
      )}

      {has("readout") && (
        <div className="timer-readout">
          <span>{formatMmSs(total - left)}</span>
          <span>{formatMmSs(total)}</span>
        </div>
      )}

      {/* Without the controls row the grid itself is the button: tap to start, pause or resume. */}
      {has("controls") ? (
        <div
          className={paused ? "dots paused" : "dots"}
          role="timer"
          aria-label={`${formatMmSs(left)} remaining`}
          style={gridStyle}
        >
          {dotCells}
        </div>
      ) : (
        <button
          type="button"
          className={paused ? "dots paused" : "dots"}
          aria-label={`${formatMmSs(left)} remaining. ${running && !paused ? "Pause" : "Start"}`}
          disabled={!!pending || !settings}
          onClick={togglePause}
          style={gridStyle}
        >
          {dotCells}
        </button>
      )}

      {has("controls") && !pending && (
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
          <button type="button" className="big" disabled={!settings} onClick={togglePause}>
            <span className="big-icon">
              <Icon name={running && !paused ? "pause" : "play"} />
            </span>
            {state.phase === "idle" ? "Start focus" : paused ? "Resume" : "Pause"}
          </button>
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
            save(false);
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
          <div className="button-row">
            <button type="submit" className="ink">
              Save session
            </button>
            {/* A focus that ran out already started its break; only a stopped one offers this. */}
            {state.phase === "focusDone" && (
              <button type="button" className="primary" onClick={() => save(true)}>
                Save and take a break
              </button>
            )}
          </div>
        </form>
      )}

      {panels.length > 0 && (
        <div className="panels">
          {panels.map((id, i) => (
            <TimerPanel
              key={id}
              id={id}
              user={user}
              reorder={reorder}
              index={i}
              onHide={() => setView({ shown: view.shown.filter((k) => k !== id) })}
            />
          ))}
        </div>
      )}
      {!view.focus && view.details && hiddenPanels.length > 0 && (
        <div className="hidden-panels">
          <span className="muted">Hidden</span>
          {hiddenPanels.map(([k, label]) => (
            <button
              key={k}
              type="button"
              className="dashed"
              onClick={() => setView({ shown: [...view.shown, k] })}
            >
              <Icon name="plus" size={12} /> {label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// The design's "View" popover: presets, grid density, and a switch per element.
// Native popover, so outside-click and Esc dismissal come free.
function ViewPanel({
  shown,
  density,
  onToggle,
  set,
}: {
  shown: Item[];
  density: Density;
  onToggle: (k: Item) => void;
  set: (patch: { shown?: Item[]; density?: Density }) => void;
}) {
  const grid = gridOf(density);
  return (
    <div id="timer-view" popover="auto" className="view-panel">
      <div className="view-head">
        <strong>Show</strong>
        <span className="muted">
          {shown.length} of {ITEMS.length}
        </span>
      </div>
      <div className="chips even">
        {Object.entries(PRESETS).map(([name, keys]) => (
          <button
            key={name}
            type="button"
            className="chip"
            aria-pressed={keys.length === shown.length && keys.every((k) => shown.includes(k))}
            onClick={() => set({ shown: [...keys] })}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="view-head">
        <span className="strong">Grid</span>
        <span className="muted">
          {grid.cols} × {grid.rows}
        </span>
      </div>
      <div className="chips even four">
        {(Object.keys(DENSITIES) as Density[]).map((d) => (
          <button
            key={d}
            type="button"
            className="chip"
            aria-pressed={d === density}
            onClick={() => set({ density: d })}
          >
            {d}
          </button>
        ))}
      </div>
      <div>
        {ITEMS.map(([k, label]) => (
          <label key={k} className="view-toggle">
            <span className={shown.includes(k) ? undefined : "muted"}>{label}</span>
            <input
              type="checkbox"
              className="switch"
              checked={shown.includes(k)}
              onChange={() => onToggle(k)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
