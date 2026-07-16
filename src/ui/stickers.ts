import { ALL_STICKERS, STARS_PER_STICKER, STICKER_SETS } from '../stickers';
import { sfx } from '../sound';
import { exportSave, importSave, stickersUnlocked, totalStars } from '../storage';
import { h } from './dom';

type Filter = 'collected' | 'all';

/** A tappable earned sticker: plays its chime + pops on click. */
function earnedSticker(emoji: string, name: string, globalIndex: number, withName: boolean): HTMLButtonElement {
  const btn = h('button', `sticker earned${withName ? ' show-name' : ''}`, h('span', 'sticker-emoji', emoji));
  if (withName) btn.append(h('span', 'sticker-name', name));
  btn.title = name;
  btn.setAttribute('aria-label', name);
  btn.onclick = () => {
    sfx.sticker(globalIndex);
    btn.classList.remove('pop');
    void btn.offsetWidth; // restart the animation
    btn.classList.add('pop');
  };
  return btn;
}

export function mountStickers(app: HTMLElement, onHome: () => void): void {
  const unlocked = stickersUnlocked();
  const stars = totalStars();

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = () => {
    sfx.tap();
    onHome();
  };

  const backupBtn = h('button', 'icon-btn', '💾');
  backupBtn.setAttribute('aria-label', 'Backup progress');
  backupBtn.onclick = openBackup;

  const header = h(
    'header',
    'book-header',
    backBtn,
    h(
      'div',
      'book-title',
      h('span', 'book-title-main', '📖 Sticker Book'),
      h('span', 'book-title-sub', `${unlocked} / ${ALL_STICKERS.length} collected · ${stars} ⭐`),
    ),
    backupBtn,
  );

  // Collected / All toggle
  const body = h('div', 'book-body');
  let filter: Filter = unlocked > 0 ? 'collected' : 'all';

  const collectedBtn = h('button', 'seg-btn', `✨ Collected (${unlocked})`);
  const allBtn = h('button', 'seg-btn', `All (${ALL_STICKERS.length})`);
  const toggle = h('div', 'seg-toggle', collectedBtn, allBtn);

  function syncToggle(): void {
    collectedBtn.classList.toggle('is-active', filter === 'collected');
    allBtn.classList.toggle('is-active', filter === 'all');
  }
  collectedBtn.onclick = () => {
    if (filter === 'collected') return;
    filter = 'collected';
    sfx.tap();
    render();
  };
  allBtn.onclick = () => {
    if (filter === 'all') return;
    filter = 'all';
    sfx.tap();
    render();
  };

  function render(): void {
    syncToggle();
    if (filter === 'collected' && unlocked === 0) {
      body.replaceChildren(
        h(
          'div',
          'sticker-empty',
          h('div', 'sticker-empty-emoji', '🎁'),
          h('div', 'sticker-empty-title', 'No stickers yet'),
          h('div', 'sticker-empty-sub', `Play a round — every correct answer is a ⭐, and every ${STARS_PER_STICKER} ⭐ earns a sticker!`),
        ),
      );
      return;
    }

    let idx = 0;
    const pages = STICKER_SETS.map((set) => {
      const startIdx = idx;
      const cells: HTMLElement[] = [];
      let got = 0;
      for (const st of set.stickers) {
        const earned = idx < unlocked;
        if (earned) got++;
        if (filter === 'collected') {
          if (earned) cells.push(earnedSticker(st.emoji, st.name, idx, true));
        } else if (earned) {
          cells.push(earnedSticker(st.emoji, st.name, idx, false));
        } else {
          const cell = h('div', 'sticker locked');
          cell.append(h('span', 'sticker-lock', '❓'));
          cell.append(h('span', 'sticker-need', `${(idx + 1) * STARS_PER_STICKER}⭐`));
          cells.push(cell);
        }
        idx++;
      }
      // In Collected mode, skip sets you haven't started.
      if (filter === 'collected' && got === 0) return null;
      idx = startIdx + set.stickers.length; // keep index consistent
      return h(
        'section',
        'sticker-page',
        h('div', 'page-head', h('span', 'page-name', `${set.emoji} ${set.name}`), h('span', 'page-count', `${got}/${set.stickers.length}`)),
        h('div', 'sticker-grid', ...cells),
      );
    });

    body.replaceChildren(...pages.filter((p): p is HTMLElement => p !== null));
  }

  const screen = h('div', 'screen book', header, toggle, body);

  function openBackup(): void {
    const code = exportSave();
    const codeArea = h('textarea', 'backup-code') as HTMLTextAreaElement;
    codeArea.value = code;
    codeArea.readOnly = true;
    const copyBtn = h('button', 'btn btn-primary', '📋 Copy code');
    copyBtn.onclick = () => { void navigator.clipboard?.writeText(code); copyBtn.textContent = '✓ Copied!'; };
    const restoreArea = h('textarea', 'backup-code') as HTMLTextAreaElement;
    restoreArea.placeholder = 'Paste a backup code here…';
    const msg = h('div', 'backup-msg', '');
    const restoreBtn = h('button', 'btn btn-ghost', '♻️ Restore');
    restoreBtn.onclick = () => {
      if (importSave(restoreArea.value)) {
        msg.textContent = 'Restored! Reloading…';
        setTimeout(() => location.reload(), 700);
      } else {
        msg.textContent = 'That code didn’t work — check it and try again.';
      }
    };
    const closeBtn = h('button', 'icon-btn', '✕');
    const overlay = h('div', 'backup-overlay',
      h('div', 'backup-panel',
        h('div', 'backup-head', h('span', 'backup-title', '💾 Backup progress'), closeBtn),
        h('p', 'backup-sub', 'Copy this code and keep it somewhere safe. Paste it on any device to restore your ⭐ and stickers.'),
        codeArea, copyBtn,
        h('div', 'backup-hr'),
        restoreArea, restoreBtn, msg,
      ),
    );
    closeBtn.onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    screen.append(overlay);
  }

  render();
  app.replaceChildren(screen);
}
