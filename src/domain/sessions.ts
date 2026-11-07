// Pure session logic. No React, no Firebase. Timestamps are epoch milliseconds.

export type Session = {
  id: string;
  ownerId: string;
  taskId: string | null;
  taskTitle: string;
  note: string;
  focusMinutes: number;
  startedAt: number;
  endedAt: number;
  endedEarly: boolean;
};

export function newSession(fields: Omit<Session, "id">): Omit<Session, "id"> {
  return fields;
}

// Count and total focus minutes of a set of sessions.
export function totalStats(sessions: Session[]): { count: number; minutes: number } {
  return { count: sessions.length, minutes: sessions.reduce((sum, s) => sum + s.focusMinutes, 0) };
}

// Count and total focus minutes of the sessions linked to one task.
export function taskStats(sessions: Session[], taskId: string): { count: number; minutes: number } {
  return totalStats(sessions.filter((s) => s.taskId === taskId));
}

export function sessionsNewestFirst(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => b.startedAt - a.startedAt);
}

// Local midnight of the Monday that starts the week containing `ms`.
export function weekStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

// Sessions grouped by week (Monday start), newest week first, newest session first within it.
export function sessionsByWeek(sessions: Session[]): { weekStart: number; sessions: Session[] }[] {
  const weeks = new Map<number, Session[]>();
  for (const s of sessionsNewestFirst(sessions)) {
    const key = weekStart(s.startedAt);
    weeks.set(key, [...(weeks.get(key) ?? []), s]);
  }
  return [...weeks].map(([weekStart, sessions]) => ({ weekStart, sessions }));
}

type Week = { weekStart: number; sessions: Session[] };

// The weeks starting no earlier than the week `months` before `now`, so a boundary week is never cut in half.
export function weeksWithin(weeks: Week[], now: number, months: number): Week[] {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  const cutoff = weekStart(d.getTime());
  return weeks.filter((w) => w.weekStart >= cutoff);
}

// The next window to load, `step` months at a time, skipping empty stretches so a click always
// reveals something. Null when every week is already within `months`.
export function nextMonths(weeks: Week[], now: number, months: number, step = 3): number | null {
  const shown = weeksWithin(weeks, now, months).length;
  if (shown === weeks.length) return null;
  let next = months + step;
  while (weeksWithin(weeks, now, next).length === shown) next += step;
  return next;
}
