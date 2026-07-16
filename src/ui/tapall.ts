// Tap-the-target — "tap all the 🍎" among a mixed grid. Attention + scanning.
// Feeds the same star / sticker system.

import { addStars } from '../storage';
import { sfx } from '../sound';
import { pick, randInt, shuffle } from '../engine/rng';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';

const POOL = ['🍎', '🐶', '⭐', '🚗', '🌸', '🐟', '🎈', '🍕', '🦋', '🐱', '🌙', '🍓', '🐸', '🎃', '🐝', '🦄', '🍩', '🐧'];
const ROUNDS = 5;
const TOTAL = 14;

export function mountTapAll(app: HTMLElement, onHome: () => void): void {
  let round = 0;
  let remaining = 0;

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = onHome;
  const counter = h('span', 'mem-counter', '');
  const foundEl = h('span', 'hud-score', '');
  const header = h('header', 'game-header', backBtn, h('span', 'hud-subject', '🎯 Find'),
    h('span', 'hud-spacer'), counter, foundEl);

  const promptEl = h('div', 'tap-prompt');
  const gridEl = h('div', 'tap-grid');
  const board = h('div', 'tap-board', promptEl, gridEl);
  const hintEl = h('div', 'circ-hint', '');
  const nextBtn = h('button', 'btn btn-primary circ-next', 'Next →');
  const footer = h('div', 'circ-footer', hintEl, nextBtn);

  const root = h('div', 'screen tapgame', header, board, footer);
  root.style.setProperty('--accent', '#fb923c');
  app.replaceChildren(root);

  function loadRound(): void {
    const target = pick(POOL, Math.random);
    const k = randInt(Math.random, 3, 6);
    const distractors = shuffle(POOL.filter((e) => e !== target), Math.random).slice(0, TOTAL - k);
    const cells = shuffle([...Array(k).fill(target), ...distractors], Math.random);
    remaining = k;

    counter.textContent = `${round + 1}/${ROUNDS}`;
    foundEl.textContent = `0/${k}`;
    hintEl.textContent = '';
    nextBtn.classList.remove('show');
    promptEl.replaceChildren(
      h('span', 'tap-prompt-text', 'Tap all the'),
      h('span', 'tap-prompt-target', target),
    );

    gridEl.replaceChildren(
      ...cells.map((e) => {
        const btn = h('button', 'tap-cell', e);
        btn.onclick = () => {
          if (btn.classList.contains('got')) return;
          if (e === target) {
            btn.classList.add('got');
            sfx.correct();
            confettiFrom(app, btn, ['#fb923c', '#fbbf24']);
            addStars(1);
            remaining--;
            foundEl.textContent = `${k - remaining}/${k}`;
            if (remaining === 0) win();
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
    hintEl.textContent = 'Found them all! ⭐';
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
    const againBtn = h('button', 'btn btn-primary', '🎯 Play again');
    againBtn.onclick = () => { sfx.tap(); round = 0; loadRound(); };
    const homeBtn = h('button', 'btn btn-ghost', '🏠 Home');
    homeBtn.onclick = onHome;
    app.replaceChildren(
      h('div', 'screen results',
        h('div', 'results-main',
          h('div', 'badge', h('span', 'badge-emoji', '🎯'), h('span', 'badge-label', 'SHARP EYES')),
          h('div', 'final-score', String(ROUNDS), h('span', 'final-caption', 'rounds cleared')),
        ),
        h('div', 'results-actions', againBtn, homeBtn),
      ),
    );
    const host = app;
    requestAnimationFrame(() => confettiFrom(host, host, ['#fb923c', '#fbbf24']));
  }

  loadRound();
}
