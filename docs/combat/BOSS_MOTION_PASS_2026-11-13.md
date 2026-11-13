# Boss motion and fight readability — 2026-11-13

Baseline: b1ec3ab00f40448364bfbd2c0768701c77118b11, public BUILD_ID 05692cc7c10c.
Scope: repair current fight/render defects, then make the existing authored
attacks read with physical weight. No new boss body, soundtrack, weapon,
chapter or arbitrary HP/damage retune is claimed.

## Defects reproduced in the real browser

TALONHOST's hanging cable, GLACIERE's flight gait/recoil/shards, FURNACE CHOIR's
pulses/footsteps/collapse and MOTHER-V's heartbeat/halo advanced inside draw.
A boss is drawn more than once for its readability outline. A skipped frame
also lost elapsed time through draw-side dt clamps. Therefore a rendering
choice changed a creature's motion. The baseline test runs equal simulation
with every-frame, sparse and no drawing, then compares actual state.

The shared boss weight pass also added a whole-body bob/squash on top of
NULLFANG's and Alpha's authored footage. PRISM ran grounded leg cells while
in flight and stopped its pounce above row14 instead of waiting for the
collision result: early recovery over low floor, no recovery on a high ledge.
All three PRISM wind-ups selected the idle strip even though their durations
had been corrected the previous day. A tell's audio was one simulation step
behind its state entry, and its visual duration was initialized by draw.

Hit feedback applied repeated transparency to bosses' armour underneath the
already-existing confirmed-contact white flash. Removing those dimming layers
keeps the body solid; it does not make a blocked hit look successful.

## Implemented ownership and choreography

- js/boss-motion.js is compiled once. Boss.update calls named begin/end hooks;
  no prototype patch installer, no change to Player.update or moveEnt.
- Fixed simulation owns secondary clocks and bounded particle budgets. A
  per-boss visual random stream drives new particle scheduling; pure clock-based
  tremor replaces render-time randomness in the changed authored paths.
- Grounded authored bodies own their motion. Their shared second bob is gone.
  TALONHOST/GLACIERE/MOTHER retain their deliberate flying motion. NOSTOS's
  former shared weight behavior is preserved rather than accidentally frozen.
- PRISM: low elongated dash tell, haunch-loaded pounce tell, raised projectile
  tell, using inspected existing atlas poses. Actual vy selects launch/apex/fall;
  actual floor contact triggers recovery and a short compression pose. Walking
  stride follows ground covered, so a wall cannot make its feet keep running.
- GLACIERE: lance/nova follow-through now triggers on the actual recover state,
  not the obsolete idle-only branch. Its visible recovery carries the recoil.
- FURNACE: its tail impact, mouth peals, step dust and collapse are simulated
  once, not fired by an outline or repeated draw. Walking breath is foot-pivoted.
- MOTHER's heartbeat and charge-held halo retain their authored health response,
  now independent of rendering frequency. TALONHOST's cable likewise advances
  once, with fixed-step damping rather than a first-draw-only integration.
- Existing boss sounds, haptics, damage, attack decks, phase rules, defensive
  counters, reward ownership and purification are preserved. Tell entry cue
  now starts in the same step as its visual warning, and never repeats merely
  because the boss is drawn twice. Gravehorn retains its custom cue ownership.

## Evidence and acceptance

`tests/boss-motion.cjs --baseline` uses the pinned old compiled page and the
same current art; the ordinary run uses the candidate. It measures secondary
state across render cadences, repeated silhouette passes, opacity on twelve
bosses, PRISM's actual raised-platform landing and pre-landing state, three
separate authored tells, stable airborne clip, grounded feet, same-step cue,
GLACIERE release follow-through and behavior without decoded art. It hashes
Player.update, heroState and moveEnt before/after. It waits for the actual
Alpha/construct strips: a loading silhouette is not acceptable test evidence.

The added no-draw/low-draw assertions were first observed failing on the pinned
production build. Exact counts, snapshots, method hashes, errors and final
BUILD_ID are saved in release-evidence/boss-motion/{baseline,verified}.json.
The baseline intentionally has no cross-version identity check; the candidate
adds it once the baseline file exists. Do not inflate both totals to match.

`tests/boss-motion-capture.cjs` captures seven staged real-engine states and a
continuous four-second, 12fps PRISM sequence driven by Boss.update. These are
staged diagnostics, not claims of an unassisted campaign clear. Asset source
rectangles were inspected before use. The whole-fight tests measure tells,
actual openings, phase/counter behavior, and motion against a moving target.
The ordinary hero gait, Ratchet interaction, save and release tests remain gates.
No acceptance threshold was widened to obtain a pass.

## Explicit limits

This is a substantive motion/feedback repair, not a claim that every boss has
received a newly filmed full moveset or that all art is now AAA-ready. PRISM's
new tells reuse approved key poses; a larger bespoke animation set would be
new asset production. The missing-art procedural PRISM fallback is not presented
as equivalent to its primary authored rendering. The longer Eye/chapter story
work and additional Gravehorn art are not silently marked done by this pass.

Public release completion requires the served page and relevant source/asset
hashes to match the final tested commit, followed by the live browser checks.
A green integration job alone is not a live release.
