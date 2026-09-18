// Pure list/folder logic. No React, no Firebase.

import type { List } from "./user";

export type Folder = {
  ownerId: string;
  name: string;
  sortOrder: number;
};

export const LIST_COLORS = [
  "slate",
  "rose",
  "orange",
  "amber",
  "green",
  "teal",
  "sky",
  "indigo",
  "violet",
  "pink",
] as const;

export type ListColor = (typeof LIST_COLORS)[number];

export function newList(
  fields: Pick<List, "ownerId" | "name"> & Partial<Pick<List, "folderId" | "color">>,
  sortOrder: number,
): List {
  return {
    ownerId: fields.ownerId,
    folderId: fields.folderId ?? null,
    name: fields.name,
    color: fields.color ?? "slate",
    sortOrder,
    isInbox: false,
  };
}

export function newFolder(ownerId: string, name: string, sortOrder: number): Folder {
  return { ownerId, name, sortOrder };
}

export function sortByOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}
