import { useState } from "react";
import type { useLists } from "../data/lists";
import { requestNotificationPermission } from "../data/reminders";
import { updateTask } from "../data/tasks";
import { type Repeat, type Task, timesLeft } from "../domain/tasks";
import { Icon } from "../icons";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const REPEATS = [
  ["", "Never"],
  ["daily", "Daily"],
  ["weekdays", "Weekdays"],
  ["weekly", "Weekly"],
  ["monthly", "Monthly"],
  ["yearly", "Yearly"],
] as const;

// datetime-local wants local wall-clock time; reminderAt is UTC ms.
function toLocalInput(ms: number): string {
  return new Date(ms - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

// Keyed by task id in Tasks, so uncontrolled fields (title, note) reset when another task opens.
export function TaskDetail({
  task,
  lists,
  stats,
  isAccountability,
  onSetAccountability,
  onStart,
  onDelete,
  onClose,
}: {
  task: Task;
  lists: ReturnType<typeof useLists>;
  stats: { count: number; minutes: number };
  isAccountability: boolean;
  onSetAccountability: () => void;
  onStart: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const save = (patch: Partial<Task>) => updateTask(task.id, patch);
  const setTimes = (times: number) => {
    if (Number.isInteger(times) && times >= 1 && times <= 99)
      save({ times, timesDone: Math.min(task.timesDone ?? 0, times - 1) });
  };
  const repeat = task.repeat;
  const todayDate = new Date().toLocaleDateString("en-CA");
  const dueToday = task.dueDate === todayDate;
  const inToday = dueToday || task.todayOn === todayDate;
  const [armed, setArmed] = useState(false); // Delete is permanent: first click arms, second deletes.

  function setKind(kind: string) {
    const r: Repeat | null =
      kind === ""
        ? null
        : kind === "weekly"
          ? { kind, days: [new Date().getDay()] }
          : kind === "monthly"
            ? { kind, dayOfMonth: Number(task.dueDate?.slice(8) ?? new Date().getDate()) }
            : kind === "yearly"
              ? { kind, anchor: (task.dueDate ?? new Date().toLocaleDateString("en-CA")).slice(5) }
              : { kind: kind as "daily" | "weekdays" };
    save({ repeat: r });
  }

  return (
    <aside className="card task-detail" aria-label="Task details">
      <div className="detail-head">
        <textarea
          className="title-input"
          aria-label="Task title"
          defaultValue={task.title}
          onBlur={(e) => {
            const title = e.target.value.trim();
            if (title && title !== task.title) save({ title });
          }}
        />
        <button type="button" className="ghost icon" onClick={onClose} aria-label="Close">
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="stats ruled">
        <div>
          <strong>{stats.count}</strong>
          <span>session{stats.count === 1 ? "" : "s"}</span>
        </div>
        <div>
          <strong>{stats.minutes}</strong>
          <span>min focused</span>
        </div>
      </div>
      <div className="button-row">
        <button type="button" className="big small" onClick={onStart}>
          <span className="big-icon">
            <Icon name="play" size={10} />
          </span>
          Start pomodoro
        </button>
        {isAccountability ? (
          <span className="badge">
            <Icon name="check" size={12} /> Shared with partner
          </span>
        ) : (
          <button type="button" className="outline" onClick={onSetAccountability}>
            Set as accountability task
          </button>
        )}
      </div>
      <button
        type="button"
        className="outline important"
        aria-pressed={!!task.important}
        onClick={() => save({ important: !task.important })}
      >
        <Icon name="star" size={14} />
        {task.important ? "Important" : "Mark as important"}
      </button>
      <button
        type="button"
        className="outline"
        aria-pressed={inToday}
        disabled={dueToday} // already in Today by its due date
        onClick={() => save({ todayOn: task.todayOn === todayDate ? null : todayDate })}
      >
        <Icon name="check" size={14} />
        {inToday ? "In Today" : "Move to Today"}
      </button>
      <label className="field">
        <span>Due</span>
        <span className="field-row">
          <input
            type="date"
            value={task.dueDate ?? ""}
            onChange={(e) => save({ dueDate: e.target.value || null })}
          />
          {task.dueDate && (
            <button type="button" className="link" onClick={() => save({ dueDate: null })}>
              Clear
            </button>
          )}
        </span>
      </label>
      <label className="field">
        <span>Reminder</span>
        <span className="field-row">
          <input
            type="datetime-local"
            value={task.reminderAt === null ? "" : toLocalInput(task.reminderAt)}
            onChange={(e) => {
              const ms = e.target.value ? new Date(e.target.value).getTime() : null;
              if (ms !== null) requestNotificationPermission();
              save({ reminderAt: ms });
            }}
          />
          {task.reminderAt !== null && (
            <button type="button" className="link" onClick={() => save({ reminderAt: null })}>
              Clear
            </button>
          )}
        </span>
      </label>
      <div className="field">
        <span>Times to complete</span>
        <div className="inline-field">
          <div className="stepper">
            <button
              type="button"
              onClick={() => setTimes((task.times ?? 1) - 1)}
              aria-label="Decrease times to complete"
            >
              −
            </button>
            <input
              key={task.times ?? 1}
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              defaultValue={task.times ?? 1}
              onBlur={(e) => setTimes(Number(e.target.value))}
              aria-label="Times to complete"
            />
            <button
              type="button"
              onClick={() => setTimes((task.times ?? 1) + 1)}
              aria-label="Increase times to complete"
            >
              +
            </button>
          </div>
          {(task.times ?? 1) > 1 && <span className="muted">{timesLeft(task)} left</span>}
        </div>
      </div>
      <label className="field">
        <span>List</span>
        <select value={task.listId} onChange={(e) => save({ listId: e.target.value })}>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <div className="field">
        <span>Repeat</span>
        <div className="chips">
          {REPEATS.map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              className="chip"
              aria-pressed={(repeat?.kind ?? "") === kind}
              onClick={() => setKind(kind)}
            >
              {label}
            </button>
          ))}
        </div>
        {repeat?.kind === "weekly" && (
          <div className="days">
            {DAYS.map((name, d) => {
              const on = repeat.days.includes(d);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const days = on
                      ? repeat.days.filter((x) => x !== d)
                      : [...repeat.days, d].sort();
                    save({ repeat: { kind: "weekly", days } });
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
        {repeat?.kind === "monthly" && (
          <label className="inline-field">
            Day of month
            <input
              type="number"
              min={1}
              max={31}
              value={repeat.dayOfMonth}
              onChange={(e) => {
                const dayOfMonth = Number(e.target.value);
                if (dayOfMonth >= 1 && dayOfMonth <= 31)
                  save({ repeat: { kind: "monthly", dayOfMonth } });
              }}
            />
          </label>
        )}
      </div>
      <label className="field">
        <span>Note</span>
        <textarea
          rows={4}
          placeholder="Anything worth remembering"
          defaultValue={task.note}
          onBlur={(e) => {
            if (e.target.value !== task.note) save({ note: e.target.value });
          }}
        />
      </label>
      <button
        type="button"
        className={armed ? "danger" : "outline"}
        onClick={() => (armed ? onDelete() : setArmed(true))}
        onBlur={() => setArmed(false)}
      >
        <Icon name="trash" size={15} />
        {armed ? "Confirm delete" : "Delete"}
      </button>
    </aside>
  );
}
