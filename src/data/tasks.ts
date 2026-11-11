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
    let first = true;
    // includeMetadataChanges: without it Firestore never reports the cache -> server switch when
    // the server copy matches the cache (the usual case on a single device), so `synced` would
    // stay false. Metadata-only snapshots keep the same tasks array so screens don't re-render.
    return onSnapshot(
      query(tasks, where("ownerId", "==", uid)),
      { includeMetadataChanges: true },
      (snap) => {
        const changed = first || snap.docChanges().length > 0;
        first = false;
        const synced = !snap.metadata.fromCache;
        setState((prev) =>
          !changed && prev.synced === synced
            ? prev
            : {
                tasks: changed
                  ? snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)
                  : prev.tasks,
                synced,
              },
        );
      },
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
