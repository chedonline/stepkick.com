// Build Mots' dictée lists (LISTES in public/french/index.html) from her dictée sheets:
// skills/dictee/examples/liste-*.json, the same files that make the printable dictée sheets.
// Every [bracketed] form on a sheet becomes a word to practise, exactly as written there
// (protèges, glissent, oiseaux...), read in the shortest sheet sentence that has it.
//   node scripts/french-listes.mjs          then  node scripts/french-voice.mjs --go
// A new Liste: run the dictée skill (it writes the JSON), add its words to META below, re-run.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const SRC = path.resolve(root, "../../skills/dictee/examples");
const page = path.join(root, "public/french/index.html");

// form -> [kind, English, emoji?]. kind: m/f = singular noun (gets un/une), pl = plural noun,
// v = verb (as written on the sheet), adj, adv, x = no article (months).
const META = {
  // Liste 5
  "nuage": ["m", "cloud", "☁️"], "genre": ["m", "kind, type"], "voyage": ["m", "trip", "🧳"], "argent": ["m", "money", "💰"],
  "protèges": ["v", "(you) protect"], "protéger": ["v", "to protect"], "village": ["m", "village", "🏘️"], "dangers": ["pl", "dangers"],
  "gorge": ["f", "throat"], "gagnes": ["v", "(you) win"], "guerre": ["f", "war"], "goutte": ["f", "drop", "💧"],
  "langue": ["f", "tongue, language", "👅"], "âge": ["m", "age"],
  // Liste 6
  "pousser": ["v", "to push"], "consoler": ["v", "to comfort"], "présente": ["v", "(I) go to, show up"], "course": ["f", "race", "🏃"],
  "cousine": ["f", "cousin (girl)"], "pose": ["v", "(she) asks, puts"], "choisir": ["v", "to choose"], "glisser": ["v", "to slide"],
  "glissent": ["v", "(they) slide"], "danser": ["v", "to dance"], "laisser": ["v", "to let"], "danse": ["f", "dance", "💃"],
  "visite": ["f", "visit, visitors"], "visites": ["pl", "visits"], "vitesse": ["f", "speed"], "église": ["f", "church", "⛪"],
  "églises": ["pl", "churches"], "trésors": ["pl", "treasures"], "descendre": ["v", "to go down"], "cousin": ["m", "cousin (boy)"],
  "passage": ["m", "passage, way"], "réussir": ["v", "to succeed"],
  // Liste 7
  "aussitôt": ["adv", "as soon as"], "octobre": ["x", "October", "🎃"], "faute": ["f", "mistake"], "fautes": ["pl", "mistakes"],
  "nouveau": ["adj", "new"], "restaurant": ["m", "restaurant", "🍽️"], "radio": ["f", "radio", "📻"], "offrir": ["v", "to offer, give"],
  "promener": ["v", "to walk"], "vélo": ["m", "bike", "🚲"], "hauteur": ["f", "height"], "beaux": ["adj", "beautiful (plural)"],
  "oiseaux": ["pl", "birds"], "poches": ["pl", "pockets"], "automne": ["m", "autumn, fall", "🍂"], "promettre": ["v", "to promise"],
};

const clean = s => s.replace(/\s*\((?:[^)]*)\)/g, "").replace(/\*/g, "").replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();
const sentencesOf = t => t.match(/[^.!?]+[.!?]+/g) || [t];
const listes = [];
let missing = 0;
for (const f of fs.readdirSync(SRC).filter(f => /^liste-\d+.*\.json$/.test(f)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)))) {
  const j = JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
  const n = +j.liste.replace(/\D/g, ""), raw = [j.text, ...(j.phrases || [])];
  const sents = raw.flatMap(sentencesOf).map(s => s.trim());
  const forms = [];
  for (const s of sents) for (const m of s.matchAll(/\[([^\]]+)\]/g)) { const w = m[1].toLowerCase(); if (!forms.includes(w)) forms.push(w); }
  const words = forms.map(w => {
    const re = new RegExp(`(^|[^\\p{L}])${w}(?![\\p{L}])`, "iu");
    const has = sents.map(clean).filter(s => re.test(s)).sort((a, b) => a.length - b.length);
    const meta = META[w]; if (!meta) { console.log(`⚠️ no META for "${w}" (Liste ${n}): add it`); missing++; }
    const [kind, en, emoji] = meta || ["x", ""];
    const row = [w, kind, en, has[0] || ""]; if (emoji) row.push(emoji);
    return row;
  });
  listes.push({ n, title: clean(j.title), words });
  console.log(`Liste ${n} "${clean(j.title)}": ${words.length} words`);
}
const body = "[\n" + listes.map(l => `{ n: ${l.n}, title: ${JSON.stringify(l.title)}, words: [\n` + l.words.map(r => JSON.stringify(r)).join(",\n") + "\n]}").join(",\n") + "\n]";
let html = fs.readFileSync(page, "utf8");
const re = /const LISTES = \[[\s\S]*?\n\];/;
if (!re.test(html)) throw new Error("LISTES not found");
html = html.replace(re, () => "const LISTES = " + body + ";");
fs.writeFileSync(page, html);
console.log(`wrote ${listes.reduce((n, l) => n + l.words.length, 0)} words into LISTES` + (missing ? `, ${missing} without META` : ""));
