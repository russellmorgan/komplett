// Repeat advancement. Dates are YYYY-MM-DD strings handled in UTC so local zones can't shift them.
import type { Repeat, Task } from "./tasks";

const DAY = 86_400_000;

function toMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function toDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function daysInMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

function matches(repeat: Repeat, d: Date, from: Date): boolean {
  switch (repeat.kind) {
    case "daily":
      return true;
    case "weekdays":
      return d.getUTCDay() >= 1 && d.getUTCDay() <= 5;
    case "weekly":
      return repeat.days.includes(d.getUTCDay());
    case "monthly":
      return d.getUTCDate() === Math.min(repeat.dayOfMonth, daysInMonth(d));
    case "yearly":
      return (
        d.getUTCMonth() === from.getUTCMonth() &&
        d.getUTCDate() === Math.min(from.getUTCDate(), daysInMonth(d))
      );
  }
}

// First matching date strictly after max(fromDate, today).
// ponytail: walks day by day (≤ ~366 steps); compute directly if it ever shows up in a profile.
export function nextOccurrence(repeat: Repeat, fromDate: string, today: string): string {
  const from = new Date(toMs(fromDate));
  let ms = Math.max(toMs(fromDate), toMs(today));
  for (let i = 0; i < 400; i++) {
    ms += DAY;
    if (matches(repeat, new Date(ms), from)) return toDate(ms);
  }
  return toDate(ms); // empty weekly day set: fall through rather than loop forever
}

export function advanceTask(task: Task, now: number): Pick<Task, "dueDate" | "reminderAt"> {
  if (!task.repeat) throw new Error("advanceTask on a non-repeating task");
  const today = toDate(now);
  const from = task.dueDate ?? today;
  const dueDate = nextOccurrence(task.repeat, from, today);
  const delta = toMs(dueDate) - toMs(from);
  return {
    dueDate,
    reminderAt: task.reminderAt === null ? null : task.reminderAt + delta,
  };
}

export function completePatch(task: Task, now: number): Partial<Task> {
  return task.repeat ? advanceTask(task, now) : { completedAt: now };
}
