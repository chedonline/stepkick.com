import type { Question, SubjectPack } from '../engine/types';
import { type BankItem, bankSequence, distractorsFrom, orderAlpha } from './util';

// Picture -> word. Grouped so wrong answers stay in the same category.
const BANK: BankItem[] = [
  { emoji: '🍎', label: 'Apple', group: 'food' },
  { emoji: '🍌', label: 'Banana', group: 'food' },
  { emoji: '🍓', label: 'Strawberry', group: 'food' },
  { emoji: '🥕', label: 'Carrot', group: 'food' },
  { emoji: '🍞', label: 'Bread', group: 'food' },
  { emoji: '🧀', label: 'Cheese', group: 'food' },
  { emoji: '🚗', label: 'Car', group: 'vehicle' },
  { emoji: '🚌', label: 'Bus', group: 'vehicle' },
  { emoji: '✈️', label: 'Plane', group: 'vehicle' },
  { emoji: '🚲', label: 'Bike', group: 'vehicle' },
  { emoji: '🚂', label: 'Train', group: 'vehicle' },
  { emoji: '⛵', label: 'Boat', group: 'vehicle' },
  { emoji: '👕', label: 'Shirt', group: 'clothes' },
  { emoji: '🧢', label: 'Hat', group: 'clothes' },
  { emoji: '👟', label: 'Shoe', group: 'clothes' },
  { emoji: '🧦', label: 'Sock', group: 'clothes' },
  { emoji: '🌧️', label: 'Rain', group: 'weather' },
  { emoji: '☀️', label: 'Sun', group: 'weather' },
  { emoji: '❄️', label: 'Snow', group: 'weather' },
  { emoji: '🌈', label: 'Rainbow', group: 'weather' },
];

const COLORS = ['#a78bfa', '#c084fc', '#f0abfc'];

export const vocabPack: SubjectPack = {
  meta: { id: 'vocab', emoji: '🖼️', name: 'Words', blurb: 'Name the picture', accent: '#a78bfa' },
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
