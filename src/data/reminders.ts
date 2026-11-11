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
// setTimeout caps at ~24.8 days; reminders further out re-arm when that timer runs out.
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
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    for (const t of tasks) {
      if (t.reminderAt === null || t.completedAt !== null) continue;
      const at = t.reminderAt;
      const key = `${t.id}:${at}`;
      if (done.has(key)) continue;
      const arm = () => {
        const delay = Math.min(Math.max(0, at - Date.now()), 2 ** 31 - 1);
        timers.set(
          key,
          setTimeout(() => {
            // Not due yet: the delay was clamped, or the timer ran a hair ahead of the wall clock.
            if (Date.now() < at) return arm();
            const now = fired();
            if (now.includes(key)) return;
            localStorage.setItem(FIRED_KEY, JSON.stringify([...now, key].slice(-200)));
            if ("Notification" in window && Notification.permission === "granted")
              new Notification(t.title, { body: t.note || undefined });
          }, delay),
        );
      };
      arm();
    }
    return () => timers.forEach(clearTimeout);
  }, [tasks, ready]);
}
