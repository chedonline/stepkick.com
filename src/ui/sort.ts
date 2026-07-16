// Sort into bins — tap an item, tap the bin it belongs in. Categorization play.
// Feeds the same star / sticker system.

import { addStars } from '../storage';
import { sfx } from '../sound';
import { shuffle } from '../engine/rng';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';

interface SortSet {
  a: { label: string; emoji: string; items: string[] };
  b: { label: string; emoji: string; items: string[] };
}
const SETS: SortSet[] = [
  { a: { label: 'Fruit', emoji: '🍎', items: ['🍎', '🍌', '🍓', '🍊', '🍇', '🍑', '🍉'] },
    b: { label: 'Veggie', emoji: '🥕', items: ['🥕', '🥦', '🌽', '🥬', '🍆', '🫑', '🥔'] } },
  { a: { label: 'Animal', emoji: '🐶', items: ['🐶', '🐱', '🐰', '🦁', '🐮', '🐸', '🐷'] },
    b: { label: 'Vehicle', emoji: '🚗', items: ['🚗', '🚌', '✈️', '🚂', '🚲', '🚁', '🚜'] } },
  { a: { label: 'Hot', emoji: '🔥', items: ['🔥', '☀️', '🌶️', '☕', '🏜️', '🌋'] },
    b: { label: 'Cold', emoji: '❄️', items: ['❄️', '⛄', '🧊', '🥶', '🏔️', '🐧'] } },
  { a: { label: 'Sky', emoji: '☁️', items: ['☁️', '🌙', '⭐', '🌈', '✈️', '🦅'] },
    b: { label: 'Sea', emoji: '🌊', items: ['🐠', '🐙', '🦀', '🐬', '🐚', '🦈'] } },
];
const ROUNDS = 4;

export function mountSort(app: HTMLElement, onHome: () => void): void {
  let round = 0;
  let remaining = 0;
  let selectedBtn: HTMLElement | null = null;

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = onHome;
  const counter = h('span', 'mem-counter', '');
  const header = h('header', 'game-header', backBtn, h('span', 'hud-subject', '🗂️ Sort'),
    h('span', 'hud-spacer'), counter);

  const trayEl = h('div', 'sort-tray');
  const binsEl = h('div', 'sort-bins');
  const hintEl = h('div', 'circ-hint', 'Tap an item, then tap its bin!');
  const nextBtn = h('button', 'btn btn-primary circ-next', 'Next →');
  const board = h('div', 'sort-board', trayEl, binsEl);
  const footer = h('div', 'circ-footer', hintEl, nextBtn);

  const root = h('div', 'screen sortgame', header, board, footer);
  root.style.setProperty('--accent', '#34d399');
  app.replaceChildren(root);

  function place(bin: 'a' | 'b'): void {
    if (!selectedBtn) return;
    const correct = selectedBtn.dataset.bin === bin;
    if (correct) {
      sfx.correct();
      confettiFrom(app, selectedBtn, ['#34d399', '#fbbf24', '#a7f3d0']);
      addStars(1);
      selectedBtn.remove();
      selectedBtn = null;
      remaining--;
      if (remaining === 0) win();
    } else {
      sfx.wrong();
      const binEl = binsEl.querySelector(`[data-binkey="${bin}"]`);
      binEl?.classList.remove('shake');
      void (binEl as HTMLElement)?.offsetWidth;
      binEl?.classList.add('shake');
    }
  }

  function selectBin(bin: 'a' | 'b'): void {
    for (const el of binsEl.querySelectorAll<HTMLElement>('.sort-bin'))
      el.classList.toggle('armed', el.dataset.binkey === bin);
  }

  let lastSet = -1;
  function nextSet(): SortSet {
    let i = Math.floor(Math.random() * SETS.length);
    if (i === lastSet) i = (i + 1) % SETS.length;
    lastSet = i;
    return SETS[i];
  }

  function loadRound(): void {
    const set = nextSet();
    selectedBtn = null;
    counter.textContent = `${round + 1}/${ROUNDS}`;
    hintEl.textContent = 'Tap an item, then tap its bin!';
    nextBtn.classList.remove('show');

    const aItems = shuffle(set.a.items, Math.random).slice(0, 4).map((e) => ({ e, bin: 'a' as const }));
    const bItems = shuffle(set.b.items, Math.random).slice(0, 4).map((e) => ({ e, bin: 'b' as const }));
    const items = shuffle([...aItems, ...bItems], Math.random);
    remaining = items.length;

    trayEl.replaceChildren(
      ...items.map((it) => {
        const btn = h('button', 'sort-item', it.e);
        btn.dataset.bin = it.bin;
        btn.onclick = () => {
          sfx.tap();
          for (const el of trayEl.querySelectorAll('.sort-item')) el.classList.remove('selected');
          btn.classList.add('selected');
          selectedBtn = btn;
        };
        return btn;
      }),
    );

    binsEl.replaceChildren(
      ...(['a', 'b'] as const).map((key) => {
        const meta = set[key];
        const bin = h('button', 'sort-bin',
          h('span', 'sort-bin-emoji', meta.emoji), h('span', 'sort-bin-label', meta.label));
        bin.dataset.binkey = key;
        bin.onclick = () => {
          selectBin(key);
          place(key);
        };
        return bin;
      }),
    );
  }

  function win(): void {
    flashWord(app);
    hintEl.textContent = 'All sorted! ⭐';
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
    const againBtn = h('button', 'btn btn-primary', '🗂️ Play again');
    againBtn.onclick = () => { sfx.tap(); round = 0; loadRound(); };
    const homeBtn = h('button', 'btn btn-ghost', '🏠 Home');
    homeBtn.onclick = onHome;
    app.replaceChildren(
      h('div', 'screen results',
        h('div', 'results-main',
          h('div', 'badge', h('span', 'badge-emoji', '🗂️'), h('span', 'badge-label', 'SORTING STAR')),
          h('div', 'final-score', String(ROUNDS), h('span', 'final-caption', 'rounds sorted')),
        ),
        h('div', 'results-actions', againBtn, homeBtn),
      ),
    );
    const host = app;
    requestAnimationFrame(() => confettiFrom(host, host, ['#34d399', '#fbbf24']));
  }

  loadRound();
}
