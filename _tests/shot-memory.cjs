// Open Memory Match and screenshot the board at a given viewport, to verify the
// responsive grid fits without clipping the header. Usage: node shot-memory.cjs <url> <out> <W> <H>
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => fs.existsSync(p));

(async () => {
  const url = process.argv[2] || 'http://localhost:5199/';
  const out = process.argv[3] || 'mem.png';
  const W = Number(process.argv[4]) || 390;
  const H = Number(process.argv[5]) || 844;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.click('.mem-launch');
  await page.waitForSelector('.mem-card', { timeout: 4000 });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: out });
  console.log('errors:', JSON.stringify(errors));
  await browser.close();
})();
