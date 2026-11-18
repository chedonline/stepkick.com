// Measure (and optionally even out) the loudness of the pre-recorded Riddles lines.
//   node scripts/riddles-loudness.mjs        -> report integrated loudness (LUFS) spread
//   node scripts/riddles-loudness.mjs --fix  -> rewrite every clip to the same loudness (two-pass loudnorm)
// Needs ffmpeg on PATH. Run --fix after every riddles-voice.mjs --go (new clips come in uneven).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const TARGET = { I: -16, TP: -1.5, LRA: 7 };
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const dir = path.join(root, "public/riddles/audio");
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
const files = [...new Set(Object.values(manifest.lines))];
const byFile = Object.fromEntries(Object.entries(manifest.lines).map(([t, f]) => [f, t]));
const norm = `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}`;

function stats(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", norm + ":print_format=json", "-f", "null", "-"], { encoding: "utf8" });
  const m = (r.stderr || "").match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!m) throw new Error("no loudness stats for " + file);
  return JSON.parse(m[0]);
}
function even(file, s) {
  const tmp = file + ".tmp.mp3";
  const af = `${norm}:measured_I=${s.input_i}:measured_TP=${s.input_tp}:measured_LRA=${s.input_lra}:measured_thresh=${s.input_thresh}:offset=${s.target_offset}:linear=true`;
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", file, "-af", af, "-ar", "44100", "-ac", "1", "-b:a", "64k", tmp], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg failed on " + file + ": " + r.stderr);
  fs.renameSync(tmp, file);
}
function report(label, rows) {
  const is = rows.map(r => r.i).sort((a, b) => a - b);
  const pct = q => is[Math.min(is.length - 1, Math.floor(q * is.length))];
  rows = rows.slice().sort((a, b) => a.i - b.i);
  console.log(`${label}: ${rows.length} clips, ${is[0]} to ${is[is.length - 1]} LUFS (spread ${(is[is.length - 1] - is[0]).toFixed(1)} dB; middle 80% ${pct(.1)} to ${pct(.9)})`);
  console.log("  quietest:", rows.slice(0, 3).map(r => `${r.i} "${byFile[r.f]}"`).join(" | "));
  console.log("  loudest: ", rows.slice(-3).map(r => `${r.i} "${byFile[r.f]}"`).join(" | "));
}

const measureAll = () => files.map(f => { const s = stats(path.join(dir, f)); return { f, i: +s.input_i, s }; });
const before = measureAll();
report("before", before);
if (process.argv.includes("--fix")) {
  // `--fix a.mp3 b.mp3` evens out just those (new recordings) so already-even clips aren't
  // re-encoded again; plain `--fix` does every clip.
  const only = process.argv.filter(a => a.endsWith(".mp3")).map(a => path.basename(a));
  const off = only.length ? before.filter(r => only.includes(r.f)) : before;
  console.log(`evening out ${off.length} clip(s)`);
  for (const r of off) even(path.join(dir, r.f), r.s);
  report("after", measureAll());
}
