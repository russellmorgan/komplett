// Dot-matrix clock from the "Komplett Dot" design. Pure: no React, no DOM.
// A 5×7 font draws mm:ss on a grid; the bottom row doubles as a progress bar.

const FONT: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

// Grid densities from the design: k = dots per font pixel, m = margin in dots.
export const DENSITIES = {
  Compact: { k: 1, m: 1 },
  Standard: { k: 1, m: 2 },
  Roomy: { k: 1, m: 4 },
  Fine: { k: 2, m: 3 },
} as const;
export type Density = keyof typeof DENSITIES;

export function gridOf(density: Density) {
  const { k, m } = DENSITIES[density];
  return {
    k,
    m,
    cols: 2 * m + 25 * k,
    rows: m + 7 * k + Math.max(m, 2), // last row is the progress bar
    digitX: [m, m + 6 * k, m + 14 * k, m + 20 * k],
    colonX: m + 12 * k,
  };
}

export type Dot = "off" | "on" | "done" | "head";

// ms remaining → mm:ss digits. Minutes cap at 99 so four glyphs always fit.
function digits(remainingMs: number): string {
  const s = Math.ceil(remainingMs / 1000);
  const mm = Math.min(99, Math.floor(s / 60));
  return `${String(mm).padStart(2, "0")}${String(s % 60).padStart(2, "0")}`;
}

// Row-major, cols × rows of gridOf(density). `colon` lets the caller blink it (and the progress
// head with it); progress is 0..1 elapsed, or null to leave the bottom row dark.
export function dotMatrix(
  remainingMs: number,
  progress: number | null,
  colon: boolean,
  density: Density = "Standard",
): Dot[] {
  const { k, m, cols, rows, digitX, colonX } = gridOf(density);
  const dots: Dot[] = Array(cols * rows).fill("off");
  const lit = (r: number, c: number) => {
    for (let a = 0; a < k; a++)
      for (let b = 0; b < k; b++) dots[(m + r * k + a) * cols + c + b] = "on";
  };
  [...digits(remainingMs)].forEach((ch, i) => {
    FONT[ch]?.forEach((row, r) => {
      [...row].forEach((bit, c) => {
        if (bit === "1") lit(r, (digitX[i] as number) + c * k);
      });
    });
  });
  if (colon) {
    lit(2, colonX);
    lit(4, colonX);
  }
  if (progress === null) return dots;
  const pm = Math.max(1, m);
  const span = cols - 2 * pm;
  const done = Math.floor(Math.min(1, Math.max(0, progress)) * span);
  const base = (rows - 1) * cols + pm;
  for (let i = 0; i < span; i++) {
    if (i < done) dots[base + i] = "done";
    else if (i === done && colon) dots[base + i] = "head";
  }
  return dots;
}
