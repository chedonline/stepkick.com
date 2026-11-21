import type { SubjectMeta, SubjectPack } from '../engine/types';
import { mathPack } from './math';
import { fractionsPack } from './fractions';
import { skipcountPack } from './skipcount';
import { clockPack } from './clock';
import { calendarPack } from './calendar';

/**
 * A subject made of other subjects: each question comes from one of `parts`, picked by
 * weight. Used to fold small subjects into a bigger one (2026-11-21 clean-up) without
 * rewriting their question generators. Keeps the first part's id, so saved bests and
 * sticker stars carry on.
 */
export function mixPack(meta: SubjectMeta, parts: [SubjectPack, number][]): SubjectPack {
  return {
    meta,
    session: (rng) => {
      const gens = parts.map(([p, w]) => [p.session(rng), w] as const);
      const total = gens.reduce((s, [, w]) => s + w, 0);
      return (index, difficulty) => {
        let roll = rng() * total;
        for (const [gen, w] of gens) {
          roll -= w;
          if (roll <= 0) return gen(index, difficulty);
        }
        return gens[0][0](index, difficulty);
      };
    },
  };
}

/** Math = arithmetic + Fractions (shaded pies) + Skip Count. */
export const mathAllPack = mixPack(
  { ...mathPack.meta, blurb: '+ − ×, fractions, skip counting' },
  [[mathPack, 6], [fractionsPack, 2.5], [skipcountPack, 1.5]],
);

/** Time = Clock + Calendar (days, months, seasons). */
export const timePack = mixPack(
  { ...clockPack.meta, name: 'Time', blurb: 'Clocks, days & seasons' },
  [[clockPack, 6], [calendarPack, 4]],
);
