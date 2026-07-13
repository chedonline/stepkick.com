import { type Rng, shuffle } from '../engine/rng';

/**
 * A bank item: a picture and its label, grouped so wrong answers are plausible
 * (drawn from the same group when possible).
 */
export interface BankItem {
  emoji: string;
  label: string;
  group: string;
}

/**
 * Pick `count` wrong labels for `answer`. Prefers same-group items (harder,
 * more plausible), falls back to anything. Never returns the answer or a dupe.
 */
export function distractorsFrom(
  answer: BankItem,
  bank: readonly BankItem[],
  rng: Rng,
  count = 3,
): string[] {
  const sameGroup = bank.filter((b) => b.group === answer.group && b.label !== answer.label);
  const other = bank.filter((b) => b.group !== answer.group && b.label !== answer.label);
  const ordered = [...shuffle(sameGroup, rng), ...shuffle(other, rng)];

  const out: string[] = [];
  for (const b of ordered) {
    if (out.length >= count) break;
    if (!out.includes(b.label)) out.push(b.label);
  }
  return out;
}

/**
 * Choice comparators. Every subject sorts its 4 choices into a consistent
 * on-screen order (a 2×2 grid reads left→right, top→bottom). The answer's slot
 * still varies question-to-question because the distractors are random.
 */
export const orderNumeric = (a: string, b: string): number => Number(a) - Number(b);
export const orderAlpha = (a: string, b: string): number => a.localeCompare(b);

/**
 * Endless no-repeat walk through a bank: a shuffled order, reshuffled each time
 * it's exhausted, so an item repeats only after the whole bank has been seen.
 */
export function bankSequence(bank: readonly BankItem[], rng: Rng): (index: number) => BankItem {
  let order = shuffle(bank, rng);
  let cycle = 0;
  return (index: number) => {
    const c = Math.floor(index / bank.length);
    if (c !== cycle) {
      order = shuffle(bank, rng);
      cycle = c;
    }
    return order[index % bank.length];
  };
}
