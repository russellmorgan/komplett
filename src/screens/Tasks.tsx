import { type FormEvent, useState } from "react";
import type { AuthUser } from "../data/auth";
import { addTask, deleteTask, inboxListId, updateTask, useTasks } from "../data/tasks";
import { activeTasks, movedSortOrder, type Task } from "../domain/tasks";

export function Tasks({ user }: { user: AuthUser }) {
  const listId = inboxListId(user.uid);
  const active = activeTasks(useTasks(user.uid), listId);
  const [title, setTitle] = useState("");
  const [lastCompleted, setLastCompleted] = useState<Task | null>(null);

  function add(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(user.uid, listId, trimmed, active);
    setTitle("");
  }

  function move(index: number, direction: -1 | 1) {
    const sortOrder = movedSortOrder(active, index, direction);
    const task = active[index];
    if (sortOrder !== null && task) updateTask(task.id, { sortOrder });
  }

  return (
    <>
      <h1>Inbox</h1>
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
            onComplete={() => {
              updateTask(task.id, { completedAt: Date.now() });
              setLastCompleted(task);
            }}
            onMove={(direction) => move(i, direction)}
            first={i === 0}
            last={i === active.length - 1}
          />
        ))}
      </ul>
    </>
  );
}

function TaskRow({
  task,
  onComplete,
  onMove,
  first,
  last,
}: {
  task: Task;
  onComplete: () => void;
  onMove: (direction: -1 | 1) => void;
  first: boolean;
  last: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
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
        <button type="button" className="task-title" onClick={() => setDraft(task.title)}>
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
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(null);
          }}
          aria-label="Task title"
        />
      )}
      <button type="button" disabled={first} onClick={() => onMove(-1)} aria-label="Move up">
        ↑
      </button>
      <button type="button" disabled={last} onClick={() => onMove(1)} aria-label="Move down">
        ↓
      </button>
      <button type="button" onClick={() => deleteTask(task.id)} aria-label="Delete">
        ×
      </button>
    </li>
  );
}
