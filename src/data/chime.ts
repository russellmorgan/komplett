import type { ChimeId } from "../domain/user";

// Period-end chimes, synthesized with Web Audio so there are no sound files to ship or cache.
// Each note is [start s, frequency Hz, length s]; `wave` and `gain` shape the timbre.

type Note = [start: number, freq: number, length: number];
type Chime = { name: string; wave: OscillatorType; gain: number; notes: Note[] };

export const CHIMES = {
  bell: {
    name: "Bell",
    wave: "sine",
    gain: 0.35,
    notes: [
      [0, 880, 1.2],
      [0, 1760, 0.6],
    ],
  },
  woodblock: {
    name: "Woodblock",
    wave: "square",
    gain: 0.12,
    notes: [
      [0, 900, 0.06],
      [0.18, 700, 0.06],
    ],
  },
  glass: {
    name: "Glass",
    wave: "sine",
    gain: 0.25,
    notes: [
      [0, 1568, 0.9],
      [0.12, 2093, 0.9],
      [0.24, 2637, 1.1],
    ],
  },
  pulse: {
    name: "Pulse",
    wave: "triangle",
    gain: 0.3,
    notes: [
      [0, 660, 0.15],
      [0.25, 660, 0.15],
      [0.5, 660, 0.15],
    ],
  },
  soft: {
    name: "Soft rise",
    wave: "sine",
    gain: 0.25,
    notes: [
      [0, 523, 0.5],
      [0.2, 659, 0.5],
      [0.4, 784, 0.9],
    ],
  },
} satisfies Record<ChimeId, Chime>;
export const CHIME_IDS = Object.keys(CHIMES) as ChimeId[];

export function playChime(id: ChimeId = "bell") {
  const chime: Chime = CHIMES[id] ?? CHIMES.bell;
  const ctx = new AudioContext();
  let end = 0;
  for (const [start, freq, length] of chime.notes) {
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = chime.wave;
    osc.frequency.value = freq;
    // Quick attack, exponential decay: no clicks, sounds struck rather than held.
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(chime.gain, t + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + length);
    end = Math.max(end, start + length);
  }
  setTimeout(() => ctx.close(), end * 1000 + 100);
}
