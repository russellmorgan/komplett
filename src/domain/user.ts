// Pure shapes for the documents created on first sign-in. No React, no Firebase.

export type Settings = { focusMinutes: number; breakMinutes: number; soundEnabled: boolean };

export type User = {
  displayName: string;
  email: string;
  partnerId: string | null;
  accountabilityTaskId: string | null;
  settings: Settings;
};

export type List = {
  ownerId: string;
  folderId: string | null;
  name: string;
  color: string; // token name, never hex
  sortOrder: number;
  isInbox: boolean;
};

export function initialUser(profile: { displayName: string | null; email: string }): User {
  return {
    displayName: profile.displayName || profile.email.split("@")[0] || profile.email,
    email: profile.email,
    partnerId: null,
    accountabilityTaskId: null,
    settings: { focusMinutes: 25, breakMinutes: 5, soundEnabled: true },
  };
}

export function inboxList(ownerId: string): List {
  return { ownerId, folderId: null, name: "Inbox", color: "slate", sortOrder: 0, isInbox: true };
}
