// Pre-record every built-in Riddles line with ElevenLabs, so any device gets the
// voice with no API key. Writes public/riddles/audio/<hash>.mp3 + manifest.json.
//   node scripts/riddles-voice.mjs          -> dry run: count lines + characters
//   node scripts/riddles-voice.mjs --go     -> record (skips files that already exist)
// Key: C:\Users\chedo\.secrets\elevenlabs.key, or ELEVENLABS_API_KEY. Never printed.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";

const VOICE = { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" };
const MODEL = "eleven_turbo_v2_5";
const VOICE_SETTINGS = { stability: 0.4, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true, speed: 1 };

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const html = fs.readFileSync(path.join(root, "public/riddles/index.html"), "utf8");
const grab = (re, what) => { const m = html.match(re); if (!m) throw new Error("couldn't find " + what); return Function(`"use strict";return (${m[1]})`)(); };
const RAW = grab(/const RAW = (\[[\s\S]*?\n\]);/, "RAW");
const YES = grab(/const YES = (\[[^\]]*\]);/, "YES");
const NO_GUESS = grab(/const NO_GUESS = (\[[^\]]*\]);/, "NO_GUESS");
const SILENT = grab(/const SILENT = (\[[^\]]*\]);/, "SILENT");
const MT_LINE = grab(/const MT_LINE = ("[^"]*");/, "MT_LINE");
const TEST_LINE = grab(/speak\(("Hi! Are you ready[^"]*")\)/, "test line");

const lines = new Set([...YES, ...NO_GUESS, ...SILENT, MT_LINE, TEST_LINE]);
for (const [type, setup, punch] of RAW) {
  if (type === "knock") { lines.add("Knock knock!"); lines.add(setup + "."); }
  else lines.add(setup);
  lines.add(punch);
}
const list = [...lines];
const chars = list.reduce((n, t) => n + t.length, 0);
console.log(`${list.length} lines, ${chars} characters (turbo bills ~${Math.ceil(chars / 2)} credits)`);
if (!process.argv.includes("--go")) process.exit(0);

let key = process.env.ELEVENLABS_API_KEY || "";
try { key = fs.readFileSync(path.join(os.homedir(), ".secrets/elevenlabs.key"), "utf8").split(/\r?\n/)[0].trim() || key; } catch {}
if (!key) { console.error("No ElevenLabs key found"); process.exit(1); }

const outDir = path.join(root, "public/riddles/audio");
fs.mkdirSync(outDir, { recursive: true });
const file = t => crypto.createHash("sha1").update(t).digest("hex").slice(0, 12) + ".mp3";
const manifest = { voice: VOICE.name, voiceId: VOICE.id, model: MODEL, lines: {} };
let made = 0, skipped = 0, failed = 0;

async function record(text) {
  const f = file(text), dest = path.join(outDir, f);
  manifest.lines[text] = f;
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) { skipped++; return; }
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE.id}?output_format=mp3_44100_64`, {
      method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL, voice_settings: VOICE_SETTINGS }) });
    if (r.ok) { fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); made++; return; }
    const msg = (await r.text()).slice(0, 200);
    if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 1500 * attempt)); continue; }
    console.error(`FAILED ${r.status} "${text}": ${msg}`); failed++; delete manifest.lines[text]; return;
  }
  console.error(`FAILED after retries "${text}"`); failed++; delete manifest.lines[text];
}

const queue = list.slice();
await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) await record(queue.shift()); }));
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`made ${made}, already had ${skipped}, failed ${failed}`);
if (made) console.log("Now even out the volume: node scripts/riddles-loudness.mjs --fix");
if (failed) process.exit(1);
