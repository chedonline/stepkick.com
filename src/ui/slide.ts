// Slide — four games answered with a slider (or a clock's hands), scored by how close:
//   📏 Number Line  "Where does 37 go?"           drag a marker along 0–10 … 0–1000, then fractions on 0–1
//   👀 How Many?     a pile flashes, guess how many
//   🕐 Set the Clock drag the hands to 3:45 / "quarter past 7"
//   🐘 How Big?      how tall / long / heavy is a giraffe, the CN Tower… (researched facts)
// Spot on = ⭐⭐⭐, close = ⭐⭐, in the right area = ⭐. A round is 8 questions.
// Every question that earns ⭐⭐ or more adds a star to the Sticker Book (Ocean page).

import { addStars } from '../storage';
import { sfx } from '../sound';
import { h } from './dom';
import { confettiFrom, flashWord } from './juice';
import FACTS from './howbig-facts.json';

type Fact = { q: string; emoji: string; kind: 'height' | 'length' | 'weight'; value: number; unit: 'm' | 'kg' | 't'; note: string; source?: string };
const ROUND = 8;
const ri = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));
const pickOne = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const shuffled = <T>(a: T[]): T[] => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = (n: number, dp = 0): string => n.toLocaleString('en-CA', { maximumFractionDigits: dp, minimumFractionDigits: 0 });
const starLine = (n: number): string => (n ? '⭐'.repeat(n) : '·');

/* ---------------- a big, touch-friendly slider ---------------- */
interface Slider { el: HTMLElement; get: () => number; set: (v: number) => void; lock: () => void; mark: (v: number, label: string) => void; moved: () => boolean }
function makeSlider(opts: { min: number; max: number; step: number; start?: number; ticks?: number; labels?: [string, string]; onInput?: (v: number) => void }): Slider {
  const { min, max, step } = opts;
  let value = opts.start ?? min, locked = false, touched = false;
  const fill = h('div', 'sl-fill'), thumb = h('div', 'sl-thumb'), marks = h('div', 'sl-marks');
  const track = h('div', 'sl-track', fill, marks, thumb);
  track.tabIndex = 0;
  track.setAttribute('role', 'slider');
  for (let i = 1; opts.ticks && i < opts.ticks; i++) { const t = h('i', 'sl-tick'); t.style.left = `${(100 * i) / opts.ticks}%`; marks.append(t); }
  const ends = opts.labels ? h('div', 'sl-ends', h('span', '', opts.labels[0]), h('span', '', opts.labels[1])) : null;
  const el = h('div', 'sl', track, ends);
  const snap = (v: number): number => { const s = step > 0 ? Math.round((v - min) / step) * step + min : v; return Math.min(max, Math.max(min, +s.toFixed(6))); };
  const draw = (): void => { const p = (100 * (value - min)) / (max - min); thumb.style.left = `${p}%`; fill.style.width = `${p}%`; };
  const fromX = (x: number): void => { const r = track.getBoundingClientRect(); set(min + ((x - r.left) / r.width) * (max - min)); };
  function set(v: number): void { value = snap(v); touched = true; draw(); opts.onInput?.(value); }
  let drag = false;
  track.addEventListener('pointerdown', (e) => { if (locked) return; drag = true; try { track.setPointerCapture(e.pointerId); } catch { /* keep dragging without capture */ } fromX(e.clientX); e.preventDefault(); });
  track.addEventListener('pointermove', (e) => { if (!locked && drag) fromX(e.clientX); });
  const stop = (): void => { drag = false; };
  track.addEventListener('pointerup', stop);
  track.addEventListener('pointercancel', stop);
  track.addEventListener('keydown', (e) => {
    if (locked) return;
    const k = step > 0 ? step : (max - min) / 100;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(value + k); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(value - k); e.preventDefault(); }
  });
  draw();
  return {
    el, get: () => value, moved: () => touched,
    set: (v) => { value = snap(v); draw(); },
    lock: () => { locked = true; el.classList.add('locked'); },
    mark: (v, label) => { const m = h('div', 'sl-answer', h('span', '', label)); m.style.left = `${(100 * (v - min)) / (max - min)}%`; marks.append(m); },
  };
}

/* ---------------- one round of questions, shared by every game ---------------- */
interface Asked { node: HTMLElement; check: () => { stars: number; text: string } }
function runRound(app: HTMLElement, onBack: () => void, title: string, accent: string, makeQ: (i: number) => Asked): void {
  let i = 0, total = 0;
  const backBtn = h('button', 'icon-btn', '←');
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.onclick = onBack;
  const counter = h('span', 'mem-counter', ''), starsEl = h('span', 'hud-score', '');
  const body = h('div', 'sl-body');
  const result = h('div', 'sl-result');
  const checkBtn = h('button', 'btn btn-primary sl-check', '✓ Check');
  const nextBtn = h('button', 'btn btn-primary circ-next', 'Next →');
  const root = h('div', 'screen slidegame', h('header', 'game-header', backBtn, h('span', 'hud-subject', title), h('span', 'hud-spacer'), counter, starsEl),
    body, h('div', 'circ-footer', result, checkBtn, nextBtn));
  root.style.setProperty('--accent', accent);
  app.replaceChildren(root);
  let cur: Asked;
  function ask(): void {
    counter.textContent = `${i + 1}/${ROUND}`;
    starsEl.textContent = `${total} ⭐`;
    result.textContent = ''; result.className = 'sl-result';
    checkBtn.style.display = ''; nextBtn.classList.remove('show');
    cur = makeQ(i);
    body.replaceChildren(cur.node);
  }
  checkBtn.onclick = () => {
    const r = cur.check();
    total += r.stars;
    starsEl.textContent = `${total} ⭐`;
    result.innerHTML = '';
    result.append(h('b', 'sl-stars', starLine(r.stars)), h('span', '', r.text));
    result.className = 'sl-result show';
    if (r.stars >= 2) { sfx.correct(r.stars); confettiFrom(app, result, [accent, '#fbbf24']); addStars(1, 'slide'); }
    else if (r.stars === 1) sfx.tap();
    else sfx.wrong();
    checkBtn.style.display = 'none';
    nextBtn.classList.add('show');
  };
  nextBtn.onclick = () => {
    sfx.tap();
    i++;
    if (i < ROUND) { ask(); return; }
    sfx.fanfare(); flashWord(app);
    const again = h('button', 'btn btn-primary', '↻ Play again'), back = h('button', 'btn btn-ghost', '🎚️ Slide games');
    again.onclick = () => runRound(app, onBack, title, accent, makeQ);
    back.onclick = onBack;
    app.replaceChildren(h('div', 'screen results',
      h('div', 'results-main',
        h('div', 'badge', h('span', 'badge-emoji', total >= ROUND * 2 ? '🏆' : '🎚️'), h('span', 'badge-label', total >= ROUND * 2 ? 'SHARP EYE' : 'NICE SLIDING')),
        h('div', 'final-score', `${total}`, h('span', 'final-caption', `of ${ROUND * 3} stars`))),
      h('div', 'results-actions', again, back)));
  };
  ask();
}

/* ---------------- 📏 Number Line ---------------- */
const FRACS: [string, number][] = [['1/2', 0.5], ['1/4', 0.25], ['3/4', 0.75], ['1/3', 1 / 3], ['2/3', 2 / 3], ['1/5', 0.2], ['4/5', 0.8], ['1/10', 0.1], ['7/10', 0.7], ['3/8', 0.375]];
function numberLine(i: number): Asked {
  // 0–10, 0–10, 0–20, 0–20, 0–100, 0–100, 0–1000, then a fraction on 0–1
  const ranges = [10, 10, 20, 20, 100, 100, 1000, 1];
  const max = ranges[i];
  let shown: string, target: number;
  if (max === 1) { const [s, v] = pickOne(FRACS); shown = s; target = v; }
  else { target = ri(1, max - 1); if (max >= 100 && target % 10 === 0) target += ri(1, 9); shown = fmt(target); }
  const sl = makeSlider({ min: 0, max, step: 0, start: 0, ticks: max === 1 ? 4 : max <= 20 ? max / (max === 20 ? 2 : 1) : 10, labels: ['0', fmt(max)] });
  const node = h('div', 'sl-q', h('div', 'sl-ask', 'Where does it go?'), h('div', 'sl-big', shown), sl.el, h('div', 'sl-help', 'Drag the dot, then tap ✓'));
  return {
    node,
    check: () => {
      sl.lock(); sl.mark(target, shown);
      const g = sl.get(), err = Math.abs(g - target) / max;
      const stars = err <= 0.02 ? 3 : err <= 0.05 ? 2 : err <= 0.1 ? 1 : 0;
      const at = max === 1 ? fmt(g, 2) : fmt(g, max <= 20 ? 1 : 0);
      return { stars, text: stars === 3 ? `Spot on! ${shown} is right there.` : `You put it at ${at}. ${shown} is at the flag.` };
    },
  };
}

/* ---------------- 👀 How Many? ---------------- */
const PILE = ['🍎', '⭐', '🐟', '🌸', '🍪', '🐞', '🎈', '🍓', '🐥', '💎'];
function howMany(i: number): Asked {
  const ns = [8, 12, 15, 20, 25, 35, 45, 60], maxes = [20, 20, 30, 40, 50, 60, 80, 100];
  const n = ns[i] + ri(-2, 2), max = maxes[i], em = pickOne(PILE);
  const field = h('div', 'hm-field');
  // scatter on a jittered grid so nothing overlaps
  const cols = Math.ceil(Math.sqrt(n * 1.6)), rows = Math.ceil(n / cols) + 1;
  const cells = shuffled(Array.from({ length: cols * rows }, (_, k) => k)).slice(0, n);
  for (const c of cells) {
    const s = h('span', 'hm-dot', em);
    s.style.left = `${((c % cols) + 0.15 + Math.random() * 0.7) * (100 / cols)}%`;
    s.style.top = `${(Math.floor(c / cols) + 0.15 + Math.random() * 0.7) * (100 / rows)}%`;
    s.style.fontSize = `${Math.max(16, 44 - n * 0.4)}px`;
    field.append(s);
  }
  const cover = h('div', 'hm-cover', '🙈 How many were there?');
  field.append(cover);
  const read = h('div', 'sl-read', '0');
  const sl = makeSlider({ min: 0, max, step: 1, start: 0, ticks: 4, labels: ['0', String(max)], onInput: (v) => { read.textContent = String(v); } });
  const show = Math.min(2600, 1200 + n * 22);
  const go = h('button', 'btn btn-ghost hm-go', `👀 Look! (${(show / 1000).toFixed(1)} s)`);
  const guess = h('div', 'hm-guess hidden', read, sl.el);
  go.onclick = () => {
    go.remove(); field.classList.add('peek'); sfx.tap();
    setTimeout(() => { field.classList.remove('peek'); field.classList.add('hidden-pile'); guess.classList.remove('hidden'); }, show);
  };
  const node = h('div', 'sl-q', h('div', 'sl-ask', `Quick look: how many ${em}?`), field, go, guess);
  return {
    node,
    check: () => {
      sl.lock(); sl.mark(n, String(n));
      field.classList.remove('hidden-pile'); field.classList.add('peek', 'revealed');
      const g = sl.get(), err = Math.abs(g - n) / n;
      const stars = err <= 0.1 ? 3 : err <= 0.2 ? 2 : err <= 0.35 ? 1 : 0;
      return { stars, text: g === n ? `Exactly ${n}! Wow.` : `There were ${n}. You said ${g}.` };
    },
  };
}

/* ---------------- 🕐 Set the Clock ---------------- */
const NUM_WORD = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
function timeWords(hh: number, mm: number): string {
  const nx = hh % 12 + 1;
  if (mm === 0) return `${NUM_WORD[hh]} o'clock`;
  if (mm === 30) return `half past ${NUM_WORD[hh]}`;
  if (mm === 15) return `quarter past ${NUM_WORD[hh]}`;
  if (mm === 45) return `quarter to ${NUM_WORD[nx]}`;
  if (mm < 30) return `${mm} past ${NUM_WORD[hh]}`;
  return `${60 - mm} to ${NUM_WORD[nx]}`;
}
function setClock(i: number): Asked {
  // o'clock → half past → quarters → any 5 minutes; digital or words
  const pools = [[0], [0, 30], [0, 30], [15, 45], [15, 30, 45], [5, 10, 20, 25, 35, 40, 50, 55], [5, 10, 20, 25, 35, 40, 50, 55], [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]];
  const hh = ri(1, 12), mm = pickOne(pools[i]);
  const words = i >= 1 && Math.random() < 0.5;
  const shown = words ? timeWords(hh, mm) : `${hh}:${String(mm).padStart(2, '0')}`;
  // the clock: 12:00 to start; drag either hand (the hour hand follows the minutes like a real clock)
  let total = 0; // minutes past 12:00, 0..719
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.classList.add('ck');
  const add = (tag: string, attrs: Record<string, string | number>, parent: Element = svg): SVGElement => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, String(attrs[k])); parent.append(e); return e; };
  add('circle', { cx: 100, cy: 100, r: 94, class: 'ck-face' });
  for (let k = 0; k < 60; k++) { const a = (k * 6 * Math.PI) / 180, r1 = k % 5 ? 86 : 80; add('line', { x1: 100 + r1 * Math.sin(a), y1: 100 - r1 * Math.cos(a), x2: 100 + 90 * Math.sin(a), y2: 100 - 90 * Math.cos(a), class: k % 5 ? 'ck-min' : 'ck-hr' }); }
  for (let k = 1; k <= 12; k++) { const a = (k * 30 * Math.PI) / 180; const t = add('text', { x: 100 + 66 * Math.sin(a), y: 100 - 66 * Math.cos(a) + 7, class: 'ck-num' }); t.textContent = String(k); }
  const hourHand = add('g', { class: 'ck-hand ck-hour' }), minHand = add('g', { class: 'ck-hand ck-minute' });
  add('line', { x1: 100, y1: 100, x2: 100, y2: 52 }, hourHand); add('circle', { cx: 100, cy: 52, r: 11, class: 'ck-knob' }, hourHand);
  add('line', { x1: 100, y1: 100, x2: 100, y2: 24 }, minHand); add('circle', { cx: 100, cy: 24, r: 11, class: 'ck-knob' }, minHand);
  add('circle', { cx: 100, cy: 100, r: 6, class: 'ck-pin' });
  const draw = (): void => {
    const m = total % 60, hrs = Math.floor(total / 60);
    minHand.setAttribute('transform', `rotate(${m * 6} 100 100)`);
    hourHand.setAttribute('transform', `rotate(${(hrs + m / 60) * 30} 100 100)`);
  };
  let dragging: 'hour' | 'minute' | null = null, locked = false;
  const angleAt = (e: PointerEvent): number => { const r = svg.getBoundingClientRect(); const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2); return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360; };
  const moveTo = (ang: number): void => {
    if (dragging === 'minute') {
      const m = Math.round(ang / 30) * 5 % 60, old = total % 60;
      let hrs = Math.floor(total / 60);
      if (old >= 45 && m <= 15 && m < old) hrs++; // went past 12 → next hour, like a real clock
      if (old <= 15 && m >= 45 && m > old) hrs--;
      total = ((hrs * 60 + m) % 720 + 720) % 720;
    } else if (dragging === 'hour') {
      const hrs = Math.floor(ang / 30) % 12;
      total = hrs * 60 + (total % 60);
    }
    draw();
  };
  svg.addEventListener('pointerdown', (e) => {
    if (locked) return;
    const ang = angleAt(e), m = (total % 60) * 6, hr = ((Math.floor(total / 60) + (total % 60) / 60) * 30) % 360;
    const d = (a: number, b: number): number => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
    // a knob decides; otherwise the hand nearest the finger's angle, and when both hands
    // point the same way (12:00 at the start), near the middle = hour hand, further out = minutes
    const tgt = e.target as Element, r = svg.getBoundingClientRect();
    const dist = (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) * 200) / r.width;
    dragging = tgt.closest('.ck-hour') ? 'hour' : tgt.closest('.ck-minute') ? 'minute'
      : d(ang, hr) < 25 && d(ang, m) < 25 ? (dist < 62 ? 'hour' : 'minute') : d(ang, hr) < d(ang, m) ? 'hour' : 'minute';
    try { svg.setPointerCapture(e.pointerId); } catch { /* keep dragging without capture */ }
    moveTo(ang); e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => { if (dragging && !locked) moveTo(angleAt(e)); });
  svg.addEventListener('pointerup', () => { dragging = null; });
  svg.addEventListener('pointercancel', () => { dragging = null; });
  draw();
  const node = h('div', 'sl-q', h('div', 'sl-ask', 'Set the clock to'), h('div', 'sl-big ck-ask', shown), svg, h('div', 'sl-help', 'Drag the long hand for minutes, the short hand for hours'));
  return {
    node,
    check: () => {
      locked = true;
      const want = (hh % 12) * 60 + mm, diff = Math.min(Math.abs(total - want), 720 - Math.abs(total - want));
      const stars = diff === 0 ? 3 : diff <= 5 ? 2 : diff <= 15 ? 1 : 0;
      const got = `${Math.floor(total / 60) || 12}:${String(total % 60).padStart(2, '0')}`;
      if (diff) { total = want; draw(); svg.classList.add('ck-fixed'); }
      return { stars, text: diff === 0 ? `Yes! That's ${shown}.` : `You set ${got}. This is ${hh}:${String(mm).padStart(2, '0')}.` };
    },
  };
}

/* ---------------- 🐘 How Big? ---------------- */
const KID_M = 1.3, KID_KG = 26, CAR_KG = 1500;
function niceMax(v: number): number { // a round slider end, 1.6–3× the answer so the middle isn't always right
  const raw = v * (1.6 + Math.random() * 1.4), p = Math.pow(10, Math.floor(Math.log10(raw)));
  return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((k) => k * p).find((x) => x >= raw) ?? 10 * p;
}
let bigDeck: Fact[] = [];
function howBig(_i: number): Asked {
  if (!bigDeck.length) bigDeck = shuffled((FACTS as unknown as Fact[]).filter((f) => f.q !== 'REFERENCE'));
  const f = bigDeck.pop() as Fact;
  const max = niceMax(f.value), step = max / 200;
  const dp = step < 0.1 ? 1 : 0;
  const unitWord = f.unit === 't' ? ' tonnes' : f.unit === 'kg' ? ' kg' : ' m';
  const read = h('div', 'sl-read', `0${unitWord}`);
  const sl = makeSlider({ min: 0, max, step, start: 0, ticks: 4, labels: ['0', `${fmt(max, dp)}${unitWord}`], onInput: (v) => { read.textContent = `${fmt(v, dp)}${unitWord}`; } });
  const ref = f.kind === 'weight' ? `You weigh about ${KID_KG} kg` : `You're about ${KID_M} m tall`;
  const node = h('div', 'sl-q', h('div', 'hb-emoji', f.emoji), h('div', 'sl-ask hb-q', f.q), read, sl.el, h('div', 'sl-help', `🧒 ${ref}`));
  return {
    node,
    check: () => {
      sl.lock(); sl.mark(f.value, `${fmt(f.value, 1)}`);
      const g = sl.get(), err = Math.abs(g - f.value) / f.value;
      const stars = err <= 0.1 ? 3 : err <= 0.25 ? 2 : err <= 0.5 ? 1 : 0;
      const kg = f.unit === 't' ? f.value * 1000 : f.value;
      const like = f.kind === 'weight'
        ? kg <= 3000 ? `That's about ${fmt(Math.max(1, Math.round(kg / KID_KG)))} kids like you!` : `That's about ${fmt(Math.round(kg / CAR_KG))} cars!`
        : f.kind === 'length'
          ? `That's about ${fmt(Math.max(1, Math.round(f.value / KID_M)))} of you, lying head to toe!`
          : `That's about ${fmt(Math.max(1, Math.round(f.value / KID_M)))} of you, standing on each other's heads!`;
      return { stars, text: `It's about ${fmt(f.value, 1)}${unitWord}. ${like} ${f.note}` };
    },
  };
}

/* ---------------- menu ---------------- */
const GAMES = [
  { icon: '📏', title: 'Number Line', sub: 'Where does the number go?', accent: '#2dd4bf', make: numberLine },
  { icon: '👀', title: 'How Many?', sub: 'Quick look, then guess!', accent: '#f472b6', make: howMany },
  { icon: '🕐', title: 'Set the Clock', sub: 'Drag the hands!', accent: '#22d3ee', make: setClock },
  { icon: '🐘', title: 'How Big?', sub: 'Tall, long, heavy: guess it!', accent: '#fbbf24', make: howBig },
];
export function mountSlide(app: HTMLElement, onHome: () => void): void {
  const menu = (): void => {
    const back = h('button', 'icon-btn', '←');
    back.setAttribute('aria-label', 'Back');
    back.onclick = onHome;
    app.replaceChildren(h('div', 'screen slidegame',
      h('header', 'game-header', back, h('span', 'hud-subject', '🎚️ Slide'), h('span', 'hud-spacer')),
      h('p', 'sl-intro', 'Answer with a slider. The closer you get, the more stars!'),
      h('div', 'sl-menu', ...GAMES.map((g) => {
        const b = h('button', 'circ-launch sl-pick', h('span', 'circ-launch-icon', g.icon), h('span', 'circ-launch-text', h('span', 'circ-launch-title', g.title), h('span', 'circ-launch-sub', g.sub)));
        b.style.setProperty('--accent', g.accent);
        b.onclick = () => { sfx.tap(); runRound(app, menu, `${g.icon} ${g.title}`, g.accent, g.make); };
        return b;
      }))));
  };
  menu();
}
