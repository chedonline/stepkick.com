// Browser smoke test: boot the built app, play every subject end-to-end,
// assert no console errors and that the full home -> game -> results loop works.
// Reuses whattheflag.net's puppeteer-core + the system Chrome.
import { createServer } from 'vite';
import puppeteer from '../../whattheflag.net/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SUBJECTS = ['Math', 'Words', 'Animals', 'Patterns'];

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
if (tiles.length !== 4) throw new Error(`expected 4 subject tiles, got ${tiles.length}`);
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
  const ordered =
    s === 0
      ? [...q.choices].sort((a, b) => val(a) - val(b))
      : s === 3
        ? q.choices // patterns: canonical shape order (not asserted here)
        : [...q.choices].sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(ordered) !== JSON.stringify(q.choices))
    throw new Error(`${SUBJECTS[s]}: choices not in order → ${JSON.stringify(q.choices)}`);
  console.log(`  order ok: ${JSON.stringify(q.choices)}`);
  if (s === 0) await shot('game-math');
  if (s === 3) await shot('game-patterns');

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
    score: document.querySelector('.final-score')?.textContent,
    badge: document.querySelector('.badge-label')?.textContent,
  }));
  console.log(`  ✓ finished — score ${res.score}, badge "${res.badge}"`);
  if (s === 0) await shot('results-math');

  // back home
  await page.click('.results-actions .btn-ghost');
  await page.waitForSelector('.subject-grid', { timeout: 3000 });
}

// sticker book: after playing 4 subjects we've earned stars -> open the book
console.log('▶ Sticker Book');
await page.waitForSelector('.book-bar', { timeout: 3000 });
await shot('home-progress');
await page.click('.book-bar');
await page.waitForSelector('.book', { timeout: 3000 });
const book = await page.evaluate(() => ({
  cells: document.querySelectorAll('.sticker').length,
  earned: document.querySelectorAll('.sticker.earned').length,
  sub: document.querySelector('.book-title-sub')?.textContent || '',
}));
if (book.cells !== 48) throw new Error(`sticker book: expected 48 cells, got ${book.cells}`);
console.log(`  ✓ book renders ${book.cells} stickers, ${book.earned} earned — "${book.sub}"`);
await shot('sticker-book');
await page.click('.book .icon-btn'); // back
await page.waitForSelector('.subject-grid', { timeout: 3000 });

await browser.close();
await server.close();

if (errors.length) {
  console.error('\n❌ console errors:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\n✅ smoke passed: all 4 subjects played through, 0 console errors.');
