import { describe, expect, it } from "vitest";
import { type Game, H, multiplier, newGame, step, W } from "./breakout";

const idle = { paddleX: null, move: 0, launch: false };
const run = (g: Game, seconds: number, input = idle) => {
  for (let t = 0; t < seconds * 60; t++) step(g, 1 / 60, input, () => 0.99);
};

describe("breakout", () => {
  it("serves from the paddle and breaks bricks once launched", () => {
    const g = newGame();
    const bricks = g.bricks.length;
    run(g, 1);
    expect(g.status).toBe("serve");
    step(g, 1 / 60, { ...idle, launch: true });
    // Follow the ball with the paddle so it never drops.
    for (let t = 0; t < 600; t++) step(g, 1 / 60, { ...idle, paddleX: g.balls[0]?.x ?? W / 2 });
    expect(g.bricks.length).toBeLessThan(bricks);
    expect(g.score).toBeGreaterThan(0);
  });

  it("loses a life when the ball drops, then game over", () => {
    const g = newGame();
    g.lives = 1;
    step(g, 1 / 60, { ...idle, launch: true });
    g.balls = [{ x: 10, y: H - 2, vx: 0, vy: 200, stuck: null }];
    run(g, 0.5);
    expect(g.status).toBe("over");
  });

  it("clears the level when only steel is left and moves on", () => {
    const g = newGame(2);
    g.bricks = g.bricks.filter((b) => b.steel);
    step(g, 1 / 60, idle);
    expect(g.status).toBe("clear");
    step(g, 1 / 60, { ...idle, launch: true });
    expect(g.level).toBe(3);
    expect(g.status).toBe("serve");
  });

  it("catches capsules: multi-ball splits every free ball in three", () => {
    const g = newGame();
    step(g, 1 / 60, { ...idle, launch: true });
    g.capsules = [{ x: g.paddle.x, y: H - 26, kind: "multi" }];
    step(g, 1 / 60, idle);
    expect(g.balls).toHaveLength(3);
  });

  it("caps the combo multiplier at ×5", () => {
    expect([0, 3, 4, 8, 100].map(multiplier)).toEqual([1, 1, 2, 3, 5]);
  });
});
