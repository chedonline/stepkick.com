// Checks joke draft files against the live list and the game's answer matcher.
//   node scripts/riddles-check-jokes.mjs _tests/riddles-new-A.json [_tests/riddles-new-B.json ...]
// Each draft file: [{ "type": "joke"|"riddle", "cat": "...", "setup": "...", "punch": "...", "alts": ["..."] }]
import fs from "node:fs";
const html = fs.readFileSync(new URL("../public/riddles/index.html", import.meta.url), "utf8");
const RAW = Function("return " + html.match(/const RAW = (\[[\s\S]*?\n\]);/)[1])();
const code = html.slice(html.indexOf("/* ---------------- answer matching"), html.indexOf("/* ---------------- play UI"));
const { isMatch, gaveUp, words } = Function(code + "\nreturn { isMatch, gaveUp, words };")();
const norm = s => words(s).join(" ");
const CATS = { joke: ["animals", "food", "school", "silly", "gross"], riddle: ["riddle", "brainy"] };
const seenSetup = new Map(RAW.map(r => [norm(r[1]), "existing list"]));
const seenPunch = new Map(RAW.map(r => [norm(r[2]), "existing list"]));
let problems = 0; const counts = {};
const bad = (f, i, msg) => { problems++; console.log(`${f} #${i}: ${msg}`); };
for (const f of process.argv.slice(2)) {
  let list; try { list = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { console.log(`${f}: not valid JSON (${e.message})`); problems++; continue; }
  list.forEach((j, i) => {
    const tag = `"${j.setup}"`;
    if (!CATS[j.type] || !CATS[j.type].includes(j.cat)) bad(f, i, `${tag} bad type/cat ${j.type}/${j.cat}`);
    if (!j.setup || !j.punch) return bad(f, i, "missing setup or punch");
    counts[j.cat] = (counts[j.cat] || 0) + 1;
    const s = norm(j.setup), p = norm(j.punch);
    if (seenSetup.has(s)) bad(f, i, `${tag} duplicate question (also in ${seenSetup.get(s)})`); else seenSetup.set(s, f);
    if (seenPunch.has(p)) bad(f, i, `${tag} duplicate punchline "${j.punch}" (also in ${seenPunch.get(p)})`); else seenPunch.set(p, f);
    if (!isMatch(j.punch.toLowerCase().replace(/[^a-z' -]/g, ""), j.punch)) bad(f, i, `${tag} punchline doesn't match itself when said: "${j.punch}"`);
    for (const a of j.alts || []) if (!isMatch(a.toLowerCase().replace(/[^a-z' -]/g, ""), a)) bad(f, i, `${tag} alt doesn't match itself: "${a}"`);
    if (gaveUp(j.setup) || gaveUp(j.punch) || (j.alts || []).some(gaveUp)) bad(f, i, `${tag} contains a give-up phrase (pass, tell me, don't know, give up, no idea, no clue...)`);
    if (words(j.punch).length > 10) bad(f, i, `${tag} punchline too long (${words(j.punch).length} words)`);
    if (/[—–]/.test(j.setup + j.punch)) bad(f, i, `${tag} has an em/en dash`);
  });
}
console.log("counts by category:", counts, "\nproblems:", problems);
