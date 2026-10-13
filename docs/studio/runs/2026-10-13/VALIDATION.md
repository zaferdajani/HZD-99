# CLAWBYTE studio validation — 2026-10-13

## Evidence boundary

- Frozen production and integration base: `d4f9c04fa5c53d72a84c2eddd72aa52870b0278c`.
- Bounded remote review implementation: `a9fd9ba64f76be20f7f04dfe4ce6be99974ec828`.
- Built pages: `BUILD_ID ccb500010b20`.
- Browser availability: **blocked**. No Chromium executable existed at `/opt/pw-browsers/chromium` or elsewhere on the host. `npx playwright install chromium` downloaded a zero-byte/non-ZIP response on all retries. `apt-get update` could not change to the package-service user in this container.
- Therefore no browser-driven staged test, uninterrupted real-input campaign, phone viewport traversal, actual touch run, gameplay screenshot, listened audio or felt haptic is certified by this run.
- Five local review images were direct source-art or source-film samples rendered at 844×390, not live-game captures; the canonical assets remain at their existing repository paths.

## Commands and results

| Command | Exit | Meaning |
|---|---:|---|
| `npm ci` | 0 | Locked dependencies installed. |
| `npx playwright install chromium` | 1 | Browser provisioning blocked by empty/truncated download. |
| `python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-13/automated` | 1 | Collector completed all requested names: build/package and 26 non-browser checks passed; 159 browser-backed checks failed at launch. No false green. |
| `node -c` on all edited JS/CJS files | 0 | Syntax valid. |
| `python -m unittest discover -s tools/studio -p 'test_audit.py' -v` | 0 | Four collector tests pass: metadata budgets, invalid metadata, status preservation and process-group cleanup. |
| `node tests/run.cjs campaign-contract grapple-contract` | 0 | Seven negative campaign certificate cases and protected/zero-damage grapple contract pass. |
| `node build.cjs` | 0 | Four HTML outputs rebuilt; build id `ccb500010b20`. |
| `node tools/pack-www.cjs` | 0 | 693 assets and two pages packaged. |
| `node tests/build-integrity.cjs` | 0 | Deterministic runtime identity/package exclusions pass. |
| `python tools/studio/audit.py --tests repair-lifecycle story-opening script-route scratch-reach hero-feedback tutorial-controller offline-release sage-specials tutorial-clarity story-progression input-focus voice-handoff desktop-protocol cave-ground seam-route shadow-ground dialogue-audio weapons gear motion-sampling combo-routing credits tails campaign-contract grapple-contract --output docs/studio/runs/2026-10-13/final-static` | 0 | Final frozen-build non-browser gate: build plus all 25 selected harnesses pass; served identity passes at start/end. |
| `git diff --check` | 0 | No whitespace errors. |

The full collector's 159 failures have the same environmental root cause: Playwright reports that the Chromium executable does not exist. Individual logs are retained instead of being rewritten as skips or passes. `automated/results.json` is the source of truth.

## Final static/source gate

`final-static/results.json` records a passing, byte-pinned subset after the final source edits. It proves only source-level and non-browser contracts. It does **not** replace:

1. the staged browser suite;
2. opening-order desktop/phone browser runs;
3. the uninterrupted `campaign-ch1` real-input run;
4. physical touch/native-package validation;
5. subjective motion, audio, haptic or owner artwork approval.

## Visual inspection

- `ratchet-wake-contact-844x390.png`: six sampled source-film frames. HZD-99 retains visor, cyan optics, ivory shell and scarf; Ratchet receives the cell and wakes. This closes the old cream/bare-face `repair.webp` identity finding by replacement, not by importing the old candidate.
- `r-cell-844x390.png`: main characters are on-model. Servo appears outside with lit amber optics/chest although the caption says he is switched off.
- `r-marble-844x390.png`: raw marble is visible, but a floating outline sword can be misread as a found weapon unless the caption/diagram reading is preserved.
- `m-down-844x390.png`: NULLFANG's infected eyes are red while the boss infection language is purple.
- `passage-b-844x390.png`: scene is readable, but HZD-99's rear-view arms/legs are elongated and less faithful than adjacent hero art.

No production URL or live asset was tested, changed or claimed.
