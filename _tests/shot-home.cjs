// Screenshot the home screen at an iPhone viewport to verify header + footer.
// Uses Guardian's puppeteer-core via NODE_PATH. Usage: node shot-home.cjs <url> <out>
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => fs.existsSync(p));

(async () => {
  const url = process.argv[2] || 'http://localhost:5199/';
  const out = process.argv[3] || 'home.png';
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: out });                                  // viewport (header)
  // Scroll the home column (internal scroll, not the document) to its end so the
  // footer flowing at the bottom is visible.
  await page.evaluate(() => {
    const el = document.querySelector('.home');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: out.replace(/\.png$/, '-bottom.png') });
  // Optional: click a subject tile by name and capture its game screen.
  const tileName = process.argv[4];
  if (tileName) {
    await page.evaluate((n) => {
      const t = [...document.querySelectorAll('.subject-tile')].find((el) => el.textContent.includes(n));
      if (t) t.click();
    }, tileName);
    await page.waitForSelector('.game .choice', { timeout: 4000 });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: out.replace(/\.png$/, '-game.png') });
  }
  console.log('console/page errors:', JSON.stringify(errors));
  await browser.close();
})();
