// Renderiza cada estado del prototipo: 390×844 en screens/ y 412×915 en screens/gate/.
// Uso: node render.mjs [salida-extra]   (necesita playwright; usa Chrome del sistema si existe)
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, "index.html")).href;
const extra = process.argv[2];
const out = join(here, "screens");
mkdirSync(join(out, "gate"), { recursive: true });
if (extra) mkdirSync(extra, { recursive: true });

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const probe = await browser.newPage();
await probe.goto(url + "?shot=login");
const ids = await probe.evaluate(() => window.__proto.STATES.map((s) => s.id));
await probe.close();

for (const [w, h, dir] of [[390, 844, out], [412, 915, join(out, "gate")]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  for (const id of ids) {
    await page.goto(`${url}?shot=${id}`);
    await page.evaluate(() => document.fonts.ready);
    const ok = await page.evaluate(() => document.fonts.check('900 16px "Nunito Sans"'));
    if (!ok) throw new Error("Nunito Sans no cargó");
    await page.waitForTimeout(80);
    const file = join(dir, `${id}.png`);
    await page.screenshot({ path: file });
    if (extra && dir === out) copyFileSync(file, join(extra, `${id}.png`));
  }
  await page.close();
}
await browser.close();
console.log(`${ids.length} estados renderizados`);
