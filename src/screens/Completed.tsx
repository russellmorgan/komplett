import type { AuthUser } from "../data/auth";
import { useLists } from "../data/lists";
import { deleteTask, deleteTasks, updateTask, useTasks } from "../data/tasks";
import { completedTasks } from "../domain/tasks";
import { fadeOut } from "../fade";
import { Icon } from "../icons";

export function Completed({ user }: { user: AuthUser }) {
  const all = useTasks(user.uid);
  const lists = useLists(user.uid);
  const completed = completedTasks(all);

  function clearAll() {
    if (!confirm("Permanently delete all completed tasks? This cannot be undone.")) return;
    deleteTasks(completed.map((t) => t.id));
  }

  return (
    <div className="stack">
      <h1>
        Completed <span className="faint">{completed.length}</span>
      </h1>
      <ul className="rows">
        {completed.map((task) => {
          const list = lists.find((l) => l.id === task.listId);
          return (
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
              <span className="row-title">
                <span>{task.title}</span>
                <span className="muted list-tag">
                  <span
                    className="swatch"
                    style={{ background: `var(--list-${list?.color ?? "slate"})` }}
                  />
                  {list?.name ?? task.listId}
                </span>
              </span>
              <button
                type="button"
                className="ghost icon"
                onClick={() => {
                  if (confirm(`Permanently delete “${task.title}”? This cannot be undone.`)) {
                    deleteTask(task.id);
                  }
                }}
                aria-label={`Delete ${task.title}`}
              >
                <Icon name="trash" size={15} />
              </button>
            </li>
          );
        })}
        {completed.length === 0 && <li className="empty">Nothing completed yet.</li>}
      </ul>
      {completed.length > 0 && (
        <button type="button" className="outline" onClick={clearAll}>
          Clear all completed
        </button>
      )}
    </div>
  );
}
