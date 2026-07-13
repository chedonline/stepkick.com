import { ALL_STICKERS, STARS_PER_STICKER, STICKER_SETS } from '../stickers';
import { sfx } from '../sound';
import { stickersUnlocked, totalStars } from '../storage';
import { h } from './dom';

export function mountStickers(app: HTMLElement, onHome: () => void): void {
  const unlocked = stickersUnlocked();
  const stars = totalStars();

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = () => {
    sfx.tap();
    onHome();
  };

  const header = h(
    'header',
    'book-header',
    backBtn,
    h('div', 'book-title', h('span', 'book-title-main', '📖 Sticker Book'), h('span', 'book-title-sub', `${unlocked} / ${ALL_STICKERS.length} collected · ${stars} ⭐`)),
  );

  // running index across the flattened unlock order
  let idx = 0;
  const pages = STICKER_SETS.map((set) => {
    const got = set.stickers.filter((_, i) => idx + i < unlocked).length;
    const grid = h('div', 'sticker-grid');
    for (const st of set.stickers) {
      const earned = idx < unlocked;
      const cell = h('div', `sticker ${earned ? 'earned' : 'locked'}`);
      if (earned) {
        cell.append(h('span', 'sticker-emoji', st.emoji));
        cell.title = st.name;
      } else {
        cell.append(h('span', 'sticker-lock', '❓'));
        const need = (idx + 1) * STARS_PER_STICKER;
        cell.append(h('span', 'sticker-need', `${need}⭐`));
      }
      grid.append(cell);
      idx++;
    }
    return h(
      'section',
      'sticker-page',
      h('div', 'page-head', h('span', 'page-name', `${set.emoji} ${set.name}`), h('span', 'page-count', `${got}/${set.stickers.length}`)),
      grid,
    );
  });

  app.replaceChildren(h('div', 'screen book', header, h('div', 'book-body', ...pages)));
}
