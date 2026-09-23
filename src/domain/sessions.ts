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
