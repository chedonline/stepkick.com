import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, randInt } from '../engine/rng';
import { orderNumeric } from './util';

// A formation of identical items (rows of 5) to count — up to 20.
const ITEMS = ['🍎', '🐤', '⭐', '🎈', '🍓', '🐢', '🚗', '🌸', '🍪', '🐞', '🧁', '🐠'];
const COLORS = ['#38bdf8', '#5eead4', '#99f6e4'];

function nearNumbers(answer: number, rng: Rng, spread: number): string[] {
  const seen = new Set<number>([answer]);
  const out: number[] = [];
  let guard = 0;
  while (out.length < 3 && guard++ < 60) {
    const n = answer + randInt(rng, 1, spread) * (rng() < 0.5 ? -1 : 1);
    if (n < 1 || n > 25 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  let k = answer + 1;
  while (out.length < 3) {
    if (k >= 1 && !seen.has(k)) { seen.add(k); out.push(k); }
    k++;
  }
  return out.map(String);
}

function build(rng: Rng, d: number): Question {
  const n = Math.min(20, randInt(rng, 3, Math.round(6 + d * 16))); // ramps up to 20
  const emoji = pick(ITEMS, rng);
  const spread = Math.max(2, Math.round(n * 0.25));
  const choices = [String(n), ...nearNumbers(n, rng, spread)].sort(orderNumeric);
  return { prompt: { kind: 'count', emoji, n }, answer: String(n), choices, choiceKind: 'text', colors: COLORS };
}

export const countingPack: SubjectPack = {
  meta: { id: 'counting', emoji: '🔢', name: 'Counting', blurb: 'How many?', accent: '#38bdf8' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
