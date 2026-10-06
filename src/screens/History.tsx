import { useState } from "react";
import type { AuthUser } from "../data/auth";
import { deleteSession, useSessions } from "../data/sessions";
import { useTasks } from "../data/tasks";
import { sessionsByWeek, totalStats } from "../domain/sessions";
import { completedTasks } from "../domain/tasks";
import { Icon } from "../icons";

const when = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const weekLabel = (ms: number) => {
  const end = new Date(ms);
  end.setDate(end.getDate() + 6); // setDate, not +6*24h, so DST changes don't shift the day
  const fmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
  return `Week of ${fmt.formatRange(new Date(ms), end)}`;
};

const asHours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// Every focus session, grouped by week, newest first. Sessions keep their copied taskTitle, so they still read
// correctly after the task is deleted.
export function History({ user }: { user: AuthUser }) {
  const allSessions = useSessions(user.uid);
  const weeks = sessionsByWeek(allSessions);
  const { count, minutes } = totalStats(allSessions);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggle = (w: number) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (!next.delete(w)) next.add(w);
      return next;
    });
  const completedCount = completedTasks(useTasks(user.uid)).length;
  return (
    <div className="stack">
      <h1>
        History <span className="faint">{count}</span>
      </h1>
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
      {weeks.map((week) => (
        <section className="stack" key={week.weekStart}>
          <h2>
            <button
              type="button"
              className="week-toggle"
              aria-expanded={!collapsed.has(week.weekStart)}
              onClick={() => toggle(week.weekStart)}
            >
              <Icon name="down" size={14} />
              {weekLabel(week.weekStart)}
            </button>
          </h2>
          {!collapsed.has(week.weekStart) && (
            <ul className="rows">
              {week.sessions.map((s) => (
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
                      if (confirm("Delete this session? This cannot be undone."))
                        deleteSession(s.id);
                    }}
                    aria-label="Delete session"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {weeks.length === 0 && (
        <ul className="rows">
          <li className="empty">No focus sessions yet.</li>
        </ul>
      )}
    </div>
  );
}
