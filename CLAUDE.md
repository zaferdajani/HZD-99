# NOSTOS / Odyssey — Project Memory & Working Rules

> Auto-loaded every session. Owner: dr.zafer.dajani@gmail.com (non-technical —
> never assign them technical steps; act, then report in plain words).

## RULE #1 — ALWAYS SEND THE TEST LINK (owner-mandated 2026-07-19)
After EVERY edit that changes something playable or viewable, END the reply
with the link the owner should open to test it. Never finish a change without
it.

**PLACEMENT RULE (owner-mandated 2026-07-24, do NOT forget):** ANY instruction
that tells the owner to open a link OR copy a prompt must be the LAST thing in
the message — the link/prompt goes at the very end with NOTHING after it (no
trailing sentence, no sign-off). One link at a time when he asks for "one
link." This applies to every message, not just edit results.

The standing links:

- **Game (permanent, auto-updating) — the official link**:
  **https://zaferdajani.github.io/odyssey/**
  Served by GitHub Pages from `zaferdajani/odyssey` (now PUBLIC). The workflow
  `.github/workflows/pages.yml` runs on every push to `main`: `node build.cjs`,
  copies `play.html` → `_site/index.html`, deploys. So a normal
  `git push origin main` auto-updates this link within ~1–2 min — nothing else
  to do. Confirm via the Actions run conclusion + `curl -I` the URL (expect 200).
  One-time setup done 2026-07-24: repo made public + Pages Source = "GitHub
  Actions" (owner-only GitHub UI toggles the API token cannot perform; already
  done, never redo). If a deploy fails with a 504 on the publish/dispatch step,
  that's a transient GitHub Pages outage — just re-run `pages.yml` later.
- **Do NOT use the Artifact tool for the game** — the single-file build is
  ~10 MB, over the Artifact size limit, so every republish is auto-rejected
  (looks like a user decline but isn't). Stale old artifact (do not update):
  https://claude.ai/code/artifact/e90a6fc8-ae94-49cd-9181-add016d372c1
- Fallback if Pages is mid-outage: `SendUserFile` the built `play.html`
  directly (works instantly, no GitHub involvement).
- Workshop 1 · Cat Samurai: https://claude.ai/code/artifact/b7ffa68b-ed0a-4be8-a05b-6c7a94dff500
- Workshop 2 · Odyssey Heroes: https://claude.ai/code/artifact/1c672893-75af-45f9-902a-ec928b071ed0
- Workshop 3 · Worlds (3D environments): https://claude.ai/code/artifact/387e07cf-8cac-4665-95cc-fec236008ded
- Workshop 4 · Beasts: in repo only (`workshop/odyssey-beasts.html`) — owner
  declined a published page once; publish only if asked again.

Game edits → send the game link. Workshop edits → send that workshop's link
(republish the SAME scratchpad file path, or pass `url:` from a new session).
Mobile note for the owner: open the game link on the phone signed into
claude.ai (or use the page's share menu for a no-login link); rotate to
landscape; touch controls appear automatically.

## What this repo is
An original bilingual (EN/AR) browser metroidvania built on Homer's Odyssey
(public domain; research base + full story mapping in `ODYSSEY_SOURCE.md`),
ported from the owner's CLAWBYTE engine and fully re-themed. Vanilla JS +
Canvas, zero dependencies. `node build.cjs` bundles `index.html` + `js/*` +
assets into the single playable `play.html` (~10 MB).

- Zones A–E + hidden X: Shores, Cyclops' Island, Circe's Isle, Underworld,
  Ithaca (finale), Sirens' Strait (secret). Internal IDs kept from clawbyte
  (glitch/atlas/zero/brood/prism/mother etc.) — only display text/sprites are
  themed; do not rename IDs.
- Guardians with phase escalations (Antinous has 3 phases); every boss drops
  rewards (room-tied ability grants in game.js `grants`, kind-tied trophies).
- Comic cutscenes (`js/comics.js`): backstory before the story, 2-panel manga
  reveal per boss (flag `cx_<kind>`), halftone/speedlines/splash style.
- Trials of Wisdom (`js/trials.js`): 4 animated mini-games at road stations +
  temple Full Trial; Metis awarded only for beating your own best.
- Dev menu: title screen → "Workshop of Daedalus" jumps to any boss/trial/riddle.
- `workshop/`: the art-pipeline stations (parametric code-drawn rigs, frame
  strips, 360° turntable, sprite-sheet export).

## Standing rules (owner-established)
1. **One repo, one conversation**: everything (game + workshops) lives here in
   `zaferdajani/odyssey`, pushed to `main`. TeamManager is untouched.
2. **Bilingual always**: every user-facing string ships with en + ar together
   (`js/i18n.js`; comic captions carry {en,ar} inline). Ambient real-Greek
   lettering (ΝΟΣΤΟΣ, zone/boss names, α β γ δ) is a deliberate style layer.
3. **Licenses**: only CC0/CC-BY assets, license verified ON THE SOURCE PAGE
   before download, recorded in `assets/CREDITS.md` (CC-BY attribution must
   ship in-page — see index.html comment + menu footer). Never "free for
   personal use", never CC-BY-SA/NC without explicit owner approval.
4. **Verify before publishing**: run the playwright harnesses in the session
   scratchpad pattern (boot, menu flow, bosses incl. forced phases, trials,
   comics, Arabic) headless in Chromium (`/opt/pw-browsers/chromium`); zero
   console/page errors is the bar. `node --check` every touched js file.
5. **Art direction**: stylized bold Greek look (Disney-Hercules-era vibe, all
   ages, everything original — nothing copied from any existing game/film).
   Eyes must have depth (lash line, iris gradient + limbal ring, light
   catches, emotional brows) — owner rejected flat cartoon eyes.
6. **Cat universe** (workshop 1, separate future game): NPCs/enemies are OTHER
   robotic animals (owl sage, fox merchant, hounds) — not more cats.
7. **Owner communication**: lead with what changed and the test link; plain
   words, no jargon; short. They direct art changes conversationally
   ("bigger shield", "heavier landing") — redraw, republish, send link.
8. Commits are restore points: commit per slice with clear messages; push to
   `main` (`git push -u origin main`).
