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

/** Registry — the home screen and router iterate this. Order = tile order. */
export const SUBJECTS: SubjectPack[] = [
  mathPack,
  vocabPack,
  animalsPack,
  patternsPack,
  clockPack,
  countingPack,
  moneyPack,
  spellingPack,
  fractionsPack,
  comparePack,
  calendarPack,
  skipcountPack,
  surprisePack,
  printsPack,
];

export const SUBJECT_BY_ID: Record<SubjectId, SubjectPack> = {
  math: mathPack,
  vocab: vocabPack,
  animals: animalsPack,
  patterns: patternsPack,
  clock: clockPack,
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
