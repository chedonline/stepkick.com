import type { Rng } from './rng';

export type SubjectId = 'math' | 'vocab' | 'animals' | 'patterns';

/**
 * What the player is shown. The engine never inspects a Prompt — the game UI
 * renders it, one branch per `kind`. Add subjects by adding kinds, nothing else.
 */
export type Prompt =
  | { kind: 'expr'; text: string } // "3 + 4 = ?"
  | { kind: 'count'; emoji: string; n: number } // count the objects
  | { kind: 'emoji'; emoji: string; caption?: string } // a picture to name
  | { kind: 'sequence'; emojis: string[] }; // a pattern; pick what comes next

/** One question, fully resolved by its SubjectPack. `choices` includes `answer`. */
export interface Question {
  prompt: Prompt;
  answer: string;
  choices: string[];
  /** how the 4 answer buttons render */
  choiceKind: 'text' | 'emoji';
  /** confetti / accent colors for this question */
  colors: string[];
}

export interface SubjectMeta {
  id: SubjectId;
  emoji: string;
  name: string;
  blurb: string;
  /** accent color (also the confetti default) */
  accent: string;
  /** score multiplier for this subject (default 1) */
  pointsMultiplier?: number;
}

/** A run's question generator. `index` is 0-based; `difficulty` is 0..1. */
export type QuestionGen = (index: number, difficulty: number) => Question;

/**
 * A subject is the ONLY place that knows anything domain-specific. The engine
 * just starts a session and asks it for questions — it never inspects one.
 * `session` lets a pack hold per-run state (e.g. a no-repeat bank walk).
 */
export interface SubjectPack {
  meta: SubjectMeta;
  session(rng: Rng): QuestionGen;
}

export interface Outcome {
  correct: boolean;
  answer: string;
  picked: string | null;
  scoreDelta: number;
  streak: number;
  done: boolean;
}

export interface RunResult {
  subject: SubjectId;
  score: number;
  answered: number;
  correct: number;
  accuracy: number;
  bestStreak: number;
}
