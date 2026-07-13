import type { RunResult, SubjectId } from './engine/types';
import { unlockedFor } from './stickers';

const KEY = 'stepkick.v1';

export type ViewId = 'phone' | 'ipad-p' | 'ipad-l';

interface Save {
  v: 1;
  bests: Partial<Record<SubjectId, number>>;
  games: number;
  /** forever-climbing star total — one star per correct answer, ever */
  stars: number;
  settings: { sound: boolean; view: ViewId };
}

const DEFAULTS: Save = {
  v: 1,
  bests: {},
  games: 0,
  stars: 0,
  settings: { sound: true, view: 'phone' },
};

let cache: Save | null = null;

function load(): Save {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    cache = {
      ...DEFAULTS,
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    cache = structuredClone(DEFAULTS);
  }
  return cache!;
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(load()));
  } catch {
    /* private mode / quota — play on without saving */
  }
}

export function recordRun(r: RunResult): { newBest: boolean } {
  const s = load();
  if (r.answered === 0) return { newBest: false };
  s.games++;
  const newBest = r.score > (s.bests[r.subject] ?? 0);
  if (newBest) s.bests[r.subject] = r.score;
  persist();
  return { newBest };
}

export function best(subject: SubjectId): number {
  return load().bests[subject] ?? 0;
}

export function totalStars(): number {
  return load().stars;
}

export function stickersUnlocked(): number {
  return unlockedFor(load().stars);
}

/**
 * Add `n` stars (correct answers). Returns the sticker indices newly unlocked
 * by crossing thresholds, so the results screen can celebrate them.
 */
export function addStars(n: number): { stars: number; newStickers: number[] } {
  const s = load();
  const before = unlockedFor(s.stars);
  s.stars += n;
  const after = unlockedFor(s.stars);
  persist();
  const newStickers: number[] = [];
  for (let i = before; i < after; i++) newStickers.push(i);
  return { stars: s.stars, newStickers };
}

export function gamesPlayed(): number {
  return load().games;
}

export function soundEnabled(): boolean {
  return load().settings.sound;
}

export function setSoundEnabled(on: boolean): void {
  load().settings.sound = on;
  persist();
}

export function view(): ViewId {
  return load().settings.view;
}

export function setView(v: ViewId): void {
  load().settings.view = v;
  persist();
}
