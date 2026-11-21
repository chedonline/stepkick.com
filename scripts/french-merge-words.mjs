// Put the word list (scripts/french-words.json, the source of truth) into public/french/index.html as WORDS.
//   node scripts/french-merge-words.mjs scripts/french-words.json   then  node scripts/french-voice.mjs --go
// Rows: [fr, gender, English, emoji, theme, alternatives?, "mass"?]. Mass nouns ("le lait",
// not "un lait") are spoken with le/la and left out of the "Un ou une ?" game.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const page = path.join(root, "public/french/index.html");
const MASS = new Set(["lait", "miel", "maïs soufflé", "pluie", "neige", "maïs"]);
const words = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), "utf8"));
for (const w of words) if (w.mass) MASS.add(w.fr); // a word can also say "mass": true itself
const rows = words.map(w => {
  const r = [w.fr, w.g, w.en, w.emoji, w.theme];
  if ((w.alt && w.alt.length) || MASS.has(w.fr)) r.push(w.alt || []);
  if (MASS.has(w.fr)) r.push("mass");
  return JSON.stringify(r);
});
let html = fs.readFileSync(page, "utf8");
const re = /const WORDS = \[[\s\S]*?\n\];/;
if (!re.test(html)) throw new Error("WORDS array not found");
html = html.replace(re, () => "const WORDS = [\n" + rows.join(",\n") + "\n];");
fs.writeFileSync(page, html);
console.log(`WORDS: ${rows.length} rows, ${[...MASS].filter(m => words.some(w => w.fr === m)).length} mass nouns`);
