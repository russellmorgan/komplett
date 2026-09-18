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

export function sessionsNewestFirst(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => b.startedAt - a.startedAt);
}
