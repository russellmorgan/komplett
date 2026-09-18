import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Settings, User } from "../domain/user";
import { db } from "./firebase";

// Live view of a user doc: your own, or your partner's (any signed-in user may read users).
export function useUserDoc(uid: string | null): User | undefined {
  const [user, setUser] = useState<User | undefined>(undefined);
  useEffect(() => {
    if (!uid) return setUser(undefined);
    return onSnapshot(
      doc(db, "users", uid),
      (snap) => setUser(snap.data() as User | undefined),
      console.error,
    );
  }, [uid]);
  return user;
}

export function updateSettings(uid: string, patch: Partial<Settings>) {
  const dotted = Object.fromEntries(Object.entries(patch).map(([k, v]) => [`settings.${k}`, v]));
  return updateDoc(doc(db, "users", uid), dotted);
}

export function setPartner(uid: string, partnerId: string | null) {
  return updateDoc(doc(db, "users", uid), { partnerId });
}

export function setAccountabilityTask(uid: string, accountabilityTaskId: string | null) {
  return updateDoc(doc(db, "users", uid), { accountabilityTaskId });
}
