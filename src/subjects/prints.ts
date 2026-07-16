import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, shuffle } from '../engine/rng';
import { orderAlpha } from './util';

// "Name the pattern" — each prompt is a crisp SVG swatch (razor-sharp at any
// size, unlike a raster image). Kid-nameable design prints.
const COLORS = ['#f472b6', '#fbcfe8', '#f9a8d4'];

interface Print { name: string; svg: string; }

/** Wrap a repeating <pattern> body into a full rounded swatch. */
function swatch(id: string, size: number, body: string): string {
  return `<svg viewBox="0 0 160 160" class="swatch-svg" role="img" aria-label="pattern swatch" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><rect width="${size}" height="${size}" fill="#0f2b31"/>${body}</pattern></defs><rect width="160" height="160" rx="16" fill="url(#${id})"/><rect x="1" y="1" width="158" height="158" rx="15" fill="none" stroke="#1f4750" stroke-width="2"/></svg>`;
}

const PRINTS: Print[] = [
  { name: 'Stripes', svg: swatch('pStr', 32, `<rect width="16" height="32" fill="#f472b6"/>`) },
  { name: 'Polka Dot', svg: swatch('pDot', 34, `<circle cx="17" cy="17" r="7" fill="#fbbf24"/>`) },
  { name: 'Checkers', svg: swatch('pChk', 40, `<rect width="20" height="20" fill="#22d3ee"/><rect x="20" y="20" width="20" height="20" fill="#22d3ee"/>`) },
  { name: 'Grid', svg: swatch('pGrd', 32, `<path d="M0 0H32M0 0V32" stroke="#5eead4" stroke-width="3" fill="none"/>`) },
  { name: 'Chevron', svg: swatch('pChv', 40, `<path d="M0 28 L20 10 L40 28" fill="none" stroke="#a78bfa" stroke-width="8"/>`) },
  { name: 'Diagonal', svg: swatch('pDia', 24, `<path d="M-6 6 L6 -6 M0 24 L24 0 M18 30 L30 18" stroke="#4ade80" stroke-width="6"/>`) },
  { name: 'Plaid', svg: swatch('pPld', 40, `<rect width="40" height="12" fill="#ef4444" opacity="0.55"/><rect width="12" height="40" fill="#ef4444" opacity="0.55"/><rect y="22" width="40" height="5" fill="#fbbf24" opacity="0.8"/><rect x="22" width="5" height="40" fill="#fbbf24" opacity="0.8"/>`) },
  { name: 'Waves', svg: swatch('pWav', 40, `<path d="M0 12 Q10 4 20 12 T40 12 M0 32 Q10 24 20 32 T40 32" fill="none" stroke="#38bdf8" stroke-width="4"/>`) },
];

function build(rng: Rng): Question {
  const p = pick(PRINTS, rng);
  const wrong = shuffle(PRINTS.filter((x) => x.name !== p.name), rng).slice(0, 3).map((x) => x.name);
  const choices = [p.name, ...wrong].sort(orderAlpha);
  return { prompt: { kind: 'swatch', svg: p.svg }, answer: p.name, choices, choiceKind: 'text', colors: COLORS };
}

export const printsPack: SubjectPack = {
  meta: { id: 'prints', emoji: '🎨', name: 'Prints', blurb: 'Name the pattern', accent: '#f472b6' },
  session: (rng) => () => build(rng),
};
