import type { AuthUser } from "../data/auth";
import { deleteSession, useSessions } from "../data/sessions";
import { useTasks } from "../data/tasks";
import { sessionsNewestFirst, totalStats } from "../domain/sessions";
import { completedTasks } from "../domain/tasks";

const when = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const asHours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// Every focus session, newest first. Sessions keep their copied taskTitle, so they still read
// correctly after the task is deleted.
export function History({ user }: { user: AuthUser }) {
  const allSessions = useSessions(user.uid);
  const sessions = sessionsNewestFirst(allSessions);
  const { count, minutes } = totalStats(allSessions);
  const completedCount = completedTasks(useTasks(user.uid)).length;
  return (
    <>
      <h1>History</h1>
      <p className="muted">
        {count} session{count === 1 ? "" : "s"} · {asHours(minutes)} focused · {completedCount}{" "}
        task{completedCount === 1 ? "" : "s"} completed
      </p>
      {sessions.length === 0 && <p className="muted">No focus sessions yet.</p>}
      <ul className="tasks">
        {sessions.map((s) => (
          <li className="task session" key={s.id}>
            <span className="muted">{when(s.startedAt)}</span>
            <span>
              {s.focusMinutes} min{s.endedEarly ? " (stopped early)" : ""}
              {s.taskTitle && <> · {s.taskTitle}</>}
            </span>
            {s.note && <span className="task-title">{s.note}</span>}
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this session? This cannot be undone.")) deleteSession(s.id);
              }}
              aria-label="Delete session"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
