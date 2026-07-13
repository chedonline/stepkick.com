// The sticker book: a forever-climbing star total (⭐ per correct answer)
// unlocks stickers in order, filling themed pages.

export interface Sticker {
  emoji: string;
  name: string;
}

export interface StickerSet {
  name: string;
  emoji: string;
  stickers: Sticker[];
}

/** 1 sticker unlocks every N stars (a star = a correct answer, ever). */
export const STARS_PER_STICKER = 5;

export const STICKER_SETS: StickerSet[] = [
  {
    name: 'Farm',
    emoji: '🚜',
    stickers: [
      { emoji: '🐶', name: 'Dog' },
      { emoji: '🐱', name: 'Cat' },
      { emoji: '🐮', name: 'Cow' },
      { emoji: '🐷', name: 'Pig' },
      { emoji: '🐔', name: 'Chicken' },
      { emoji: '🐴', name: 'Horse' },
      { emoji: '🐑', name: 'Sheep' },
      { emoji: '🐰', name: 'Rabbit' },
    ],
  },
  {
    name: 'Ocean',
    emoji: '🌊',
    stickers: [
      { emoji: '🐟', name: 'Fish' },
      { emoji: '🐠', name: 'Tropical Fish' },
      { emoji: '🐬', name: 'Dolphin' },
      { emoji: '🐙', name: 'Octopus' },
      { emoji: '🦀', name: 'Crab' },
      { emoji: '🦈', name: 'Shark' },
      { emoji: '🐳', name: 'Whale' },
      { emoji: '🐚', name: 'Shell' },
    ],
  },
  {
    name: 'Space',
    emoji: '🚀',
    stickers: [
      { emoji: '🚀', name: 'Rocket' },
      { emoji: '🌙', name: 'Moon' },
      { emoji: '⭐', name: 'Star' },
      { emoji: '🪐', name: 'Planet' },
      { emoji: '☄️', name: 'Comet' },
      { emoji: '🛸', name: 'UFO' },
      { emoji: '👽', name: 'Alien' },
      { emoji: '🌍', name: 'Earth' },
    ],
  },
  {
    name: 'Treats',
    emoji: '🍩',
    stickers: [
      { emoji: '🍎', name: 'Apple' },
      { emoji: '🍌', name: 'Banana' },
      { emoji: '🍓', name: 'Strawberry' },
      { emoji: '🍕', name: 'Pizza' },
      { emoji: '🍔', name: 'Burger' },
      { emoji: '🍪', name: 'Cookie' },
      { emoji: '🍩', name: 'Donut' },
      { emoji: '🎂', name: 'Cake' },
    ],
  },
  {
    name: 'Bugs',
    emoji: '🐝',
    stickers: [
      { emoji: '🐝', name: 'Bee' },
      { emoji: '🐞', name: 'Ladybug' },
      { emoji: '🦋', name: 'Butterfly' },
      { emoji: '🐌', name: 'Snail' },
      { emoji: '🐛', name: 'Caterpillar' },
      { emoji: '🕷️', name: 'Spider' },
      { emoji: '🐜', name: 'Ant' },
      { emoji: '🦗', name: 'Cricket' },
    ],
  },
  {
    name: 'Magic',
    emoji: '🦄',
    stickers: [
      { emoji: '🦄', name: 'Unicorn' },
      { emoji: '🐉', name: 'Dragon' },
      { emoji: '🧚', name: 'Fairy' },
      { emoji: '🔮', name: 'Crystal Ball' },
      { emoji: '🌈', name: 'Rainbow' },
      { emoji: '⚡', name: 'Lightning' },
      { emoji: '🍄', name: 'Mushroom' },
      { emoji: '👑', name: 'Crown' },
    ],
  },
];

/** Flattened unlock order — stickers unlock set by set, in this order. */
export const ALL_STICKERS: Sticker[] = STICKER_SETS.flatMap((s) => s.stickers);

/** How many stickers a given star total has unlocked. */
export function unlockedFor(stars: number): number {
  return Math.min(ALL_STICKERS.length, Math.floor(stars / STARS_PER_STICKER));
}
