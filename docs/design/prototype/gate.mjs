// ux-complexity-gate · capa automática (A). Mide cada estado en 412×915 y 390×844.
// Salida: gate/report.json y gate/marks/<viewport>/<id>.png (capturas con marcas numeradas para la capa visual).
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, "index.html")).href;
const outDir = join(here, "gate");
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const probe = await browser.newPage();
await probe.goto(url + "?shot=login");
const states = await probe.evaluate(() => window.__proto.STATES.map((s) => ({ id: s.id, group: s.group, label: s.label })));
await probe.close();

const measure = () => {
  const SEL = 'a[href], button, input, select, textarea, [role=button], [role=link], [role=checkbox], [role=radio], [tabindex]:not([tabindex="-1"])';
  const vh = innerHeight, vw = innerWidth;
  const phone = document.querySelector(".phone");
  const all = [...phone.querySelectorAll(SEL)].filter((el) => !el.parentElement.closest(SEL) && !el.classList.contains("sheet-backdrop"));
  const fixed = [...phone.querySelectorAll(".nav-wrap, .dock, .sheet-backdrop, .statusbar")];
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cy < 0 || cy > vh || cx < 0 || cx > vw) return false;
    const hit = document.elementFromPoint(cx, cy);
    return hit && (el === hit || el.contains(hit));
  };
  const vis = all.filter(visible);
  const inBar = (el) => !!el.closest("[data-bar]");
  const items = vis.map((el, i) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const text = (el.getAttribute("aria-label") || el.innerText || el.value || "").trim().replace(/\s+/g, " ").slice(0, 60);
    const iconOnly = !(el.innerText || "").trim() && el.tagName !== "INPUT" && el.tagName !== "SELECT" && !!el.querySelector("svg, img");
    const looks = cs.backgroundColor !== "rgba(0, 0, 0, 0)" || parseFloat(cs.borderTopWidth) > 0 || cs.textDecorationLine.includes("underline") || !!el.querySelector(".chev, .card-open, .mark") || ["INPUT", "SELECT"].includes(el.tagName) || el.classList.contains("nav-item") || el.classList.contains("day") || !!el.closest(".nav-wrap");
    return { n: i + 1, tag: el.tagName.toLowerCase(), cls: el.className.baseVal ?? el.className, text, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top),
      primary: el.hasAttribute("data-primary"), group: el.closest("[data-group]")?.dataset.group || null, bar: inBar(el), iconOnly, label: !!el.getAttribute("aria-label"), looks, fontSize: parseFloat(cs.fontSize) };
  });
  // texto
  const small = [];
  const walker = document.createTreeWalker(phone, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (el.closest(".statusbar")) continue;
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh || r.width === 0) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 12) small.push({ text: t.textContent.trim().slice(0, 40), fs });
  }
  const nav = [...phone.querySelectorAll(".nav-item")].map((n) => n.innerText.trim());
  return { items, small, nav, back: !!phone.querySelector("[data-act=back]"), sheet: !!phone.querySelector(".sheet-backdrop") };
};

const report = { generated: new Date().toISOString(), viewports: {}, summary: {} };
for (const [w, h] of [[412, 915], [390, 844]]) {
  const vp = `${w}x${h}`;
  mkdirSync(join(outDir, "marks", vp), { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  report.viewports[vp] = {};
  for (const st of states) {
    await page.goto(`${url}?shot=${st.id}`);
    await page.evaluate(() => document.fonts.ready);
    const m = await page.evaluate(measure);
    const content = m.items.filter((i) => !i.bar && !i.cls.includes("nav-item"));
    const groups = new Set(); let p3 = 0; const kinds = new Set();
    for (const i of content) {
      if (i.group) { if (!groups.has(i.group)) { groups.add(i.group); p3++; kinds.add("g:" + i.group); } }
      else { p3++; kinds.add(i.tag + "." + String(i.cls).split(" ")[0]); }
    }
    const findings = [];
    const prim = m.items.filter((i) => i.primary);
    if (prim.length > 1) findings.push({ rule: "P1", s: 3, msg: `${prim.length} acciones primarias` });
    if (kinds.size > 8) findings.push({ rule: "P2", s: 3, msg: `${kinds.size} decisiones` }); else if (kinds.size > 5) findings.push({ rule: "P2", s: 2, msg: `${kinds.size} decisiones` });
    if (p3 > 30) findings.push({ rule: "P3", s: 3, msg: `${p3} interactivos` }); else if (p3 > 20) findings.push({ rule: "P3", s: 2, msg: `${p3} interactivos` });
    for (const i of m.items) {
      if (i.w < 24 || i.h < 24) findings.push({ rule: "P6", s: 4, msg: `#${i.n} ${i.text} ${i.w}×${i.h}` });
      else if (i.w < 44 || i.h < 44) findings.push({ rule: "P5", s: 3, msg: `#${i.n} ${i.text} ${i.w}×${i.h}` });
      if (i.iconOnly && !i.label) findings.push({ rule: "P12", s: 3, msg: `#${i.n} ícono sin etiqueta` });
      if (!i.looks) findings.push({ rule: "P10", s: 3, msg: `#${i.n} ${i.text} no parece tocable` });
      if (i.primary && i.y + i.h / 2 < h * 0.4) findings.push({ rule: "P7", s: 2, msg: `primaria arriba (${i.y}px)` });
      if ((i.tag === "button" || i.tag === "a") && !i.cls.includes("nav-item") && !i.cls.includes("day") && !i.cls.includes("class-card") && !i.cls.includes("row") && !i.cls.includes("choice") && i.fontSize < 14) findings.push({ rule: "P8", s: 2, msg: `botón #${i.n} ${i.fontSize}px` });
    }
    for (const t of m.small) findings.push({ rule: "P8", s: 3, msg: `texto ${t.fs}px: ${t.text}` });
    if (m.nav.length && (m.nav.length < 3 || m.nav.length > 5 || m.nav.some((x) => !x))) findings.push({ rule: "A1", s: 3, msg: `barra con ${m.nav.length}` });
    const axe = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    for (const v of axe.violations) for (const n of v.nodes) findings.push({ rule: "P9", s: 3, msg: `${n.target.join(" ")} ${n.any[0]?.data?.contrastRatio ?? ""}` });
    // marcas numeradas para la capa visual
    await page.evaluate((items) => {
      const layer = document.createElement("div"); layer.id = "gate-marks";
      layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999";
      for (const i of items) {
        const b = document.createElement("div");
        b.style.cssText = `position:absolute;left:${i.x}px;top:${i.y}px;width:${i.w}px;height:${i.h}px;outline:2px solid #e0007a;`;
        const tagEl = document.createElement("span"); tagEl.textContent = i.n;
        tagEl.style.cssText = "position:absolute;left:-2px;top:-2px;background:#e0007a;color:#fff;font:700 11px/1 monospace;padding:2px 3px";
        b.appendChild(tagEl); layer.appendChild(b);
      }
      document.body.appendChild(layer);
    }, m.items);
    await page.screenshot({ path: join(outDir, "marks", vp, `${st.id}.png`) });
    report.viewports[vp][st.id] = { group: st.group, label: st.label, metrics: { P1: prim.length, P2: kinds.size, P3: p3 }, marks: m.items.map(({ n, text, w, h, primary }) => ({ n, text, w, h, primary })), findings };
  }
  await ctx.close();
}
await browser.close();
let blockers = 0, warnings = 0;
for (const vp of Object.values(report.viewports)) for (const st of Object.values(vp)) for (const f of st.findings) f.s >= 3 ? blockers++ : warnings++;
report.summary = { states: states.length, blockers, warnings };
writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));
for (const [vp, sts] of Object.entries(report.viewports)) for (const [id, st] of Object.entries(sts)) for (const f of st.findings) console.log(vp, id, f.rule, "S" + f.s, f.msg);
