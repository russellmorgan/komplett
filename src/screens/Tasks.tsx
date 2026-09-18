import { type FormEvent, useRef, useState } from "react";
import { useParams } from "react-router";
import type { AuthUser } from "../data/auth";
import { useLists } from "../data/lists";
import { addTask, deleteTask, updateTask, useTasks } from "../data/tasks";
import { completePatch } from "../domain/repeat";
import {
  activeTasks,
  completedTasks,
  movedSortOrder,
  nextSortOrder,
  type Task,
} from "../domain/tasks";
import { inboxListId } from "../domain/user";
import { TaskDetail } from "./TaskDetail";

export function Tasks({ user }: { user: AuthUser }) {
  const { listId: paramListId } = useParams();
  const listId = paramListId ?? inboxListId(user.uid);
  const lists = useLists(user.uid);
  const currentList = lists.find((l) => l.id === listId);
  const all = useTasks(user.uid);
  const active = activeTasks(all, listId);
  const completed = completedTasks(all, listId);
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

  function add(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    // Order against every task in the list, completed ones included, so nothing interleaves later.
    const sortOrder = nextSortOrder(all.filter((t) => t.listId === listId));
    addTask({ ownerId: user.uid, listId, title: trimmed, sortOrder });
    setTitle("");
  }

  function move(index: number, direction: -1 | 1) {
    const sortOrder = movedSortOrder(active, index, direction);
    const task = active[index];
    if (sortOrder !== null && task) updateTask(task.id, { sortOrder });
  }

  return (
    <>
      <h1>{currentList?.isInbox === false ? currentList.name : "Inbox"}</h1>
      <form onSubmit={add} className="add-task">
        <input
          placeholder="Add a task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="New task title"
        />
      </form>
      {lastCompleted && (
        <p className="muted">
          Completed “{lastCompleted.title}”{" "}
          <button
            type="button"
            onClick={() => {
              updateTask(lastCompleted.id, { completedAt: null });
              setLastCompleted(null);
            }}
          >
            Undo
          </button>
        </p>
      )}
      <ul className="tasks">
        {active.map((task, i) => (
          <TaskRow
            key={task.id}
            task={task}
            lists={lists}
            onComplete={() => {
              updateTask(task.id, completePatch(task, Date.now()));
              if (!task.repeat) setLastCompleted(task);
            }}
            onOpen={() => setOpenId(task.id)}
            onMove={(direction) => move(i, direction)}
            first={i === 0}
            last={i === active.length - 1}
          />
        ))}
      </ul>
      <label className="muted">
        <input
          type="checkbox"
          checked={showCompleted}
          onChange={(e) => toggleShowCompleted(e.target.checked)}
        />{" "}
        Show completed
      </label>
      {showCompleted && (
        <ul className="tasks">
          {completed.map((task) => (
            <li className="task" key={task.id}>
              <input
                type="checkbox"
                checked={true}
                onChange={() => updateTask(task.id, { completedAt: null })}
                aria-label={`Un-complete ${task.title}`}
              />
              <span className="task-title">{task.title}</span>
            </li>
          ))}
        </ul>
      )}
      {open && <TaskDetail task={open} onClose={() => setOpenId(null)} />}
    </>
  );
}

function TaskRow({
  task,
  lists,
  onComplete,
  onOpen,
  onMove,
  first,
  last,
}: {
  task: Task;
  lists: ReturnType<typeof useLists>;
  onComplete: () => void;
  onOpen: () => void;
  onMove: (direction: -1 | 1) => void;
  first: boolean;
  last: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  // Escape unmounts the input, which fires blur; this stops that blur committing the cancelled edit.
  const cancelled = useRef(false);

  function commit() {
    if (cancelled.current) return;
    const title = draft?.trim();
    if (title && title !== task.title) updateTask(task.id, { title });
    setDraft(null);
  }

  return (
    <li className="task">
      <input
        type="checkbox"
        checked={false}
        onChange={onComplete}
        aria-label={`Complete ${task.title}`}
      />
      {draft === null ? (
        <button
          type="button"
          className="task-title"
          onClick={() => {
            cancelled.current = false;
            setDraft(task.title);
          }}
        >
          {task.title}
        </button>
      ) : (
        <input
          // biome-ignore lint/a11y/noAutofocus: the user just clicked the title to edit it
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              cancelled.current = true;
              setDraft(null);
            }
          }}
          aria-label="Task title"
        />
      )}
      <button type="button" onClick={onOpen} aria-label="Details">
        {task.dueDate ?? "…"}
      </button>
      <button type="button" disabled={first} onClick={() => onMove(-1)} aria-label="Move up">
        ↑
      </button>
      <button type="button" disabled={last} onClick={() => onMove(1)} aria-label="Move down">
        ↓
      </button>
      <select
        aria-label={`Move ${task.title} to list`}
        value={task.listId}
        onChange={(e) => updateTask(task.id, { listId: e.target.value })}
      >
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => deleteTask(task.id)} aria-label="Delete">
        ×
      </button>
    </li>
  );
}
