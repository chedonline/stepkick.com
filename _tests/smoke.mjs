// Browser smoke test: boot the built app, play every subject end-to-end,
// assert no console errors and that the full home -> game -> results loop works.
// Reuses whattheflag.net's puppeteer-core + the system Chrome.
import { createServer } from 'vite';
import puppeteer from '../../whattheflag.net/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
// 2026-11-21 clean-up: Math (with fractions + skip count), Time (clock + calendar), Money, Patterns, Spelling, Prints, Surprise
const SUBJECTS = ['Math', 'Time', 'Money', 'Patterns', 'Spelling', 'Prints', 'Surprise'];

const server = await createServer({ root: process.cwd(), server: { port: 5199 } });
await server.listen();
const url = `http://localhost:5199/`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=430,860'],
});
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 860, deviceScaleFactor: 2 });

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push(`REQ FAIL ${r.url()}`));
page.on('response', (r) => r.status() === 404 && errors.push(`404 ${r.url()}`));

const shot = async (name) => {
  await page.screenshot({ path: `_tests/shot-${name}.png` });
  console.log(`  📸 ${name}`);
};

await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 400));

// home
const tiles = await page.$$('.subject-tile');
if (tiles.length !== SUBJECTS.length) throw new Error(`expected ${SUBJECTS.length} subject tiles, got ${tiles.length}`);
// BONUS badges on the multiplier subjects (Math 1.2×, Surprise 1.2×)
const badge = await page.evaluate(() => {
  const all = document.querySelectorAll('.tile-badge');
  return { count: all.length, text: all[0]?.textContent || '' };
});
if (badge.count !== 2) throw new Error(`home: expected 2 tile badges, got ${badge.count}`);
if (!badge.text.includes('BONUS')) throw new Error(`home: badge text wrong: "${badge.text}"`);
console.log(`  ✓ home badges: ${badge.count} × "${badge.text}"`);
await shot('home');

for (let s = 0; s < SUBJECTS.length; s++) {
  console.log(`▶ ${SUBJECTS[s]}`);
  const tile = (await page.$$('.subject-tile'))[s];
  await tile.click();
  await page.waitForSelector('.game .choice', { timeout: 3000 });

  // validate the first question of this subject
  const q = await page.evaluate(() => {
    const choices = [...document.querySelectorAll('.choice')].map((c) => c.dataset.choice);
    const promptKind = document.querySelector('.game-prompt > *')?.className;
    return { choices, promptKind, hasPrompt: !!document.querySelector('.game-prompt > *') };
  });
  if (q.choices.length !== 4) throw new Error(`${SUBJECTS[s]}: expected 4 choices, got ${q.choices.length}`);
  if (new Set(q.choices).size !== 4) throw new Error(`${SUBJECTS[s]}: duplicate choices ${JSON.stringify(q.choices)}`);
  if (!q.hasPrompt) throw new Error(`${SUBJECTS[s]}: no prompt rendered`);

  // ordering: Math ascending numeric, Words/Animals alphabetical
  const val = (x) => (x.includes('/') ? Number(x.split('/')[0]) / Number(x.split('/')[1]) : Number(x));
  const timeVal = (x) => { const [hh, mm] = x.split(':').map(Number); return hh * 60 + mm; };
  const cents = (x) => (x.includes('$') ? Math.round(parseFloat(x.replace('$', '')) * 100) : parseInt(x, 10));
  let ordered;
  if (s === 0) ordered = [...q.choices].sort((a, b) => val(a) - val(b)); // math (+ fractions, skip count): by value
  else if (s === 2) ordered = [...q.choices].sort((a, b) => cents(a) - cents(b)); // money: cent value
  else if (s === 1 || s === 3 || s === 6) ordered = q.choices; // time (clock or calendar) / patterns / surprise: not asserted
  else ordered = [...q.choices].sort((a, b) => a.localeCompare(b)); // spelling / prints: alpha
  void timeVal;
  if (JSON.stringify(ordered) !== JSON.stringify(q.choices))
    throw new Error(`${SUBJECTS[s]}: choices not in order → ${JSON.stringify(q.choices)}`);
  console.log(`  order ok: ${JSON.stringify(q.choices)}`);
  if (s === 0) await shot('game-math');
  if (s === 1) await shot('game-time');
  if (s === 2) await shot('game-money');
  if (s === 3) await shot('game-patterns');
  if (s === 4) await shot('game-spelling');

  // play all 10 questions (click first live choice each time), validating each
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('.game .choice:not([disabled])', { timeout: 3000 });
    const check = await page.evaluate(() => {
      const cs = [...document.querySelectorAll('.choice')].map((c) => c.dataset.choice);
      const prompt = document.querySelector('.game-prompt')?.textContent?.trim() || '';
      return { cs, prompt, bad: cs.some((c) => c == null || c === '' || c.includes('NaN') || c.includes('undefined')) };
    });
    if (check.cs.length !== 4) throw new Error(`${SUBJECTS[s]} q${i}: ${check.cs.length} choices`);
    if (new Set(check.cs).size !== 4) throw new Error(`${SUBJECTS[s]} q${i}: dup choices ${JSON.stringify(check.cs)}`);
    if (check.bad) throw new Error(`${SUBJECTS[s]} q${i}: bad choice ${JSON.stringify(check.cs)} (prompt "${check.prompt}")`);
    if (s === 0) console.log(`    math q${i}: "${check.prompt}" → ${JSON.stringify(check.cs)}`);
    const btn = await page.$('.game .choice:not([disabled])');
    await btn.click();
    await new Promise((r) => setTimeout(r, i === 9 ? 1800 : 1300));
  }

  await page.waitForSelector('.results', { timeout: 4000 });
  const res = await page.evaluate(() => ({
    score: parseInt(document.querySelector('.final-score')?.textContent || '0', 10),
    correctFrac: document.querySelector('.stat .stat-value')?.textContent || '0/0',
    badge: document.querySelector('.badge-label')?.textContent,
  }));
  console.log(`  ✓ finished — score ${res.score}, badge "${res.badge}"`);
  if (s === 0) {
    // Math is 1.2×: every correct answer is worth ≥120 (100 × 1.2, more with streak)
    const correct = parseInt(res.correctFrac.split('/')[0], 10) || 0;
    if (correct > 0 && res.score < correct * 120)
      throw new Error(`math 1.2× not applied: score ${res.score} < ${correct}×120`);
    console.log(`  ✓ math 1.2× applied: ${res.correctFrac} correct → ${res.score} pts (≥ ${correct * 120})`);
    await shot('results-math');
  }

  // back home (results now also has a "Sticker Book" ghost button, so target Home by text)
  await page.evaluate(() => [...document.querySelectorAll('.results-actions .btn')].find((b) => b.textContent.includes('Home'))?.click());
  await page.waitForSelector('.subject-grid', { timeout: 3000 });
}

// sticker book: after playing 4 subjects we've earned stars -> open the book
console.log('▶ Sticker Book');
// seed one group's stars so the sticker tests are deterministic (48 ⭐ ÷ 6 = 8 Farm stickers)
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('stepkick.v1') || '{}');
  s.stars = 48;
  s.groupStars = [48, 0, 0, 0, 0, 0, 0, 0, 0];
  localStorage.setItem('stepkick.v1', JSON.stringify(s));
});
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForSelector('.book-bar', { timeout: 3000 });
await shot('home-progress');
await page.click('.book-bar');
await page.waitForSelector('.book', { timeout: 3000 });
// defaults to Collected view: only earned stickers, all named
const collected = await page.evaluate(() => ({
  earned: document.querySelectorAll('.sticker.earned').length,
  named: document.querySelectorAll('.sticker .sticker-name').length,
  activeTab: document.querySelector('.seg-btn.is-active')?.textContent || '',
  sub: document.querySelector('.book-title-sub')?.textContent || '',
}));
if (!collected.activeTab.includes('Collected')) throw new Error(`book: expected Collected tab active, got "${collected.activeTab}"`);
if (collected.earned !== 8) throw new Error(`book Collected: expected 8 earned after seeding, got ${collected.earned}`);
if (collected.named !== collected.earned) throw new Error(`book Collected: ${collected.earned} earned but ${collected.named} named`);
console.log(`  ✓ Collected view: ${collected.earned} attained stickers, all named — "${collected.sub}"`);
// tap an earned sticker (plays its chime + pop) — must not error
const tappable = await page.$('button.sticker.earned');
if (!tappable) throw new Error('book: earned stickers are not tappable buttons');
await tappable.click();
await new Promise((r) => setTimeout(r, 150));
console.log('  ✓ tapped a sticker (chime + pop), no error');
await shot('sticker-collected');
// switch to All -> full 88-slot book (11 pages: 9 StepKick + Français + Rigolo)
await page.evaluate(() => [...document.querySelectorAll('.seg-btn')].find((b) => b.textContent.includes('All'))?.click());
await new Promise((r) => setTimeout(r, 200));
const all = await page.evaluate(() => document.querySelectorAll('.sticker').length);
if (all !== 88) throw new Error(`book All: expected 88 cells, got ${all}`);
console.log(`  ✓ All view: ${all} slots`);
await shot('sticker-book');
// backup: open the panel, confirm a code is generated, close it
await page.evaluate(() => [...document.querySelectorAll('.book-header .icon-btn')].find((b) => b.textContent === '💾')?.click());
await page.waitForSelector('.backup-panel .backup-code', { timeout: 2000 });
const codeLen = await page.$eval('.backup-code', (el) => el.value.length);
if (codeLen < 10) throw new Error(`backup: code too short (${codeLen})`);
console.log(`  ✓ backup code generated (${codeLen} chars)`);
await page.click('.backup-overlay .icon-btn'); // close (✕)
await page.waitForSelector('.subject-grid, .book', { timeout: 2000 });
await page.click('.book .icon-btn'); // back
await page.waitForSelector('.subject-grid', { timeout: 3000 });

// circuits mode: open, solve puzzle 1 (OR, both off, goal ON -> flip one switch)
console.log('▶ Circuits');
// big games (Mots, Riddles) are cards linking to their own pages: check they're there, don't open them
const voice = await page.$$eval('.big-card .big-title', (els) => els.map((e) => e.textContent));
if (voice.join('|') !== 'Mots|Riddles') throw new Error('big game cards missing: ' + voice.join('|'));
console.log('  ✓ big games on home: ' + voice.join(', '));
// stars they leave in the shared inbox land in the Sticker Book when home opens (and keep old stars)
const before = await page.evaluate(() => JSON.parse(localStorage.getItem('stepkick.v1') || '{}').groupStars || []);
await page.evaluate(() => localStorage.setItem('stepkick.inbox', JSON.stringify({ mots: 7, riddles: 2 })));
await page.reload();
await page.waitForSelector('.sk-toast', { timeout: 4000 });
const inbox = await page.evaluate(() => ({ toast: document.querySelector('.sk-toast').textContent, gs: JSON.parse(localStorage.getItem('stepkick.v1')).groupStars, left: localStorage.getItem('stepkick.inbox') }));
if (inbox.gs[9] !== (before[9] || 0) + 7 || inbox.gs[10] !== (before[10] || 0) + 2 || inbox.left) throw new Error('inbox not collected: ' + JSON.stringify(inbox));
if (before.slice(0, 9).some((v, i) => inbox.gs[i] !== v)) throw new Error('inbox: earlier pages changed ' + JSON.stringify({ before, after: inbox.gs }));
console.log(`  ✓ inbox stars collected: "${inbox.toast}"`);
await page.waitForSelector('.subject-grid', { timeout: 3000 });
await page.waitForSelector('.circuits-launch', { timeout: 3000 });
await page.click('.circuits-launch');
await page.waitForSelector('.circuits .circ-switch', { timeout: 3000 });
const preSolve = await page.evaluate(() => !!document.querySelector('.circ-bulb.lit'));
if (preSolve) throw new Error('circuits: puzzle 1 started already solved');
await page.click('.circ-switch');
await new Promise((r) => setTimeout(r, 200));
const circ = await page.evaluate(() => ({
  lit: !!document.querySelector('.circ-bulb.lit'),
  nextShown: !!document.querySelector('.circ-next.show'),
}));
if (!circ.lit) throw new Error('circuits: bulb did not light after solving');
if (!circ.nextShown) throw new Error('circuits: Next button did not appear');
console.log('  ✓ solved puzzle 1 (bulb lit + Next shown)');
await shot('circuits');

// memory match: open from home, verify the grid + a flip works
console.log('▶ Memory Match');
await page.click('.circuits .icon-btn'); // back home
await page.waitForSelector('.subject-grid', { timeout: 3000 });
await page.click('.mem-launch');
await page.waitForSelector('.memory .mem-card', { timeout: 3000 });
const cardCount = await page.evaluate(() => document.querySelectorAll('.mem-card').length);
if (cardCount !== 6) throw new Error(`memory: expected 6 cards on level 1, got ${cardCount}`);
const memCards = await page.$$('.mem-card');
await memCards[0].click();
await memCards[1].click();
await new Promise((r) => setTimeout(r, 500));
const flipped = await page.evaluate(() => document.querySelectorAll('.mem-card.flipped, .mem-card.matched').length);
if (flipped < 1) throw new Error('memory: cards did not flip');
console.log(`  ✓ memory level 1: ${cardCount} cards, flips work`);
await shot('memory');

// the other play modes: open each from home, assert it mounts, go back home
console.log('▶ Play modes');
await page.click('.memory .icon-btn'); // back home from memory
await page.waitForSelector('.subject-grid', { timeout: 3000 });
const MODES = [
  { launch: '.groups-launch', screen: '.groupsgame', sel: '.grp-tile', min: 6 },
  { launch: '.slide-launch', screen: '.slidegame', sel: '.sl-pick', min: 4 },
  { launch: '.tap-launch', screen: '.tapgame', sel: '.tap-cell', min: 8 },
  { launch: '.maze-launch', screen: '.mazegame', sel: '.maze-cell', min: 20 },
  { launch: '.mensa-launch', screen: '.mensagame', sel: '.mensa-choice', min: 4 },
];
for (const m of MODES) {
  await page.click(m.launch);
  await page.waitForSelector(`${m.screen} ${m.sel}`, { timeout: 4000 });
  const n = await page.$$eval(m.sel, (els) => els.length);
  if (n < m.min) throw new Error(`${m.launch}: expected >= ${m.min} ${m.sel}, got ${n}`);
  console.log(`  ✓ ${m.screen}: ${n} ${m.sel}`);
  await page.click(`${m.screen} .icon-btn`); // back home
  await page.waitForSelector('.subject-grid', { timeout: 3000 });
}

await browser.close();
await server.close();

if (errors.length) {
  console.error('\n❌ console errors:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\n✅ smoke passed: all 4 subjects played through, 0 console errors.');
