// Break-time brick breaker. Pure: no React, no DOM. World is a fixed W×H box; the screen scales it.
// step() mutates the game in place: it runs every animation frame, so copying would be waste.

export const W = 480;
export const H = 360;
const COLS = 12;
const MARGIN = 12;
const TOP = 36;
const BRICK_W = (W - MARGIN * 2) / COLS;
const BRICK_H = 14;
const PADDLE_Y = H - 24;
const PADDLE_H = 8;
const PADDLE_W = 64;
export const BALL_R = 5;

// '.' empty, '1'–'6' one-hit colors, '#' two hits, '=' steel (unbreakable), '*' always drops.
const LEVELS = [
  ["............", "111111111111", "222222222222", "333333333333", "444444444444", "555555555555"],
  [".....**.....", "....3333....", "...444444...", "..55555555..", ".6666666666.", "=####..####="],
  ["1.2.3.4.5.6.", ".1.2.3.4.5.6", "#.#.#.#.#.#.", ".*.*.*.*.*.*", "6.5.4.3.2.1.", ".6.5.4.3.2.1"],
  ["=....==....=", "=.##....##.=", "=.#*#..#*#.=", "=.##....##.=", "=..111111..=", "...222222..."],
  [
    "..3......3..",
    "...3....3...",
    "..44444444..",
    ".55.5555.55.",
    "666666666666",
    "6.66666666.6",
    "6.6......6.6",
    "...##..##...",
  ],
];

export type PowerKind = "wide" | "multi" | "slow" | "laser" | "catch" | "fire" | "life";
export const POWER_LABEL: Record<PowerKind, string> = {
  wide: "W",
  multi: "M",
  slow: "S",
  laser: "L",
  catch: "C",
  fire: "F",
  life: "+",
};
const POWERS = Object.keys(POWER_LABEL) as PowerKind[];
const DURATION: Partial<Record<PowerKind, number>> = {
  wide: 12,
  slow: 10,
  laser: 8,
  catch: 15,
  fire: 6,
};

export type Brick = {
  x: number;
  y: number;
  hp: number;
  steel: boolean;
  color: number;
  drop: boolean;
};
// stuck: offset from the paddle center while the ball rides the paddle (serve or catch).
export type Ball = { x: number; y: number; vx: number; vy: number; stuck: number | null };
export type Status = "serve" | "play" | "clear" | "over";

export type Game = {
  level: number; // 1-based; past the last map it loops, faster
  score: number;
  lives: number;
  combo: number; // bricks broken since the ball last touched the paddle
  status: Status;
  paddle: { x: number; w: number };
  balls: Ball[];
  bricks: Brick[];
  capsules: { x: number; y: number; kind: PowerKind }[];
  lasers: { x: number; y: number }[];
  effects: Partial<Record<PowerKind, number>>; // seconds left
  laserCooldown: number;
};

export type Input = { paddleX: number | null; move: number; launch: boolean };

function speed(level: number) {
  return Math.min(250 * (1 + 0.07 * (level - 1)), 420);
}

function bricksFor(level: number): Brick[] {
  const map = LEVELS[(level - 1) % LEVELS.length] as string[];
  return map.flatMap((row, r) =>
    [...row].flatMap((ch, c) =>
      ch === "."
        ? []
        : [
            {
              x: MARGIN + c * BRICK_W,
              y: TOP + r * BRICK_H,
              hp: ch === "#" ? 2 : 1,
              steel: ch === "=",
              color: ch >= "1" && ch <= "6" ? Number(ch) - 1 : r % 6,
              drop: ch === "*",
            },
          ],
    ),
  );
}

function serveBall(paddle: Game["paddle"]): Ball {
  return { x: paddle.x, y: PADDLE_Y - BALL_R, vx: 0, vy: 0, stuck: 0 };
}

export function newGame(level = 1): Game {
  const paddle = { x: W / 2, w: PADDLE_W };
  return {
    level,
    score: 0,
    lives: 3,
    combo: 0,
    status: "serve",
    paddle,
    balls: [serveBall(paddle)],
    bricks: bricksFor(level),
    capsules: [],
    lasers: [],
    effects: {},
    laserCooldown: 0,
  };
}

// Score multiplier from the combo: ×1, then +1 every four bricks in a row, up to ×5.
export function multiplier(combo: number) {
  return Math.min(1 + Math.floor(combo / 4), 5);
}

function launch(g: Game, ball: Ball) {
  // Leaves at an angle set by where it sits on the paddle, so serving off-center aims.
  const rel = Math.max(-1, Math.min(1, (ball.stuck ?? 0) / (g.paddle.w / 2)));
  const a = rel * 1.05 || 0.2;
  const s = speed(g.level);
  ball.vx = s * Math.sin(a);
  ball.vy = -s * Math.cos(a);
  ball.stuck = null;
}

function hitBrick(g: Game, b: Brick, rng: () => number) {
  if (b.steel) return;
  b.hp -= 1;
  if (b.hp > 0) return;
  g.bricks.splice(g.bricks.indexOf(b), 1);
  g.combo += 1;
  g.score += (b.drop ? 50 : 10 + 5 * (g.level - 1)) * multiplier(g.combo);
  if (b.drop || rng() < 0.14) {
    const kind = POWERS[Math.floor(rng() * POWERS.length)] as PowerKind;
    g.capsules.push({ x: b.x + BRICK_W / 2, y: b.y + BRICK_H / 2, kind });
  }
}

function overlaps(ball: Ball, b: Brick) {
  const cx = Math.max(b.x, Math.min(ball.x, b.x + BRICK_W));
  const cy = Math.max(b.y, Math.min(ball.y, b.y + BRICK_H));
  return (ball.x - cx) ** 2 + (ball.y - cy) ** 2 < BALL_R * BALL_R;
}

function apply(g: Game, kind: PowerKind) {
  g.score += 25;
  if (kind === "life") g.lives = Math.min(g.lives + 1, 6);
  else if (kind === "multi") {
    const free = g.balls.filter((b) => b.stuck === null);
    for (const b of free.slice(0, 4)) {
      const s = Math.hypot(b.vx, b.vy);
      for (const turn of [-0.45, 0.45]) {
        const a = Math.atan2(b.vy, b.vx) + turn;
        g.balls.push({ x: b.x, y: b.y, vx: s * Math.cos(a), vy: s * Math.sin(a), stuck: null });
      }
    }
  } else g.effects[kind] = DURATION[kind];
}

// Moves one ball along one axis, bouncing off walls and bricks. Fireballs plough through.
function moveAxis(g: Game, ball: Ball, axis: "x" | "y", d: number, rng: () => number) {
  if (axis === "x") ball.x += d;
  else ball.y += d;
  if (ball.x < BALL_R || ball.x > W - BALL_R) {
    ball.x = Math.max(BALL_R, Math.min(W - BALL_R, ball.x));
    ball.vx = -ball.vx;
  }
  if (ball.y < BALL_R) {
    ball.y = BALL_R;
    ball.vy = Math.abs(ball.vy);
  }
  const hit = g.bricks.find((b) => overlaps(ball, b));
  if (!hit) return;
  const fire = (g.effects.fire ?? 0) > 0;
  if (fire && !hit.steel) {
    hit.hp = 1;
    hitBrick(g, hit, rng);
    return;
  }
  hitBrick(g, hit, rng);
  if (axis === "x") {
    ball.x -= d;
    ball.vx = -ball.vx;
  } else {
    ball.y -= d;
    ball.vy = -ball.vy;
  }
}

export function step(g: Game, dt: number, input: Input, rng: () => number = Math.random) {
  if (g.status === "over") return;
  dt = Math.min(dt, 1 / 30); // a backgrounded tab must not teleport the ball through bricks
  if (g.status === "clear") {
    if (input.launch) Object.assign(g, nextLevel(g));
    return;
  }

  for (const k of Object.keys(g.effects) as PowerKind[]) {
    g.effects[k] = (g.effects[k] ?? 0) - dt;
    if ((g.effects[k] ?? 0) <= 0) delete g.effects[k];
  }
  const p = g.paddle;
  p.w = g.effects.wide ? PADDLE_W * 1.6 : PADDLE_W;
  if (input.paddleX !== null) p.x = input.paddleX;
  p.x += input.move * 420 * dt;
  p.x = Math.max(p.w / 2, Math.min(W - p.w / 2, p.x));

  for (const ball of g.balls) {
    if (ball.stuck === null) continue;
    ball.x = p.x + ball.stuck;
    ball.y = PADDLE_Y - BALL_R;
    if (input.launch) launch(g, ball);
  }
  if (input.launch && g.status === "serve") g.status = "play";

  const slow = g.effects.slow ? 0.6 : 1;
  const sub = 4;
  for (let i = 0; i < sub; i++) {
    for (const ball of g.balls) {
      if (ball.stuck !== null) continue;
      moveAxis(g, ball, "x", (ball.vx * slow * dt) / sub, rng);
      moveAxis(g, ball, "y", (ball.vy * slow * dt) / sub, rng);
      const onPaddle =
        ball.vy > 0 &&
        ball.y + BALL_R >= PADDLE_Y &&
        ball.y - BALL_R <= PADDLE_Y + PADDLE_H &&
        Math.abs(ball.x - p.x) <= p.w / 2 + BALL_R;
      if (onPaddle) {
        g.combo = 0;
        ball.y = PADDLE_Y - BALL_R;
        if (g.effects.catch) {
          ball.stuck = ball.x - p.x;
          ball.vx = ball.vy = 0;
        } else {
          ball.stuck = ball.x - p.x;
          launch(g, ball);
        }
      }
    }
  }
  g.balls = g.balls.filter((b) => b.y < H + BALL_R * 2);

  if (g.effects.laser) {
    g.laserCooldown -= dt;
    if (g.laserCooldown <= 0) {
      g.laserCooldown = 0.3;
      g.lasers.push({ x: p.x - p.w / 2 + 4, y: PADDLE_Y }, { x: p.x + p.w / 2 - 4, y: PADDLE_Y });
    }
  }
  for (const l of g.lasers) {
    l.y -= 480 * dt;
    const hit = g.bricks.find(
      (b) => l.x >= b.x && l.x <= b.x + BRICK_W && l.y <= b.y + BRICK_H && l.y >= b.y,
    );
    if (hit) {
      hitBrick(g, hit, rng);
      l.y = -1;
    }
  }
  g.lasers = g.lasers.filter((l) => l.y > 0);

  for (const c of g.capsules) {
    c.y += 90 * dt;
    if (
      c.y >= PADDLE_Y - 4 &&
      c.y <= PADDLE_Y + PADDLE_H + 4 &&
      Math.abs(c.x - p.x) <= p.w / 2 + 8
    ) {
      apply(g, c.kind);
      c.y = H * 2;
    }
  }
  g.capsules = g.capsules.filter((c) => c.y < H + 10);

  if (g.bricks.every((b) => b.steel)) {
    g.score += 100 * g.level + 50 * g.lives;
    g.status = "clear";
  } else if (g.balls.length === 0) {
    g.lives -= 1;
    g.effects = {};
    g.capsules = [];
    g.lasers = [];
    g.combo = 0;
    if (g.lives <= 0) g.status = "over";
    else {
      g.balls = [serveBall(p)];
      g.status = "serve";
    }
  }
}

function nextLevel(g: Game): Game {
  const next = newGame(g.level + 1);
  return { ...next, score: g.score, lives: g.lives };
}

export const geometry = { BRICK_W, BRICK_H, PADDLE_Y, PADDLE_H };
