import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import type { AuthUser } from "../data/auth";
import { useLists } from "../data/lists";
import { useSessions } from "../data/sessions";
import { addTask, deleteTask, updateTask, useTasks } from "../data/tasks";
import { useTimerContext } from "../data/timer";
import { setAccountabilityTask, useUserDoc } from "../data/user";
import { completePatch } from "../domain/repeat";
import { taskStats } from "../domain/sessions";
import {
  activeTasks,
  completedTasks,
  movedSortOrder,
  nextSortOrder,
  type Task,
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

// `today` renders the automatic Today list: tasks due today from every list. Read-only — no add bar,
// no reordering; completing or editing a task works as usual and it stays in its own list.
export function Tasks({ user, today = false }: { user: AuthUser; today?: boolean }) {
  const { listId: paramListId } = useParams();
  const listId = today ? "today" : (paramListId ?? inboxListId(user.uid));
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
  const active = today ? todayTasks(all, localDate()) : activeTasks(all, listId);
  const completed = today
    ? completedTasks(all).filter((t) => t.dueDate === localDate())
    : completedTasks(all, listId);
  const [title, setTitle] = useState("");
  const [lastCompleted, setLastCompleted] = useState<Task | null>(null);
  const showCompletedKey = `showCompleted-${listId}`;
  const [showCompleted, setShowCompleted] = useState(
    () => localStorage.getItem(showCompletedKey) === "1",
  );

  function toggleShowCompleted(checked: boolean) {
    setShowCompleted(checked);
    localStorage.setItem(showCompletedKey, checked ? "1" : "0");
  }
  const [openId, setOpenId] = useState<string | null>(null);
  const open = all.find((t) => t.id === openId);
  const listName = today ? "Today" : currentList?.isInbox === false ? currentList.name : "Inbox";

  function add(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    // Order against every task in the list, completed ones included, so nothing interleaves later.
    const sortOrder = nextSortOrder(all.filter((t) => t.listId === listId));
    addTask({ ownerId: user.uid, listId, title: trimmed, sortOrder });
    setTitle("");
  }

  const reorder = useReorder(active.length, (from, to) => {
    const sortOrder = movedSortOrder(active, from, to);
    const task = active[from];
    if (sortOrder !== null && task) updateTask(task.id, { sortOrder });
  });

  return (
    <div className={open ? "tasks-layout open" : "tasks-layout"}>
      <div className="stack">
        <div className="stack-tight">
          <h1>
            {listName} <span className="faint">{active.length}</span>
          </h1>
          <nav className="chips" aria-label="Lists">
            <Link to="/today" className="chip" aria-current={today ? "page" : undefined}>
              <span className="swatch" style={{ background: "var(--list-amber)" }} />
              Today
            </Link>
            {lists.map((l) => (
              <Link
                key={l.id}
                to={l.isInbox ? "/" : `/list/${l.id}`}
                className="chip"
                aria-current={!today && l.id === listId ? "page" : undefined}
              >
                <span className="swatch" style={{ background: `var(--list-${l.color})` }} />
                {l.name}
              </Link>
            ))}
          </nav>
        </div>
        {!today && (
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
                updateTask(lastCompleted.id, { completedAt: null });
                setLastCompleted(null);
              }}
            >
              Undo
            </button>
          </div>
        )}
        <ul className="rows">
          {active.map((task, i) => {
            // Today is all one date, so show which list each task lives in instead.
            const due = today
              ? (lists.find((l) => l.id === task.listId)?.name ?? "")
              : dueLabel(task.dueDate);
            const now = timer.task?.id === task.id && timer.phase !== "idle";
            return (
              <li
                key={task.id}
                {...(today ? {} : reorder.row(i))}
                className={
                  (task.id === openId ? "task-row selected" : "task-row") + (today ? " static" : "")
                }
              >
                {!today && (
                  <button {...reorder.handle(i, task.title)}>
                    <Grip />
                  </button>
                )}
                <input
                  type="checkbox"
                  className="check"
                  checked={false}
                  onChange={(e) =>
                    fadeOut(task.repeat ? null : e.currentTarget.closest("li"), () => {
                      updateTask(task.id, completePatch(task, Date.now()));
                      if (!task.repeat) setLastCompleted(task);
                    })
                  }
                  aria-label={`Complete ${task.title}`}
                />
                <button type="button" className="row-title" onClick={() => setOpenId(task.id)}>
                  <span className={now ? "strong" : undefined}>{task.title}</span>
                  {task.note && <span className="muted">{task.note}</span>}
                </button>
                <span className={due === "Overdue" ? "due overdue" : "due"}>{due}</span>
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
