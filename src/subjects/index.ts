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
};
