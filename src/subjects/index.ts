import type { SubjectId, SubjectPack } from '../engine/types';
import { mathPack } from './math';
import { vocabPack } from './vocab';
import { animalsPack } from './animals';
import { patternsPack } from './patterns';

/** Registry — the home screen and router iterate this. Order = tile order. */
export const SUBJECTS: SubjectPack[] = [mathPack, vocabPack, animalsPack, patternsPack];

export const SUBJECT_BY_ID: Record<SubjectId, SubjectPack> = {
  math: mathPack,
  vocab: vocabPack,
  animals: animalsPack,
  patterns: patternsPack,
};
