import type { SubjectPack } from '../engine/types';
import { pick } from '../engine/rng';
import { patternsPack } from './patterns';
import { moneyPack } from './money';
import { spellingPack } from './spelling';
import { printsPack } from './prints';
import { mathAllPack, timePack } from './mix';

// "A bit of everything" — each question is pulled from a random subject on the home
// screen, so kids meet the tiles they'd normally skip. Imports the packs directly (not
// the index) to avoid a circular import.
const POOL: SubjectPack[] = [mathAllPack, timePack, moneyPack, patternsPack, spellingPack, printsPack];

export const surprisePack: SubjectPack = {
  meta: {
    id: 'surprise',
    emoji: '🎲',
    name: 'Surprise',
    blurb: 'A bit of everything!',
    accent: '#f472b6',
    pointsMultiplier: 1.2, // mixed bag → a nudge-worthy BONUS
  },
  session: (rng) => {
    const gens = POOL.map((p) => p.session(rng));
    return (index, difficulty) => pick(gens, rng)(index, difficulty);
  },
};
