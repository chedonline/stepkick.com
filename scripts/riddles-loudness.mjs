// Even out the volume of the pre-recorded Riddles lines WITHOUT touching the files.
//   node scripts/riddles-loudness.mjs          -> measure every clip, write a gain (dB) per file into manifest.json
//   node scripts/riddles-loudness.mjs --report -> just show the spread
// The page applies the gain while it plays. Never re-encode the MP3s to change their volume:
// decoding and re-encoding a 64k MP3 adds a second layer of compression crackle ("bips").
// Needs ffmpeg on PATH. Run after every riddles-voice.mjs --go.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const TARGET_I = -16, MAX_TP = -1; // loudness target (LUFS) and the highest peak allowed after the gain (dBTP)
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
// audio folder: public/riddles/audio by default, or pass one (e.g. public/french/audio)
const dirArg = process.argv.slice(2).find(a => !a.startsWith("--"));
const dir = path.resolve(root, dirArg || "public/riddles/audio");
const mpath = path.join(dir, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(mpath, "utf8"));
// every recording set in the manifest (Mots has "lines" = fast and "slow")
const files = [...new Set([...Object.values(manifest.lines), ...Object.values(manifest.slow || {})])];

function stats(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"], { encoding: "utf8" });
  const m = (r.stderr || "").match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!m) throw new Error("no loudness stats for " + file);
  const s = JSON.parse(m[0]); return { i: +s.input_i, tp: +s.input_tp };
}
const rows = files.map(f => {
  const s = stats(path.join(dir, f));
  const want = TARGET_I - s.i, gain = Math.min(want, MAX_TP - s.tp);
  return { f, ...s, gain: Math.round(gain * 10) / 10, short: want - gain };
});
const after = rows.map(r => r.i + r.gain).sort((a, b) => a - b);
console.log(`${rows.length} clips: as recorded ${Math.min(...rows.map(r => r.i))} to ${Math.max(...rows.map(r => r.i))} LUFS; ` +
  `as played ${after[0].toFixed(1)} to ${after[after.length - 1].toFixed(1)} (middle 80% ${after[Math.floor(after.length * .1)].toFixed(1)} to ${after[Math.floor(after.length * .9)].toFixed(1)})`);
const held = rows.filter(r => r.short > 1);
if (held.length) console.log(`${held.length} clip(s) kept more than 1 dB quieter so their peaks don't clip`);
if (process.argv.includes("--report")) process.exit(0);
manifest.gain = Object.fromEntries(rows.map(r => [r.f, r.gain]));
fs.writeFileSync(mpath, JSON.stringify(manifest, null, 1));
console.log("wrote gains to manifest.json");
