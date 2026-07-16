import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, shuffle } from '../engine/rng';

// "More or fewer" — four groups of the same item, pick the biggest / smallest.
const EMOJI = ['🍎', '⭐', '🎈', '🍪', '🐤', '🌸', '🍓', '🐞', '🧁', '🐠'];
const COLORS = ['#f59e0b', '#fbbf24', '#fcd34d'];

/** `k` distinct counts in [1, hi]. */
function distinctCounts(rng: Rng, k: number, hi: number): number[] {
  const pool: number[] = [];
  for (let n = 1; n <= hi; n++) pool.push(n);
  return shuffle(pool, rng).slice(0, k);
}

function build(rng: Rng, d: number): Question {
  const emoji = pick(EMOJI, rng);
  const askMost = rng() < 0.5;
  // easy: small counts (wide gaps read clearly); harder: up to 7 (closer together)
  const hi = Math.min(7, 4 + Math.round(d * 3));
  const counts = distinctCounts(rng, 4, hi);
  const target = askMost ? Math.max(...counts) : Math.min(...counts);
  const answer = emoji.repeat(target);
  // sort by count so the 2×2 grid reads small→large consistently
  const choices = counts.slice().sort((a, b) => a - b).map((n) => emoji.repeat(n));
  return {
    prompt: { kind: 'word', text: askMost ? 'Which has the MOST?' : 'Which has the FEWEST?' },
    answer,
    choices,
    choiceKind: 'text',
    colors: COLORS,
  };
}

export const comparePack: SubjectPack = {
  meta: { id: 'compare', emoji: '⚖️', name: 'Compare', blurb: 'Which has more?', accent: '#f59e0b' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
