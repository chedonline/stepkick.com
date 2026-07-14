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
): void {
  const tiles = SUBJECTS.map((pack) => {
    const b = best(pack.meta.id);
    const mult = pack.meta.pointsMultiplier ?? 1;
    const tile = h(
      'button',
      'subject-tile',
      mult > 1 ? h('span', 'tile-badge', `${mult}× points`) : null,
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

  const soundBtn = h('button', 'sound-toggle', isSoundOn() ? '🔊' : '🔇');
  soundBtn.setAttribute('aria-label', 'Toggle sound');
  soundBtn.onclick = () => {
    soundBtn.textContent = toggleSound() ? '🔊' : '🔇';
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

  app.replaceChildren(
    h(
      'div',
      'screen home',
      h(
        'header',
        'home-header',
        h('div', 'logo-mark', '🦶'),
        h('h1', 'logo', h('span', 'logo-step', 'STEP'), h('span', 'logo-kick', 'KICK')),
        h('p', 'tagline', 'Pick one. Learn by playing!'),
      ),
      h('div', 'subject-grid', ...tiles),
      bookBtn,
      h(
        'footer',
        'home-footer',
        soundBtn,
        h('span', 'footer-spacer'),
        h('p', 'credit', 'CHEDONLINE'),
      ),
    ),
  );
}
