# Validation — 2026-10-15

Base integration: `911893775559e189418705a5d841bf29d4fe992e`  
Implementation head: `73be40495ad3638c8ceeec6ca21c25061d0dc791`  
Local build ID: `07f3967fe8dc`

| Command | Exit | Result |
|---|---:|---|
| `npm ci` | 0 | 160 packages installed |
| `node --check tools/castreel.cjs` | 0 | pass |
| `node --check tools/nullfangreel.cjs` | 0 | pass |
| `node --check tests/reel-contract.cjs` | 0 | pass |
| `node tests/run.cjs reel-contract campaign-contract grapple-contract` | 0 | 3/3 pass |
| `python -m unittest discover -s tools/studio -p 'test_audit.py' -v` | 0 | 4/4 pass |
| `node build.cjs` | 0 | four pages built, BUILD_ID `07f3967fe8dc` |
| `node tools/pack-www.cjs` | 0 | 693 assets + two pages, 249.7 MB |
| `node tests/build-integrity.cjs` | 0 | pass |
| `npx playwright install chromium` | 1 | five zero-byte invalid ZIP downloads |
| `python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-15/automated` | 1 | 189 results: 30 pass; 159 browser-launch failures |
| `python tools/studio/audit.py --tests ... reel-contract --output docs/studio/runs/2026-10-15/final-static` | 0 | 29/29 recorded results pass |

The full run's browser logs consistently report that the Chromium executable does not exist at `/opt/pw-browsers/chromium`. Treat those 159 results as blocked. The full campaign, reel render, gameplay frames, physical inputs, audio listening and haptics are unverified.

Generated HTML was rebuilt for validation but is intentionally excluded from the review commit. Integration must rebuild from source.
