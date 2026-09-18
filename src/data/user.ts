import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Settings, User } from "../domain/user";
import { db } from "./firebase";

// Live view of the signed-in user's own doc.
export function useUserDoc(uid: string): User | undefined {
  const [user, setUser] = useState<User | undefined>(undefined);
  useEffect(
    () =>
      onSnapshot(
        doc(db, "users", uid),
        (snap) => setUser(snap.data() as User | undefined),
        console.error,
      ),
    [uid],
  );
  return user;
}

export function updateSettings(uid: string, patch: Partial<Settings>) {
  const dotted = Object.fromEntries(Object.entries(patch).map(([k, v]) => [`settings.${k}`, v]));
  return updateDoc(doc(db, "users", uid), dotted);
}
