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
import { newTask, type Task } from "../domain/tasks";
import { db } from "./firebase";

const tasks = collection(db, "tasks");

// Live view of every task the user owns; screens filter/sort with domain functions.
export function useTasks(uid: string): Task[] {
  const [all, setAll] = useState<Task[]>([]);
  useEffect(
    () =>
      onSnapshot(
        query(tasks, where("ownerId", "==", uid)),
        (snap) => setAll(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)),
        console.error,
      ),
    [uid],
  );
  return all;
}

export function addTask(fields: Parameters<typeof newTask>[0]) {
  return setDoc(doc(tasks), newTask(fields, Date.now()));
}

export function updateTask(id: string, patch: Partial<Omit<Task, "id" | "ownerId">>) {
  return updateDoc(doc(tasks, id), { ...patch, updatedAt: Date.now() });
}

export function deleteTask(id: string) {
  return deleteDoc(doc(tasks, id));
}

export function deleteTasks(ids: string[]) {
  return Promise.all(ids.map((id) => deleteDoc(doc(tasks, id))));
}
