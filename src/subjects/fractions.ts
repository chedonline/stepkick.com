import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, randInt } from '../engine/rng';

const COLORS = ['#22d3ee', '#2dd4bf', '#5eead4'];
const val = (t: string): number => {
  const [a, b] = t.split('/').map(Number);
  return a / b;
};

function build(rng: Rng, d: number): Question {
  const denoms = d < 0.35 ? [3, 4] : d < 0.65 ? [4, 5, 6] : [6, 8];
  const denom = pick(denoms, rng);
  const num = randInt(rng, 1, denom - 1);
  const answer = `${num}/${denom}`;
  const av = num / denom;

  // wrong fractions from nearby denominators. Never equal the answer's value,
  // and never two distractors of the same value (dedupe by value → fair + clean).
  const cand = new Set<string>();
  for (const b of [denom, denom - 1, denom + 1]) {
    if (b < 2) continue;
    for (let a = 1; a <= b; a++) {
      if (Math.abs(a / b - av) > 1e-9) cand.add(`${a}/${b}`);
    }
  }
  const wrong: string[] = [];
  const usedVals = [av];
  for (const f of [...cand].sort((x, y) => Math.abs(val(x) - av) - Math.abs(val(y) - av))) {
    const v = val(f);
    if (usedVals.some((u) => Math.abs(u - v) < 1e-9)) continue;
    usedVals.push(v);
    wrong.push(f);
    if (wrong.length >= 3) break;
  }
  const choices = [answer, ...wrong].sort((x, y) => val(x) - val(y));
  return { prompt: { kind: 'fraction', num, denom }, answer, choices, choiceKind: 'text', colors: COLORS };
}

export const fractionsPack: SubjectPack = {
  meta: { id: 'fractions', emoji: '🍕', name: 'Fractions', blurb: 'How much is shaded?', accent: '#22d3ee' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
