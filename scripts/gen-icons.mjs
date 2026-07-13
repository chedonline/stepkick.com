// Render PWA/app icons with the system emoji via headless Chrome.
// No image libs needed — reuses whattheflag.net's puppeteer-core + system Chrome.
import { mkdir } from 'node:fs/promises';
import puppeteer from '../../whattheflag.net/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
await mkdir('public/icons', { recursive: true });

const html = (size) => `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0}
.tile{width:${size}px;height:${size}px;display:grid;place-items:center;
background:linear-gradient(135deg,#38bdf8 0%,#6366f1 50%,#fb923c 100%);}
.foot{font-size:${Math.round(size * 0.56)}px;line-height:1;
filter:drop-shadow(0 ${Math.round(size * 0.02)}px ${Math.round(size * 0.04)}px rgba(0,0,0,.35))}</style>
<div class="tile"><span class="foot">🦶</span></div>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();

const jobs = [
  { size: 512, file: 'public/icons/pwa-512.png' },
  { size: 192, file: 'public/icons/pwa-192.png' },
  { size: 180, file: 'public/icons/apple-touch-icon.png' },
];
for (const { size, file } of jobs) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(html(size), { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: file, omitBackground: false });
  console.log(`  🎨 ${file} (${size}px)`);
}

await browser.close();
console.log('icons done.');
