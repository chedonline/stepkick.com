import type { SubjectId, SubjectPack } from '../engine/types';
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
import { surprisePack } from './surprise';
import { printsPack } from './prints';
import { mathAllPack, timePack } from './mix';

/**
 * Registry — the home screen and router iterate this. Order = tile order.
 * Clean-up 2026-11-21: Fractions + Skip Count fold into Math, Calendar into Clock (now
 * "Time"); Words, Animals, Counting and Compare are off the home screen (too easy at 8;
 * French words live in Mots at /french). Their packs stay for SUBJECT_BY_ID and the mixes.
 */
export const SUBJECTS: SubjectPack[] = [
  mathAllPack,
  timePack,
  moneyPack,
  patternsPack,
  spellingPack,
  printsPack,
  surprisePack,
];

export const SUBJECT_BY_ID: Record<SubjectId, SubjectPack> = {
  math: mathAllPack,
  vocab: vocabPack,
  animals: animalsPack,
  patterns: patternsPack,
  clock: timePack,
  counting: countingPack,
  money: moneyPack,
  spelling: spellingPack,
  fractions: fractionsPack,
  compare: comparePack,
  calendar: calendarPack,
  skipcount: skipcountPack,
  surprise: surprisePack,
  prints: printsPack,
};

// keep the originals referenced (they're the building blocks of the mixes above)
void mathPack; void clockPack;
