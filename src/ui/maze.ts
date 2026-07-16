// Maze — steer to the star with the arrow pad. Spatial reasoning + planning.
// Mazes are generated and BFS-checked so there's always a path. Feeds stars.

import { addStars } from '../storage';
import { sfx } from '../sound';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';

const LEVELS = [
  { size: 5, density: 0.22 },
  { size: 6, density: 0.25 },
  { size: 7, density: 0.28 },
];

function solvable(g: boolean[][], size: number): boolean {
  const seen = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const stack: [number, number][] = [[0, 0]];
  seen[0][0] = true;
  while (stack.length) {
    const [r, c] = stack.pop()!;
    if (r === size - 1 && c === size - 1) return true;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !seen[nr][nc] && !g[nr][nc]) {
        seen[nr][nc] = true;
        stack.push([nr, nc]);
      }
    }
  }
  return false;
}

function genMaze(size: number, density: number): boolean[][] {
  for (let attempt = 0; attempt < 300; attempt++) {
    const g = Array.from({ length: size }, () => Array.from({ length: size }, () => Math.random() < density));
    g[0][0] = false;
    g[size - 1][size - 1] = false;
    if (solvable(g, size)) return g;
  }
  return Array.from({ length: size }, () => Array<boolean>(size).fill(false));
}

export function mountMaze(app: HTMLElement, onHome: () => void): void {
  let level = 0;
  let grid: boolean[][] = [];
  let size = 5;
  let pr = 0;
  let pc = 0;
  let done = false;
  const cellEls: HTMLElement[][] = [];

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = onHome;
  const counter = h('span', 'mem-counter', '');
  const header = h('header', 'game-header', backBtn, h('span', 'hud-subject', '🧭 Maze'),
    h('span', 'hud-spacer'), counter);

  const gridEl = h('div', 'maze-grid');
  const up = h('button', 'maze-btn maze-up', '▲');
  const down = h('button', 'maze-btn maze-down', '▼');
  const left = h('button', 'maze-btn maze-left', '◀');
  const right = h('button', 'maze-btn maze-right', '▶');
  const pad = h('div', 'maze-pad', up, left, right, down);
  const board = h('div', 'maze-board', gridEl, pad);
  const hintEl = h('div', 'circ-hint', '');
  const nextBtn = h('button', 'btn btn-primary circ-next', 'Next →');
  const footer = h('div', 'circ-footer', hintEl, nextBtn);

  const root = h('div', 'screen mazegame', header, board, footer);
  root.style.setProperty('--accent', '#facc15');
  app.replaceChildren(root);

  up.onclick = () => move(-1, 0);
  down.onclick = () => move(1, 0);
  left.onclick = () => move(0, -1);
  right.onclick = () => move(0, 1);
  window.addEventListener('keydown', onKey);
  function onKey(e: KeyboardEvent): void {
    if (!document.body.contains(gridEl)) { window.removeEventListener('keydown', onKey); return; }
    if (e.key === 'ArrowUp') move(-1, 0);
    else if (e.key === 'ArrowDown') move(1, 0);
    else if (e.key === 'ArrowLeft') move(0, -1);
    else if (e.key === 'ArrowRight') move(0, 1);
  }

  function paint(): void {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const el = cellEls[r][c];
        el.className = 'maze-cell' + (grid[r][c] ? ' wall' : '')
          + (r === pr && c === pc ? ' player' : '')
          + (r === size - 1 && c === size - 1 ? ' goal' : '');
        el.textContent = r === pr && c === pc ? '🐭' : (r === size - 1 && c === size - 1 ? '⭐' : '');
      }
    }
  }

  function move(dr: number, dc: number): void {
    if (done) return;
    const nr = pr + dr;
    const nc = pc + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size || grid[nr][nc]) return;
    pr = nr;
    pc = nc;
    sfx.tap();
    paint();
    if (pr === size - 1 && pc === size - 1) win();
  }

  function win(): void {
    done = true;
    sfx.correct();
    flashWord(app);
    const goalEl = cellEls[size - 1][size - 1];
    confettiFrom(app, goalEl, ['#facc15', '#fbbf24', '#a7f3d0']);
    addStars(2);
    hintEl.textContent = 'You made it! ⭐';
    nextBtn.classList.add('show');
  }

  function loadLevel(): void {
    size = LEVELS[level].size;
    grid = genMaze(size, LEVELS[level].density);
    pr = 0;
    pc = 0;
    done = false;
    counter.textContent = `${level + 1}/${LEVELS.length}`;
    hintEl.textContent = '';
    nextBtn.classList.remove('show');

    cellEls.length = 0;
    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    const cells: HTMLElement[] = [];
    for (let r = 0; r < size; r++) {
      cellEls.push([]);
      for (let c = 0; c < size; c++) {
        const el = h('div', 'maze-cell');
        cellEls[r].push(el);
        cells.push(el);
      }
    }
    gridEl.replaceChildren(...cells);
    paint();
  }

  nextBtn.onclick = () => {
    sfx.tap();
    level++;
    if (level >= LEVELS.length) showComplete();
    else loadLevel();
  };

  function showComplete(): void {
    window.removeEventListener('keydown', onKey);
    sfx.fanfare();
    const againBtn = h('button', 'btn btn-primary', '🧭 Play again');
    againBtn.onclick = () => { sfx.tap(); level = 0; loadLevel(); };
    const homeBtn = h('button', 'btn btn-ghost', '🏠 Home');
    homeBtn.onclick = onHome;
    app.replaceChildren(
      h('div', 'screen results',
        h('div', 'results-main',
          h('div', 'badge', h('span', 'badge-emoji', '🧭'), h('span', 'badge-label', 'PATHFINDER')),
          h('div', 'final-score', String(LEVELS.length), h('span', 'final-caption', 'mazes solved')),
        ),
        h('div', 'results-actions', againBtn, homeBtn),
      ),
    );
    const host = app;
    requestAnimationFrame(() => confettiFrom(host, host, ['#facc15', '#fbbf24']));
  }

  loadLevel();
}
