import type { SubjectId } from '../engine/types';
import { SUBJECTS } from '../subjects';
import { best } from '../storage';
import { isSoundOn, sfx, toggleSound } from '../sound';
import { h } from './dom';

export function mountHome(app: HTMLElement, onPlay: (subject: SubjectId) => void): void {
  const tiles = SUBJECTS.map((pack) => {
    const b = best(pack.meta.id);
    const tile = h(
      'button',
      'subject-tile',
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
