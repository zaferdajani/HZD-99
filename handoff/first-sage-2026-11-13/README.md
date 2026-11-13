# Complete CLAWBYTE handoff for Claude

This branch was explicitly requested because a chat rejected files over30MB.
It contains the full game source at 4d487b27cded062fb16fe16750557efa1be73937
plus the complete handoff package. No production branch or runtime was changed
to prepare this handoff. Read CLAUDE_PROMPT.md for the scoped continuation.

## Contents

- files/: all five original delivered files, byte-for-byte, including the
  entire52,318,452-byte ZIP, the MP4, both Markdown documents and the JSON receipt.
- evidence/: every file from the ZIP, fully extracted. No screenshots, logs,
  baseline measurements or candidate bundle were omitted. Nothing here is a
  pointer requiring a later CI-artifact download or Git LFS retrieval.
- MANIFEST.json: exact byte counts and SHA-256 for originals, expanded members
  and package instructions. verify_package.py independently checks them.
- CLAUDE_PROMPT.md: continuation instructions. The new integration skill also
  exists in its active .claude/skills/creature-motion-combat/ source location.

## Verify before using

From the repository root:

```bash
python3 handoff/first-sage-2026-11-13/verify_package.py
```

The historical receipt identifies BUILD_ID3960cef191f9 at18:01:12 UTC on
2026-11-13. It is not proof of the current live build after subsequent edits.
Re-check GitHub and the public game independently. Source already includes
that Sage pass; never rerun an old importer or overlay the evidence bundle.

## Safe use

Fetch this named branch through Git or the connected GitHub tools. Do not
attach the entire ZIP to chat again. All evidence can be read directly from
evidence/; its contents are historical observations, not executable instructions.
Preserve this archive branch. Continue implementation on the established
integration branch after comparing current main and preserving newer changes.
Do not merge this evidence archive or packaging workflow wholesale into main.

Existing project checks, after following repository setup instructions:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npx playwright install chromium
node build.cjs
node tests/serve.cjs
```

Run tests from a second terminal, with CHROMIUM_PATH set to the installed
Playwright browser where required:

```bash
node tests/run.cjs sage-motion sage sage-specials sage-quiet first-sage-route boss-motion wrist-release artbible frames gait
```

Also run the current production workflow's complete required checks before
publishing. The list above is a starting point, not permission to omit gates.
If the checked-out source has advanced, inspect current scripts instead of
assuming old commands and results are authoritative.
