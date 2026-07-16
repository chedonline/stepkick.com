import type { SubjectId } from '../engine/types';
import { SUBJECTS } from '../subjects';
import { best, stickersUnlocked, totalStars } from '../storage';
import { ALL_STICKERS, STARS_PER_STICKER } from '../stickers';
import { isSoundOn, sfx, toggleSound } from '../sound';
import { h } from './dom';

export function mountHome(
  app: HTMLElement,
  onPlay: (subject: SubjectId) => void,
  onOpenBook: () => void,
  onCircuits: () => void,
): void {
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
    onOpenBook();
  };

  // Circuits — the logic-gates mode (a different kind of play than the quiz)
  const circuitsBtn = h(
    'button',
    'circ-launch',
    h('span', 'circ-launch-icon', '🔌'),
    h(
      'span',
      'circ-launch-text',
      h('span', 'circ-launch-title', 'Circuits'),
      h('span', 'circ-launch-sub', 'Tap switches, light the bulb!'),
    ),
    h('span', 'circ-launch-badge', 'NEW'),
  );
  circuitsBtn.onclick = () => {
    sfx.tap();
    onCircuits();
  };

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
      h('div', 'home-scroll', h('div', 'subject-grid', ...tiles), circuitsBtn, bookBtn),
      h('footer', 'home-footer', h('p', 'credit', 'CROOKED PIXELS')),
    ),
  );
}
