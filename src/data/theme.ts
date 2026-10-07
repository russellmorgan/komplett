import { useState } from "react";

// Appearance is per device (localStorage), not per user: a phone and a desktop can differ.
// Values map to <html data-theme / data-mode>; the palettes themselves live in tokens.css.
export const THEMES = [
  { id: "paper", name: "Paper" },
  { id: "orange", name: "Orange" },
  { id: "blue", name: "Blue" },
  { id: "green", name: "Green" },
] as const;
export const MODES = [
  { id: "system", name: "System" },
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
] as const;

export type Appearance = {
  theme: (typeof THEMES)[number]["id"];
  mode: (typeof MODES)[number]["id"];
};

const KEY = "komplett:appearance";

function load(): Appearance {
  try {
    return { theme: "paper", mode: "system", ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { theme: "paper", mode: "system" };
  }
}

export function applyAppearance(a: Appearance = load()) {
  const root = document.documentElement;
  root.dataset.theme = a.theme;
  if (a.mode === "system") delete root.dataset.mode;
  else root.dataset.mode = a.mode;
  syncTitleBarOverlay();
}

// Electron (Windows/Linux): paint the native window buttons with the page's own colors. Computed
// styles resolve light-dark(), which the raw custom properties don't. No-op in the browser.
export function syncTitleBarOverlay() {
  const bridge = (window as { komplett?: { setTitleBarOverlay(c: string, s: string): void } })
    .komplett;
  if (!bridge) return;
  const { backgroundColor, color } = getComputedStyle(document.body);
  bridge.setTitleBarOverlay(backgroundColor, color);
}

export function useAppearance(): [Appearance, (patch: Partial<Appearance>) => void] {
  const [a, setA] = useState(load);
  return [
    a,
    (patch) => {
      const next = { ...a, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      applyAppearance(next);
      setA(next);
    },
  ];
}
