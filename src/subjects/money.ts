import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, randInt } from '../engine/rng';

const COLORS = ['#fbbf24', '#2dd4bf', '#5eead4'];
const fmt = (c: number): string => `${c}¢`;

function build(rng: Rng, d: number): Question {
  const denoms = d < 0.3 ? [1, 5] : d < 0.6 ? [1, 5, 10] : [1, 5, 10, 25];
  const maxCoins = randInt(rng, 2, d < 0.4 ? 4 : 6);
  const coins: number[] = [];
  let total = 0;
  let guard = 0;
  while (coins.length < maxCoins && guard++ < 40) {
    const c = pick(denoms, rng);
    if (total + c > 99) continue; // keep it under a dollar
    coins.push(c);
    total += c;
  }
  if (coins.length < 2) {
    coins.push(1);
    total += 1;
  }
  coins.sort((a, b) => b - a); // group big → small so it's easy to count

  const answer = fmt(total);
  const seen = new Set<number>([total]);
  const out: number[] = [];
  let g = 0;
  while (out.length < 3 && g++ < 60) {
    const n = total + randInt(rng, 1, 10) * (rng() < 0.5 ? -1 : 1);
    if (n < 1 || n > 120 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  let k = total + 1;
  while (out.length < 3) {
    if (k > 0 && !seen.has(k)) { seen.add(k); out.push(k); }
    k++;
  }

  const choices = [total, ...out].sort((a, b) => a - b).map(fmt);
  return { prompt: { kind: 'coins', coins }, answer, choices, choiceKind: 'text', colors: COLORS };
}

export const moneyPack: SubjectPack = {
  meta: { id: 'money', emoji: '🪙', name: 'Money', blurb: 'How much?', accent: '#5eead4' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
