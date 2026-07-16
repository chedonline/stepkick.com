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

/** 1 sticker unlocks every N stars (a star = a correct answer, ever).
 *  Tuned to 6 (was 5) — a 20% higher bar so stickers feel more earned. */
export const STARS_PER_STICKER = 6;

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
  {
    name: 'Dinos',
    emoji: '🦕',
    stickers: [
      { emoji: '🦖', name: 'T-Rex' },
      { emoji: '🦕', name: 'Longneck' },
      { emoji: '🐊', name: 'Crocodile' },
      { emoji: '🐢', name: 'Turtle' },
      { emoji: '🦎', name: 'Lizard' },
      { emoji: '🐍', name: 'Snake' },
      { emoji: '🦴', name: 'Bone' },
      { emoji: '🥚', name: 'Egg' },
    ],
  },
  {
    name: 'Go!',
    emoji: '🚗',
    stickers: [
      { emoji: '🚗', name: 'Car' },
      { emoji: '🚕', name: 'Taxi' },
      { emoji: '🚌', name: 'Bus' },
      { emoji: '🚓', name: 'Police Car' },
      { emoji: '🚑', name: 'Ambulance' },
      { emoji: '🚒', name: 'Fire Truck' },
      { emoji: '🚂', name: 'Train' },
      { emoji: '✈️', name: 'Airplane' },
    ],
  },
  {
    name: 'Weather',
    emoji: '🌤️',
    stickers: [
      { emoji: '☀️', name: 'Sun' },
      { emoji: '⛅', name: 'Cloud' },
      { emoji: '🌧️', name: 'Rain' },
      { emoji: '⛈️', name: 'Storm' },
      { emoji: '❄️', name: 'Snowflake' },
      { emoji: '☃️', name: 'Snowman' },
      { emoji: '🌬️', name: 'Wind' },
      { emoji: '🌪️', name: 'Tornado' },
    ],
  },
];

/** Flattened unlock order — stickers unlock set by set, in this order. */
export const ALL_STICKERS: Sticker[] = STICKER_SETS.flatMap((s) => s.stickers);
export const SET_COUNT = STICKER_SETS.length;

// Sticker gating: each subject / mode fills ONE set. Play those to earn that set.
// Index = position in STICKER_SETS (Farm, Ocean, Space, Treats, Bugs, Magic,
// Dinos, Go!, Weather).
export const GROUP_OF: Record<string, number> = {
  animals: 0, compare: 0,
  counting: 1, skipcount: 1,
  math: 2, fractions: 2,
  vocab: 3, spelling: 3,
  patterns: 4, prints: 4,
  calendar: 5, clock: 5, money: 5,
  circuits: 6, maze: 6,
  sort: 7, tapall: 7, order: 7,
  memory: 8, mensa: 8, surprise: 8,
};

/** Pretty source names per set (aligned to STICKER_SETS order) — for book labels. */
export const GROUP_SOURCES: string[][] = [
  ['Animals', 'Compare'],
  ['Counting', 'Skip Count'],
  ['Math', 'Fractions'],
  ['Words', 'Spelling'],
  ['Patterns', 'Prints'],
  ['Calendar', 'Clock', 'Money'],
  ['Circuits', 'Maze'],
  ['Sort', 'Find', 'Order'],
  ['Memory', 'Shapes', 'Surprise'],
];

/** Global index where a set's stickers begin in ALL_STICKERS. */
export function setBaseIndex(setIndex: number): number {
  let base = 0;
  for (let i = 0; i < setIndex; i++) base += STICKER_SETS[i].stickers.length;
  return base;
}

/** How many stickers in a set the group's stars have unlocked. */
export function unlockedInSet(setIndex: number, groupStars: number[]): number {
  const n = STICKER_SETS[setIndex].stickers.length;
  return Math.min(n, Math.floor((groupStars[setIndex] ?? 0) / STARS_PER_STICKER));
}

/** Total stickers unlocked across all sets. */
export function totalUnlocked(groupStars: number[]): number {
  let sum = 0;
  for (let i = 0; i < SET_COUNT; i++) sum += unlockedInSet(i, groupStars);
  return sum;
}
