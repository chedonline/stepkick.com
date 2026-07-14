import type { Outcome, Question, QuestionGen, RunResult, SubjectPack } from './types';
import { mulberry32 } from './rng';

/** Kid mode: a fixed, gentle session. No timer, no sudden death. */
export const QUESTIONS_PER_RUN = 10;

const BASE_POINTS = 100;
const STREAK_CAP = 10;

/** Difficulty ramps gently across the run: 0.15 -> 0.85. */
function difficultyFor(index: number): number {
  return 0.15 + (0.7 * index) / (QUESTIONS_PER_RUN - 1);
}

export class Game {
  score = 0;
  streak = 0;
  bestStreak = 0;
  answered = 0;
  correct = 0;

  private readonly pack: SubjectPack;
  private readonly gen: QuestionGen;
  private index = 0;
  private ended = false;
  private question: Question;

  constructor(pack: SubjectPack, seed = Math.floor(Math.random() * 2 ** 31)) {
    this.pack = pack;
    this.gen = pack.session(mulberry32(seed));
    this.question = this.gen(0, difficultyFor(0));
  }

  get current(): Question {
    return this.question;
  }

  get done(): boolean {
    return this.ended;
  }

  /** picked = null means the player quit / skipped. */
  answer(picked: string | null): Outcome {
    if (this.ended) throw new Error('run is over');
    const q = this.question;
    const correct = picked === q.answer;
    const streakBefore = this.streak;
    this.answered++;

    let scoreDelta = 0;
    if (correct) {
      this.correct++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      const mult = 1 + 0.1 * Math.min(streakBefore, STREAK_CAP);
      const subjectMult = this.pack.meta.pointsMultiplier ?? 1;
      scoreDelta = Math.round(BASE_POINTS * mult * subjectMult);
    } else {
      this.streak = 0;
    }
    this.score += scoreDelta;

    if (this.answered >= QUESTIONS_PER_RUN) this.ended = true;

    return {
      correct,
      answer: q.answer,
      picked,
      scoreDelta,
      streak: this.streak,
      done: this.ended,
    };
  }

  /** Advance to the next question (call after showing feedback). */
  next(): Question {
    if (this.ended) throw new Error('run is over');
    this.index++;
    this.question = this.gen(this.index, difficultyFor(this.index));
    return this.question;
  }

  end(): void {
    this.ended = true;
  }

  results(): RunResult {
    return {
      subject: this.pack.meta.id,
      score: this.score,
      answered: this.answered,
      correct: this.correct,
      accuracy: this.answered === 0 ? 0 : Math.round((100 * this.correct) / this.answered),
      bestStreak: this.bestStreak,
    };
  }
}
