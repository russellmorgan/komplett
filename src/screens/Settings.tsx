import { type AuthUser, signOut } from "../data/auth";
import { updateSettings, useUserDoc } from "../data/user";

// Native min/max only validate on submit; clamp on blur so 0/NaN never reaches the user doc.
const minutes = (v: string) => Math.min(180, Math.max(1, Math.round(Number(v)) || 1));

export function Settings({ user }: { user: AuthUser }) {
  const doc = useUserDoc(user.uid);

  return (
    <>
      <h1>Settings</h1>
      <p className="muted">Signed in as {user.email}</p>
      {doc && (
        <>
          <label>
            Focus minutes
            <input
              type="number"
              min={1}
              max={180}
              defaultValue={doc.settings.focusMinutes}
              onBlur={(e) => updateSettings(user.uid, { focusMinutes: minutes(e.target.value) })}
            />
          </label>
          <label>
            Break minutes
            <input
              type="number"
              min={1}
              max={180}
              defaultValue={doc.settings.breakMinutes}
              onBlur={(e) => updateSettings(user.uid, { breakMinutes: minutes(e.target.value) })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              defaultChecked={doc.settings.soundEnabled}
              onChange={(e) => updateSettings(user.uid, { soundEnabled: e.target.checked })}
            />
            Sound
          </label>
        </>
      )}
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </>
  );
}
