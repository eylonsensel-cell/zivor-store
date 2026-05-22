import puppeteer from 'puppeteer';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const url    = process.argv[2] || 'http://localhost:3000';
const label  = process.argv[3] ? '-' + process.argv[3] : '';
const outDir = join(__dirname, 'temporary screenshots');

import { mkdir } from 'fs/promises';
await mkdir(outDir, { recursive: true });

const files = await readdir(outDir).catch(() => []);
const nums  = files.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? '0')).filter(Boolean);
const next  = (nums.length ? Math.max(...nums) : 0) + 1;
const out   = join(outDir, `screenshot-${next}${label}.png`);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));
// Scroll through page so IntersectionObserver fires for all reveal elements
await page.evaluate(async () => {
  await new Promise(resolve => {
    let y = 0;
    const step = 600;
    const id = setInterval(() => {
      window.scrollBy(0, step);
      y += step;
      if (y >= document.body.scrollHeight) { clearInterval(id); window.scrollTo(0, 0); resolve(); }
    }, 80);
  });
});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: out, fullPage: false });
await browser.close();

console.log('Screenshot saved:', out);
