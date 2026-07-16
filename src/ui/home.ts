import type { SubjectId } from '../engine/types';
import { SUBJECTS } from '../subjects';
import { best, stickersUnlocked, totalStars } from '../storage';
import { ALL_STICKERS, STARS_PER_STICKER } from '../stickers';
import { isSoundOn, sfx, toggleSound } from '../sound';
import { h } from './dom';

export interface HomeModes {
  book: () => void;
  circuits: () => void;
  memory: () => void;
  sort: () => void;
  tapall: () => void;
  order: () => void;
  maze: () => void;
  mensa: () => void;
}

// The non-quiz play modes, rendered as launcher bars below the subject tiles.
const LAUNCHERS: { key: keyof HomeModes; cls: string; icon: string; title: string; sub: string; badge?: string }[] = [
  { key: 'circuits', cls: 'circ-launch', icon: '🔌', title: 'Circuits', sub: 'Tap switches, light the bulb!' },
  { key: 'memory', cls: 'circ-launch mem-launch', icon: '🃏', title: 'Memory Match', sub: 'Find the matching pairs!', badge: 'NEW' },
  { key: 'sort', cls: 'circ-launch sort-launch', icon: '🗂️', title: 'Sort', sub: 'Put each thing in its bin!', badge: 'NEW' },
  { key: 'tapall', cls: 'circ-launch tap-launch', icon: '🎯', title: 'Find', sub: 'Tap all the matching ones!', badge: 'NEW' },
  { key: 'order', cls: 'circ-launch order-launch', icon: '🔢', title: 'Put in Order', sub: 'Smallest to biggest!', badge: 'NEW' },
  { key: 'maze', cls: 'circ-launch maze-launch', icon: '🧭', title: 'Maze', sub: 'Find your way to the star!', badge: 'NEW' },
  { key: 'mensa', cls: 'circ-launch mensa-launch', icon: '🧩', title: 'Shape Builder', sub: 'Which two make the shape?', badge: 'NEW' },
];

export function mountHome(app: HTMLElement, onPlay: (subject: SubjectId) => void, modes: HomeModes): void {
  const tiles = SUBJECTS.map((pack) => {
    const b = best(pack.meta.id);
    const mult = pack.meta.pointsMultiplier ?? 1;
    const tile = h(
      'button',
      'subject-tile',
      mult > 1 ? h('span', 'tile-badge', '⭐ BONUS') : null,
      h('span', 'tile-emoji', pack.meta.emoji),
      h('span', 'tile-name', pack.meta.name),
      h('span', 'tile-blurb', pack.meta.blurb),
      h('span', 'tile-best', b > 0 ? `Best ${b}` : 'Tap to play'),
    );
    tile.style.setProperty('--accent', pack.meta.accent);
    tile.onclick = () => {
      sfx.tap();
      onPlay(pack.meta.id);
    };
    return tile;
  });

  // A clear on/off switch (top-right of the screen), not just an icon.
  const soundOn = isSoundOn();
  const soundSwitch = h(
    'button',
    `sound-switch${soundOn ? ' is-on' : ''}`,
    h('span', 'sound-switch-icon', soundOn ? '🔊' : '🔇'),
    h('span', 'sound-switch-track', h('span', 'sound-switch-knob')),
  );
  soundSwitch.setAttribute('role', 'switch');
  soundSwitch.setAttribute('aria-checked', String(soundOn));
  soundSwitch.setAttribute('aria-label', 'Sound');
  soundSwitch.onclick = () => {
    const on = toggleSound();
    soundSwitch.classList.toggle('is-on', on);
    soundSwitch.setAttribute('aria-checked', String(on));
    const icon = soundSwitch.querySelector('.sound-switch-icon');
    if (icon) icon.textContent = on ? '🔊' : '🔇';
  };

  // Sticker-book progress bar: forever star total, progress to the next sticker.
  const unlocked = stickersUnlocked();
  const stars = totalStars();
  const toNext = unlocked >= ALL_STICKERS.length ? 1 : (stars % STARS_PER_STICKER) / STARS_PER_STICKER;
  const bookBtn = h(
    'button',
    'book-bar',
    h('span', 'book-bar-icon', '📖'),
    h(
      'span',
      'book-bar-text',
      h('span', 'book-bar-title', 'Sticker Book'),
      h('span', 'book-bar-sub', `${unlocked}/${ALL_STICKERS.length} · ${stars} ⭐`),
    ),
    h('span', 'book-bar-bar', (() => {
      const fill = h('span', 'book-bar-fill');
      fill.style.width = `${Math.round(toNext * 100)}%`;
      return fill;
    })()),
  );
  bookBtn.onclick = () => {
    sfx.tap();
    modes.book();
  };

  const launcherBars = LAUNCHERS.map((L) => {
    const bar = h(
      'button',
      L.cls,
      h('span', 'circ-launch-icon', L.icon),
      h('span', 'circ-launch-text', h('span', 'circ-launch-title', L.title), h('span', 'circ-launch-sub', L.sub)),
      L.badge ? h('span', 'circ-launch-badge', L.badge) : null,
    );
    bar.onclick = () => {
      sfx.tap();
      modes[L.key]();
    };
    return bar;
  });

  app.replaceChildren(
    h(
      'div',
      'screen home',
      h(
        'header',
        'home-header',
        soundSwitch,
        h('div', 'logo-mark', '🦶'),
        h('h1', 'logo', h('span', 'logo-step', 'STEP'), h('span', 'logo-kick', 'KICK')),
        h('p', 'tagline', 'Pick one. Learn by playing!'),
      ),
      // scrolls when there are more tiles than fit (folders come later)
      h('div', 'home-scroll', h('div', 'subject-grid', ...tiles), ...launcherBars, bookBtn),
      h('footer', 'home-footer', h('p', 'credit', 'CROOKED PIXELS')),
    ),
  );
}
