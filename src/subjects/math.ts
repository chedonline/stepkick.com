import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, randInt } from '../engine/rng';
import { orderNumeric } from './util';

const COUNTABLES = ['🍎', '🐤', '⭐', '🎈', '🍓', '🐢', '🚗', '🌸', '🍪', '🐞'];
const COLORS = ['#38bdf8', '#22d3ee', '#818cf8'];

/** 3 near-miss numbers around `answer`, all >= 0 and distinct from it. */
function numberDistractors(answer: number, rng: Rng, spread: number): string[] {
  const seen = new Set<number>([answer]);
  const out: number[] = [];
  let guard = 0;
  while (out.length < 3 && guard++ < 50) {
    const delta = randInt(rng, 1, spread) * (rng() < 0.5 ? -1 : 1);
    const n = answer + delta;
    if (n < 0 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  // pad if a tiny answer starved the loop (e.g. answer 0/1)
  let n = answer + 1;
  while (out.length < 3) {
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
    n++;
  }
  return out.map(String);
}

function build(rng: Rng, difficulty: number): Question {
  const d = difficulty;
  const type = rng() < 0.4 ? 'count' : rng() < 0.7 ? 'add' : 'sub';

  let answer: number;
  let prompt: Question['prompt'];

  if (type === 'count') {
    const n = randInt(rng, 2, Math.round(3 + d * 9)); // up to ~12
    answer = n;
    prompt = { kind: 'count', emoji: pick(COUNTABLES, rng), n };
  } else if (type === 'add') {
    const cap = Math.round(4 + d * 14);
    const a = randInt(rng, 1, cap);
    const b = randInt(rng, 1, cap);
    answer = a + b;
    prompt = { kind: 'expr', text: `${a} + ${b} = ?` };
  } else {
    const cap = Math.round(5 + d * 15);
    const a = randInt(rng, 2, cap);
    const b = randInt(rng, 1, a); // keep it non-negative for kids
    answer = a - b;
    prompt = { kind: 'expr', text: `${a} − ${b} = ?` };
  }

  const spread = Math.max(2, Math.round(answer * 0.4));
  const choices = [String(answer), ...numberDistractors(answer, rng, spread)].sort(orderNumeric);
  return { prompt, answer: String(answer), choices, choiceKind: 'text', colors: COLORS };
}

export const mathPack: SubjectPack = {
  meta: { id: 'math', emoji: '➕', name: 'Math', blurb: 'Count & add it up', accent: '#38bdf8' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
