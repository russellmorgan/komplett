import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  projectSharedTask,
  type SharedTask,
  sharedTaskChanged,
  withReaction,
} from "../domain/shared";
import type { Task } from "../domain/tasks";
import type { User } from "../domain/user";
import { db } from "./firebase";

// Live view of one user's shared task. undefined while loading, null when none exists yet (or
// the rules refuse: a partner who hasn't picked you back reads as null).
export function useSharedTask(uid: string | null): SharedTask | null | undefined {
  const [shared, setShared] = useState<SharedTask | null | undefined>(undefined);
  useEffect(() => {
    if (!uid) return setShared(null);
    setShared(undefined);
    // Picking a partner applies locally before the server has it, so the first read of their
    // shared task can be denied by the partnerId rule; retry once the write has landed.
    let stop = () => {};
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const subscribe = () => {
      stop = onSnapshot(
        doc(db, "sharedTasks", uid),
        (snap) => setShared((snap.data() as SharedTask | undefined) ?? null),
        () => {
          setShared(null);
          if (attempts++ < 3) retry = setTimeout(subscribe, 1500);
        },
      );
    };
    subscribe();
    return () => {
      stop();
      clearTimeout(retry);
    };
  }, [uid]);
  return shared;
}

// Keeps sharedTasks/{uid} matching the accountability task. Runs app-wide so every edit,
// completion and repeat advance is reflected; compares against the live doc so it converges
// without looping. A deleted accountability task leaves the last projection in place (spec:
// stays visible as done until a new one is set).
export function useSharedTaskSync(uid: string, user: User | undefined, tasks: Task[]) {
  const stored = useSharedTask(uid);
  const task = tasks.find((t) => t.id === user?.accountabilityTaskId);
  useEffect(() => {
    if (!task || stored === undefined) return;
    const next = projectSharedTask(task, stored, Date.now());
    if (sharedTaskChanged(stored, next)) setDoc(doc(db, "sharedTasks", uid), next);
  }, [uid, task, stored]);
}

// React to a partner's completed shared task; replaces this user's earlier reaction.
export function setReaction(ownerUid: string, shared: SharedTask, byUserId: string, emoji: string) {
  return updateDoc(doc(db, "sharedTasks", ownerUid), {
    reactions: withReaction(shared.reactions, byUserId, emoji, Date.now()),
  });
}

// Everyone who has signed in, for picking a partner.
export type Person = Pick<User, "displayName" | "email" | "photoURL"> & { uid: string };
export function useAllUsers(): Person[] {
  const [people, setPeople] = useState<Person[]>([]);
  useEffect(
    () =>
      onSnapshot(
        collection(db, "users"),
        (snap) =>
          setPeople(
            snap.docs.map((d) => {
              const u = d.data() as User;
              // photoURL is missing on docs created before it was stored
              return {
                uid: d.id,
                displayName: u.displayName,
                email: u.email,
                photoURL: u.photoURL ?? null,
              };
            }),
          ),
        console.error,
      ),
    [],
  );
  return people;
}
