import { useState } from "react";
import { type AuthUser, signOut } from "../data/auth";
import { CHIME_IDS, CHIMES, playChime } from "../data/chime";
import { MODES, THEMES, useAppearance } from "../data/theme";
import { updateSettings, useUserDoc } from "../data/user";
import { Icon } from "../icons";
import { Breakout } from "./Breakout";

// Native min/max only validate on submit; clamp so 0/NaN never reaches the user doc.
const minutes = (v: string | number) => Math.min(180, Math.max(1, Math.round(Number(v)) || 1));

export function Settings({ user }: { user: AuthUser }) {
  const doc = useUserDoc(user.uid);
  const [appearance, setAppearance] = useAppearance();
  const [playing, setPlaying] = useState(false);

  return (
    <div className="stack">
      <div className="stack-tight">
        <h1>Settings</h1>
        <span className="muted">Signed in as {user.email}</span>
      </div>
      {doc && (
        <section className="card flush">
          {(
            [
              ["focusMinutes", "Focus"],
              ["breakMinutes", "Break"],
            ] as const
          ).map(([key, label]) => {
            const value = doc.settings[key];
            const set = (v: string | number) => updateSettings(user.uid, { [key]: minutes(v) });
            return (
              <div className="setting" key={key}>
                <span className="setting-label">
                  <strong>{label}</strong>
                  <span className="muted">1 to 180 minutes</span>
                </span>
                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => set(value - 1)}
                    aria-label={`Decrease ${label}`}
                  >
                    −
                  </button>
                  <input
                    key={value}
                    type="number"
                    min={1}
                    max={180}
                    defaultValue={value}
                    onBlur={(e) => set(e.target.value)}
                    aria-label={`${label} minutes`}
                  />
                  <button
                    type="button"
                    onClick={() => set(value + 1)}
                    aria-label={`Increase ${label}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
          <label className="setting">
            <span className="setting-label">
              <strong>Sound</strong>
              <span className="muted">Chime when a focus or break ends</span>
            </span>
            <input
              type="checkbox"
              className="switch"
              checked={doc.settings.soundEnabled}
              onChange={(e) => updateSettings(user.uid, { soundEnabled: e.target.checked })}
            />
          </label>
          {doc.settings.soundEnabled && (
            <fieldset className="chimes" aria-label="Chime sound">
              {CHIME_IDS.map((id) => (
                <div className="chime" key={id}>
                  <button
                    type="button"
                    className="person"
                    aria-pressed={(doc.settings.chime ?? "bell") === id}
                    onClick={() => updateSettings(user.uid, { chime: id })}
                  >
                    <span className="radio" />
                    {CHIMES[id].name}
                  </button>
                  <button type="button" className="chip" onClick={() => playChime(id)}>
                    <Icon name="play" size={10} /> Preview
                  </button>
                </div>
              ))}
            </fieldset>
          )}
        </section>
      )}
      <section className="card flush">
        <div className="setting">
          <span className="setting-label">
            <strong>Appearance</strong>
            <span className="muted">On this device</span>
          </span>
          <fieldset className="segmented" aria-label="Appearance">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={appearance.mode === m.id}
                onClick={() => setAppearance({ mode: m.id })}
              >
                {m.name}
              </button>
            ))}
          </fieldset>
          <label className="round-toggle">
            Rounded
            <input
              type="checkbox"
              className="switch"
              checked={appearance.round}
              onChange={(e) => setAppearance({ round: e.target.checked })}
            />
          </label>
        </div>
        <div className="setting">
          <span className="setting-label">
            <strong>Theme</strong>
          </span>
          <fieldset className="segmented" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={appearance.theme === t.id}
                onClick={() => setAppearance({ theme: t.id })}
              >
                {t.name}
              </button>
            ))}
          </fieldset>
        </div>
        <div className="setting">
          <span className="setting-label">
            <strong>Break game</strong>
            <span className="muted">Usually offered during a break</span>
          </span>
          <button type="button" className="outline" onClick={() => setPlaying(true)}>
            <Icon name="play" size={10} /> Play
          </button>
        </div>
      </section>
      {playing && <Breakout uid={user.uid} onClose={() => setPlaying(false)} />}
      <button type="button" className="outline start" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
