import type { Question, SubjectPack } from '../engine/types';
import { type BankItem, bankSequence, distractorsFrom, orderAlpha } from './util';

// Animal picture -> name. Grouped by habitat so wrong answers are plausible.
const BANK: BankItem[] = [
  { emoji: '🦁', label: 'Lion', group: 'savanna' },
  { emoji: '🐘', label: 'Elephant', group: 'savanna' },
  { emoji: '🦒', label: 'Giraffe', group: 'savanna' },
  { emoji: '🦓', label: 'Zebra', group: 'savanna' },
  { emoji: '🐆', label: 'Leopard', group: 'savanna' },
  { emoji: '🐟', label: 'Fish', group: 'ocean' },
  { emoji: '🐙', label: 'Octopus', group: 'ocean' },
  { emoji: '🐬', label: 'Dolphin', group: 'ocean' },
  { emoji: '🦈', label: 'Shark', group: 'ocean' },
  { emoji: '🦀', label: 'Crab', group: 'ocean' },
  { emoji: '🐶', label: 'Dog', group: 'farm' },
  { emoji: '🐄', label: 'Cow', group: 'farm' },
  { emoji: '🐷', label: 'Pig', group: 'farm' },
  { emoji: '🐔', label: 'Chicken', group: 'farm' },
  { emoji: '🐴', label: 'Horse', group: 'farm' },
  { emoji: '🦉', label: 'Owl', group: 'forest' },
  { emoji: '🦊', label: 'Fox', group: 'forest' },
  { emoji: '🐻', label: 'Bear', group: 'forest' },
  { emoji: '🦌', label: 'Deer', group: 'forest' },
  { emoji: '🐿️', label: 'Squirrel', group: 'forest' },
];

const COLORS = ['#4ade80', '#34d399', '#a3e635'];

export const animalsPack: SubjectPack = {
  meta: { id: 'animals', emoji: '🦁', name: 'Animals', blurb: 'Who is it?', accent: '#4ade80' },
  session: (rng) => {
    const nextItem = bankSequence(BANK, rng);
    return (index): Question => {
      const item = nextItem(index);
      const choices = [item.label, ...distractorsFrom(item, BANK, rng)].sort(orderAlpha);
      return {
        prompt: { kind: 'emoji', emoji: item.emoji },
        answer: item.label,
        choices,
        choiceKind: 'text',
        colors: COLORS,
      };
    };
  },
};
