import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, randInt } from '../engine/rng';

const COLORS = ['#22d3ee', '#2dd4bf', '#5eead4'];

const fmt = (h: number, m: number): string => `${h}:${String(m).padStart(2, '0')}`;
const timeVal = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

function build(rng: Rng, d: number): Question {
  // minute precision ramps: o'clock → half → quarters → any 5 minutes
  const minutes = d < 0.3 ? [0] : d < 0.5 ? [0, 30] : d < 0.7 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const hour = randInt(rng, 1, 12);
  const minute = pick(minutes, rng);
  const answer = fmt(hour, minute);

  const seen = new Set<string>([answer]);
  const out: string[] = [];
  let guard = 0;
  while (out.length < 3 && guard++ < 80) {
    let h2 = hour;
    let m2 = minute;
    if (rng() < 0.5) h2 = ((hour - 1 + randInt(rng, 1, 4)) % 12) + 1; // wrong hour
    else m2 = pick(minutes, rng); // wrong minute
    const t = fmt(h2, m2);
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  let hh = 1;
  while (out.length < 3) {
    const t = fmt(((hour - 1 + hh) % 12) + 1, minute);
    if (!seen.has(t)) { seen.add(t); out.push(t); }
    hh++;
  }

  const choices = [answer, ...out].sort((a, b) => timeVal(a) - timeVal(b));
  return { prompt: { kind: 'clock', hour, minute }, answer, choices, choiceKind: 'text', colors: COLORS };
}

export const clockPack: SubjectPack = {
  meta: { id: 'clock', emoji: '🕐', name: 'Clock', blurb: 'What time is it?', accent: '#22d3ee' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
