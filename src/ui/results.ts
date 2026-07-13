import type { RunResult, SubjectId } from '../engine/types';
import { SUBJECT_BY_ID } from '../subjects';
import { ALL_STICKERS } from '../stickers';
import { sfx } from '../sound';
import { h } from './dom';
import { confettiBurst } from './juice';

interface Badge {
  emoji: string;
  label: string;
}

function badgeFor(accuracy: number): Badge {
  if (accuracy >= 100) return { emoji: '🏆', label: 'PERFECT!' };
  if (accuracy >= 80) return { emoji: '🌟', label: 'SUPER STAR' };
  if (accuracy >= 60) return { emoji: '👍', label: 'GREAT JOB' };
  if (accuracy >= 40) return { emoji: '🙂', label: 'NICE TRY' };
  return { emoji: '🌱', label: 'KEEP GOING' };
}

export function mountResults(
  app: HTMLElement,
  result: RunResult,
  newBest: boolean,
  newStickers: number[],
  onPlayAgain: (subject: SubjectId) => void,
  onHome: () => void,
): void {
  const pack = SUBJECT_BY_ID[result.subject];
  const badge = badgeFor(result.accuracy);

  // celebrate any stickers earned this run
  const unlockedRow =
    newStickers.length > 0
      ? h(
          'div',
          'sticker-unlock',
          h('span', 'sticker-unlock-label', newStickers.length === 1 ? '🎉 New sticker!' : `🎉 ${newStickers.length} new stickers!`),
          h(
            'div',
            'sticker-unlock-row',
            ...newStickers.map((i) => h('span', 'sticker-unlock-emoji', ALL_STICKERS[i]?.emoji ?? '⭐')),
          ),
        )
      : null;

  const againBtn = h('button', 'btn btn-primary', `${pack.meta.emoji} Play again`);
  againBtn.onclick = () => {
    sfx.tap();
    onPlayAgain(result.subject);
  };
  const homeBtn = h('button', 'btn btn-ghost', '🏠 Home');
  homeBtn.onclick = () => {
    sfx.tap();
    onHome();
  };

  app.replaceChildren(
    h(
      'div',
      'screen results',
      h(
        'div',
        'results-main',
        h('div', 'badge', h('span', 'badge-emoji', badge.emoji), h('span', 'badge-label', badge.label)),
        newBest ? h('div', 'new-best', '⭐ NEW BEST!') : null,
        h('div', 'final-score', String(result.score), h('span', 'final-caption', 'points')),
        h(
          'div',
          'stat-row',
          h('div', 'stat', h('span', 'stat-value', `${result.correct}/${result.answered}`), h('span', 'stat-label', 'Correct')),
          h('div', 'stat', h('span', 'stat-value', `${result.accuracy}%`), h('span', 'stat-label', 'Accuracy')),
          h('div', 'stat', h('span', 'stat-value', `🔥${result.bestStreak}`), h('span', 'stat-label', 'Streak')),
        ),
        unlockedRow,
      ),
      h('div', 'results-actions', againBtn, homeBtn),
    ),
  );

  sfx.fanfare();
  const host = app;
  requestAnimationFrame(() => {
    const r = host.getBoundingClientRect();
    confettiBurst(host, r.width / 2, r.height * 0.35, [pack.meta.accent, '#fbbf24', '#f1f5ff']);
  });
}
