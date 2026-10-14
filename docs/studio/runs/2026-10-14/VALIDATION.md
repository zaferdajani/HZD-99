# CLAWBYTE studio validation — 2026-10-14

## Evidence boundary

- Frozen main/integration base: `14bef4baba6b12d78b7ba2e41c221e8b95b9f938`.
- Local implementation commit: `ea9f710`.
- Built pages: `BUILD_ID 07f3967fe8dc`.
- Browser availability: **blocked**. No Chromium executable existed on the worker. `npx playwright install chromium` attempted five downloads; every response reported `100% of 0 MiB` and failed ZIP validation.
- Consequently no browser staged test, uninterrupted campaign, phone viewport traversal, actual touch run, gameplay screenshot, listened audio or felt haptic is certified here.
- Four 1600×893 source panels were rendered to 844×390 for direct art inspection. These are source samples, not live-game captures.
- The purple-eye image edit is a candidate only. It changed the full raster and dimensions, so it was not integrated or counted as a verified localized fix.

## Commands and results

| Command | Exit | Meaning |
|---|---:|---|
| `git fetch origin --prune` | 0 | Main and integration pinned at the same `14bef4b`. |
| `npm ci` | 0 | 160 locked packages installed. |
| `npx playwright install chromium` | 1 | Browser provisioning blocked by zero-byte/non-ZIP downloads. |
| `node -c` on edited JS/CJS and `python -m py_compile` on audit files | 0 | Syntax valid. |
| `node tests/run.cjs campaign-contract grapple-contract` | 0 | Seven negative campaign cases and 11 protected grapple states plus global Alpha-pack rule pass. |
| `python -m unittest discover -s tools/studio -p 'test_audit.py' -v` | 0 | Four collector regressions pass. |
| `node build.cjs` | 0 | Four pages built; `BUILD_ID 07f3967fe8dc`. |
| `node tools/pack-www.cjs` | 0 | 693 assets and two pages packaged. |
| `node tests/build-integrity.cjs` | 0 | Runtime identity and package exclusions pass. |
| `python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-14/automated` | 1 | All 188 results completed: 29 pass, 159 browser-backed launch failures. No false green. |
| Static subset collector listed below | 0 | 28/28 results pass: build, two identity checks and 25 harnesses. |
| `git diff --check` | 0 | No whitespace errors. |

Static subset command:

```sh
python tools/studio/audit.py --tests repair-lifecycle story-opening script-route scratch-reach hero-feedback tutorial-controller offline-release sage-specials tutorial-clarity story-progression input-focus voice-handoff desktop-protocol cave-ground seam-route shadow-ground dialogue-audio weapons gear motion-sampling combo-routing credits tails campaign-contract grapple-contract --output docs/studio/runs/2026-10-14/final-static
```

The full run's 159 failures share the same root: Playwright could not find `/opt/pw-browsers/chromium`. Representative logs include `repair-browser.log` and `campaign-ch1.log`. `automated/results.json` is the complete local result record.

## Visual-source inspection

| Asset | Source SHA-256 | Direct observation |
|---|---|---|
| `r_cell.webp` | `800ab5ba11aab84cbf7a13e8a38d6c37acc924505558df945e76b490362c98c4` | Hero/Ratchet identity is strong; background Servo has lit amber eyes/cyan chest despite “switched off” text. |
| `r_marble.webp` | `82f68a235fad9e1de0b559c90c8d295a71fcfa6857fb8dbe1f67e4ae01fce410` | Raw marble is present and hero unarmed; sword outline must remain clearly a future forge diagram. |
| `m_down.webp` | `c65be806cf5fdc6b005d551504625dd0d38ffec4f7afcb260205f2a45930acaa` | NULLFANG seams are purple but eyes are red. |
| `passage_b.webp` | `9ca50c2cbeb05b9769a5d11d360bf0ae9a1792ceb8bc02b9ad15d86995944203` | Rear-view hero limbs/hands are elongated versus the compact model. |

Source render hashes at 844×390 are recorded beside the files under `visual-source/`. Their existence does not certify gameplay presentation.

## Evidence semantics

- The campaign contract executes the acceptance function and negative cases; it does not play the game.
- Browser harnesses such as panels, grapple, vlink and room-cache stage state or geometry; when runnable, they remain separate from campaign evidence.
- Only a cleared-storage `campaign-ch1` run, starting from the title with ordinary controls and no inventory/flag/position writes, can certify Chapter One.
- Viewport emulation is not a physical-touch run. Source audio/haptic calls are not listened/felt evidence.
