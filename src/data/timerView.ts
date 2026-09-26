import { useCallback, useState } from "react";
import type { Density } from "../domain/dots";

// What the Timer screen shows, from the design's "View" panel. Per device (localStorage), like
// appearance: a phone might run Minimal while the desktop shows Everything.

export const ITEMS = [
  ["nav", "Navigation"],
  ["task", "Task title"],
  ["phase", "Focus / break switch"],
  ["readout", "Elapsed and total"],
  ["progress", "Progress row"],
  ["controls", "Controls"],
  ["upnext", "Up next"],
  ["today", "Today"],
  ["partner", "Partner"],
] as const;
export type Item = (typeof ITEMS)[number][0];

export const PANELS = [
  ["upnext", "Up next"],
  ["today", "Today"],
  ["partner", "Partner"],
] as const;
export type Panel = (typeof PANELS)[number][0];

export const PRESETS: Record<string, Item[]> = {
  Minimal: ["controls"],
  Focus: ["task", "readout", "progress", "controls"],
  Everything: ITEMS.map(([k]) => k),
};

export type TimerView = {
  shown: Item[];
  density: Density;
  focus: boolean; // focus mode: just the dots (and progress row if shown); Esc exits
  details: boolean; // panels under the timer on/off, without forgetting which are shown
  order: Panel[];
};

const KEY = "komplett:timerView";
const DEFAULT: TimerView = {
  shown: PRESETS.Everything as Item[],
  density: "Standard",
  focus: false,
  details: true,
  order: ["upnext", "today", "partner"],
};

function load(): TimerView {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULT;
  }
}

export function useTimerView(): [TimerView, (patch: Partial<TimerView>) => void] {
  const [view, setView] = useState(load);
  // Stable, so effects that depend on it don't resubscribe on every timer tick.
  const update = useCallback(
    (patch: Partial<TimerView>) =>
      setView((v) => {
        const next = { ...v, ...patch };
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      }),
    [],
  );
  return [view, update];
}
