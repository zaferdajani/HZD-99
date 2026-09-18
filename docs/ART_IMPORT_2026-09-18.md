# HZD-99 artwork recovery — 18 September 2026

The owner approved the preserved guard calibration in this Codex task. Original RGB/alpha takes precedence over the old 3–7% dark-pixel target: luminance keying was erasing the original visor and outlines.

## Changes

- `movestrip.cjs` and `herostates.cjs` preserve alpha-bearing input. Luminance keying is limited to legacy opaque black backgrounds.
- `hero-delivery.cjs` rebuilds 42 character/projectile sheets / 291 cells from source hashes, rectangles, scales, pivots and flight offsets. The state order remains 24 cells; the old 22-cell builder now includes walk_c/run_c.
- The 16-frame run uses new drawings referenced to the approved guard. Other replacement bodies use supplied originals or pose recoveries generated from them; recovered weapon, recharge and aerial originals are archived alongside the immutable supplied sheets.
- Scale is measured once per source cohort from the ceramic head. Poses are not individually stretched to equal heights. Uppercut overhead extension, crouches and airborne poses intentionally change silhouette height.
- Grounded cells end on row 311 of a 320px cell (joined overhead weapon cells use 384px, floor row 375). Flight has explicit lift or centered registration. Minimum adjacent-frame gutter is 19 transparent columns.
- Locomotion registration follows the head. Obsolete run mirroring/state offsets are removed. Walk contacts/passing and measured world-space stride are updated together.
- Eye anchors were remeasured, with a visually checked wall-pose exception for the cyan paw beside its visor. The state fallback alone has baked eyes removed for the existing runtime painter.
- Sprite frames and clip changes no longer cross-fade into doubled heads and paws. Existing game clocks still select frames.
- Combat hitboxes, world zoom, actor screen-scale, input, saves and progression are unchanged.

## Provenance and limits

`assets/source/hero/delivery-2026-09-18/manifest.json` contains source SHA-256 hashes and transformations. Original delivered PNGs are unchanged. `approved-guard.png` is the reviewed crop; `runA.png`–`runD.png` are OpenAI ChatGPT image generation outputs using it as reference. The 16 run figures are 486–609px tall before packing. The rejected low-resolution 16-up attempt is not shipped.

Historical supplied strips retain their original resolution, including figures below 400px. The exported 320px PNGs are runtime masters, not a claim that all historical sources meet the new-generation minimum. Upscaling would not recover detail.

The supplied playful front-view idle/fidget, existing cable-tail poses and approved limb design are retained. Conflicting historical blanket “no tail”, arm-hardware and palette descriptions do not silently redesign the approved original.

The owner subsequently required all eight later body-plus-effect composites to be recovered and implemented. They remain archived unchanged under `reference-composites/`, with ZIP provenance in `supplied-inventory.json`. See `ART_RECOVERY_PROGRESS.md` for the per-sheet status; archiving alone does not count as implementation. The original exclusion is superseded.

## Rebuild and verification

Install repository dependencies; set `CHROMIUM_PATH` when using system Chrome.

```sh
node tools/hero-delivery.cjs
node tools/hero-delivery.cjs --check
node tools/lowres.cjs
npm run app:pack
node tests/run.cjs
```

`--check` verifies source hashes and regenerated runtime bytes. `--png-dir /absolute/output/path` exports transparent PNGs before runtime eye removal. `--raw-states` is diagnostic: remeasure with `heroeyes.cjs`, review markers, update `heroeye.json` and `HERO_EYE`, then rebuild normally before shipping.

Connected-silhouette isolation removes detached neighboring-frame fragments without recoloring opaque body pixels. Manifest geometry and eye anchors remain reviewed data.

`hero-alpha.cjs` protects the dark visor/alpha import; `hero-frame-alpha.cjs` checks for ghost silhouettes at fractional frames and clip switches. Existing gameplay/art suites remain required. Windows test fixes normalize credit paths and honor configured Chrome. The gait test measures actual draw scale instead of assuming k=1; acceptance thresholds are unchanged. See the task's final report for completed tests and live-release status.
