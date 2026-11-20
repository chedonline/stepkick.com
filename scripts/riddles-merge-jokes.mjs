// Merge reviewed joke drafts into RAW as a new batch, and their alts into ALT_ANSWERS.
//   node scripts/riddles-merge-jokes.mjs 3 _tests/riddles-new-A.json _tests/riddles-new-B.json
import fs from "node:fs";
const p = new URL("../public/riddles/index.html", import.meta.url);
let html = fs.readFileSync(p, "utf8");
const [batch, ...files] = process.argv.slice(2);
const drafts = files.flatMap(f => JSON.parse(fs.readFileSync(f, "utf8")));
// RAW: add lines before the closing "\n]"
const m = html.match(/const RAW = (\[[\s\S]*?)\n\];/);
const existing = new Set(Function("return " + m[1] + "\n]")().map(r => r[1]));
const add = drafts.filter(d => !existing.has(d.setup));
const lines = add.map(d => JSON.stringify([d.type, d.setup, d.punch, d.cat, +batch])).join(",\n");
html = html.replace(m[0], `const RAW = ${m[1]},\n// batch ${batch}: added ${new Date().toISOString().slice(0, 10)}\n${lines}\n];`);
// ALT_ANSWERS: add before its closing "\n};"
const alts = add.filter(d => d.alts && d.alts.length);
if (alts.length) {
  const a = html.match(/const ALT_ANSWERS = (\{[\s\S]*?)\n\};/);
  html = html.replace(a[0], `const ALT_ANSWERS = ${a[1]}\n${alts.map(d => `  ${JSON.stringify(d.setup)}: ${JSON.stringify(d.alts)},`).join("\n")}\n};`);
}
fs.writeFileSync(p, html);
const RAW = Function("return " + html.match(/const RAW = (\[[\s\S]*?\n\]);/)[1])();
const c = {}; RAW.forEach(r => c[r[3]] = (c[r[3]] || 0) + 1);
console.log(`added ${add.length} (skipped ${drafts.length - add.length} already present), alts for ${alts.length}; total ${RAW.length}`, c);
