import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { type Folder, newFolder, newList } from "../domain/lists";
import type { List } from "../domain/user";
import { db } from "./firebase";

const lists = collection(db, "lists");
const folders = collection(db, "folders");
const tasks = collection(db, "tasks");

export function useLists(uid: string): (List & { id: string })[] {
  const [all, setAll] = useState<(List & { id: string })[]>([]);
  useEffect(
    () =>
      onSnapshot(
        query(lists, where("ownerId", "==", uid)),
        (snap) =>
          setAll(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as List & { id: string })),
        console.error,
      ),
    [uid],
  );
  return all;
}

export function useFolders(uid: string): (Folder & { id: string })[] {
  const [all, setAll] = useState<(Folder & { id: string })[]>([]);
  useEffect(
    () =>
      onSnapshot(
        query(folders, where("ownerId", "==", uid)),
        (snap) =>
          setAll(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Folder & { id: string })),
        console.error,
      ),
    [uid],
  );
  return all;
}

export function addList(fields: Parameters<typeof newList>[0], sortOrder: number) {
  return setDoc(doc(lists), newList(fields, sortOrder));
}

export function updateList(id: string, patch: Partial<Omit<List, "ownerId" | "isInbox">>) {
  return updateDoc(doc(lists, id), patch);
}

// Deleting a list also deletes its tasks.
export async function deleteList(id: string) {
  const batch = writeBatch(db);
  const owned = await getDocs(query(tasks, where("listId", "==", id)));
  for (const d of owned.docs) batch.delete(d.ref);
  batch.delete(doc(lists, id));
  return batch.commit();
}

export function addFolder(ownerId: string, name: string, sortOrder: number) {
  return setDoc(doc(folders), newFolder(ownerId, name, sortOrder));
}

export function updateFolder(id: string, patch: Partial<Omit<Folder, "ownerId">>) {
  return updateDoc(doc(folders, id), patch);
}

// Deleting a folder keeps its lists, lifted to the top level.
export async function deleteFolder(id: string) {
  const batch = writeBatch(db);
  const owned = await getDocs(query(lists, where("folderId", "==", id)));
  for (const d of owned.docs) batch.update(d.ref, { folderId: null });
  batch.delete(doc(folders, id));
  return batch.commit();
}
