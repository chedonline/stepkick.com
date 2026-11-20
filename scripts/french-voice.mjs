// Pre-record every line of Mots (public/french) in Jeanne Mance's voice (ElevenLabs, Québec French).
// Reads the words, lists and lines straight from the page (including the SAY-BEGIN block that
// builds "Un chat." etc.), so the recordings always match what the page asks for.
//   node scripts/french-voice.mjs              -> dry run: count lines + characters
//   node scripts/french-voice.mjs --go         -> record what's missing (--max N to cap)
//   then: node scripts/riddles-loudness.mjs public/french/audio   (volume per clip; files untouched)
// Key: C:\Users\chedo\.secrets\elevenlabs.key, or ELEVENLABS_API_KEY. Never printed.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";

const VOICE = { id: "K7gx0ylJdff0yjM2uVQS", name: "Jeanne Mance" };
const MODEL = "eleven_turbo_v2_5";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true, speed: 0.95 };

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const html = fs.readFileSync(path.join(root, "public/french/index.html"), "utf8");
const grab = (re, what) => { const m = html.match(re); if (!m) throw new Error("couldn't find " + what); return m[1]; };
const WORDS = Function(`"use strict";return (${grab(/const WORDS = (\[[\s\S]*?\n\]);/, "WORDS")})`)();
const LISTES = Function(`"use strict";return (${grab(/const LISTES = (\[[\s\S]*?\n\]);/, "LISTES")})`)();
const LINES = Function(`"use strict";return (${grab(/const LINES = (\{[\s\S]*?\n\});/, "LINES")})`)();
const SAY = Function(`"use strict";${grab(/\/\* SAY-BEGIN[^*]*\*\/([\s\S]*?)\/\* SAY-END \*\//, "SAY block")};return { buildWords, sayBare, sayInd };`)();

const lines = new Set(Object.values(LINES).flat());
for (const w of SAY.buildWords(WORDS, LISTES)) { lines.add(SAY.sayBare(w)); lines.add(SAY.sayInd(w)); if (w.sentence) lines.add(w.sentence); }
const list = [...lines];
const chars = list.reduce((n, t) => n + t.length, 0);
console.log(`${list.length} lines, ${chars} characters`);
if (!process.argv.includes("--go")) process.exit(0);

let key = process.env.ELEVENLABS_API_KEY || "";
try { key = fs.readFileSync(path.join(os.homedir(), ".secrets/elevenlabs.key"), "utf8").split(/\r?\n/)[0].trim() || key; } catch {}
if (!key) { console.error("No ElevenLabs key found"); process.exit(1); }

const outDir = path.join(root, "public/french/audio");
fs.mkdirSync(outDir, { recursive: true });
const file = t => crypto.createHash("sha1").update(t).digest("hex").slice(0, 12) + ".mp3";
let oldGain = {};
try { oldGain = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8")).gain || {}; } catch {}
const manifest = { voice: VOICE.name, voiceId: VOICE.id, model: MODEL, lines: {}, gain: oldGain };
const existsOk = t => { const d = path.join(outDir, file(t)); return fs.existsSync(d) && fs.statSync(d).size > 1000; };
let made = 0, skipped = 0, failed = 0;

async function record(text) {
  const f = file(text), dest = path.join(outDir, f);
  manifest.lines[text] = f;
  if (existsOk(text)) { skipped++; return; }
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE.id}?output_format=mp3_44100_64`, {
      method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL, language_code: "fr", voice_settings: VOICE_SETTINGS }) });
    if (r.ok) { fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); made++; return; }
    const msg = (await r.text()).slice(0, 200);
    if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 1500 * attempt)); continue; }
    console.error(`FAILED ${r.status} "${text}": ${msg}`); failed++; delete manifest.lines[text]; return;
  }
  console.error(`FAILED after retries "${text}"`); failed++; delete manifest.lines[text];
}
const maxArg = process.argv.indexOf("--max"), maxNew = maxArg > 0 ? +process.argv[maxArg + 1] : Infinity;
let budget = maxNew;
const queue = list.filter(t => existsOk(t) || budget-- > 0);
for (const t of list) if (!queue.includes(t) && existsOk(t)) manifest.lines[t] = file(t);
await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) await record(queue.shift()); }));
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`made ${made}, already had ${skipped}, failed ${failed}`);
if (made) console.log("Now set the volume per clip (files stay untouched): node scripts/riddles-loudness.mjs public/french/audio");
if (failed) process.exit(1);
