// Groups — find the tiles that belong together. Math flavour: every tile is a number or a
// sum (6 + 6, 3 × 4, 15 − 3, 12), and a group is the tiles that are EQUAL. Tap tiles to pick
// a group; when you've picked enough it checks itself.
// Levels grow the group: pairs on a 2×3 grid → triplets on 3×3 → fours on 4×4, and the sums
// grow from + − to × and ÷. Each group found = a star (Farm sticker page).

import { addStars } from '../storage';
import { sfx } from '../sound';
import { shuffle } from '../engine/rng';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';

type Op = 'num' | 'add' | 'sub' | 'mul' | 'div';
interface Level { size: number; groups: number; cols: number; lo: number; hi: number; ops: Op[] }

const LEVELS: Level[] = [
  { size: 2, groups: 3, cols: 3, lo: 5, hi: 12, ops: ['num', 'add', 'sub'] },
  { size: 2, groups: 3, cols: 3, lo: 8, hi: 20, ops: ['add', 'sub', 'num'] },
  { size: 3, groups: 3, cols: 3, lo: 6, hi: 24, ops: ['num', 'add', 'sub', 'mul'] },
  { size: 3, groups: 3, cols: 3, lo: 10, hi: 36, ops: ['add', 'sub', 'mul', 'num'] },
  { size: 4, groups: 4, cols: 4, lo: 6, hi: 30, ops: ['num', 'add', 'sub', 'mul', 'div'] },
  { size: 4, groups: 4, cols: 4, lo: 12, hi: 48, ops: ['add', 'sub', 'mul', 'div', 'num'] },
];
const GROUP_COLORS = ['#2dd4bf', '#fbbf24', '#f472b6', '#a78bfa'];
const GAP = 8;
const ri = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));

/** One way to write `v` with operation `op`, or null if that op can't make it nicely. */
function express(v: number, op: Op): string | null {
  if (op === 'num') return String(v);
  if (op === 'add') { const a = ri(1, v - 1); return `${a} + ${v - a}`; }
  if (op === 'sub') { const b = ri(1, Math.min(12, v + 6)); return `${v + b} − ${b}`; }
  if (op === 'mul') {
    const f = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter((a) => v % a === 0 && v / a >= 2 && v / a <= 12);
    if (!f.length) return null;
    const a = f[ri(0, f.length - 1)];
    return Math.random() < 0.5 ? `${a} × ${v / a}` : `${v / a} × ${a}`;
  }
  // div: times-table facts only (answer ≤ 12, divide by 2–5), so it's 36 ÷ 4, never 87 ÷ 3
  if (v > 12) return null;
  const ds = [2, 3, 4, 5];
  const d = ds[ri(0, ds.length - 1)];
  return `${v * d} ÷ ${d}`;
}

/** `size` different-looking tiles that all equal `v` (at most one plain number). */
function tilesFor(v: number, size: number, ops: Op[]): string[] | null {
  const out = new Set<string>();
  let guard = 0;
  while (out.size < size && guard++ < 80) {
    const op = guard <= ops.length ? ops[guard - 1] : ops[ri(0, ops.length - 1)];
    if (op === 'num' && out.has(String(v))) continue;
    const s = express(v, op);
    if (s) out.add(s);
  }
  return out.size === size ? [...out] : null;
}

/** Pick `groups` different values (close together, so it takes thinking) and their tiles. */
function makeBoard(L: Level): { text: string; group: number; value: number }[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const values = new Set<number>();
    while (values.size < L.groups) values.add(ri(L.lo, L.hi));
    const vs = [...values];
    const sets = vs.map((v) => tilesFor(v, L.size, L.ops));
    if (sets.some((s) => !s)) continue;
    const all = sets.flat() as string[];
    if (new Set(all).size !== all.length) continue; // no tile text twice on the board
    return shuffle(vs.flatMap((v, g) => (sets[g] as string[]).map((text) => ({ text, group: g, value: v }))), Math.random);
  }
  throw new Error('could not build a Groups board');
}

export function mountGroups(app: HTMLElement, onHome: () => void): void {
  let index = 0;
  let picked: HTMLElement[] = [];
  let found = 0;
  let misses = 0;
  let lock = false;

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  const counter = h('span', 'mem-counter', '');
  const missEl = h('span', 'hud-score', '');
  const header = h('header', 'game-header', backBtn, h('span', 'hud-subject', '🧩 Groups'), h('span', 'hud-spacer'), counter, missEl);
  const ask = h('div', 'grp-ask', '');
  const gridEl = h('div', 'grp-grid');
  const hintEl = h('div', 'circ-hint');
  const nextBtn = h('button', 'btn btn-primary circ-next', 'Next →');
  const footer = h('div', 'circ-footer', hintEl, nextBtn);
  const root = h('div', 'screen groupsgame', header, ask, gridEl, footer);
  root.style.setProperty('--accent', '#fbbf24');
  app.replaceChildren(root);

  // square tiles, as big as fit in both directions, `cols` across
  function layoutGrid(): void {
    const n = gridEl.childElementCount, cols = LEVELS[index]?.cols ?? 3;
    const W = gridEl.clientWidth, H = gridEl.clientHeight;
    if (!n || W <= 0 || H <= 0) return;
    const rows = Math.ceil(n / cols);
    const size = Math.floor(Math.min((W - GAP * (cols - 1)) / cols, (H - GAP * (rows - 1)) / rows, 170));
    gridEl.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    gridEl.style.gridAutoRows = `${size}px`;
    gridEl.style.setProperty('--card', `${size}px`);
  }
  const ro = new ResizeObserver(() => layoutGrid());
  ro.observe(gridEl);
  backBtn.onclick = () => { ro.disconnect(); onHome(); };

  function loadLevel(): void {
    const L = LEVELS[index];
    picked = []; found = 0; misses = 0; lock = false;
    counter.textContent = `${index + 1}/${LEVELS.length}`;
    missEl.textContent = '';
    hintEl.textContent = '';
    nextBtn.classList.remove('show');
    const word = L.size === 2 ? 'pairs' : L.size === 3 ? 'groups of 3' : 'groups of 4';
    ask.textContent = `Find ${L.groups} ${word} that are equal`;
    gridEl.replaceChildren(...makeBoard(L).map((t) => {
      const tile = h('button', 'grp-tile', h('span', 'grp-text', t.text));
      tile.dataset.group = String(t.group);
      tile.dataset.value = String(t.value);
      tile.onclick = () => tap(tile);
      return tile;
    }));
    layoutGrid();
  }

  function tap(tile: HTMLElement): void {
    if (lock || tile.classList.contains('done')) return;
    sfx.tap();
    if (tile.classList.contains('picked')) { tile.classList.remove('picked'); picked = picked.filter((t) => t !== tile); return; }
    tile.classList.add('picked');
    picked.push(tile);
    if (picked.length < LEVELS[index].size) return;
    const sel = picked;
    picked = [];
    lock = true;
    const same = sel.every((t) => t.dataset.group === sel[0].dataset.group);
    if (same) {
      const color = GROUP_COLORS[found % GROUP_COLORS.length];
      setTimeout(() => {
        for (const t of sel) {
          t.classList.remove('picked'); t.classList.add('done');
          t.style.setProperty('--grp', color);
          t.append(h('span', 'grp-eq', `= ${t.dataset.value}`));
        }
        sfx.correct();
        confettiFrom(app, sel[sel.length - 1], [color, '#ffffff']);
        addStars(1, 'groups');
        found++;
        lock = false;
        if (found === LEVELS[index].groups) win();
      }, 220);
    } else {
      sfx.wrong();
      misses++;
      missEl.textContent = `${misses} ✗`;
      hintEl.textContent = 'Not equal. Work each one out!';
      for (const t of sel) t.classList.add('miss');
      setTimeout(() => {
        for (const t of sel) t.classList.remove('picked', 'miss');
        lock = false;
      }, 700);
    }
  }

  function win(): void {
    flashWord(app);
    hintEl.textContent = misses ? `All found! ${misses} miss${misses > 1 ? 'es' : ''}. ⭐` : 'All found, no misses! ⭐⭐';
    nextBtn.classList.add('show');
  }

  nextBtn.onclick = () => {
    sfx.tap();
    index++;
    if (index >= LEVELS.length) showComplete();
    else loadLevel();
  };

  function showComplete(): void {
    ro.disconnect();
    sfx.fanfare();
    const againBtn = h('button', 'btn btn-primary', '🧩 Play again');
    againBtn.onclick = () => { sfx.tap(); index = 0; ro.observe(gridEl); app.replaceChildren(root); loadLevel(); };
    const homeBtn = h('button', 'btn btn-ghost', '🏠 Home');
    homeBtn.onclick = onHome;
    app.replaceChildren(h('div', 'screen results',
      h('div', 'results-main',
        h('div', 'badge', h('span', 'badge-emoji', '🧩'), h('span', 'badge-label', 'GROUP GENIUS')),
        h('div', 'final-score', String(LEVELS.length), h('span', 'final-caption', 'levels cleared'))),
      h('div', 'results-actions', againBtn, homeBtn)));
    requestAnimationFrame(() => confettiFrom(app, app, ['#fbbf24', '#2dd4bf']));
  }

  loadLevel();
}
