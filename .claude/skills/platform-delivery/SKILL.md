---
name: platform-delivery
description: RULE ZERO (author at full quality, derive every cheaper tier with a tool) and RULE ONE (web, phone, the Capacitor app and the desktop shell are one build) — the asset tiers, the package's size and what is streamed, the low-resolution copy, the native shell. Load before adding or changing any asset, sheet, film or track, before touching how anything reaches a device (preload, service worker, pack-www), and before adding a screen or an input.
---

# Every platform gets the same game, and every tier is derived

Moved from `CLAUDE.md` on 2026-11-17, unedited. `docs/DELIVERY.md` is the whole
delivery path; this is the two rules that govern it and why.

## RULE ZERO: author at full quality, DERIVE everything cheaper

**Never author down. Make the good version once, and let a tool in `tools/`
produce the small one — automatically, reproducibly, from the master.**

The owner's standing instruction, and it is the cheapest way to work as well as
the best-looking: taste and effort go in once, and every platform after that is
a script. The alternative — deciding at authoring time that a phone will not
need the detail — is a decision that cannot be undone and has to be re-made
every time a new platform appears.

The masters are the archive; the shipped tiers are generated:

| what | master | derived tier | tool |
|---|---|---|---|
| art sheets | `assets/characters`, `assets/backgrounds`, … | `assets/lowres/` — 0.55 MB for 24.2 MB | `tools/lowres.cjs` |
| films | `assets/video/*.mp4` | `assets/video/light/` — about half | `tools/lightvid.cjs` |
| rendering | the full effect stack | the quality dial: resolution, ceilings, weather, glow, bloom | `js/perf.js` |
| generation plates | `assets/source/` — 11 MB, never shipped | the composited sheets | `tools/*.cjs` |

Consequences that bind every change:

- A new heavy asset is not finished until its cheaper tier exists. Regenerate
  with `node tools/lowres.cjs && node build.cjs` after any art change.
- The engine never assumes it has the good version. Every renderer already
  guards on "the sheet is not here yet"; a derived tier is the same situation.
- **The one exception is measured, not assumed**: six guardian parts atlases are
  addressed by absolute pixel rect and must have no small copy.
  `tests/lowres.cjs` re-derives that from the source rather than trusting a list.
- The delivery path this feeds is `docs/DELIVERY.md`. Read it before changing
  how anything reaches a device.

**Multi-platform is the target, not an afterthought**: browser and phone first,
desktop (Steam) next, console possible later. Every tier above exists so that
adding a platform is a configuration decision rather than an art project.

## RULE ONE: every platform gets the same game

**Web page, mobile web, the Capacitor app, the desktop shell — one build, one
game, updated together. No change ships to one and not the others.**

This is the highest rule in this file. It is not a preference; it is the thing
that decides whether "I fixed it" means anything.

It is already true STRUCTURALLY, and that is on purpose: `build.cjs` emits
`index.html` + `odyssey.html`, and every platform consumes those two files.
`tools/pack-www.cjs` copies them into `www/` for Capacitor; `tools/pack-desktop.cjs`
stages `www/` for the desktop shell; `sw.js` is a runtime cache with no
precache manifest, so there is no list of files to keep in sync. `www/` is
generated and untracked — it can never be stale in git because it is never in
git.

So the ways this rule actually gets broken are narrow, and they are what
`tests/platform.cjs` checks every run:

- **An asset the game references that the packer does not copy.** The packer
  walks the whole `assets/` tree with no allowlist, which is the safe default —
  an allowlist is a list somebody has to remember, and forgetting it means a
  new file silently missing on Android while the web build is fine.
- **A page difference that is not one of the two deliberate ones.** The app
  strips the service-worker registration (inside a package there is nothing to
  be newer than) and nothing else. Any other divergence is a bug.
- **Input.** Keyboard, gamepad and touch are three paths to the same actions;
  a feature reachable by only one of them is broken on the platforms that lack
  it. Every new screen needs a touch hit-box derived from its own drawing (see
  `tests/tap.cjs`) and a pad binding.
- **Weight.** `assets/source/` is the generation archive, 11 MB that nothing
  loads. It is excluded from the package by name.

After any change that touches assets, pages or input: `node build.cjs && npm
run app:pack && node tests/run.cjs`.

Two games, one engine. `index.html` is CLAWBYTE (robo-cat, machine city);
`odyssey.html` is NOSTOS (the hero's world). Same code, hard-locked to one
world each by `window.GAME_LOCK`; `isHero()` is the switch.

## Native

`capacitor.config.json` + `android/` wrap the same build as an app;
`tools/pack-www.cjs` assembles `www/` (and strips the service worker, which an
app does not want). `MainActivity.java` turns off the media-gesture requirement
— the reason the app can start its music without asking. See `NATIVE.md`.
