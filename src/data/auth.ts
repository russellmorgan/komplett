import {
  type User as FirebaseUser,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { useEffect, useState } from "react";
import { inboxList, initialUser } from "../domain/user";
import { auth, db } from "./firebase";

const EMAIL_KEY = "komplett:emailForSignIn";

export type AuthUser = { uid: string; displayName: string | null; email: string | null };

// Returns undefined while the initial auth state is still loading, null when signed out.
export function useAuthUser(): AuthUser | null | undefined {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  useEffect(
    () =>
      onAuthStateChanged(auth, async (firebaseUser) => {
        // A failed doc write must not strand the app on the blank loading state.
        if (firebaseUser) await ensureUserDocs(firebaseUser).catch(console.error);
        setUser(
          firebaseUser
            ? {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
              }
            : null,
        );
      }),
    [],
  );
  return user;
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function sendMagicLink(email: string) {
  await sendSignInLinkToEmail(auth, email, { url: window.location.origin, handleCodeInApp: true });
  localStorage.setItem(EMAIL_KEY, email);
}

// Call once on load: completes the magic-link flow if the URL is one.
export async function completeMagicLinkIfPresent() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return;
  const email =
    localStorage.getItem(EMAIL_KEY) ?? window.prompt("Confirm your email to finish signing in");
  if (!email) return;
  await signInWithEmailLink(auth, email, window.location.href);
  localStorage.removeItem(EMAIL_KEY);
  window.history.replaceState(null, "", window.location.pathname);
}

export function signOut() {
  return firebaseSignOut(auth);
}

// First sign-in creates users/{uid} and the Inbox list; later sign-ins find the user doc and stop.
async function ensureUserDocs(u: FirebaseUser) {
  const userRef = doc(db, "users", u.uid);
  if ((await getDoc(userRef)).exists()) return;
  await runTransaction(db, async (tx) => {
    if ((await tx.get(userRef)).exists()) return;
    tx.set(userRef, initialUser({ displayName: u.displayName, email: u.email ?? "" }));
    tx.set(doc(db, "lists", `${u.uid}-inbox`), inboxList(u.uid));
  });
}
