import { describe, expect, it } from "vitest";
import { dotMatrix, gridOf } from "./dots";

const { cols: DOT_COLS, rows: DOT_ROWS } = gridOf("Standard");

// Render rows 2..8 (the glyph band) as a string of #/. for readable assertions.
const band = (dots: ReturnType<typeof dotMatrix>) =>
  Array.from({ length: 7 }, (_, r) =>
    dots
      .slice((r + 2) * DOT_COLS, (r + 3) * DOT_COLS)
      .map((d) => (d === "on" ? "#" : "."))
      .join(""),
  );

describe("dotMatrix", () => {
  it("draws 25:00 with a colon and an empty progress row", () => {
    const dots = dotMatrix(25 * 60_000, 0, true);
    expect(dots).toHaveLength(DOT_COLS * DOT_ROWS);
    expect(band(dots)[0]).toBe("...###..#####....###...###...");
    expect(band(dots)[2]).toBe("......#.####..#.#..##.#..##..");
    const progress = dots.slice((DOT_ROWS - 1) * DOT_COLS);
    expect(progress.filter((d) => d === "done")).toHaveLength(0);
    expect(progress.filter((d) => d === "head")).toHaveLength(1);
  });

  it("hides the colon and progress head when colon is off", () => {
    const on = dotMatrix(60_000, 0.5, true).filter((d) => d !== "off").length;
    const off = dotMatrix(60_000, 0.5, false).filter((d) => d !== "off").length;
    expect(on - off).toBe(3); // two colon dots + the progress head
  });

  it("scales glyphs by k and leaves the progress row dark when progress is null", () => {
    const { cols, rows } = gridOf("Fine");
    const dots = dotMatrix(25 * 60_000, null, false, "Fine");
    expect(dots).toHaveLength(cols * rows);
    // Fine doubles each font pixel: 4× the lit dots of Standard (colon off in both).
    const standard = dotMatrix(25 * 60_000, null, false).filter((d) => d === "on").length;
    expect(dots.filter((d) => d === "on")).toHaveLength(standard * 4);
    expect(dots.some((d) => d === "done" || d === "head")).toBe(false);
  });

  it("fills the progress row proportionally", () => {
    const row = dotMatrix(0, 1, false).slice((DOT_ROWS - 1) * DOT_COLS);
    expect(row.filter((d) => d === "done")).toHaveLength(DOT_COLS - 4);
  });
});
