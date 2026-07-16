// Memory Match mode — flip cards, find the matching pairs. A different kind of
// play than the quiz (memory + attention). Kid-tuned: big cards, instant juice,
// no timer. Matches feed the same star / sticker system.

import { addStars } from '../storage';
import { sfx } from '../sound';
import { shuffle } from '../engine/rng';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';

// Bright, visually distinct faces that read at small size.
const FACES = ['🐶', '🐱', '🦊', '🐰', '🐼', '🐸', '🐵', '🦁', '🐯', '🐨',
  '🐷', '🐧', '🦄', '🐙', '🦋', '🐝', '🐢', '🐳', '🐮', '🐰'];

interface Level { pairs: number; cols: number; }
const LEVELS: Level[] = [
  { pairs: 4, cols: 4 }, //  8 cards
  { pairs: 6, cols: 4 }, // 12 cards
  { pairs: 8, cols: 4 }, // 16 cards
];

export function mountMemory(app: HTMLElement, onHome: () => void): void {
  let index = 0;
  let first: HTMLElement | null = null;
  let lock = false;
  let matched = 0;
  let moves = 0;

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = onHome;
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

  function loadLevel(): void {
    const lv = LEVELS[index];
    first = null;
    lock = false;
    matched = 0;
    moves = 0;
    counter.textContent = `${index + 1}/${LEVELS.length}`;
    movesEl.textContent = '';
    hintEl.textContent = '';
    nextBtn.classList.remove('show');

    const faces = shuffle(FACES, Math.random).slice(0, lv.pairs);
    const deck = shuffle([...faces, ...faces], Math.random);

    gridEl.style.gridTemplateColumns = `repeat(${lv.cols}, 1fr)`;
    gridEl.replaceChildren(
      ...deck.map((face) => {
        const card = h('button', 'mem-card', h('span', 'mem-face', face), h('span', 'mem-back', '❓'));
        card.dataset.face = face;
        card.onclick = () => flip(card);
        return card;
      }),
    );
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
        if (matched === LEVELS[index].pairs) win();
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
    if (index >= LEVELS.length) showComplete();
    else loadLevel();
  };

  function showComplete(): void {
    sfx.fanfare();
    const againBtn = h('button', 'btn btn-primary', '🃏 Play again');
    againBtn.onclick = () => {
      sfx.tap();
      index = 0;
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
          h('div', 'final-score', String(LEVELS.length), h('span', 'final-caption', 'levels cleared')),
        ),
        h('div', 'results-actions', againBtn, homeBtn),
      ),
    );
    const host = app;
    requestAnimationFrame(() => confettiFrom(host, host, ['#c084fc', '#fbbf24']));
  }

  loadLevel();
}
