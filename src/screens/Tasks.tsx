import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import type { AuthUser } from "../data/auth";
import { playDone } from "../data/chime";
import { useLists } from "../data/lists";
import { useSessions } from "../data/sessions";
import { addTask, deleteTask, updateTask, useTasks } from "../data/tasks";
import { useTimerContext } from "../data/timer";
import { setAccountabilityTask, useUserDoc } from "../data/user";
import { listColorCss } from "../domain/lists";
import { completePatch } from "../domain/repeat";
import { taskStats } from "../domain/sessions";
import {
  activeTasks,
  completedTasks,
  movedSortOrder,
  nextSortOrder,
  type Task,
  timesLeft,
  todayTasks,
} from "../domain/tasks";
import { inboxListId } from "../domain/user";
import { fadeOut } from "../fade";
import { Icon } from "../icons";
import { Grip, useReorder } from "../reorder";
import { TaskDetail } from "./TaskDetail";

// Local calendar date as YYYY-MM-DD, `offset` days from today.
const localDate = (offset = 0) =>
  new Date(Date.now() + offset * 86_400_000).toLocaleDateString("en-CA");

function dueLabel(date: string | null): string {
  if (!date) return "";
  if (date === localDate()) return "Today";
  if (date === localDate(1)) return "Tomorrow";
  if (date < localDate()) return "Overdue";
  return new Date(`${date}T00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

// `today` renders the automatic Today list: tasks due or moved to today, from every list. No add bar.
// `showAll` renders every open task from every list, the same way (no add bar).
// Dragging reorders by each task's own sortOrder, shared across lists; a task stays in its own list.
export function Tasks({
  user,
  today = false,
  showAll = false,
}: {
  user: AuthUser;
  today?: boolean;
  showAll?: boolean;
}) {
  const { listId: paramListId } = useParams();
  const listId = today ? "today" : showAll ? "all" : (paramListId ?? inboxListId(user.uid));
  const combined = today || showAll;
  const lists = useLists(user.uid);
  const currentList = lists.find((l) => l.id === listId);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sessions = useSessions(user.uid);
  const me = useUserDoc(user.uid);
  const { state: timer, pending, startFocus } = useTimerContext();
  // ponytail: one pomodoro at a time; a running one has to finish or be stopped first.
  const startPomodoro = (task: Task) => {
    if (timer.phase !== "idle") {
      alert("A pomodoro is already running. Stop it from the Timer first.");
      return;
    }
    if (pending) {
      alert("Save the note for your last session on the Timer first.");
      navigate("/timer");
      return;
    }
    startFocus({ id: task.id, title: task.title });
    navigate("/timer");
  };
  const all = useTasks(user.uid);
  const active = today
    ? todayTasks(all, localDate())
    : activeTasks(all, showAll ? undefined : listId);
  const completed = today
    ? completedTasks(all).filter((t) => t.dueDate === localDate())
    : completedTasks(all, showAll ? undefined : listId);
  const [title, setTitle] = useState("");
  const [lastCompleted, setLastCompleted] = useState<Task | null>(null);
  // The Undo toast goes away on its own after 5 seconds (a newer completion restarts the clock).
  useEffect(() => {
    if (!lastCompleted) return;
    const t = setTimeout(() => setLastCompleted(null), 5000);
    return () => clearTimeout(t);
  }, [lastCompleted]);
  const showCompletedKey = `showCompleted-${listId}`;
  const [showCompleted, setShowCompleted] = useState(
    () => localStorage.getItem(showCompletedKey) === "1",
  );

  function toggleShowCompleted(checked: boolean) {
    setShowCompleted(checked);
    localStorage.setItem(showCompletedKey, checked ? "1" : "0");
  }
  const [openId, setOpenId] = useState<string | null>(null);
  // Close the mobile list picker on a tap anywhere outside it.
  const pickerRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      const picker = pickerRef.current;
      if (picker?.open && !picker.contains(e.target as Node)) picker.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const open = all.find((t) => t.id === openId);
  const listName = today
    ? "Today"
    : showAll
      ? "All"
      : currentList?.isInbox === false
        ? currentList.name
        : "Inbox";
  const listLinks = [
    { to: "/today", name: "Today", color: "amber", current: today ? ("page" as const) : undefined },
    // Today, then Inbox, always first; the rest in their list order.
    ...[...lists]
      .sort((a, b) => Number(!!b.isInbox) - Number(!!a.isInbox) || a.sortOrder - b.sortOrder)
      .map((l) => ({
        to: l.isInbox ? "/" : `/list/${l.id}`,
        name: l.name,
        color: l.color,
        current: !combined && l.id === listId ? ("page" as const) : undefined,
      })),
    { to: "/all", name: "All", color: "slate", current: showAll ? ("page" as const) : undefined },
  ];
  const currentColor = listLinks.find((l) => l.current)?.color ?? "amber";

  function add(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    // Order against every task in the list, completed ones included, so nothing interleaves later.
    const sortOrder = nextSortOrder(all.filter((t) => t.listId === listId));
    addTask({ ownerId: user.uid, listId, title: trimmed, sortOrder });
    setTitle("");
  }

  // Important tasks are pinned to the top by rule, so only the rest can be dragged, among themselves.
  const pinned = active.filter((t) => t.important).length;
  const reorder = useReorder(active.length, (from, to) => {
    const rest = active.slice(pinned);
    const sortOrder = movedSortOrder(rest, from - pinned, Math.max(to - pinned, 0));
    const task = active[from];
    if (from >= pinned && sortOrder !== null && task) updateTask(task.id, { sortOrder });
  });

  return (
    <div className={open ? "tasks-layout open" : "tasks-layout"}>
      <div className="stack">
        <div className="stack-tight">
          <h1>
            {listName} <span className="faint">{active.length}</span>
          </h1>
          <nav className="chips" aria-label="Lists">
            {listLinks.map((l) => (
              <Link key={l.to} to={l.to} className="chip" aria-current={l.current}>
                <span className="swatch" style={{ background: listColorCss(l.color) }} />
                {l.name}
              </Link>
            ))}
          </nav>
          {/* ponytail: native <details> dropdown on mobile; chips wrap too much there. */}
          <details className="list-picker" ref={pickerRef}>
            <summary className="chip">
              <span className="swatch" style={{ background: listColorCss(currentColor) }} />
              {listName}
              <Icon name="down" size={12} />
            </summary>
            <nav aria-label="Lists">
              {listLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  aria-current={l.current}
                  onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
                >
                  <span className="swatch" style={{ background: listColorCss(l.color) }} />
                  {l.name}
                </Link>
              ))}
            </nav>
          </details>
        </div>
        {!combined && (
          <form onSubmit={add} className="add-bar">
            <input
              placeholder={`Add a task to ${listName}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="New task title"
            />
            <button type="submit" className="ink icon" aria-label="Add">
              <Icon name="plus" size={12} />
            </button>
          </form>
        )}
        {lastCompleted && (
          <div className="toast">
            <span>Completed “{lastCompleted.title}”</span>
            <button
              type="button"
              className="primary"
              onClick={() => {
                updateTask(lastCompleted.id, {
                  completedAt: null,
                  ...(lastCompleted.times ? { timesDone: lastCompleted.timesDone ?? 0 } : {}),
                });
                setLastCompleted(null);
              }}
            >
              Undo
            </button>
          </div>
        )}
        <ul className="rows">
          {active.map((task, i) => {
            // Today/All mix lists, so show which list each task lives in instead of its due date.
            const due = combined
              ? (lists.find((l) => l.id === task.listId)?.name ?? "")
              : dueLabel(task.dueDate);
            const now = timer.task?.id === task.id && timer.phase !== "idle";
            return (
              <li
                key={task.id}
                {...reorder.row(i)}
                className={task.id === openId ? "task-row selected" : "task-row"}
              >
                <button {...reorder.handle(i, task.title)}>
                  <Grip />
                </button>
                <input
                  type="checkbox"
                  className="check"
                  checked={false}
                  onChange={(e) => {
                    const finishes = !task.repeat && timesLeft(task) === 1;
                    fadeOut(finishes ? e.currentTarget.closest("li") : null, () => {
                      updateTask(task.id, completePatch(task, Date.now()));
                      playDone(me?.settings.soundEnabled);
                      if (finishes) setLastCompleted(task);
                    });
                  }}
                  aria-label={`Complete ${task.title}`}
                />
                <button type="button" className="row-title" onClick={() => setOpenId(task.id)}>
                  <span className={now ? "strong" : undefined}>{task.title}</span>
                  {task.note && <span className="muted">{task.note}</span>}
                </button>
                <span className={due === "Overdue" ? "due overdue" : "due"}>
                  {timesLeft(task) > 1
                    ? [`${timesLeft(task)} left`, due].filter(Boolean).join(" · ")
                    : due}
                </span>
                <button
                  type="button"
                  className="star"
                  aria-pressed={!!task.important}
                  aria-label={`Mark ${task.title} important`}
                  title="Important"
                  onClick={() => updateTask(task.id, { important: !task.important })}
                >
                  <Icon name="star" size={15} />
                </button>
                <button
                  type="button"
                  className={now ? "play now" : "play"}
                  onClick={() => startPomodoro(task)}
                  aria-label={`Start pomodoro on ${task.title}`}
                >
                  <Icon name="play" size={10} />
                </button>
              </li>
            );
          })}
          {active.length === 0 && <li className="empty">Nothing left in {listName}.</li>}
        </ul>
        <div className="switch-bar">
          <label className="switch-row">
            <input
              type="checkbox"
              className="switch"
              checked={showCompleted}
              onChange={(e) => {
                const on = e.target.checked;
                fadeOut(on ? null : document.querySelector(".done-rows"), () =>
                  toggleShowCompleted(on),
                );
              }}
            />
            Show completed <span className="muted">{completed.length}</span>
          </label>
          <Link to="/completed" state={{ from: pathname }} className="muted underline">
            All completed
          </Link>
        </div>
        {showCompleted && (
          <ul className="rows done-rows">
            {completed.map((task) => (
              <li className="task-row" key={task.id}>
                <input
                  type="checkbox"
                  className="check"
                  checked={true}
                  onChange={(e) =>
                    fadeOut(e.currentTarget.closest("li"), () =>
                      updateTask(task.id, { completedAt: null }),
                    )
                  }
                  aria-label={`Un-complete ${task.title}`}
                />
                <span className="row-title struck">{task.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {open && (
        <TaskDetail
          key={open.id}
          task={open}
          lists={lists}
          stats={taskStats(sessions, open.id)}
          isAccountability={me?.accountabilityTaskId === open.id}
          onSetAccountability={() => setAccountabilityTask(user.uid, open.id)}
          onStart={() => startPomodoro(open)}
          onDelete={() => {
            setOpenId(null);
            deleteTask(open.id);
          }}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
