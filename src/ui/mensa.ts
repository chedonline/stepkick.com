// Shape Builder — a target shape is two primitives overlaid; tap the TWO tiles
// that make it. Spatial reasoning (a light "mensa" puzzle). Feeds stars.

import { addStars } from '../storage';
import { sfx } from '../sound';
import { shuffle } from '../engine/rng';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';

interface Shape { id: string; color: string; body: string; }
const SHAPES: Shape[] = [
  { id: 'circle', color: '#f472b6', body: '<circle cx="50" cy="50" r="33"/>' },
  { id: 'square', color: '#38bdf8', body: '<rect x="18" y="18" width="64" height="64" rx="6"/>' },
  { id: 'triangle', color: '#4ade80', body: '<polygon points="50,15 85,84 15,84"/>' },
  { id: 'diamond', color: '#fbbf24', body: '<polygon points="50,13 87,50 50,87 13,50"/>' },
  { id: 'hexagon', color: '#a78bfa', body: '<polygon points="50,14 82,32 82,68 50,86 18,68 18,32"/>' },
];
const ROUNDS = 5;

function shapeGroup(s: Shape, opacity: number): string {
  return `<g fill="${s.color}" fill-opacity="${opacity}" stroke="${s.color}" stroke-width="2">${s.body}</g>`;
}
function svg(inner: string, cls: string): string {
  return `<svg viewBox="0 0 100 100" class="${cls}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}
function setsEqual(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

export function mountMensa(app: HTMLElement, onHome: () => void): void {
  let round = 0;
  let answer = new Set<string>();
  let selected: HTMLElement[] = [];
  let lock = false;

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = onHome;
  const counter = h('span', 'mem-counter', '');
  const header = h('header', 'game-header', backBtn, h('span', 'hud-subject', '🧩 Shapes'),
    h('span', 'hud-spacer'), counter);

  const targetEl = h('div', 'mensa-target');
  const choicesEl = h('div', 'mensa-choices');
  const promptEl = h('div', 'tap-prompt', h('span', 'tap-prompt-text', 'Which TWO make this shape?'));
  const board = h('div', 'mensa-board', promptEl, targetEl, choicesEl);
  const hintEl = h('div', 'circ-hint', '');
  const nextBtn = h('button', 'btn btn-primary circ-next', 'Next →');
  const footer = h('div', 'circ-footer', hintEl, nextBtn);

  const root = h('div', 'screen mensagame', header, board, footer);
  root.style.setProperty('--accent', '#f472b6');
  app.replaceChildren(root);

  function loadRound(): void {
    const shapes = shuffle(SHAPES, Math.random).slice(0, 4);
    const pair = shapes.slice(0, 2);
    answer = new Set(pair.map((s) => s.id));
    selected = [];
    lock = false;
    counter.textContent = `${round + 1}/${ROUNDS}`;
    hintEl.textContent = '';
    nextBtn.classList.remove('show');

    targetEl.innerHTML = svg(shapeGroup(pair[0], 0.6) + shapeGroup(pair[1], 0.6), 'mensa-target-svg');

    choicesEl.replaceChildren(
      ...shuffle(shapes, Math.random).map((s) => {
        const btn = h('button', 'mensa-choice');
        btn.dataset.shape = s.id;
        btn.innerHTML = svg(shapeGroup(s, 1), 'mensa-choice-svg');
        btn.onclick = () => select(btn);
        return btn;
      }),
    );
  }

  function select(btn: HTMLElement): void {
    if (lock || btn.classList.contains('selected')) return;
    btn.classList.add('selected');
    sfx.tap();
    selected.push(btn);
    if (selected.length < 2) return;
    lock = true;
    const ids = new Set(selected.map((b) => b.dataset.shape!));
    if (setsEqual(ids, answer)) {
      sfx.correct();
      confettiFrom(app, selected[1], ['#f472b6', '#fbbf24', '#a7f3d0']);
      addStars(1);
      selected.forEach((b) => b.classList.add('correct'));
      win();
    } else {
      sfx.wrong();
      selected.forEach((b) => {
        b.classList.remove('miss');
        void b.offsetWidth;
        b.classList.add('miss');
      });
      const toClear = selected;
      selected = [];
      setTimeout(() => {
        toClear.forEach((b) => b.classList.remove('selected', 'miss'));
        lock = false;
      }, 700);
    }
  }

  function win(): void {
    flashWord(app);
    hintEl.textContent = 'You built it! ⭐';
    nextBtn.classList.add('show');
  }

  nextBtn.onclick = () => {
    sfx.tap();
    round++;
    if (round >= ROUNDS) showComplete();
    else loadRound();
  };

  function showComplete(): void {
    sfx.fanfare();
    const againBtn = h('button', 'btn btn-primary', '🧩 Play again');
    againBtn.onclick = () => { sfx.tap(); round = 0; loadRound(); };
    const homeBtn = h('button', 'btn btn-ghost', '🏠 Home');
    homeBtn.onclick = onHome;
    app.replaceChildren(
      h('div', 'screen results',
        h('div', 'results-main',
          h('div', 'badge', h('span', 'badge-emoji', '🧩'), h('span', 'badge-label', 'SHAPE WHIZ')),
          h('div', 'final-score', String(ROUNDS), h('span', 'final-caption', 'shapes built')),
        ),
        h('div', 'results-actions', againBtn, homeBtn),
      ),
    );
    const host = app;
    requestAnimationFrame(() => confettiFrom(host, host, ['#f472b6', '#fbbf24']));
  }

  loadRound();
}
