import { setSoundEnabled, soundEnabled } from './storage';

let ctx: AudioContext | null = null;
let on = false;
let initialized = false;

function ensureOn(): boolean {
  if (!initialized) {
    on = soundEnabled();
    initialized = true;
  }
  return on;
}

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function isSoundOn(): boolean {
  return ensureOn();
}

export function toggleSound(): boolean {
  on = !ensureOn();
  initialized = true;
  setSoundEnabled(on);
  if (on) {
    audio();
    note(660, 0, 0.08, 'triangle', 0.1);
  }
  return on;
}

function note(
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType = 'triangle',
  peak = 0.14,
): void {
  const a = audio();
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  correct(streak = 0): void {
    if (!ensureOn()) return;
    const lift = Math.min(streak, 10) * 35; // pitch climbs with the streak
    note(988 + lift, 0, 0.055, 'square', 0.06);
    note(1319 + lift, 0.055, 0.17, 'square', 0.08);
    note(660 + lift / 2, 0, 0.12, 'triangle', 0.09);
  },
  wrong(): void {
    if (!ensureOn()) return;
    note(190, 0, 0.16, 'sawtooth', 0.09);
    note(140, 0.09, 0.22, 'sawtooth', 0.09);
  },
  fanfare(): void {
    if (!ensureOn()) return;
    [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.09, 0.16, 'triangle', 0.12));
  },
  tap(): void {
    if (!ensureOn()) return;
    note(440, 0, 0.05, 'sine', 0.06);
  },
};
