# stepkick.com — PLAN

> **Type:** Site · Mode: 🕹️ App (kids education). Greenfield.
> **Status:** Building · Plan locked 2026-07-13 · POC in `src/`
> **Domain:** stepkick.com — Bluehost, exp 05/11/2027 (renewed, auto-renew ON)

---

## What it is (decided 2026-07-13)

A **kid-friendly learning quiz** in the whattheflag mould: **a visual + 4 tappable choices**. Pick a
subject, get 10 questions, rack up a streak, get showered in confetti. No reading required to *play* —
the prompt carries the question (a picture, a count, a pattern, a math expression).

**stepkick is the umbrella app; the quiz is the launch mode.** The original logic-gates idea
(input→output, AND/OR/NOT) is **not dropped** — it becomes a *later mode inside stepkick*
("Circuits"), sharing the same shell, dopamine layer, and progress store. See **Roadmap** below.

### Launch subjects (the four tiles)

| Tile | Prompt shown | You pick | Distractor rule |
|---|---|---|---|
| ➕ **Math** | count-the-objects / `3 + 4 = ?` | the number | near-miss numbers (generated) |
| 🖼️ **Vocabulary** | a picture (emoji) | the word | other words in the same category |
| 🦁 **Animals** | an animal picture | its name | other animals |
| 🔷 **Patterns & Logic** | a sequence `🔺🔵🔺🔵…` | what comes next | the other shapes |

Patterns & Logic is deliberately the **bridge to the Circuits mode** — pattern/odd-one-out *is*
pre-computational thinking, so the umbrella feels coherent from day one.

Alternates parked for later tiers: Shapes & Colors (youngest), Geography (careful — overlaps
whattheflag), History (weak for young kids — needs an older tier).

---

## Architecture — the generalized quiz engine

whattheflag's one flag-specific spot was distractor selection (pick wrong flags from the same
region). We **invert** that: the engine knows nothing about subjects — it just asks a **SubjectPack**
for the next question. Each subject owns its own question construction. This is the shared engine
your memory notes was meant to back whattheflag / rapscore / sicquotes / uxdef.

```
src/
  engine/        subject-agnostic
    types.ts       Prompt, Question, SubjectPack, Outcome
    rng.ts         seeded mulberry32 (lifted from wtf, verbatim)
    game.ts        Game: score / streak / flow. Asks pack.makeQuestion(rng, i, difficulty)
  subjects/      one file per tile — the ONLY subject-specific code
    util.ts        bank sequence + group-distractor helpers
    math.ts        generative (count / add / sub)
    vocab.ts       emoji→word bank
    animals.ts     emoji→name bank
    patterns.ts    generative (alternating / repeating sequences)
    index.ts       registry: SubjectId -> pack
  ui/
    dom.ts         tiny h() builder (from wtf)
    juice.ts       confetti + flash words + score fly-ups (from wtf, VERBATIM)
    home.ts        subject tiles
    game.ts        renders any Prompt kind + 4 choice buttons
    results.ts     badge + score + play again
  main.ts          desktop frame + 📱/iPad▯/iPad▭ view switcher (from wtf), routing
  storage.ts       bests-per-subject, sound, view (localStorage)
  sound.ts         WebAudio sfx (from wtf, verbatim)
  styles.css       adapted from wtf; container-query responsive
```

### Reused from whattheflag, unchanged
- **`juice.ts`** — the dopamine layer you liked (confetti, `YES!`/`GALAXY BRAIN!`, score fly-ups).
- **The desktop view switcher** — `main.ts` already shows a 📱/iPad▯/iPad▭ toggle *only* on
  mouse-driven desktops; real devices get full viewport. Exactly the "little switcher" you asked for.
- **Container-query responsive** — `@container (aspect-ratio > 1.15)` flips to a two-column layout
  for iPad landscape automatically. No orientation JS.
- **Seeded RNG, sound, scoring shape.**

### Kid-tuned differences from whattheflag
- **No timer / no sudden-death by default** — young kids shouldn't be rushed. 10 questions, gentle
  difficulty ramp, keep score + streak + all the juice.
- **Home = subject tiles**, not mode tiles (modes come later).
- Bigger tap targets, brighter per-subject accent colors.

---

## House stack
Vite + TypeScript, static, no backend. `npm run deploy` → gh-pages (mirror whattheflag).
localStorage only, no accounts. PWA (installable, offline) is a fast follow — deferred out of the POC
to keep it lean; add `vite-plugin-pwa` exactly as whattheflag has it.

---

## Roadmap
1. **POC (this build):** all four subjects playable end-to-end, home→game→results, full juice,
   responsive + desktop switcher. ✅ target
2. Polish content banks (more items, better art — emoji now, could move to illustrated SVGs).
3. PWA + deploy to stepkick.com.
4. **Circuits mode** — the original logic-gates toy as a second mode inside stepkick.
5. Older-kids tier (History / Geography), difficulty settings, per-kid profiles.
6. Eventually port to native iOS (SwiftUI) — the engine/subject split makes the data portable.

## Distinct-brand guardrail
Keep **stepkick ≠ giantchop** (house rule). Giantchop = older-kids STEAM *content*; stepkick =
younger-kids *quiz app*. Different visual line.
