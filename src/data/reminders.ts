import { useEffect, useState } from "react";
import type { Task } from "../domain/tasks";

const FIRED_KEY = "firedReminders";

function fired(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default")
    Notification.requestPermission();
}

// Fires a Notification for each due reminder while the app is open. Fired keys are remembered in
// localStorage so a reload doesn't re-fire them.
// ponytail: setTimeout caps at ~24.8 days; reminders further out are rescheduled on the next task change or reload.
//
// `synced` is true once the task list has come from the server. Until then it may be a stale
// cached copy (tasks finished on another device still look open), so we hold off. If the server
// hasn't answered after CACHE_GRACE_MS we assume we're offline and fall back to the cache, so
// reminders arrive late rather than never.
const CACHE_GRACE_MS = 30_000;
export function useReminders(tasks: Task[], synced: boolean) {
  const [graceOver, setGraceOver] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setGraceOver(true), CACHE_GRACE_MS);
    return () => clearTimeout(id);
  }, []);
  const ready = synced || graceOver;

  useEffect(() => {
    if (!ready) return;
    const done = new Set(fired());
    const timers = tasks.flatMap((t) => {
      if (t.reminderAt === null || t.completedAt !== null) return [];
      const key = `${t.id}:${t.reminderAt}`;
      if (done.has(key)) return [];
      const delay = Math.min(Math.max(0, t.reminderAt - Date.now()), 2 ** 31 - 1);
      return [
        setTimeout(() => {
          if (Date.now() < (t.reminderAt as number)) return; // clamped delay; rescheduled later
          const now = fired();
          if (now.includes(key)) return;
          localStorage.setItem(FIRED_KEY, JSON.stringify([...now, key].slice(-200)));
          if ("Notification" in window && Notification.permission === "granted")
            new Notification(t.title, { body: t.note || undefined });
        }, delay),
      ];
    });
    return () => timers.forEach(clearTimeout);
  }, [tasks, ready]);
}
