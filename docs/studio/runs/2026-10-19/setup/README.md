# Validation environment

Locked repository dependencies installed with `npm ci`; package/lock unchanged.
The browser dependency is pinned outside the repository:
`npm install --prefix /tmp/clawbyte-19-browser @sparticuz/chromium@153.0.0`.
Its executable reports Chromium 153.0.8010.0. No browser binary or npm dependency
is added to the game.

The package's automatic extraction hit this host's unsupported `chown` operation
on `/tmp/fonts` ([actual error](automatic-extraction-failure.log)). No privilege
escalation occurred. The provided Brotli payloads were expanded into the owned
task directory with [prepare-browser.cjs](prepare-browser.cjs), then tar archives
were extracted there using `--no-same-owner`. Fontconfig includes that task's
fonts and system fonts; the actual [configuration](fonts.conf) is retained.

The [wrapper](browser-wrapper.cjs) removes single-process/in-process-GPU and
unnecessary web-security/site-isolation flags before all today's tests. Unlike
October 18, no browser configuration is changed mid-collector. It forwards the
Playwright protocol pipes and uses local software graphics. These are local
diagnostics, not physical-device or performance certification.

The unchanged full-run environment lists no `zh`-capable font via Fontconfig;
its Chinese fallback resolves to Open Sans. [Font coverage](font-coverage.json)
is a host CLI observation, not a browser per-glyph trace. The new Chinese-wrap
failure must be retained and checked with actual CJK glyph/font availability;
do not alter the sample/width assertion or call fallback/tofu metrics a valid
Chinese reader certificate. No font/browser configuration is changed mid-run.

Each runner owns its local server; the collector pins five selected HTTP files
and rechecks the same snapshot at the end. The flier diagnostics own ephemeral
ports, report served index hashes, and are staged. The before state gallery
serves the exact parent assembled page from git with unchanged current assets;
it never rewinds or edits the working checkout.

`CAMPAIGN_VIDEO=0`: the fresh-storage campaign retains screenshots, actual game
saves and logs, not a complete recording. Keyboard traversal in a phone viewport
is not a physical touch playthrough. Audio calls/encoded fade and emulation do
not certify listened endings, haptics, real controllers or sustained device cost.

## Post-collector font comparison (partial/blocked)

The full run finished before any extra browser diagnostic. The original-wrapper
sample in [cjk-diagnostic/result.json](cjk-diagnostic/result.json) reproduces the
same one-line/467px measurement, with a matching DOM platform-font trace naming
URW Bookman rather than Fontconfig's CLI fallback. This is not a canvas
per-glyph trace or proof of the root cause.

[prepare-cjk.py](prepare-cjk.py) exports the installed PyMuPDF built-in CJK font
only to a separate local directory, outside the full-run font search; see
[provenance](cjk-preparation.json). No font binary is committed or shipped.
The alternate wrapper launch failed EACCES (observed mode 644), so no successful
font-complete comparison or textreveal rerun occurred. The
[attempt](cjk-diagnostic/attempt.log) is retained. Do not interpret the prepared
configuration as a tested browser or bypass an execution-permission block.
