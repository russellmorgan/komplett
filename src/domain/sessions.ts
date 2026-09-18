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

// Count and total focus minutes of the sessions linked to one task.
export function taskStats(sessions: Session[], taskId: string): { count: number; minutes: number } {
  const mine = sessions.filter((s) => s.taskId === taskId);
  return { count: mine.length, minutes: mine.reduce((sum, s) => sum + s.focusMinutes, 0) };
}

export function sessionsNewestFirst(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => b.startedAt - a.startedAt);
}
