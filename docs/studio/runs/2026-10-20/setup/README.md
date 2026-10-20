# Validation environment — October 20

`npm ci --no-audit --no-fund` completed successfully; repository dependency files
are unchanged. External host browser: `@sparticuz/chromium@153.0.0`, installed
with `npm install --prefix /tmp/clawbyte-20-browser @sparticuz/chromium@153.0.0`.
The ordinary package payloads are expanded by [prepare-browser.cjs](prepare-browser.cjs)
into that owned directory; extract fonts.tar and swiftshader.tar there with
`tar --no-same-owner -xf`. No browser binary/dependency is added to the game.

Before any launch, the new [wrapper](browser-wrapper.cjs) was given mode755,
and executable/browser modes were checked (755/700). It removes single-process,
in-process-GPU and unnecessary security/site-isolation overrides, forwards the
Playwright pipes and uses software graphics. `FONTCONFIG_PATH` points at the
owned [configuration](fonts.conf), with host/system fonts. No permission denial
or privilege escalation occurred in today's preflight.

[prepare-cjk.py](prepare-cjk.py) prepares a host-only installed PyMuPDF CJK font;
[provenance](cjk-provenance.json) records name, bytes, hash and actual Han glyph.
Font binary is not committed or shipped. The unchanged `textreveal` fixture now
measures three lines (widest544px in548px) in [preflight.log](preflight.log).
The [browser diagnostic](../portrait/result.json) also records a DOM platform-font
trace: Droid Sans Fallback87glyphs and URW Bookman2. This DOM trace is not a
canvas per-glyph trace. The [raw sample](../portrait/cjk-fixture.png) is visually
legible Chinese. October19's original one-line/467px sample is historical, not a
paired original-font launch on this host today. No game font/wrapping code changed.

The browser/font configuration is frozen before full collection. Early portrait
diagnostics had two refused localhost connections before launching a browser;
their logs are retained. Each successful diagnostic now owns a server in the
same process namespace and checks the served index hash. These are incidental
local-server failures, not permission restrictions or passing checks.

`CAMPAIGN_VIDEO=0` retains screenshots, actual game saves and input trace, not a
complete video. Keyboard in a phone viewport is not a physical touch run.
Software-rendered host speed does not certify real device performance. No
listened audio, physical controller/haptics, installed iOS/Android shell or
production deployment is certified.

## Collector retention regression

The new corruption controls run against the inherited collector without rewinding
the checkout: [before script](collector-before.py), [failed log](collector-before.log).
Its two missing snapshot operations fail. The candidate's six unit tests pass
in [collector-contract.log](collector-contract.log), also registered in the full
suite as `studio-collector`. Snapshot bytes are captured at the same read as
their hash; post-capture truncation, missing files and malformed/tampered snapshots
are rejected. This is retention and detection, not proof of the unknown mechanism
that damaged October19's original input-focus log. Do not replace old provenance
with a rerun or silently rehash it.
