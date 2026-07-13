import type { Question, SubjectPack } from '../engine/types';
import { type Rng, randInt } from '../engine/rng';

const COLORS = ['#2dd4bf', '#5eead4', '#99f6e4'];

type QType = 'add' | 'sub' | 'mult' | 'fracOf' | 'fracAdd' | 'dec';

/** Evaluate a choice string that may be a number, decimal, or "n/d" fraction. */
const val = (s: string): number =>
  s.includes('/') ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : Number(s);

/** Weighted type pick — shifts toward multiplication / fractions / decimals as difficulty rises. */
function chooseType(rng: Rng, d: number): QType {
  const weights: [QType, number][] = [
    ['add', Math.max(0.2, 1.2 - d * 0.7)],
    ['sub', Math.max(0.2, 1.0 - d * 0.5)],
    ['mult', 0.8 + d * 1.4],
    ['fracOf', 0.3 + d * 0.6],
    ['dec', 0.2 + d * 0.8],
    ['fracAdd', 0.1 + d * 0.7],
  ];
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [t, w] of weights) {
    roll -= w;
    if (roll <= 0) return t;
  }
  return 'add';
}

/** 3 near-miss integers around `answer`, all >= 0 and distinct. */
function intDistractors(answer: number, rng: Rng, spread: number): string[] {
  const seen = new Set<number>([answer]);
  const out: number[] = [];
  let guard = 0;
  while (out.length < 3 && guard++ < 60) {
    const n = answer + randInt(rng, 1, spread) * (rng() < 0.5 ? -1 : 1);
    if (n < 0 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  let n = answer + 1;
  while (out.length < 3) {
    if (!seen.has(n)) { seen.add(n); out.push(n); }
    n++;
  }
  return out.map(String);
}

/** 3 near-miss one-decimal values around `answer`, all >= 0 and distinct. */
function decDistractors(answer: number, rng: Rng): string[] {
  const seen = new Set<string>([answer.toFixed(1)]);
  const out: string[] = [];
  let guard = 0;
  while (out.length < 3 && guard++ < 60) {
    const n = answer + randInt(rng, 1, 9) * 0.1 * (rng() < 0.5 ? -1 : 1);
    const s = (Math.round(n * 10) / 10).toFixed(1);
    if (n < 0 || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  let k = 1;
  while (out.length < 3) {
    const s = (answer + k * 0.1).toFixed(1);
    if (!seen.has(s)) { seen.add(s); out.push(s); }
    k++;
  }
  return out;
}

function build(rng: Rng, d: number): Question {
  const type = chooseType(rng, d);
  let text: string;
  let answer: string;
  let distractors: string[];

  if (type === 'mult') {
    // 1–12 times tables; smaller factors early, fuller range later
    const cap = Math.round(5 + d * 7); // 5..12
    const a = randInt(rng, 1, cap);
    const b = randInt(rng, 1, 12);
    const n = a * b;
    text = `${a} × ${b} = ?`;
    answer = String(n);
    distractors = intDistractors(n, rng, Math.max(2, Math.round(n * 0.15)));
  } else if (type === 'add') {
    const cap = Math.round(10 + d * 80);
    const n = randInt(rng, 2, cap) + randInt(rng, 2, cap);
    const a = randInt(rng, 1, n - 1);
    text = `${a} + ${n - a} = ?`;
    answer = String(n);
    distractors = intDistractors(n, rng, Math.max(2, Math.round(n * 0.2)));
  } else if (type === 'sub') {
    const cap = Math.round(12 + d * 80);
    const a = randInt(rng, 5, cap);
    const b = randInt(rng, 1, a);
    text = `${a} − ${b} = ?`;
    answer = String(a - b);
    distractors = intDistractors(a - b, rng, Math.max(2, Math.round(a * 0.15)));
  } else if (type === 'fracOf') {
    // "1/2 of 8 = ?"  -> integer answer
    const denom = [2, 3, 4, 5, 10][randInt(rng, 0, 4)];
    const num = randInt(rng, 1, denom - 1);
    const whole = denom * randInt(rng, 2, Math.round(4 + d * 8)); // divisible
    const n = (whole * num) / denom;
    text = `${num}/${denom} of ${whole} = ?`;
    answer = String(n);
    distractors = intDistractors(n, rng, Math.max(2, Math.round(n * 0.3)));
  } else if (type === 'fracAdd') {
    // same-denominator add: "1/4 + 2/4 = ?"  -> "n/d"
    const denom = [4, 5, 6, 8, 10][randInt(rng, 0, 4)];
    const n1 = randInt(rng, 1, denom - 2);
    const n2 = randInt(rng, 1, denom - n1);
    const sum = n1 + n2;
    text = `${n1}/${denom} + ${n2}/${denom} = ?`;
    answer = `${sum}/${denom}`;
    const others = new Set<string>([answer]);
    const pool: string[] = [];
    for (let k = 1; k <= denom; k++) {
      const s = `${k}/${denom}`;
      if (!others.has(s)) pool.push(s);
    }
    // shuffle-lite pick 3 nearest-ish
    distractors = pool.sort((a, b) => Math.abs(val(a) - val(answer)) - Math.abs(val(b) - val(answer))).slice(0, 3);
  } else {
    // decimals: one-place add or subtract, clean and small
    const a = randInt(rng, 3, Math.round(20 + d * 60)) / 10;
    const b = randInt(rng, 2, Math.round(15 + d * 40)) / 10;
    if (rng() < 0.5) {
      const n = Math.round((a + b) * 10) / 10;
      text = `${a.toFixed(1)} + ${b.toFixed(1)} = ?`;
      answer = n.toFixed(1);
      distractors = decDistractors(n, rng);
    } else {
      const hi = Math.max(a, b), lo = Math.min(a, b);
      const n = Math.round((hi - lo) * 10) / 10;
      text = `${hi.toFixed(1)} − ${lo.toFixed(1)} = ?`;
      answer = n.toFixed(1);
      distractors = decDistractors(n, rng);
    }
  }

  const choices = [answer, ...distractors].sort((a, b) => val(a) - val(b));
  return { prompt: { kind: 'expr', text }, answer, choices, choiceKind: 'text', colors: COLORS };
}

export const mathPack: SubjectPack = {
  meta: { id: 'math', emoji: '➕', name: 'Math', blurb: '×, fractions & more', accent: '#2dd4bf' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
