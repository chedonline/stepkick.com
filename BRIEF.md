# stepkick.com — BRIEF

> **Type:** Site (kids education). Greenfield.
> **Status:** Brief · Created 2026-07-12 · plan TBD (this is the seed for plan mode)
> **Domain:** stepkick.com — Bluehost, exp 05/11/2027 (renewed, auto-renew ON)

---

## The idea (Charles's words)

> Child education built around **logic gates** — teaching kids computational thinking through AND/OR/NOT-style puzzles. Step by step, **input → output**. The name suggests sequencing / causality.

A kid-friendly, visual, interactive site that teaches the building blocks of computation: you give inputs, the gate/circuit does its thing, you see the output. Learn AND / OR / NOT (then NAND, XOR, and simple multi-gate circuits) by **playing**, not reading.

**Positioning:** computational thinking for kids — logic as a toy. Concrete, tactile, cause-and-effect. The "aha" is watching an output flip when you toggle an input.

---

## Why it could work

- **Logic gates are inherently visual and interactive** — perfect for a browser toy: toggle switches (inputs), see a lightbulb (output) turn on/off. Immediate feedback, no text needed.
- **Progression is natural** — single gate → truth tables by play → combine two gates → build a circuit that does a task (e.g. "turn the light on only when *both* switches are up"). Difficulty scales cleanly into a level ladder.
- **Underserved niche** — lots of kids' coding sites (Scratch, code.org) teach sequencing/loops; far fewer make **boolean logic / circuits** playful for young kids. Distinct hook.

---

## Rough shape (to pin down in plan mode)

- **Core interaction:** drag-free at first — tap switches, watch the gate resolve, output lights up. Later levels: drag gates onto a board and wire them.
- **Level ladder:** meet each gate (AND/OR/NOT) → truth-table-by-play → 2-gate combos → "solve the puzzle" circuits with a goal condition → free-build sandbox.
- **No-text-first:** icons, color, animation carry the teaching so pre-readers / early readers can play. Optional voice/labels.
- **House stack (likely):** static site, vanilla JS + canvas/SVG for the circuit board, no build — same Variant A as rapscore/citydrawer. A logic-gate simulator is pure client-side; no backend needed for v1.
- **Progress:** local-only (localStorage) for v1; no accounts.

---

## Open questions for plan mode

1. **Age target** — leans **younger** now that GiantChop owns the older-kids bet (decided 2026-07-12): target ~**5–8** (tap-and-see, minimal/late wiring). Confirm the exact band — it drives the whole interaction model.
2. **Game vs sandbox vs curriculum** — a level-based puzzle game, an open sandbox to build circuits, or a structured lesson sequence? (Recommend: puzzle-game spine + unlockable sandbox.)
3. **How far up the ladder** — stop at the 7 basic gates, or go to half-adders / simple "build a machine" projects for older kids?
4. **Art direction** — characters/mascot (adjacent to giantchop's kids-STEAM brand) or clean abstract shapes? Keep stepkick and giantchop **distinct brands** (house rule) — decide the visual line here.
5. **Monetization / intent** — free educational toy, lead-gen for a giantchop-style brand, or eventual paid level packs? (Affects scope, not v1.)
6. **Relationship to giantchop.com** — both are kids brands. Nest, cross-link, or fully separate? Decide before building a second kids identity.

---

## Next step

Run this through **plan mode** (like citydrawer/heyvisit): settle age target + game-vs-sandbox + the level ladder, then scaffold `projects/stepkick.com/` with a PLAN.md and a single-gate POC (tap two switches → AND gate → lightbulb) to prove the core interaction feels good.
