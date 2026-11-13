// A3: toques por tarea desde la pantalla de inicio, tocando la interfaz real del prototipo.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, "index.html")).href;
const tasks = JSON.parse(readFileSync(join(here, "tasks.json"), "utf8"));
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const results = [];
for (const t of tasks) {
  await page.goto(`${url}?state=${t.start}`);
  let ok = true, err = "";
  for (const sel of t.taps) {
    try { await page.locator(`.phone ${sel}`).first().click({ timeout: 2000 }); await page.waitForTimeout(650); }
    catch (e) { ok = false; err = `no encontré ${sel}`; break; }
  }
  if (ok) ok = (await page.locator(`.phone ${t.expect}`).count()) > 0;
  const nav = t.taps.length - (t.valueTaps || 0);
  results.push({ id: t.id, freq: t.freq, budget: t.budget, taps: t.taps.length, navTaps: nav, pass: ok && t.taps.length <= t.budget, reached: ok, err });
}
await browser.close();
writeFileSync(join(here, "gate", "tasks-result.json"), JSON.stringify(results, null, 2));
console.table(results);
