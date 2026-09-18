import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { nextSortOrder, type Task } from "../domain/tasks";
import { db } from "./firebase";

const tasks = collection(db, "tasks");

export function inboxListId(uid: string) {
  return `${uid}-inbox`;
}

// Live view of every task the user owns; screens filter/sort with domain functions.
export function useTasks(uid: string): Task[] {
  const [all, setAll] = useState<Task[]>([]);
  useEffect(
    () =>
      onSnapshot(query(tasks, where("ownerId", "==", uid)), (snap) =>
        setAll(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)),
      ),
    [uid],
  );
  return all;
}

export function addTask(uid: string, listId: string, title: string, siblings: Task[]) {
  const now = Date.now();
  const ref = doc(tasks);
  const task: Omit<Task, "id"> = {
    ownerId: uid,
    listId,
    title,
    note: "",
    dueDate: null,
    reminderAt: null,
    repeat: null,
    sortOrder: nextSortOrder(siblings),
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  return setDoc(ref, task);
}

export function updateTask(id: string, patch: Partial<Omit<Task, "id" | "ownerId">>) {
  return updateDoc(doc(tasks, id), { ...patch, updatedAt: Date.now() });
}

export function deleteTask(id: string) {
  return deleteDoc(doc(tasks, id));
}
