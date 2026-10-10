# Running a studio review

Read `docs/studio/PIPELINE.md`; instantiate the fifteen mandates in
`docs/studio/roles.json` as specialist reviews, grouping work where needed.

```sh
npm ci
# Install a Playwright-compatible Chromium or set CHROMIUM_PATH to an existing one.
CHROMIUM_PATH=/path/to/chromium python tools/studio/audit.py --profile full --output docs/studio/runs/YYYY-MM-DD/automated
```

`--profile focus` selects the opening, dialogue, panels, cave, gate, story,
VFX, wolf, lion, rescue, mobile and room smoke tests. `--tests NAME ...`
selects an explicitly partial run. Neither subset certifies a full release.
The collector builds first, packages when needed, verifies local-server identity,
records logs/checksums/status after each check, and returns nonzero for failure,
missing harness, timeout or blocker. It does not install dependencies, publish,
generate artwork, or pretend to conduct a human playthrough automatically.

Finish with the role review, actual campaign capture, detailed REPORT.md and one
CLAUDE_PROMPT.md. Keep source fixes and original evidence; never rewrite a failed
log as a pass. Put retries in a new directory with their cause explained. Before
handoff, rebuild again after the final source change and run affected checks.

Server identity is one rule shared with `tests/run.cjs`: `tests/served-identity.cjs`
hashes `index.html`, `odyssey.html`, `sw.js`, `assets/eyes.json` and one low-tier
webp as served on `127.0.0.1:8220` and compares them byte for byte with this
checkout. The collector pins that snapshot once (`served-identity.json` in the
output directory), passes it to every `run.cjs` call as `SERVED_IDENTITY_EXPECT`,
and checks it again at the end. A mismatch at the start blocks the run. A change
during the run (another checkout taking the port, or these pages being rebuilt)
fails the run, and the log prints what was served and what was expected,
including each page's `BUILD_ID`. Run `node tests/served-identity.cjs` by itself
to see which build the port is serving right now.

Use an isolated checkout/server. Do not run overlapping builds against the same
served pages during a release audit. Source-only review branches must explicitly
tell the integrator to regenerate the four built HTML pages before release.
