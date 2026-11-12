// usage: node render.mjs
// Renders every *.html in this folder (except none) to 390×844 PNG @3x.
// Also writes 412×915 gate shots into ./gate/
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const htmls = fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
if (!htmls.length) {
  console.error('no HTML files in', dir);
  process.exit(1);
}

const gateDir = path.join(dir, 'gate');
fs.mkdirSync(gateDir, { recursive: true });

const b = await chromium.launch();
for (const f of htmls) {
  const p = path.join(dir, f);
  for (const spec of [
    { width: 390, height: 844, scale: 3, outDir: dir, tag: '' },
    { width: 412, height: 915, scale: 2, outDir: gateDir, tag: '@412' },
  ]) {
    const ctx = await b.newContext({
      viewport: { width: spec.width, height: spec.height },
      deviceScaleFactor: spec.scale,
    });
    const page = await ctx.newPage();
    await page.goto('file://' + p, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const base = f.replace(/\.html$/, '');
    const out = path.join(spec.outDir, spec.tag ? `${base}${spec.tag}.png` : `${base}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log('rendered', out);
    await ctx.close();
  }
}
await b.close();
