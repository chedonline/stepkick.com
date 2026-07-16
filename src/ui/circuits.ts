// Circuits mode — the logic-gates toy (the original stepkick idea, folded in
// as a second mode). Tap switches → a gate resolves → the bulb lights.
// Kid-tuned: no reading required to play, immediate feedback, full juice.

import { addStars } from '../storage';
import { sfx } from '../sound';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';

type Gate = 'AND' | 'OR' | 'NOT';

interface Puzzle {
  gate: Gate;
  start: boolean[];
  goal: boolean; // desired bulb state
}

// Hand-picked ladder: every puzzle needs at least one tap (none start solved),
// and together they teach AND / OR / NOT and both ON and OFF goals.
const PUZZLES: Puzzle[] = [
  { gate: 'OR', start: [false, false], goal: true },
  { gate: 'AND', start: [false, false], goal: true },
  { gate: 'NOT', start: [false], goal: false },
  { gate: 'AND', start: [true, false], goal: true },
  { gate: 'OR', start: [true, true], goal: false },
  { gate: 'NOT', start: [true], goal: true },
];

const GATE_INFO: Record<Gate, { hint: string; inputs: number }> = {
  AND: { hint: 'lights up only when BOTH switches are on', inputs: 2 },
  OR: { hint: 'lights up when ANY switch is on', inputs: 2 },
  NOT: { hint: 'flips it — on becomes off!', inputs: 1 },
};

function evalGate(gate: Gate, s: boolean[]): boolean {
  if (gate === 'NOT') return !s[0];
  if (gate === 'AND') return s[0] && s[1];
  return s[0] || s[1];
}

export function mountCircuits(app: HTMLElement, onHome: () => void): void {
  let index = 0;
  let state: boolean[] = [];
  let solved = false;

  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = onHome;
  const counter = h('span', 'circ-counter', '');
  const header = h('header', 'game-header', backBtn, h('span', 'hud-subject', '🔌 Circuits'), h('span', 'hud-spacer'), counter);

  const goalEl = h('div', 'circ-goal');
  const switchesEl = h('div', 'circ-switches');
  const gateEl = h('div', 'circ-gate');
  const bulbEl = h('div', 'circ-bulb', '💡');
  const board = h(
    'div',
    'circ-board',
    switchesEl,
    h('div', 'circ-wire', '▼'),
    gateEl,
    h('div', 'circ-wire', '▼'),
    bulbEl,
  );
  const hintEl = h('div', 'circ-hint');
  const nextBtn = h('button', 'btn btn-primary circ-next', 'Next →');
  const footer = h('div', 'circ-footer', hintEl, nextBtn);

  const root = h('div', 'screen circuits', header, goalEl, board, footer);
  root.style.setProperty('--accent', '#2dd4bf');
  app.replaceChildren(root);

  function refreshBulb(): void {
    const out = evalGate(PUZZLES[index].gate, state);
    bulbEl.classList.toggle('lit', out);
  }

  function loadPuzzle(): void {
    const p = PUZZLES[index];
    const info = GATE_INFO[p.gate];
    solved = false;
    state = p.start.slice();
    counter.textContent = `${index + 1}/${PUZZLES.length}`;
    goalEl.replaceChildren(
      h('span', 'circ-goal-icon', p.goal ? '💡' : '🌙'),
      h('span', 'circ-goal-text', p.goal ? 'Turn the light ON' : 'Turn the light OFF'),
    );
    gateEl.replaceChildren(h('span', 'circ-gate-name', p.gate), h('span', 'circ-gate-sub', info.hint));
    hintEl.textContent = '';
    nextBtn.classList.remove('show');

    switchesEl.replaceChildren(
      ...Array.from({ length: info.inputs }, (_, i) => {
        const sw = h('button', 'circ-switch', h('span', 'circ-knob'), h('span', 'circ-switch-label', ''));
        const sync = () => {
          sw.classList.toggle('on', state[i]);
          sw.querySelector('.circ-switch-label')!.textContent = state[i] ? 'ON' : 'OFF';
        };
        sync();
        sw.onclick = () => {
          if (solved) return;
          state[i] = !state[i];
          sync();
          sfx.tap();
          refreshBulb();
          check();
        };
        return sw;
      }),
    );
    refreshBulb();
  }

  function check(): void {
    const p = PUZZLES[index];
    if (solved || evalGate(p.gate, state) !== p.goal) return;
    solved = true;
    sfx.correct();
    flashWord(app);
    confettiFrom(app, bulbEl, ['#2dd4bf', '#fbbf24', '#5eead4']);
    addStars(1, 'circuits'); // feeds the Dinos sticker set
    hintEl.textContent = 'Solved! ⭐';
    nextBtn.classList.add('show');
  }

  nextBtn.onclick = () => {
    sfx.tap();
    index++;
    if (index >= PUZZLES.length) {
      showComplete();
    } else {
      loadPuzzle();
    }
  };

  function showComplete(): void {
    sfx.fanfare();
    const againBtn = h('button', 'btn btn-primary', '🔌 Play again');
    againBtn.onclick = () => {
      sfx.tap();
      index = 0;
      loadPuzzle();
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
          h('div', 'badge', h('span', 'badge-emoji', '⚡'), h('span', 'badge-label', 'CIRCUIT WHIZ')),
          h('div', 'final-score', String(PUZZLES.length), h('span', 'final-caption', 'circuits solved')),
        ),
        h('div', 'results-actions', againBtn, homeBtn),
      ),
    );
    const host = app;
    requestAnimationFrame(() => {
      const r = host.getBoundingClientRect();
      confettiFrom(host, host, ['#2dd4bf', '#fbbf24']);
      void r;
    });
  }

  loadPuzzle();
}
