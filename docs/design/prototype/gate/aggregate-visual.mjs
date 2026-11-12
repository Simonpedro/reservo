// Consolida la capa visual: una observación cuenta si aparece en ≥ 2 de 3 corridas con la misma regla en la misma pantalla.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const dir = new URL("./visual/", import.meta.url);
const runs = { 1: {}, 2: {}, 3: {} };
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json") && f.startsWith("run"))) {
  const run = f.match(/run(\d)/)[1];
  let data; try { data = JSON.parse(readFileSync(new URL(f, dir), "utf8")); } catch { console.error("JSON inválido", f); continue; }
  for (const s of data.screens) runs[run][s.id] = s;
}
const MAP = { R1: "P1", R2: "P10", R3: "P11", R4: "P12", R11: "P17" };
const out = [];
const ids = new Set(Object.values(runs).flatMap((r) => Object.keys(r)));
for (const id of ids) {
  const byRule = {};
  for (const [run, r] of Object.entries(runs)) {
    const s = r[id]; if (!s) continue;
    const seen = new Set();
    for (const f of s.findings || []) {
      if (seen.has(f.rule)) continue; seen.add(f.rule);
      (byRule[f.rule] ||= []).push({ run, sev: f.severity, marks: f.marks, note: f.note });
    }
  }
  for (const [rule, hits] of Object.entries(byRule)) {
    if (hits.length < 2) continue;
    const sev = hits.map((h) => h.sev).sort((a, b) => a - b)[Math.floor(hits.length / 2)];
    out.push({ id, rule, gateRule: MAP[rule] || "REVIEW", runs: hits.length, severity: sev, blocking: sev >= 3 && ["R1", "R2", "R3", "R4"].includes(rule), notes: hits.map((h) => `[${h.run}] S${h.sev} ${JSON.stringify(h.marks)} ${h.note}`) });
  }
}
out.sort((a, b) => b.severity - a.severity || a.id.localeCompare(b.id));
writeFileSync(new URL("./visual-summary.json", import.meta.url), JSON.stringify(out, null, 2));
for (const o of out) console.log(`${o.blocking ? "BLOCK" : o.severity >= 3 ? "S3" : "S" + o.severity}\t${o.id}\t${o.rule}/${o.gateRule}\t${o.runs}/3\n   ${o.notes.join("\n   ")}`);
