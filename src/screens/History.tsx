import type { AuthUser } from "../data/auth";
import { deleteSession, useSessions } from "../data/sessions";
import { sessionsNewestFirst } from "../domain/sessions";

const when = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// Every focus session, newest first. Sessions keep their copied taskTitle, so they still read
// correctly after the task is deleted.
export function History({ user }: { user: AuthUser }) {
  const sessions = sessionsNewestFirst(useSessions(user.uid));
  return (
    <>
      <h1>History</h1>
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
