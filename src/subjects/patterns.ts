import type { Question, SubjectPack } from '../engine/types';
import { type Rng, randInt, shuffle } from '../engine/rng';

const SHAPES = ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠', '🔺', '⭐', '❤️', '🟦'];
const COLORS = ['#22d3ee', '#2dd4bf', '#5eead4'];

/** Pick `n` distinct shapes. */
function pickShapes(rng: Rng, n: number): string[] {
  return shuffle(SHAPES, rng).slice(0, n);
}

function build(rng: Rng, difficulty: number): Question {
  const d = difficulty;
  // easy: 2 symbols, simple cycle. harder: 3 symbols and/or doubled runs.
  const symbolCount = d < 0.45 ? 2 : rng() < 0.5 ? 2 : 3;
  const doubled = d > 0.55 && rng() < 0.5;
  const symbols = pickShapes(rng, symbolCount);

  // base unit of the repeating pattern
  const base = doubled ? symbols.flatMap((s) => [s, s]) : symbols;
  const at = (i: number): string => base[i % base.length];

  const visibleLen = randInt(rng, base.length + 1, base.length + 3);
  const emojis = Array.from({ length: visibleLen }, (_, i) => at(i));
  const answer = at(visibleLen);

  // distractors: the other symbols in play first, then random shapes
  const wrong: string[] = [];
  for (const s of shuffle([...symbols, ...SHAPES], rng)) {
    if (wrong.length >= 3) break;
    if (s !== answer && !wrong.includes(s)) wrong.push(s);
  }

  // consistent order: canonical shape order (index in SHAPES)
  const choices = [answer, ...wrong].sort((a, b) => SHAPES.indexOf(a) - SHAPES.indexOf(b));

  return {
    prompt: { kind: 'sequence', emojis },
    answer,
    choices,
    choiceKind: 'emoji',
    colors: COLORS,
  };
}

export const patternsPack: SubjectPack = {
  meta: {
    id: 'patterns',
    emoji: '🔷',
    name: 'Patterns',
    blurb: 'What comes next?',
    accent: '#22d3ee',
  },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
