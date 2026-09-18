import { requestNotificationPermission } from "../data/reminders";
import { updateTask } from "../data/tasks";
import type { Repeat, Task } from "../domain/tasks";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// datetime-local wants local wall-clock time; reminderAt is UTC ms.
function toLocalInput(ms: number): string {
  return new Date(ms - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function TaskDetail({
  task,
  stats,
  onStart,
  onClose,
}: {
  task: Task;
  stats: { count: number; minutes: number };
  onStart: () => void;
  onClose: () => void;
}) {
  const save = (patch: Partial<Task>) => updateTask(task.id, patch);
  const repeat = task.repeat;

  function setKind(kind: string) {
    const r: Repeat | null =
      kind === ""
        ? null
        : kind === "weekly"
          ? { kind, days: [new Date().getDay()] }
          : kind === "monthly"
            ? { kind, dayOfMonth: Number(task.dueDate?.slice(8) ?? new Date().getDate()) }
            : { kind: kind as "daily" | "weekdays" | "yearly" };
    save({ repeat: r });
  }

  return (
    <aside className="task-detail">
      <header>
        <strong>{task.title}</strong>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <p className="muted">
        {stats.count} session{stats.count === 1 ? "" : "s"}, {stats.minutes} min focus{" "}
        <button type="button" onClick={onStart}>
          Start pomodoro
        </button>
      </p>
      <label>
        Due
        <input
          type="date"
          value={task.dueDate ?? ""}
          onChange={(e) => save({ dueDate: e.target.value || null })}
        />
      </label>
      <label>
        Reminder
        <input
          type="datetime-local"
          value={task.reminderAt === null ? "" : toLocalInput(task.reminderAt)}
          onChange={(e) => {
            const ms = e.target.value ? new Date(e.target.value).getTime() : null;
            if (ms !== null) requestNotificationPermission();
            save({ reminderAt: ms });
          }}
        />
      </label>
      <label>
        Note
        <textarea
          defaultValue={task.note}
          onBlur={(e) => {
            if (e.target.value !== task.note) save({ note: e.target.value });
          }}
        />
      </label>
      <label>
        Repeat
        <select value={repeat?.kind ?? ""} onChange={(e) => setKind(e.target.value)}>
          <option value="">Never</option>
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </label>
      {repeat?.kind === "weekly" && (
        <fieldset>
          {DAYS.map((name, d) => (
            <label key={name}>
              <input
                type="checkbox"
                checked={repeat.days.includes(d)}
                onChange={(e) => {
                  const days = e.target.checked
                    ? [...repeat.days, d].sort()
                    : repeat.days.filter((x) => x !== d);
                  save({ repeat: { kind: "weekly", days } });
                }}
              />
              {name}
            </label>
          ))}
        </fieldset>
      )}
      {repeat?.kind === "monthly" && (
        <label>
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
    </aside>
  );
}
