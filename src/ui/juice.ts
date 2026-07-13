// The dopamine layer: confetti bursts, flash words, score fly-ups.
// All overlays live on the app root, pointer-events: none, self-cleaning.
// Lifted from whattheflag.net — subject-agnostic, unchanged.

import { h } from './dom';

// --- confetti ------------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  hgt: number;
  color: string;
  born: number;
}

const LIFE_MS = 1000;
const GRAVITY = 0.12;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let raf = 0;

function ensureCanvas(host: HTMLElement): CanvasRenderingContext2D {
  if (!canvas || canvas.parentElement !== host) {
    canvas?.remove();
    canvas = h('canvas', 'juice-canvas');
    host.append(canvas);
    ctx = canvas.getContext('2d')!;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = host.getBoundingClientRect();
  if (canvas.width !== Math.round(rect.width * dpr)) {
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return ctx!;
}

function loop(): void {
  if (!ctx || !canvas) return;
  const now = performance.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => now - p.born < LIFE_MS);
  if (particles.length === 0) {
    raf = 0;
    return;
  }
  for (const p of particles) {
    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    const age = (now - p.born) / LIFE_MS;
    ctx.save();
    ctx.globalAlpha = age > 0.7 ? 1 - (age - 0.7) / 0.3 : 1;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.hgt / 2, p.w, p.hgt);
    ctx.restore();
  }
  raf = requestAnimationFrame(loop);
}

/** Burst of confetti at (x, y) — coordinates relative to `host`. */
export function confettiBurst(host: HTMLElement, x: number, y: number, colors: string[]): void {
  ensureCanvas(host);
  const palette = colors.length > 0 ? colors : ['#22d3ee', '#fbbf24', '#4ade80'];
  const now = performance.now();
  for (let i = 0; i < 32; i++) {
    const angle = Math.PI * (1 + Math.random()); // upward half-circle
    const speed = 3 + Math.random() * 7;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1),
      vy: Math.sin(angle) * speed - 2,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      w: 5 + Math.random() * 6,
      hgt: 4 + Math.random() * 5,
      color: palette[i % palette.length],
      born: now,
    });
  }
  if (!raf) raf = requestAnimationFrame(loop);
}

/** Burst centered on an element. */
export function confettiFrom(host: HTMLElement, el: HTMLElement, colors: string[]): void {
  const hostRect = host.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  confettiBurst(host, r.left - hostRect.left + r.width / 2, r.top - hostRect.top + r.height / 2, colors);
}

// --- flash words -----------------------------------------------------------

const WORDS = ['YES!', 'NICE!', 'BOOM!', 'SHARP!', 'NAILED IT!', 'SWEET!', 'YOU GOT IT!', 'OH YEAH!'];
const RARE = ['🌋 VOLCANIC!', '🧠 GALAXY BRAIN!', '🦅 EAGLE EYE!', '⚡ LIGHTNING!'];
let lastWord = '';

export function flashWord(host: HTMLElement): void {
  let word: string;
  do {
    word = Math.random() < 0.06 ? RARE[Math.floor(Math.random() * RARE.length)] : WORDS[Math.floor(Math.random() * WORDS.length)];
  } while (word === lastWord);
  lastWord = word;
  const el = h('div', 'flash-word', word);
  el.style.setProperty('--tilt', `${(Math.random() * 10 - 5).toFixed(1)}deg`);
  host.append(el);
  setTimeout(() => el.remove(), 750);
}

// --- score fly-up ----------------------------------------------------------

export function flyScore(host: HTMLElement, from: HTMLElement, to: HTMLElement, text: string, onArrive?: () => void): void {
  const hostRect = host.getBoundingClientRect();
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const el = h('div', 'score-fly', text);
  el.style.left = `${a.left - hostRect.left + a.width / 2}px`;
  el.style.top = `${a.top - hostRect.top + a.height / 2}px`;
  host.append(el);
  const dx = b.left - hostRect.left + b.width / 2 - (a.left - hostRect.left + a.width / 2);
  const dy = b.top - hostRect.top + b.height / 2 - (a.top - hostRect.top + a.height / 2);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.5)`;
      el.style.opacity = '0.15';
    }),
  );
  setTimeout(() => {
    el.remove();
    onArrive?.();
  }, 620);
}
