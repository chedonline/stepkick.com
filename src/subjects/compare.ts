import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, randInt, shuffle } from '../engine/rng';

// "More or fewer" — four piles of the same item in DIFFERENT arrangements
// (e.g. 3×5 vs 2×6), so you can't judge by the bounding box; tap the biggest /
// smallest. Each choice is a "pile" formation (emoji|count|cols).
const EMOJI = ['🍎', '⭐', '🎈', '🍪', '🐤', '🌸', '🍓', '🐞', '🧁', '🐠', '🍊', '🐥'];
const COLORS = ['#f59e0b', '#fbbf24', '#fcd34d'];

/** `k` distinct counts in [lo, hi]. */
function distinctCounts(rng: Rng, k: number, lo: number, hi: number): number[] {
  const pool: number[] = [];
  for (let n = lo; n <= hi; n++) pool.push(n);
  return shuffle(pool, rng).slice(0, k);
}

function build(rng: Rng, d: number): Question {
  const emoji = pick(EMOJI, rng);
  const askMost = rng() < 0.5;
  // easy: small counts, well spread. harder: bigger and closer together.
  const hi = Math.min(12, 6 + Math.round(d * 6));
  const lo = Math.max(2, Math.round(hi * 0.35));
  const counts = distinctCounts(rng, 4, lo, hi);
  const targetCount = askMost ? Math.max(...counts) : Math.min(...counts);

  // each pile gets its own column count → same total looks different on screen
  const piles = counts.map((n) => ({ n, enc: `${emoji}|${n}|${randInt(rng, 2, 4)}` }));
  const answer = piles.find((p) => p.n === targetCount)!.enc;
  // shuffle so the winner isn't in a fixed slot (piles are visual, no need to sort)
  const choices = shuffle(piles.map((p) => p.enc), rng);

  return {
    prompt: { kind: 'word', text: askMost ? 'Which pile has the MOST?' : 'Which pile has the FEWEST?' },
    answer,
    choices,
    choiceKind: 'pile',
    colors: COLORS,
  };
}

export const comparePack: SubjectPack = {
  meta: { id: 'compare', emoji: '⚖️', name: 'Compare', blurb: 'Which pile has more?', accent: '#f59e0b' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
