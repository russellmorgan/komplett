import { type AuthUser, signOut } from "../data/auth";

export const Tasks = () => <h1>Tasks</h1>;
export const Timer = () => <h1>Timer</h1>;
export const History = () => <h1>History</h1>;
export const Partner = () => <h1>Partner</h1>;

export function Settings({ user }: { user: AuthUser }) {
  return (
    <>
      <h1>Settings</h1>
      <p className="muted">Signed in as {user.email}</p>
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </>
  );
}
