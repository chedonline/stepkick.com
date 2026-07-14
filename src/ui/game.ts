import type { Prompt, Question, RunResult, SubjectPack } from '../engine/types';
import { Game, QUESTIONS_PER_RUN } from '../engine/game';
import { sfx } from '../sound';
import { h } from './dom';
import { confettiFrom, flashWord, flyScore } from './juice';

/** An analog clock face at hour:minute (SVG, 0..100 viewBox). */
function renderClock(hour: number, minute: number): HTMLElement {
  const cx = 50, cy = 50;
  const hand = (angleDeg: number, len: number, width: number, color: string): string => {
    const a = ((angleDeg - 90) * Math.PI) / 180; // 0deg points up (12 o'clock)
    const x = cx + Math.cos(a) * len;
    const y = cy + Math.sin(a) * len;
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  };
  let ticks = '';
  let nums = '';
  for (let n = 1; n <= 12; n++) {
    const a = ((n * 30 - 90) * Math.PI) / 180;
    ticks += `<line x1="${(cx + Math.cos(a) * 40).toFixed(1)}" y1="${(cy + Math.sin(a) * 40).toFixed(1)}" x2="${(cx + Math.cos(a) * 44).toFixed(1)}" y2="${(cy + Math.sin(a) * 44).toFixed(1)}" stroke="#8bb3b8" stroke-width="1.6"/>`;
    nums += `<text x="${(cx + Math.cos(a) * 33).toFixed(1)}" y="${(cy + Math.sin(a) * 33 + 3.4).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="800" fill="#ecfeff">${n}</text>`;
  }
  const hourAng = ((hour % 12) + minute / 60) * 30;
  const minAng = minute * 6;
  const wrap = h('div', 'prompt-clock');
  wrap.innerHTML = `<svg viewBox="0 0 100 100" class="clock-svg" role="img" aria-label="clock">
    <circle cx="50" cy="50" r="46" fill="#10262b" stroke="#22d3ee" stroke-width="3"/>
    ${ticks}${nums}
    ${hand(hourAng, 24, 4, '#ecfeff')}
    ${hand(minAng, 34, 2.6, '#22d3ee')}
    <circle cx="50" cy="50" r="3" fill="#22d3ee"/>
  </svg>`;
  return wrap;
}

/** Render the prompt visual for a question. */
function renderPrompt(p: Prompt): HTMLElement {
  switch (p.kind) {
    case 'expr':
      return h('div', 'prompt-expr', p.text);
    case 'count': {
      // arrange in a formation: rows of up to 5, so it's countable by grouping
      const grid = h('div', 'prompt-count');
      grid.style.gridTemplateColumns = `repeat(${Math.min(p.n, 5)}, auto)`;
      for (let i = 0; i < p.n; i++) grid.append(h('span', 'count-item', p.emoji));
      return grid;
    }
    case 'clock':
      return renderClock(p.hour, p.minute);
    case 'emoji':
      return h(
        'div',
        'prompt-picture',
        h('span', 'picture-emoji', p.emoji),
        p.caption ? h('div', 'picture-caption', p.caption) : null,
      );
    case 'word':
      return h('div', 'prompt-word', p.text);
    case 'sequence': {
      const row = h('div', 'prompt-sequence');
      for (const e of p.emojis) row.append(h('span', 'seq-item', e));
      row.append(h('span', 'seq-item seq-q', '?'));
      return row;
    }
  }
}

export function mountGame(
  app: HTMLElement,
  pack: SubjectPack,
  onDone: (r: RunResult) => void,
  onQuit: () => void,
): void {
  const game = new Game(pack);
  let locked = false;
  let finished = false;

  const quitBtn = h('button', 'icon-btn', '✕');
  quitBtn.setAttribute('aria-label', 'Quit');
  const scoreEl = h('span', 'hud-score', '0');
  const streakEl = h('span', 'hud-streak', '');
  const counterEl = h('span', 'hud-counter', '');
  const header = h(
    'header',
    'game-header',
    quitBtn,
    h('span', 'hud-subject', `${pack.meta.emoji} ${pack.meta.name}`),
    streakEl,
    h('span', 'hud-spacer'),
    counterEl,
    scoreEl,
  );

  const promptEl = h('div', 'game-prompt');
  const choicesEl = h('div', 'game-choices');
  const body = h('div', 'game-body', promptEl, choicesEl);

  const root = h('div', 'screen game', header, body);
  root.style.setProperty('--accent', pack.meta.accent);
  app.replaceChildren(root);

  quitBtn.onclick = () => {
    finished = true;
    if (game.answered > 0) {
      game.end();
      onDone(game.results());
    } else {
      onQuit();
    }
  };

  function updateHud(): void {
    scoreEl.textContent = String(game.score);
    streakEl.textContent = game.streak >= 2 ? `🔥${game.streak}` : '';
    counterEl.textContent = `${Math.min(game.answered + 1, QUESTIONS_PER_RUN)}/${QUESTIONS_PER_RUN}`;
  }

  function pop(el: HTMLElement): void {
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  function renderQuestion(q: Question): void {
    locked = false;
    updateHud();
    promptEl.replaceChildren(renderPrompt(q.prompt));

    choicesEl.className = `game-choices ${q.choiceKind === 'emoji' ? 'choices-emoji' : 'choices-text'}`;
    choicesEl.replaceChildren(
      ...q.choices.map((c) => {
        const btn = h('button', `choice choice-${q.choiceKind}`, c);
        btn.dataset.choice = c;
        btn.onclick = () => choose(c, btn);
        return btn;
      }),
    );
  }

  function choose(picked: string | null, pickedBtn: HTMLButtonElement | null): void {
    if (locked || finished) return;
    locked = true;

    const q = game.current;
    const out = game.answer(picked);

    for (const btn of choicesEl.querySelectorAll<HTMLButtonElement>('.choice')) {
      btn.disabled = true;
      if (btn.dataset.choice === out.answer) btn.classList.add('is-correct');
      else if (btn.dataset.choice === picked) btn.classList.add('is-wrong');
      else btn.classList.add('is-dim');
    }

    if (out.correct) {
      sfx.correct(out.streak);
      if (pickedBtn) {
        confettiFrom(app, pickedBtn, q.colors);
        flyScore(app, pickedBtn, scoreEl, `+${out.scoreDelta}`, () => pop(scoreEl));
      } else {
        pop(scoreEl);
      }
      flashWord(app);
      if (out.streak >= 2) pop(streakEl);
    } else {
      sfx.wrong();
      root.classList.remove('shake');
      void root.offsetWidth;
      root.classList.add('shake');
    }
    updateHud();

    if (out.done) {
      finished = true;
      setTimeout(() => onDone(game.results()), out.correct ? 1300 : 1700);
      return;
    }

    const q2 = game.next();
    const wait = out.correct ? 1100 : 1700; // linger so the right answer sinks in
    setTimeout(() => {
      if (!finished) renderQuestion(q2);
    }, wait);
  }

  renderQuestion(game.current);
}
