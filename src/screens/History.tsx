import type { AuthUser } from "../data/auth";
import { deleteSession, useSessions } from "../data/sessions";
import { useTasks } from "../data/tasks";
import { sessionsNewestFirst, totalStats } from "../domain/sessions";
import { completedTasks } from "../domain/tasks";
import { Icon } from "../icons";

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
    <div className="stack">
      <h1>History</h1>
      <div className="stats big-stats">
        <div>
          <strong>{count}</strong>
          <span>session{count === 1 ? "" : "s"}</span>
        </div>
        <div>
          <strong>{asHours(minutes)}</strong>
          <span>focused</span>
        </div>
        <div>
          <strong>{completedCount}</strong>
          <span>task{completedCount === 1 ? "" : "s"} completed</span>
        </div>
      </div>
      <ul className="rows">
        {sessions.map((s) => (
          <li className="session-row" key={s.id}>
            <span className="muted">{when(s.startedAt)}</span>
            <span className="row-title">
              <strong>{s.note || s.taskTitle || "Focus"}</strong>
              {s.taskTitle && s.note && <span className="muted">{s.taskTitle}</span>}
            </span>
            <span className="num">
              {s.focusMinutes} min{s.endedEarly ? " (stopped early)" : ""}
            </span>
            <button
              type="button"
              className="ghost icon"
              onClick={() => {
                if (confirm("Delete this session? This cannot be undone.")) deleteSession(s.id);
              }}
              aria-label="Delete session"
            >
              <Icon name="trash" size={15} />
            </button>
          </li>
        ))}
        {sessions.length === 0 && <li className="empty">No focus sessions yet.</li>}
      </ul>
    </div>
  );
}
