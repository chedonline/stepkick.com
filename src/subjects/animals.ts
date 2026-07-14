import type { Question, SubjectPack } from '../engine/types';
import { type Rng, pick, shuffle } from '../engine/rng';
import { orderAlpha } from './util';

type Cls = 'mammal' | 'bird' | 'fish' | 'reptile' | 'amphibian' | 'bug' | 'sea';
type Habitat = 'savanna' | 'farm' | 'forest' | 'jungle' | 'ocean' | 'polar' | 'desert' | 'pond' | 'garden';

interface Animal {
  emoji: string;
  name: string;
  cls: Cls;
  habitat: Habitat;
  fly?: boolean;
  hard?: boolean; // less-common — only shown as the answer at higher difficulty
}

// Ordered roughly common → rare. `hard` ones are gated behind difficulty.
const BANK: Animal[] = [
  { emoji: '🦁', name: 'Lion', cls: 'mammal', habitat: 'savanna' },
  { emoji: '🐘', name: 'Elephant', cls: 'mammal', habitat: 'savanna' },
  { emoji: '🦒', name: 'Giraffe', cls: 'mammal', habitat: 'savanna' },
  { emoji: '🦓', name: 'Zebra', cls: 'mammal', habitat: 'savanna' },
  { emoji: '🐯', name: 'Tiger', cls: 'mammal', habitat: 'jungle' },
  { emoji: '🐻', name: 'Bear', cls: 'mammal', habitat: 'forest' },
  { emoji: '🦊', name: 'Fox', cls: 'mammal', habitat: 'forest' },
  { emoji: '🐰', name: 'Rabbit', cls: 'mammal', habitat: 'forest' },
  { emoji: '🐵', name: 'Monkey', cls: 'mammal', habitat: 'jungle' },
  { emoji: '🐮', name: 'Cow', cls: 'mammal', habitat: 'farm' },
  { emoji: '🐷', name: 'Pig', cls: 'mammal', habitat: 'farm' },
  { emoji: '🐴', name: 'Horse', cls: 'mammal', habitat: 'farm' },
  { emoji: '🐑', name: 'Sheep', cls: 'mammal', habitat: 'farm' },
  { emoji: '🐐', name: 'Goat', cls: 'mammal', habitat: 'farm' },
  { emoji: '🐶', name: 'Dog', cls: 'mammal', habitat: 'farm' },
  { emoji: '🐱', name: 'Cat', cls: 'mammal', habitat: 'farm' },
  { emoji: '🐸', name: 'Frog', cls: 'amphibian', habitat: 'pond' },
  { emoji: '🐟', name: 'Fish', cls: 'fish', habitat: 'ocean' },
  { emoji: '🦈', name: 'Shark', cls: 'fish', habitat: 'ocean' },
  { emoji: '🐬', name: 'Dolphin', cls: 'mammal', habitat: 'ocean' },
  { emoji: '🐙', name: 'Octopus', cls: 'sea', habitat: 'ocean' },
  { emoji: '🦀', name: 'Crab', cls: 'sea', habitat: 'ocean' },
  { emoji: '🐢', name: 'Turtle', cls: 'reptile', habitat: 'ocean' },
  { emoji: '🐍', name: 'Snake', cls: 'reptile', habitat: 'jungle' },
  { emoji: '🦅', name: 'Eagle', cls: 'bird', habitat: 'forest', fly: true },
  { emoji: '🦉', name: 'Owl', cls: 'bird', habitat: 'forest', fly: true },
  { emoji: '🦆', name: 'Duck', cls: 'bird', habitat: 'pond', fly: true },
  { emoji: '🐧', name: 'Penguin', cls: 'bird', habitat: 'polar' },
  { emoji: '🐝', name: 'Bee', cls: 'bug', habitat: 'garden', fly: true },
  { emoji: '🦋', name: 'Butterfly', cls: 'bug', habitat: 'garden', fly: true },
  { emoji: '🐞', name: 'Ladybug', cls: 'bug', habitat: 'garden', fly: true },
  { emoji: '🐜', name: 'Ant', cls: 'bug', habitat: 'garden' },
  // rarer — great recall challenge, still an unambiguous picture
  { emoji: '🦥', name: 'Sloth', cls: 'mammal', habitat: 'jungle', hard: true },
  { emoji: '🦡', name: 'Badger', cls: 'mammal', habitat: 'forest', hard: true },
  { emoji: '🦔', name: 'Hedgehog', cls: 'mammal', habitat: 'forest', hard: true },
  { emoji: '🦫', name: 'Beaver', cls: 'mammal', habitat: 'pond', hard: true },
  { emoji: '🦦', name: 'Otter', cls: 'mammal', habitat: 'pond', hard: true },
  { emoji: '🦭', name: 'Seal', cls: 'mammal', habitat: 'polar', hard: true },
  { emoji: '🦛', name: 'Hippo', cls: 'mammal', habitat: 'savanna', hard: true },
  { emoji: '🦏', name: 'Rhino', cls: 'mammal', habitat: 'savanna', hard: true },
  { emoji: '🦌', name: 'Deer', cls: 'mammal', habitat: 'forest', hard: true },
  { emoji: '🐪', name: 'Camel', cls: 'mammal', habitat: 'desert', hard: true },
  { emoji: '🦩', name: 'Flamingo', cls: 'bird', habitat: 'pond', fly: true, hard: true },
  { emoji: '🦜', name: 'Parrot', cls: 'bird', habitat: 'jungle', fly: true, hard: true },
  { emoji: '🦎', name: 'Lizard', cls: 'reptile', habitat: 'desert', hard: true },
  { emoji: '🐊', name: 'Crocodile', cls: 'reptile', habitat: 'pond', hard: true },
  { emoji: '🦂', name: 'Scorpion', cls: 'bug', habitat: 'desert', hard: true },
  { emoji: '🕷️', name: 'Spider', cls: 'bug', habitat: 'garden', hard: true },
];

const COLORS = ['#5eead4', '#34d399', '#2dd4bf'];
const bankIndex = (emoji: string): number => BANK.findIndex((a) => a.emoji === emoji);
const orderByBank = (a: string, b: string): number => bankIndex(a) - bankIndex(b);

/** Wrong answers: prefer same class, then same habitat, then anything. */
function similar(ans: Animal, rng: Rng, n: number): Animal[] {
  const sameCls = BANK.filter((a) => a.cls === ans.cls && a.emoji !== ans.emoji);
  const sameHab = BANK.filter((a) => a.habitat === ans.habitat && a.emoji !== ans.emoji);
  const rest = BANK.filter((a) => a.emoji !== ans.emoji);
  const out: Animal[] = [];
  const seen = new Set<string>();
  for (const a of [...shuffle(sameCls, rng), ...shuffle(sameHab, rng), ...shuffle(rest, rng)]) {
    if (out.length >= n) break;
    if (!seen.has(a.emoji)) {
      seen.add(a.emoji);
      out.push(a);
    }
  }
  return out;
}

/** Classify templates — "which one is a…" / "which can…" / "which lives…". */
const CLASSIFY: { q: string; pred: (a: Animal) => boolean }[] = [
  { q: 'Which one is a BIRD?', pred: (a) => a.cls === 'bird' },
  { q: 'Which one is a FISH?', pred: (a) => a.cls === 'fish' },
  { q: 'Which one is a REPTILE?', pred: (a) => a.cls === 'reptile' },
  { q: 'Which one is a BUG?', pred: (a) => a.cls === 'bug' },
  { q: 'Which one is a MAMMAL?', pred: (a) => a.cls === 'mammal' },
  { q: 'Which one can FLY?', pred: (a) => a.fly === true },
  { q: 'Which one lives in the OCEAN?', pred: (a) => a.habitat === 'ocean' },
  { q: 'Which one lives on a FARM?', pred: (a) => a.habitat === 'farm' },
];

function pickAnswer(rng: Rng, d: number): Animal {
  const pool = d < 0.4 ? BANK.filter((a) => !a.hard) : BANK;
  return pick(pool, rng);
}

function recognition(rng: Rng, d: number): Question {
  const ans = pickAnswer(rng, d);
  const wrong = similar(ans, rng, 3);
  return {
    prompt: { kind: 'emoji', emoji: ans.emoji },
    answer: ans.name,
    choices: [ans.name, ...wrong.map((w) => w.name)].sort(orderAlpha),
    choiceKind: 'text',
    colors: COLORS,
  };
}

function reverse(rng: Rng, d: number): Question {
  const ans = pickAnswer(rng, d);
  const wrong = similar(ans, rng, 3);
  return {
    prompt: { kind: 'word', text: ans.name },
    answer: ans.emoji,
    choices: [ans.emoji, ...wrong.map((w) => w.emoji)].sort(orderByBank),
    choiceKind: 'emoji',
    colors: COLORS,
  };
}

function classify(rng: Rng): Question {
  const t = pick(CLASSIFY, rng);
  const yes = BANK.filter(t.pred);
  const no = BANK.filter((a) => !t.pred(a));
  const correct = pick(yes, rng);
  const wrong = shuffle(no, rng).slice(0, 3);
  return {
    prompt: { kind: 'word', text: t.q },
    answer: correct.emoji,
    choices: [correct.emoji, ...wrong.map((w) => w.emoji)].sort(orderByBank),
    choiceKind: 'emoji',
    colors: COLORS,
  };
}

function build(rng: Rng, d: number): Question {
  // easy: recognize common animals. mid: + reverse. hard: + classify & rare animals.
  if (d < 0.3) return recognition(rng, d);
  const r = rng();
  if (d < 0.55) return r < 0.6 ? recognition(rng, d) : reverse(rng, d);
  if (r < 0.4) return classify(rng);
  if (r < 0.72) return reverse(rng, d);
  return recognition(rng, d);
}

export const animalsPack: SubjectPack = {
  meta: { id: 'animals', emoji: '🦁', name: 'Animals', blurb: 'Who is it?', accent: '#5eead4' },
  session: (rng) => (_index, difficulty) => build(rng, difficulty),
};
