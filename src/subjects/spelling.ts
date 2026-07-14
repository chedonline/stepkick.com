import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, randInt } from '../engine/rng';
import { orderAlpha } from './util';

const COLORS = ['#2dd4bf', '#5eead4', '#99f6e4'];

// Picture → pick the correctly-spelled word. Distractors are plausible
// misspellings of the SAME word (single edits), so it's fair.
const BANK: { emoji: string; word: string }[] = [
  { emoji: '🐘', word: 'Elephant' },
  { emoji: '🦒', word: 'Giraffe' },
  { emoji: '🦋', word: 'Butterfly' },
  { emoji: '☂️', word: 'Umbrella' },
  { emoji: '🦕', word: 'Dinosaur' },
  { emoji: '🌈', word: 'Rainbow' },
  { emoji: '🐙', word: 'Octopus' },
  { emoji: '🎈', word: 'Balloon' },
  { emoji: '🐧', word: 'Penguin' },
  { emoji: '🚲', word: 'Bicycle' },
  { emoji: '🍓', word: 'Strawberry' },
  { emoji: '🍅', word: 'Tomato' },
  { emoji: '🦘', word: 'Kangaroo' },
  { emoji: '🐊', word: 'Alligator' },
  { emoji: '🍍', word: 'Pineapple' },
  { emoji: '⛰️', word: 'Mountain' },
  { emoji: '🏰', word: 'Castle' },
  { emoji: '🚀', word: 'Rocket' },
  { emoji: '🎸', word: 'Guitar' },
  { emoji: '🍌', word: 'Banana' },
];

const PHONETIC: [RegExp, string][] = [
  [/ph/, 'f'],
  [/f/, 'ph'],
  [/c/, 'k'],
  [/ee/, 'ea'],
  [/ou/, 'oo'],
  [/ai/, 'ay'],
  [/y$/, 'ie'],
];

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** One plausible misspelling (single edit), or null if it didn't change. */
function misspell(word: string, rng: Rng): string | null {
  const w = word.toLowerCase();
  const strat = randInt(rng, 0, w.length >= 4 ? 3 : 1);
  let m = w;
  if (strat === 0) {
    const i = randInt(rng, 1, w.length - 1); // drop a letter
    m = w.slice(0, i) + w.slice(i + 1);
  } else if (strat === 1) {
    const i = randInt(rng, 1, w.length - 1); // double a letter
    m = w.slice(0, i) + w[i] + w.slice(i);
  } else if (strat === 2) {
    const i = randInt(rng, 1, w.length - 2); // swap two adjacent
    m = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
  } else {
    const opts = PHONETIC.filter(([re]) => re.test(w));
    if (opts.length === 0) return null;
    const [re, rep] = pick(opts, rng);
    m = w.replace(re, rep);
  }
  return m === w ? null : cap(m);
}

function misspellings(word: string, rng: Rng): string[] {
  const out: string[] = [];
  const seen = new Set([word]);
  let g = 0;
  while (out.length < 3 && g++ < 40) {
    const m = misspell(word, rng);
    if (m && !seen.has(m)) { seen.add(m); out.push(m); }
  }
  // fallback: force distinct single-letter drops
  for (let i = 1; i < word.length && out.length < 3; i++) {
    const m = cap((word.toLowerCase().slice(0, i) + word.toLowerCase().slice(i + 1)));
    if (!seen.has(m)) { seen.add(m); out.push(m); }
  }
  return out;
}

function build(rng: Rng, d: number): Question {
  const pool = d < 0.4 ? BANK.filter((b) => b.word.length <= 7) : BANK;
  const item = pick(pool, rng);
  const choices = [item.word, ...misspellings(item.word, rng)].sort(orderAlpha);
  return {
    prompt: { kind: 'emoji', emoji: item.emoji },
    answer: item.word,
    choices,
    choiceKind: 'text',
    colors: COLORS,
  };
}

export const spellingPack: SubjectPack = {
  meta: { id: 'spelling', emoji: '📝', name: 'Spelling', blurb: 'Spell the picture', accent: '#2dd4bf' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
