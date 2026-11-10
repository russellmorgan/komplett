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

// Live view of every task the user owns, plus whether it has been confirmed by the server. The
// persistent cache makes the first snapshot a stale local copy (e.g. tasks finished on another
// computer still look open), so anything that acts on tasks, like reminders, waits for `synced`.
export function useTasksSnapshot(uid: string): { tasks: Task[]; synced: boolean } {
  const [state, setState] = useState<{ tasks: Task[]; synced: boolean }>({
    tasks: [],
    synced: false,
  });
  useEffect(() => {
    setState({ tasks: [], synced: false });
    return onSnapshot(
      query(tasks, where("ownerId", "==", uid)),
      (snap) =>
        setState({
          tasks: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task),
          synced: !snap.metadata.fromCache,
        }),
      console.error,
    );
  }, [uid]);
  return state;
}

// Live view of every task the user owns; screens filter/sort with domain functions.
export function useTasks(uid: string): Task[] {
  return useTasksSnapshot(uid).tasks;
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
