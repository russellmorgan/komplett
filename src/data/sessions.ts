import { collection, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { newSession, type Session } from "../domain/sessions";
import { db } from "./firebase";

const sessions = collection(db, "sessions");

// Live view of every session the user owns; screens sort with domain functions.
export function useSessions(uid: string): Session[] {
  const [all, setAll] = useState<Session[]>([]);
  useEffect(
    () =>
      onSnapshot(
        query(sessions, where("ownerId", "==", uid)),
        (snap) => setAll(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Session)),
        console.error,
      ),
    [uid],
  );
  return all;
}

export function addSession(fields: Parameters<typeof newSession>[0]) {
  return setDoc(doc(sessions), newSession(fields));
}
