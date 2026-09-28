import { type FormEvent, type ReactNode, useState } from "react";
import { Link } from "react-router";
import type { AuthUser } from "../data/auth";
import { useSessions } from "../data/sessions";
import { useSharedTask } from "../data/shared";
import { addTask, updateTask, useTasks } from "../data/tasks";
import { useTimerContext } from "../data/timer";
import type { Panel } from "../data/timerView";
import { useUserDoc } from "../data/user";
import { completePatch } from "../domain/repeat";
import type { SharedTask } from "../domain/shared";
import { nextSortOrder, type Task, upNext } from "../domain/tasks";
import { inboxListId } from "../domain/user";
import { fadeOut } from "../fade";
import { Icon } from "../icons";
import { Grip, type useReorder } from "../reorder";

const hm = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`;
const clock = (ms: number) =>
  new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
const startOfDay = () => new Date().setHours(0, 0, 0, 0);

type PanelProps = {
  user: AuthUser;
  reorder: ReturnType<typeof useReorder>;
  index: number;
  onHide: () => void;
};

// Card chrome shared by the panels: heading, drag grip, hide button.
function PanelCard({
  title,
  label,
  reorder,
  index,
  onHide,
  children,
}: Omit<PanelProps, "user"> & { title: ReactNode; label: string; children: ReactNode }) {
  return (
    <section className="card panel" {...reorder.row(index)}>
      <div className="panel-head">
        {title}
        <span className="panel-tools">
          <button {...reorder.handle(index, label)}>
            <Grip />
          </button>
          <button
            type="button"
            className="ghost icon"
            aria-label={`Hide ${label}`}
            title="Hide"
            onClick={(e) => fadeOut(e.currentTarget.closest(".panel"), onHide)}
          >
            <Icon name="close" size={14} />
          </button>
        </span>
      </div>
      {children}
    </section>
  );
}

export function TimerPanel({ id, ...props }: PanelProps & { id: Panel }) {
  if (id === "upnext") return <UpNext {...props} />;
  if (id === "today") return <Today {...props} />;
  return <PartnerPanel {...props} />;
}

function UpNext({ user, ...card }: PanelProps) {
  const all = useTasks(user.uid);
  const sessions = useSessions(user.uid);
  const open = upNext(all, sessions, new Date().toLocaleDateString("en-CA"), inboxListId(user.uid));
  const { state, pending, startFocus } = useTimerContext();
  const busy = state.phase !== "idle" || pending !== null;
  const [draft, setDraft] = useState("");
  const [last, setLast] = useState<Task | null>(null);

  function add(e: FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    const listId = inboxListId(user.uid);
    addTask({
      ownerId: user.uid,
      listId,
      title,
      sortOrder: nextSortOrder(all.filter((t) => t.listId === listId)),
    });
    setDraft("");
  }

  return (
    <PanelCard
      {...card}
      label="Up next"
      title={
        <>
          <h2>Up next</h2>
          <Link to="/" className="muted underline">
            {all.filter((t) => t.completedAt === null).length} open
          </Link>
        </>
      }
    >
      <form onSubmit={add} className="add-bar inset">
        <input
          placeholder="Add a task"
          aria-label="Add a task to Inbox"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="ink icon" aria-label="Add">
          <Icon name="plus" size={12} />
        </button>
      </form>
      <ul className="rows">
        {open.slice(0, 6).map((task) => {
          const now = state.task?.id === task.id && state.phase !== "idle";
          return (
            <li key={task.id} className="task-row">
              <input
                type="checkbox"
                className="check"
                checked={false}
                onChange={() => {
                  updateTask(task.id, completePatch(task, Date.now()));
                  if (!task.repeat) setLast(task);
                }}
                aria-label={`Complete ${task.title}`}
              />
              <span className="row-title">
                <span className={now ? "strong" : undefined}>{task.title}</span>
              </span>
              <button
                type="button"
                className={now ? "play now" : "play"}
                aria-label={`Focus on ${task.title}`}
                disabled={busy}
                title={busy ? "Finish the current pomodoro and its note first" : undefined}
                onClick={() => startFocus({ id: task.id, title: task.title })}
              >
                <Icon name="play" size={10} />
              </button>
            </li>
          );
        })}
        {open.length === 0 && <li className="empty">Nothing due or in Inbox.</li>}
      </ul>
      {last && (
        <div className="toast">
          <span>Completed “{last.title}”</span>
          <button
            type="button"
            className="primary"
            onClick={() => {
              updateTask(last.id, { completedAt: null });
              setLast(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
    </PanelCard>
  );
}

function Today({ user, ...card }: PanelProps) {
  const since = startOfDay();
  const sessions = useSessions(user.uid)
    .filter((s) => s.startedAt >= since)
    .sort((a, b) => b.startedAt - a.startedAt);
  const done = useTasks(user.uid).filter((t) => (t.completedAt ?? 0) >= since).length;
  const minutes = sessions.reduce((sum, s) => sum + s.focusMinutes, 0);
  return (
    <PanelCard {...card} label="Today" title={<h2>Today</h2>}>
      <div className="stats three">
        <div>
          <strong>{sessions.length}</strong>
          <span>sessions</span>
        </div>
        <div>
          <strong>{hm(minutes)}</strong>
          <span>focused</span>
        </div>
        <div>
          <strong>{done}</strong>
          <span>tasks done</span>
        </div>
      </div>
      <ul className="rows">
        {sessions.map((s) => (
          <li key={s.id} className="today-row">
            <span className="muted">{clock(s.startedAt)}</span>
            <span className="row-title">
              <strong>{s.note || s.taskTitle || "Focus"}</strong>
              {s.note && s.taskTitle && <span className="muted">{s.taskTitle}</span>}
            </span>
            <span className="num muted">{s.focusMinutes} min</span>
          </li>
        ))}
        {sessions.length === 0 && <li className="empty">No sessions yet today.</li>}
      </ul>
    </PanelCard>
  );
}

function status(shared: SharedTask) {
  return shared.completedAt !== null
    ? "Done"
    : shared.dueDate
      ? `Due ${shared.dueDate}`
      : "In progress";
}

function PartnerPanel({ user, ...card }: PanelProps) {
  const me = useUserDoc(user.uid);
  const partnerId = me?.partnerId ?? null;
  const partner = useUserDoc(partnerId);
  const mutual = partner?.partnerId === user.uid;
  const mine = useSharedTask(user.uid);
  const theirs = useSharedTask(mutual ? partnerId : null);
  const name = partner?.displayName ?? "No partner";
  return (
    <PanelCard
      {...card}
      label="Partner"
      title={
        <>
          <span className="avatar inverse">{partner ? name.slice(0, 1).toUpperCase() : "–"}</span>
          <span className="row-title">
            <h2>{name}</h2>
            <span className="muted">Accountability partner</span>
          </span>
        </>
      }
    >
      <div className="shared-line">
        <span className="muted">{partner ? `${name}’s shared task` : "Their shared task"}</span>
        {!partner ? (
          <Link to="/partner" className="muted underline">
            Choose a partner
          </Link>
        ) : !mutual ? (
          <span className="muted">They haven’t picked you back yet.</span>
        ) : theirs ? (
          <>
            <strong className={theirs.completedAt !== null ? "struck" : undefined}>
              {theirs.title}
            </strong>
            <span className={theirs.completedAt !== null ? "num done" : "num"}>
              {status(theirs)}
            </span>
          </>
        ) : (
          <span className="muted">No accountability task yet.</span>
        )}
      </div>
      <div className="shared-line">
        <span className="muted">Your shared task</span>
        {mine ? (
          <>
            <strong className={mine.completedAt !== null ? "struck" : undefined}>
              {mine.title}
            </strong>
            <span className={mine.completedAt !== null ? "num done" : "num"}>{status(mine)}</span>
          </>
        ) : (
          <span className="muted">None yet. Set one from a task’s details.</span>
        )}
      </div>
    </PanelCard>
  );
}
