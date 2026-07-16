import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, randInt, shuffle } from '../engine/rng';
import { orderAlpha } from './util';

// Days, seasons, and (at higher difficulty) months.
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const SEASONS = [
  { name: 'Spring', emoji: '🌷' },
  { name: 'Summer', emoji: '☀️' },
  { name: 'Fall', emoji: '🍂' },
  { name: 'Winter', emoji: '❄️' },
];
const COLORS = ['#a78bfa', '#c4b5fd', '#8b5cf6'];

/** "What comes after/before X?" over a wrapping list. */
function orderQ(rng: Rng, list: string[], noun: string): Question {
  const after = rng() < 0.5;
  const i = randInt(rng, 0, list.length - 1);
  const answer = list[(i + (after ? 1 : -1) + list.length) % list.length];
  const wrong = shuffle(list.filter((x) => x !== answer && x !== list[i]), rng).slice(0, 3);
  const choices = [answer, ...wrong].sort(orderAlpha);
  return {
    prompt: { kind: 'word', text: `What ${noun} comes ${after ? 'after' : 'before'} ${list[i]}?` },
    answer,
    choices,
    choiceKind: 'text',
    colors: COLORS,
  };
}

function seasonQ(rng: Rng): Question {
  const s = pick(SEASONS, rng);
  const choices = SEASONS.map((x) => x.name).sort(orderAlpha);
  return {
    prompt: { kind: 'emoji', emoji: s.emoji, caption: 'Which season?' },
    answer: s.name,
    choices,
    choiceKind: 'text',
    colors: COLORS,
  };
}

function build(rng: Rng, d: number): Question {
  const r = rng();
  if (d < 0.4) return r < 0.5 ? orderQ(rng, DAYS, 'day') : seasonQ(rng);
  if (r < 0.4) return orderQ(rng, DAYS, 'day');
  if (r < 0.7) return seasonQ(rng);
  return orderQ(rng, MONTHS, 'month');
}

export const calendarPack: SubjectPack = {
  meta: { id: 'calendar', emoji: '📅', name: 'Calendar', blurb: 'Days & seasons', accent: '#a78bfa' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
