// Captures 3 View Transition keyframes: tapped card, mid-morph, settled detail.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const reservar = path.join(dir, '../reservar');

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
});
const page = await ctx.newPage();

// Frame 1: pressed card on the list
await page.goto('file://' + path.join(reservar, 'tapped.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const frame1 = path.join(dir, 'transition-1-tapped.png');
await page.screenshot({ path: frame1, fullPage: false });
console.log('rendered', frame1);

// Frame 3 first (settled detail) so we also have a clean end state
await page.goto('file://' + path.join(dir, 'bookable.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const frame3 = path.join(dir, 'transition-3-settled.png');
await page.screenshot({ path: frame3, fullPage: false });
console.log('rendered', frame3);

// Frame 2: pause the live prototype mid-transition
await page.goto('file://' + path.join(dir, 'prototype.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.evaluate(async () => {
  const proto = window.__reservoPrototype;
  if (!proto) throw new Error('prototype hook missing');
  proto.tagCard('pilates');
  const update = () => {
    proto.model.classId = 'pilates';
    proto.model.mode = 'bookable';
    proto.model.sheet = null;
    proto.model.view = 'detail';
    proto.paint();
    proto.tagHero();
  };
  if (typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  const vt = document.startViewTransition(update);
  await vt.ready;
  const anims = document.getAnimations({ subtree: true });
  for (const anim of anims) {
    try {
      anim.pause();
      const timing = anim.effect && anim.effect.getComputedTiming ? anim.effect.getComputedTiming() : null;
      const duration = typeof timing?.duration === 'number' ? timing.duration : 480;
      anim.currentTime = duration * 0.42;
    } catch {
      // ignore animations that cannot be paused
    }
  }
});
await page.waitForTimeout(200);
const frame2 = path.join(dir, 'transition-2-morph.png');
await page.screenshot({ path: frame2, fullPage: false });
console.log('rendered', frame2);

await browser.close();
