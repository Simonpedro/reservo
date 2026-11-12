// Captures 3 View Transition keyframes: tapped card, mid-morph, settled detail.
// Also prints mid-transition diagnostics so we can confirm the card (not the avatar) is morphing.
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

await page.goto('file://' + path.join(reservar, 'tapped.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const frame1 = path.join(dir, 'transition-1-tapped.png');
await page.screenshot({ path: frame1, fullPage: false });
console.log('rendered', frame1);

await page.goto('file://' + path.join(dir, 'bookable.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const frame3 = path.join(dir, 'transition-3-settled.png');
await page.screenshot({ path: frame3, fullPage: false });
console.log('rendered', frame3);

await page.goto('file://' + path.join(dir, 'prototype.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

const diag = await page.evaluate(async () => {
  const proto = window.__reservoPrototype;
  if (!proto) throw new Error('prototype hook missing');

  const namedBefore = [...document.querySelectorAll('.avatar-button, .class-card, .clase-hero, h3, .clase-title, .cutout')].map((el) => ({
    el: el.className || el.tagName,
    name: getComputedStyle(el).viewTransitionName,
  }));

  proto.tagCard('pilates');
  const taggedOutgoing = {
    card: getComputedStyle(document.querySelector('.class-card[data-class="pilates"]')).viewTransitionName,
    title: getComputedStyle(document.querySelector('.class-card[data-class="pilates"] h3')).viewTransitionName,
    photo: getComputedStyle(document.querySelector('.class-card[data-class="pilates"] .cutout')).viewTransitionName,
    avatar: document.querySelector('.avatar-button')
      ? getComputedStyle(document.querySelector('.avatar-button')).viewTransitionName
      : 'absent',
  };

  if (typeof document.startViewTransition !== 'function') {
    proto.model.classId = 'pilates';
    proto.model.mode = 'bookable';
    proto.model.sheet = null;
    proto.model.view = 'detail';
    proto.paint();
    proto.tagHero();
    return { error: 'startViewTransition missing', taggedOutgoing, namedBefore };
  }

  const vt = document.startViewTransition(() => {
    proto.model.classId = 'pilates';
    proto.model.mode = 'bookable';
    proto.model.sheet = null;
    proto.model.view = 'detail';
    proto.paint();
    proto.tagHero();
  });
  await vt.ready;

  const anims = document.getAnimations({ subtree: true });
  for (const anim of anims) {
    try {
      anim.pause();
      const timing = anim.effect && anim.effect.getComputedTiming ? anim.effect.getComputedTiming() : null;
      const duration = typeof timing?.duration === 'number' ? timing.duration : 480;
      anim.currentTime = duration * 0.42;
    } catch {
      // ignore
    }
  }

  const groups = {};
  for (const name of ['clase-fondo', 'clase-titulo', 'clase-foto', 'chrome-nav', 'chrome-avatar', 'root']) {
    const node = document.documentElement;
    // Measure the group via a temporary probe on the pseudo
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;pointer-events:none;inset:auto';
    document.body.appendChild(probe);
    // We cannot query VT pseudo boxes via getBoundingClientRect easily from here;
    // instead report computed names on the new DOM and animation names.
    probe.remove();
    groups[name] = true;
  }

  const incoming = {
    hero: document.querySelector('.clase-hero')
      ? getComputedStyle(document.querySelector('.clase-hero')).viewTransitionName
      : 'absent',
    title: document.querySelector('.clase-title')
      ? getComputedStyle(document.querySelector('.clase-title')).viewTransitionName
      : 'absent',
    photo: document.querySelector('.clase-hero .cutout')
      ? getComputedStyle(document.querySelector('.clase-hero .cutout')).viewTransitionName
      : 'absent',
    avatarOnDetail: !!document.querySelector('.clase-hero .avatar-button, .app-shell > .avatar-button, .hero-bar .avatar-button'),
    navOnDetail: !!document.querySelector('.nav-wrap, .bottom-nav'),
  };

  const animationNames = anims.map((a) => {
    const effect = a.effect;
    let pseudo = null;
    let target = null;
    try {
      target = effect?.target?.tagName || effect?.target?.className || null;
      pseudo = effect?.pseudoElement || null;
    } catch {
      // ignore
    }
    const timing = effect?.getComputedTiming?.();
    return {
      target,
      pseudo,
      currentTime: a.currentTime,
      duration: timing?.duration ?? null,
      playState: a.playState,
    };
  });

  const vtPseudos = animationNames.filter((a) => a.pseudo && String(a.pseudo).includes('view-transition'));
  const hasCardMorph = vtPseudos.some((a) => /clase-fondo|clase-titulo|clase-foto/.test(String(a.pseudo)));
  const hasAvatarMorph = vtPseudos.some((a) => /chrome-avatar/.test(String(a.pseudo)));

  return {
    taggedOutgoing,
    incoming,
    hasCardMorph,
    hasAvatarMorph,
    vtPseudos,
  };
});

console.log('MID-TRANSITION DIAGNOSTICS');
console.log(JSON.stringify(diag, null, 2));

await page.waitForTimeout(200);
const frame2 = path.join(dir, 'transition-2-morph.png');
await page.screenshot({ path: frame2, fullPage: false });
console.log('rendered', frame2);

await browser.close();
