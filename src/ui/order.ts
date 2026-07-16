// Put in Order — tap the numbers from smallest to biggest. Sequencing + number
// sense. Feeds the same star / sticker system.

import { addStars } from '../storage';
import { sfx } from '../sound';
import { shuffle } from '../engine/rng';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';

const ROUND_COUNTS = [4, 5, 6, 7, 8];

export function mountOrder(app: HTMLElement, onHome: () => void): void {
  let round = 0;
  let nextIdx = 0;
  let sorted: number[] = [];

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = onHome;
  const counter = h('span', 'mem-counter', '');
  const header = h('header', 'game-header', backBtn, h('span', 'hud-subject', '🔢 Order'),
    h('span', 'hud-spacer'), counter);

  const promptEl = h('div', 'tap-prompt', h('span', 'tap-prompt-text', 'Tap smallest → biggest'));
  const gridEl = h('div', 'order-grid');
  const board = h('div', 'tap-board', promptEl, gridEl);
  const hintEl = h('div', 'circ-hint', '');
  const nextBtn = h('button', 'btn btn-primary circ-next', 'Next →');
  const footer = h('div', 'circ-footer', hintEl, nextBtn);

  const root = h('div', 'screen ordergame', header, board, footer);
  root.style.setProperty('--accent', '#38bdf8');
  app.replaceChildren(root);

  function loadRound(): void {
    const count = ROUND_COUNTS[round];
    const pool: number[] = [];
    for (let n = 1; n <= count * 3; n++) pool.push(n);
    const nums = shuffle(pool, Math.random).slice(0, count);
    sorted = [...nums].sort((a, b) => a - b);
    nextIdx = 0;
    counter.textContent = `${round + 1}/${ROUND_COUNTS.length}`;
    hintEl.textContent = '';
    nextBtn.classList.remove('show');

    gridEl.replaceChildren(
      ...shuffle(nums, Math.random).map((n) => {
        const btn = h('button', 'order-tile', String(n));
        btn.onclick = () => {
          if (btn.classList.contains('done')) return;
          if (n === sorted[nextIdx]) {
            btn.classList.add('done');
            btn.append(h('span', 'order-rank', String(nextIdx + 1)));
            sfx.correct();
            confettiFrom(app, btn, ['#38bdf8', '#fbbf24', '#a7f3d0']);
            addStars(1, 'order');
            nextIdx++;
            if (nextIdx === sorted.length) win();
          } else {
            sfx.wrong();
            btn.classList.remove('miss');
            void btn.offsetWidth;
            btn.classList.add('miss');
          }
        };
        return btn;
      }),
    );
  }

  function win(): void {
    flashWord(app);
    hintEl.textContent = 'In order! ⭐';
    nextBtn.classList.add('show');
  }

  nextBtn.onclick = () => {
    sfx.tap();
    round++;
    if (round >= ROUND_COUNTS.length) showComplete();
    else loadRound();
  };

  function showComplete(): void {
    sfx.fanfare();
    const againBtn = h('button', 'btn btn-primary', '🔢 Play again');
    againBtn.onclick = () => { sfx.tap(); round = 0; loadRound(); };
    const homeBtn = h('button', 'btn btn-ghost', '🏠 Home');
    homeBtn.onclick = onHome;
    app.replaceChildren(
      h('div', 'screen results',
        h('div', 'results-main',
          h('div', 'badge', h('span', 'badge-emoji', '🔢'), h('span', 'badge-label', 'IN ORDER!')),
          h('div', 'final-score', String(ROUND_COUNTS.length), h('span', 'final-caption', 'rounds sorted')),
        ),
        h('div', 'results-actions', againBtn, homeBtn),
      ),
    );
    const host = app;
    requestAnimationFrame(() => confettiFrom(host, host, ['#38bdf8', '#fbbf24']));
  }

  loadRound();
}
