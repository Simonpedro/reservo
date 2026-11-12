// usage: node render.mjs
// Renders every *.html in this folder to 390×844 PNG @3x, plus 412×915 gate shots in ./gate/
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const htmls = fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
const gateDir = path.join(dir, 'gate');
fs.mkdirSync(gateDir, { recursive: true });

const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
for (const f of htmls) {
  for (const spec of [
    { width: 390, height: 844, scale: 3, outDir: dir, tag: '' },
    { width: 412, height: 915, scale: 2, outDir: gateDir, tag: '@412' },
  ]) {
    const ctx = await b.newContext({ viewport: { width: spec.width, height: spec.height }, deviceScaleFactor: spec.scale });
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(dir, f), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('900 16px "Nunito Sans"')))) {
      throw new Error(`Nunito Sans did not load for ${f}; re-run when online`);
    }
    await page.waitForTimeout(400);
    const out = path.join(spec.outDir, f.replace(/\.html$/, '') + spec.tag + '.png');
    await page.screenshot({ path: out });
    console.log('rendered', out);
    await ctx.close();
  }
}
await b.close();
