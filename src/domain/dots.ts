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

// ponytail: one density ("Standard" in the design); the design's Compact/Roomy/Fine picker is skipped.
const M = 2; // margin in dots
export const DOT_COLS = 2 * M + 25; // 29
export const DOT_ROWS = M + 7 + M; // 11: margin, 7 glyph rows, margin (last row = progress)
const DIGIT_X = [M, M + 6, M + 14, M + 20];
const COLON_X = M + 12;

export type Dot = "off" | "on" | "done" | "head";

// ms remaining → mm:ss digits. Minutes cap at 99 so four glyphs always fit.
function digits(remainingMs: number): string {
  const s = Math.ceil(remainingMs / 1000);
  const mm = Math.min(99, Math.floor(s / 60));
  return `${String(mm).padStart(2, "0")}${String(s % 60).padStart(2, "0")}`;
}

// Row-major, DOT_COLS × DOT_ROWS. `colon` lets the caller blink it; progress is 0..1 elapsed.
export function dotMatrix(remainingMs: number, progress: number, colon: boolean): Dot[] {
  const dots: Dot[] = Array(DOT_COLS * DOT_ROWS).fill("off");
  const lit = (r: number, c: number) => {
    dots[(M + r) * DOT_COLS + c] = "on";
  };
  [...digits(remainingMs)].forEach((ch, i) => {
    FONT[ch]?.forEach((row, r) => {
      [...row].forEach((b, c) => {
        if (b === "1") lit(r, (DIGIT_X[i] as number) + c);
      });
    });
  });
  if (colon) {
    lit(2, COLON_X);
    lit(4, COLON_X);
  }
  const span = DOT_COLS - 2 * M;
  const done = Math.floor(Math.min(1, Math.max(0, progress)) * span);
  const base = (DOT_ROWS - 1) * DOT_COLS + M;
  for (let k = 0; k < span; k++) {
    if (k < done) dots[base + k] = "done";
    else if (k === done && colon) dots[base + k] = "head";
  }
  return dots;
}
