import type { RunResult, SubjectId } from './engine/types';
import { GROUP_OF, SET_COUNT, setBaseIndex, totalUnlocked, unlockedInSet } from './stickers';

const KEY = 'stepkick.v1';

export type ViewId = 'phone' | 'ipad-p' | 'ipad-l';

interface Save {
  v: 1;
  bests: Partial<Record<SubjectId, number>>;
  games: number;
  /** forever-climbing star total — one star per correct answer, ever (display) */
  stars: number;
  /** per-set stars — a sticker set unlocks from the games mapped to it (gating) */
  groupStars: number[];
  settings: { sound: boolean; view: ViewId };
}

const DEFAULTS: Save = {
  v: 1,
  bests: {},
  games: 0,
  stars: 0,
  groupStars: Array.from({ length: SET_COUNT }, () => 0),
  settings: { sound: true, view: 'phone' },
};

let cache: Save | null = null;

function load(): Save {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const merged: Save = {
      ...DEFAULTS,
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings ?? {}) },
    };
    if (!Array.isArray(merged.groupStars) || merged.groupStars.length !== SET_COUNT) {
      merged.groupStars = Array.from({ length: SET_COUNT }, () => 0);
    }
    cache = merged;
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

export function groupStars(): number[] {
  return load().groupStars;
}

export function stickersUnlocked(): number {
  return totalUnlocked(load().groupStars);
}

/**
 * Add `n` stars earned in `source` (a subject or mode id). Stars go to that
 * source's sticker set (gating). Returns the GLOBAL sticker indices newly
 * unlocked in that set, so the results screen can celebrate them.
 */
export function addStars(n: number, source: string): { stars: number; newStickers: number[] } {
  const s = load();
  const g = GROUP_OF[source] ?? 0;
  const before = unlockedInSet(g, s.groupStars);
  s.stars += n;
  s.groupStars[g] = (s.groupStars[g] ?? 0) + n;
  const after = unlockedInSet(g, s.groupStars);
  persist();
  const base = setBaseIndex(g);
  const newStickers: number[] = [];
  for (let i = before; i < after; i++) newStickers.push(base + i);
  return { stars: s.stars, newStickers };
}

export function gamesPlayed(): number {
  return load().games;
}

/** A portable backup code (base64 of the save) — parent saves it off-device. */
export function exportSave(): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(load()))));
}

/** Restore from a backup code. Returns false if the code is invalid. */
export function importSave(code: string): boolean {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (typeof parsed?.stars !== 'number') return false;
    localStorage.setItem(KEY, JSON.stringify({ ...DEFAULTS, ...parsed }));
    cache = null;
    return true;
  } catch {
    return false;
  }
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
