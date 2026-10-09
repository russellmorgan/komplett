import type { ListColor } from "./lists";

// Pure shapes for the documents created on first sign-in. No React, no Firebase.

export type ChimeId = "bell" | "woodblock" | "glass" | "pulse" | "soft" | "lawOrder";

export type Settings = {
  focusMinutes: number;
  breakMinutes: number;
  soundEnabled: boolean;
  chime?: ChimeId; // absent on users created before chimes existed; means "bell"
};

export type User = {
  displayName: string;
  email: string;
  photoURL: string | null;
  partnerId: string | null;
  accountabilityTaskId: string | null;
  settings: Settings;
  breakoutBest?: number; // break-time game high score; absent until the first game ends
};

export type List = {
  ownerId: string;
  folderId: string | null;
  name: string;
  color: ListColor; // palette token name, or custom #rrggbb
  sortOrder: number;
  isInbox: boolean;
};

export function initialUser(profile: {
  displayName: string | null;
  email: string;
  photoURL?: string | null;
}): User {
  return {
    displayName: profile.displayName || profile.email.split("@")[0] || profile.email,
    email: profile.email,
    photoURL: profile.photoURL ?? null,
    partnerId: null,
    accountabilityTaskId: null,
    settings: { focusMinutes: 25, breakMinutes: 5, soundEnabled: true },
  };
}

export function inboxListId(uid: string) {
  return `${uid}-inbox`;
}

export function inboxList(ownerId: string): List {
  return { ownerId, folderId: null, name: "Inbox", color: "slate", sortOrder: 0, isInbox: true };
}
