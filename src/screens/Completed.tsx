import type { AuthUser } from "../data/auth";
import { useLists } from "../data/lists";
import { deleteTask, deleteTasks, useTasks } from "../data/tasks";
import { completedTasks } from "../domain/tasks";

export function Completed({ user }: { user: AuthUser }) {
  const all = useTasks(user.uid);
  const lists = useLists(user.uid);
  const completed = completedTasks(all);

  function clearAll() {
    if (!confirm("Permanently delete all completed tasks? This cannot be undone.")) return;
    deleteTasks(completed.map((t) => t.id));
  }

  return (
    <>
      <h1>Completed</h1>
      {completed.length > 0 && (
        <button type="button" onClick={clearAll}>
          Clear all completed
        </button>
      )}
      <ul className="tasks">
        {completed.map((task) => (
          <li className="task" key={task.id}>
            <span className="task-title">{task.title}</span>
            <span className="muted">
              {lists.find((l) => l.id === task.listId)?.name ?? task.listId}
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Permanently delete “${task.title}”? This cannot be undone.`)) {
                  deleteTask(task.id);
                }
              }}
              aria-label={`Delete ${task.title}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
