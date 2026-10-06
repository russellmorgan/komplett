import { useEffect, useRef, useState } from "react";
import { Avatar } from "../Avatar";
import { setBreakoutBest, useUserDoc } from "../data/user";
import {
  BALL_R,
  type Game,
  geometry,
  H,
  multiplier,
  newGame,
  POWER_LABEL,
  type PowerKind,
  step,
  W,
} from "../domain/breakout";
import { Icon } from "../icons";

const { BRICK_W, BRICK_H, PADDLE_Y, PADDLE_H } = geometry;
const BRICKS = [
  "--list-rose",
  "--list-orange",
  "--list-amber",
  "--list-green",
  "--list-sky",
  "--list-violet",
];
const TOKENS = [
  "--color-field",
  "--color-text",
  "--color-on-text",
  "--color-text-muted",
  "--color-text-faint",
  "--color-border",
  "--color-accent",
  "--color-danger",
  ...BRICKS,
];
type Palette = Record<string, string>;

// Canvas can't read var(), and a custom property's computed value is still the raw light-dark(…)
// text; a probe's computed `color` resolves it for the current theme and mode.
function readPalette(host: HTMLElement): Palette {
  const probe = document.createElement("span");
  probe.style.transition = "none"; // app.css transitions everything; mid-transition reads lag a token
  host.append(probe);
  const out = Object.fromEntries(
    TOKENS.map((t) => {
      probe.style.color = `var(${t})`;
      return [t, getComputedStyle(probe).color];
    }),
  );
  probe.remove();
  return out;
}

function draw(ctx: CanvasRenderingContext2D, g: Game, c: Palette, round: boolean, font: string) {
  const r = round ? 4 : 0;
  ctx.fillStyle = c["--color-field"] as string;
  ctx.fillRect(0, 0, W, H);

  for (const b of g.bricks) {
    ctx.fillStyle = (
      b.steel
        ? c["--color-border"]
        : b.drop
          ? c["--color-accent"]
          : b.hp > 1
            ? c["--color-text-muted"]
            : c[BRICKS[b.color] as string]
    ) as string;
    ctx.beginPath();
    ctx.roundRect(b.x + 1, b.y + 1, BRICK_W - 2, BRICK_H - 2, r);
    ctx.fill();
  }

  ctx.fillStyle = c["--color-accent"] as string;
  for (const l of g.lasers) ctx.fillRect(l.x - 1, l.y - 8, 2, 8);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 8px ${font}`;
  for (const cap of g.capsules) {
    ctx.fillStyle = c["--color-text"] as string;
    ctx.beginPath();
    ctx.roundRect(cap.x - 11, cap.y - 5, 22, 10, round ? 5 : 0);
    ctx.fill();
    ctx.fillStyle = c["--color-on-text"] as string;
    ctx.fillText(POWER_LABEL[cap.kind], cap.x, cap.y + 0.5);
  }

  const p = g.paddle;
  ctx.fillStyle = c["--color-text"] as string;
  ctx.beginPath();
  ctx.roundRect(p.x - p.w / 2, PADDLE_Y, p.w, PADDLE_H, r);
  ctx.fill();
  ctx.fillStyle = c["--color-accent"] as string;
  if (g.effects.catch) ctx.fillRect(p.x - p.w / 2 + 3, PADDLE_Y, p.w - 6, 2);
  if (g.effects.laser) {
    ctx.fillRect(p.x - p.w / 2 + 2, PADDLE_Y - 4, 4, 4);
    ctx.fillRect(p.x + p.w / 2 - 6, PADDLE_Y - 4, 4, 4);
  }

  ctx.fillStyle = (g.effects.fire ? c["--color-danger"] : c["--color-accent"]) as string;
  for (const b of g.balls) {
    ctx.beginPath();
    if (round) ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
    else ctx.rect(b.x - BALL_R, b.y - BALL_R, BALL_R * 2, BALL_R * 2);
    ctx.fill();
  }

  const message =
    g.status === "serve"
      ? g.level === 1 && g.lives === 3
        ? "Tap or press space to launch"
        : "Tap to launch"
      : g.status === "clear"
        ? `Level ${g.level} cleared · tap for level ${g.level + 1}`
        : g.status === "over"
          ? "Game over · tap to play again"
          : null;
  if (message) {
    ctx.fillStyle = c["--color-text-faint"] as string;
    ctx.font = `600 13px ${font}`;
    ctx.fillText(message, W / 2, H * 0.68);
  }
}

type Hud = Pick<Game, "score" | "lives" | "level" | "combo"> & { effects: [PowerKind, number][] };
const hudOf = (g: Game): Hud => ({
  score: g.score,
  lives: g.lives,
  level: g.level,
  combo: g.combo,
  effects: Object.entries(g.effects).map(([k, s]) => [k as PowerKind, Math.ceil(s ?? 0)]),
});

// Break-time brick breaker in a modal. Colors, rounding and font come from the theme tokens.
// Best score lives on the user doc so the partner can read it (user docs are readable by all).
export function Breakout({
  uid,
  onClose,
  onStartFocus,
}: {
  uid: string;
  onClose: () => void;
  onStartFocus?: () => void; // absent outside a break (Settings), which hides the button
}) {
  const me = useUserDoc(uid);
  const partner = useUserDoc(me?.partnerId ?? null);
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<Hud>(() => hudOf(newGame()));
  const best = me?.breakoutBest ?? 0;
  // Infinity until the user doc loads, so a slow snapshot can't let a low score overwrite a high one.
  const bestRef = useRef(Number.POSITIVE_INFINITY);
  bestRef.current = me ? best : Number.POSITIVE_INFINITY;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    const el = canvas.current as HTMLCanvasElement;
    const ctx = el.getContext("2d") as CanvasRenderingContext2D;
    const root = getComputedStyle(document.documentElement);
    const round = root.getPropertyValue("--radius-dot").trim() !== "0";
    const font = getComputedStyle(el).fontFamily;
    let palette = readPalette(el.parentElement as HTMLElement);
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    const repaint = () => {
      palette = readPalette(el.parentElement as HTMLElement);
    };
    scheme.addEventListener("change", repaint);

    let game = newGame();
    let pointerX: number | null = null;
    let launch = false;
    const keys = new Set<string>();
    const save = () => {
      if (game.score <= bestRef.current) return;
      bestRef.current = game.score;
      setBreakoutBest(uid, game.score).catch(console.error);
    };

    const toWorld = (clientX: number) => {
      const box = el.getBoundingClientRect();
      return ((clientX - box.left) / box.width) * W;
    };
    const onMove = (e: PointerEvent) => {
      pointerX = toWorld(e.clientX);
    };
    const onDown = (e: PointerEvent) => {
      pointerX = toWorld(e.clientX);
      launch = true;
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === "keyup") return keys.delete(k);
      if (k === " " || k === "enter" || k === "arrowup") launch = true;
      else if (["arrowleft", "arrowright", "a", "d"].includes(k)) {
        keys.add(k);
        pointerX = null;
      } else return;
      e.preventDefault();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("keydown", onKey);
    el.addEventListener("keyup", onKey);

    let last = performance.now();
    let shown = "";
    let raf = 0;
    const frame = (t: number) => {
      const dpr = devicePixelRatio || 1;
      const w = Math.round(el.clientWidth * dpr);
      if (el.width !== w) {
        el.width = w;
        el.height = Math.round((w * H) / W);
      }
      const move =
        (keys.has("arrowright") || keys.has("d") ? 1 : 0) -
        (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
      if (game.status === "over") {
        if (launch) game = newGame();
      } else {
        step(game, (t - last) / 1000, { paddleX: pointerX, move, launch });
        if ((game.status as string) === "over") save(); // step() mutated it; TS kept the narrowing
      }
      launch = false;
      last = t;
      ctx.setTransform(el.width / W, 0, 0, el.width / W, 0, 0);
      draw(ctx, game, palette, round, font);
      const next = hudOf(game);
      const key = JSON.stringify(next);
      if (key !== shown) {
        shown = key;
        setHud(next);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      scheme.removeEventListener("change", repaint);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("keyup", onKey);
      save(); // closing mid-game still counts
    };
  }, [uid]);

  const partnerBest = partner?.breakoutBest ?? 0;
  const partnerName = partner?.displayName.split(" ")[0] ?? "Partner";
  const ahead = partner && hud.score > partnerBest && partnerBest > 0;

  return (
    <dialog ref={dialog} className="game" onClose={onClose} aria-label="Break game">
      <div className="panel-head">
        <h2>Break time</h2>
        <span className="panel-tools">
          {onStartFocus && (
            <button type="button" className="primary" onClick={onStartFocus}>
              Start focus
            </button>
          )}
          <button type="button" className="ghost icon" aria-label="Close game" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </span>
      </div>
      <div className="stats game-stats">
        <div>
          <strong>{hud.score.toLocaleString()}</strong>
          <span>score{hud.combo >= 4 && <b className="combo"> ×{multiplier(hud.combo)}</b>}</span>
        </div>
        <div>
          <strong>{Math.max(best, hud.score).toLocaleString()}</strong>
          <span>your best</span>
        </div>
        {partner && (
          <div>
            <strong>
              <Avatar person={partner} className="avatar small" /> {partnerBest.toLocaleString()}
            </strong>
            <span className={ahead ? "combo" : undefined}>
              {ahead ? `ahead of ${partnerName}!` : `${partnerName}’s best`}
            </span>
          </div>
        )}
        <div>
          <strong>{hud.level}</strong>
          <span>level</span>
        </div>
        <div>
          <strong title={`${hud.lives} ${hud.lives === 1 ? "life" : "lives"}`}>
            {"●".repeat(Math.max(hud.lives, 0))}
          </strong>
          <span>lives</span>
        </div>
      </div>
      <canvas
        ref={canvas}
        tabIndex={0}
        autoFocus
        aria-label="Brick breaker. Arrows move, space launches."
      />
      <p className="muted">
        {hud.effects.length > 0
          ? hud.effects.map(([k, s]) => `${POWER_LABEL[k]} ${s}s`).join(" · ")
          : "Catch capsules: W wide · M multiball · S slow · L laser · C catch · F fireball · + life. Chain bricks for a multiplier."}
      </p>
    </dialog>
  );
}
