import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, randInt } from '../engine/rng';
import { orderNumeric } from './util';

// Skip counting: a run of multiples, fill the next one. 2s → then 5s / 10s / 3s.
const EASY_STEPS = [2];
const HARD_STEPS = [2, 3, 5, 10];
const COLORS = ['#34d399', '#6ee7b7', '#a7f3d0'];

function build(rng: Rng, d: number): Question {
  const step = d < 0.4 ? pick(EASY_STEPS, rng) : pick(HARD_STEPS, rng);
  const start = step * randInt(rng, 1, 4); // start on a clean multiple
  const shown = 4;
  const terms = Array.from({ length: shown }, (_, i) => start + i * step);
  const answer = start + shown * step;

  // distractors: off-by-a-step and off-by-one — the mistakes kids actually make
  const seen = new Set<number>([answer]);
  const wrong: number[] = [];
  for (const w of [answer + step, answer - step, answer + 1, answer - 1, answer + 2 * step]) {
    if (w > 0 && !seen.has(w)) { seen.add(w); wrong.push(w); }
    if (wrong.length >= 3) break;
  }
  const choices = [answer, ...wrong].map(String).sort(orderNumeric);
  return {
    prompt: { kind: 'word', text: `${terms.join(', ')}, __` },
    answer: String(answer),
    choices,
    choiceKind: 'text',
    colors: COLORS,
  };
}

export const skipcountPack: SubjectPack = {
  meta: {
    id: 'skipcount',
    emoji: '🔟',
    name: 'Skip Count',
    blurb: 'Count by 2s & 5s',
    accent: '#34d399',
    pointsMultiplier: 1.3, // genuinely harder → worth more (nudges kids toward it)
  },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
