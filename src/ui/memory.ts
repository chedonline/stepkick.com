// Memory Match mode — flip cards, find the matching pairs. A different kind of
// play than the quiz (memory + attention). Kid-tuned: instant juice, no timer.
// Matches feed the same star / sticker system.
//
// The board is fully responsive: cards are sized to fit the available area in
// BOTH dimensions (never overflowing or hiding the score), and the count ramps
// 6 → 12 → 24 → 36 → 48 as levels progress.

import { addStars } from '../storage';
import { sfx } from '../sound';
import { shuffle } from '../engine/rng';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';

// Bright, visually distinct faces that read even when small (need ≥ max pairs).
const FACES = [
  '🐶', '🐱', '🦊', '🐰', '🐼', '🐸', '🐵', '🦁', '🐯', '🐨',
  '🐷', '🐧', '🦄', '🐙', '🦋', '🐝', '🐢', '🐳', '🐮', '🐔',
  '🐴', '🐠', '🐬', '🦀', '🐞', '🦖', '🦕', '🐍', '🦎', '🐭',
  '🦉', '🦜', '🐺', '🦩',
];

// Pairs per level → 6, 12, 24, 36, 48 cards. Responsive layout keeps them on one
// screen; the last levels get small but stay tappable.
const LEVEL_PAIRS = [3, 6, 12, 18, 24];
const GAP = 8;

export function mountMemory(app: HTMLElement, onHome: () => void): void {
  let index = 0;
  let first: HTMLElement | null = null;
  let lock = false;
  let matched = 0;
  let moves = 0;

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  const counter = h('span', 'mem-counter', '');
  const movesEl = h('span', 'hud-score', '');
  const header = h('header', 'game-header', backBtn, h('span', 'hud-subject', '🃏 Memory'),
    h('span', 'hud-spacer'), counter, movesEl);

  const gridEl = h('div', 'mem-grid');
  const hintEl = h('div', 'circ-hint');
  const nextBtn = h('button', 'btn btn-primary circ-next', 'Next →');
  const footer = h('div', 'circ-footer', hintEl, nextBtn);

  const root = h('div', 'screen memory', header, gridEl, footer);
  root.style.setProperty('--accent', '#c084fc');
  app.replaceChildren(root);

  // Pick columns + card size that maximizes the (square) card while fitting the
  // grid area in both dimensions. Recomputed on every resize / orientation flip.
  function layoutGrid(): void {
    const n = gridEl.childElementCount;
    const W = gridEl.clientWidth;
    const H = gridEl.clientHeight;
    if (!n || W <= 0 || H <= 0) return;
    let best = { cols: 1, size: 0 };
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cw = (W - GAP * (cols - 1)) / cols;
      const ch = (H - GAP * (rows - 1)) / rows;
      const size = Math.min(cw, ch);
      if (size > best.size) best = { cols, size };
    }
    const size = Math.floor(best.size);
    gridEl.style.gridTemplateColumns = `repeat(${best.cols}, ${size}px)`;
    gridEl.style.gridAutoRows = `${size}px`;
    gridEl.style.setProperty('--card', `${size}px`);
  }

  const ro = new ResizeObserver(() => layoutGrid());
  ro.observe(gridEl);

  const leave = (): void => {
    ro.disconnect();
    onHome();
  };
  backBtn.onclick = leave;

  function loadLevel(): void {
    const pairs = LEVEL_PAIRS[index];
    first = null;
    lock = false;
    matched = 0;
    moves = 0;
    counter.textContent = `${index + 1}/${LEVEL_PAIRS.length}`;
    movesEl.textContent = '';
    hintEl.textContent = '';
    nextBtn.classList.remove('show');

    const faces = shuffle(FACES, Math.random).slice(0, pairs);
    const deck = shuffle([...faces, ...faces], Math.random);

    gridEl.replaceChildren(
      ...deck.map((face) => {
        const card = h('button', 'mem-card', h('span', 'mem-face', face), h('span', 'mem-back', '❓'));
        card.dataset.face = face;
        card.onclick = () => flip(card);
        return card;
      }),
    );
    layoutGrid();
  }

  function flip(card: HTMLElement): void {
    if (lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    sfx.tap();
    if (!first) {
      first = card;
      return;
    }
    moves++;
    movesEl.textContent = `${moves} 🔄`;
    const a = first;
    const b = card;
    first = null;

    if (a.dataset.face === b.dataset.face) {
      lock = true;
      setTimeout(() => {
        a.classList.add('matched');
        b.classList.add('matched');
        sfx.correct();
        confettiFrom(app, b, ['#c084fc', '#fbbf24', '#a7f3d0']);
        addStars(1); // each pair = a star (feeds stickers, like a correct answer)
        matched++;
        lock = false;
        if (matched === LEVEL_PAIRS[index]) win();
      }, 320);
    } else {
      lock = true;
      sfx.wrong();
      setTimeout(() => {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        lock = false;
      }, 850);
    }
  }

  function win(): void {
    flashWord(app);
    hintEl.textContent = `All matched in ${moves} tries! ⭐`;
    nextBtn.classList.add('show');
  }

  nextBtn.onclick = () => {
    sfx.tap();
    index++;
    if (index >= LEVEL_PAIRS.length) showComplete();
    else loadLevel();
  };

  function showComplete(): void {
    ro.disconnect();
    sfx.fanfare();
    const againBtn = h('button', 'btn btn-primary', '🃏 Play again');
    againBtn.onclick = () => {
      sfx.tap();
      index = 0;
      ro.observe(gridEl);
      app.replaceChildren(root);
      loadLevel();
    };
    const homeBtn = h('button', 'btn btn-ghost', '🏠 Home');
    homeBtn.onclick = onHome;
    app.replaceChildren(
      h(
        'div',
        'screen results',
        h(
          'div',
          'results-main',
          h('div', 'badge', h('span', 'badge-emoji', '🧠'), h('span', 'badge-label', 'MEMORY MASTER')),
          h('div', 'final-score', String(LEVEL_PAIRS.length), h('span', 'final-caption', 'levels cleared')),
        ),
        h('div', 'results-actions', againBtn, homeBtn),
      ),
    );
    const host = app;
    requestAnimationFrame(() => confettiFrom(host, host, ['#c084fc', '#fbbf24']));
  }

  loadLevel();
}
