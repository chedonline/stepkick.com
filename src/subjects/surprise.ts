import type { SubjectPack } from '../engine/types';
import { pick } from '../engine/rng';
import { mathPack } from './math';
import { vocabPack } from './vocab';
import { animalsPack } from './animals';
import { patternsPack } from './patterns';
import { clockPack } from './clock';
import { countingPack } from './counting';
import { moneyPack } from './money';
import { spellingPack } from './spelling';
import { fractionsPack } from './fractions';
import { comparePack } from './compare';
import { calendarPack } from './calendar';
import { skipcountPack } from './skipcount';

// "A bit of everything" — each question is pulled from a random real subject, so
// kids meet the tiles they'd normally skip. Imports the packs directly (not the
// index) to avoid a circular import.
const POOL: SubjectPack[] = [
  mathPack, vocabPack, animalsPack, patternsPack, clockPack, countingPack,
  moneyPack, spellingPack, fractionsPack, comparePack, calendarPack, skipcountPack,
];

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
