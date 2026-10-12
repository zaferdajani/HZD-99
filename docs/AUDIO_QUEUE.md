# THE AUDIO GENERATION QUEUE

Briefs that are **written and ready to fire** but whose cues do not exist yet.
The AUDIO session's counterpart to `docs/ART_QUEUE.md`, same shape, same
reason: the expensive part of a cue is deciding exactly what it must DO, and
that can be written down before a Higgsfield audio connector is even bound.

**Read the `composer` skill before writing or firing anything here.** It
covers what a cue must do for the moment it serves, how to brief the model so
it comes back doing that, how to measure the result instead of guessing, and
how to cut it into the game so it loops, ducks and fades correctly.

**Rules that apply to every entry here:**

- State the cue's **function** first — what the player should feel, in the
  verbs of the scene — not a genre or a mood word. "Epic" briefs nothing.
- Name the **technical contract**: loop point or one-shot, target length,
  what it plays under (must duck for dialogue? survive a hit-stop?), and how
  it ends (fades on cut, or has a real musical stop).
- The owner reviews every cue before it is cut and committed — credits and
  refusals are his, same as art.
- After it comes back: cut it with the project's audio tooling, archive the
  source, wire it into `js/audio.js`'s manifest (`js/media.js` for the asset
  entry), and run `node tests/run.cjs` — cuepitch/voxmeas and any cue-specific
  harness must stay green.
- **Never** touch game logic beyond the manifest wiring. Combat balance, UI
  behavior and state machines belong to the code session.

---

*(No briefs queued yet — this ledger is new as of 2026-09-11, opened when
the fleet split ART/AUDIO/VIDEO into separate owner-opened sessions. The
project manager (code session) queues a brief here whenever a decomposed
request needs one; the AUDIO session fires top to bottom, same as ART_QUEUE.)*

---

## A-GLIDE. The hover jets ✱ QUEUED 2026-10-12 (code session, handoff Part 2 B3)

The glide is silent today (`js/glide.js`). One loop:

| cue | function | contract |
|---|---|---|
| `glide_jets` | two small jets holding her up: a soft steady hiss with a faint flutter, lighter than the double jump's burst | seamless LOOP 0.4–0.6 s, starts and stops with the glide, ducks under dialogue |

Owner reviews before it is cut; wire into `js/audio.js` and start/stop it from `glideStep`.
## A-FURNACE. The bellows and the drop ✱ QUEUED 2026-10-12 (code session, handoff Part 2 A5)

FURNACE CHOIR's new moves (`js/furnace-fight.js`) ship on borrowed cues: the
wind-ups already speak through his own warning voice (`tell_atlas`, fired by
`TELL_ST` on `ventwarn`, `dropcrouch` and `droplock`), and the rest borrows
`vent`, `castfire` + `blast`, `launch` + `dash`, `chirp`, `slam` + `land`.
Read the `composer` skill first; every cue is a one-shot that must survive a
hit-stop and sit under the Foundry's boss theme without masking the tell.

| cue | function | contract |
|---|---|---|
| `fc_breath` | THE BELLOWS DRAWING IN: a huge forge bellows inhaling — a rising roar of air sucked into a furnace, metal plates creaking open. "You hit it three times; it noticed." | one-shot 0.4 s (the p1 breath is 450 ms, p2 400 ms) — must END on a held peak, never resolve, because the blast follows |
| `fc_backdraft` | the furnace exhaling fire out of its chest: a short, violent WHOOMPH of flame with a low 74–110 Hz body | one-shot ≤ 0.35 s, hard onset |
| `fc_choke` | a perfect guard turned the fire back into him: the bellows coughing — a sputtering, smoke-choked wheeze with a metallic rattle | one-shot ≤ 0.6 s; plays with the parry's clash, so leave the first 100 ms quiet |
| `fc_launch` | the wings throwing a two-ton dragon into the air: one deep wingbeat plus a scrape of claws leaving the floor | one-shot ≤ 0.4 s |
| `fc_lock` | the LOCK (the moment to move): a short, dry, high metallic click-chime — distinct from GRAVEHORN's missile `chirp` | one-shot ≤ 0.15 s, must cut through the music |

Owner reviews every cue before it is cut; wire into `js/audio.js`'s SFX map and
swap the borrowed names in `js/furnace-fight.js` (`fcStart` 'vent', the
`ventwarn`/`vent`/`dropcrouch`/`rise` states, `fcClashed`, `fcLand`).

## A-SOAR. The launch ✱ QUEUED 2026-10-11 (code session, handoff Part 2 B2)

The soar borrows `djump` (`js/soar.js`). One cue, one contract:

| cue | function | contract |
|---|---|---|
| `soar_launch` | the pack venting all at once: a rising whoosh with an electrical crackle, upward in feel | one-shot 0.3–0.45 s, strong onset, no low rumble tail |

Owner reviews before it is cut; wire into `js/audio.js` and swap the borrowed name.

## A-PARRY. The clash and the counter ✱ QUEUED 2026-10-11 (code session, handoff Part 2 A4)

The parry borrows `block` + `crack` for the clash and `dash` + `hit` for the
counter (`js/parry.js`). It must sound like nothing else in the game, because
the colour channel it rides on is unique too:

| cue | function | contract |
|---|---|---|
| `parry_clash` | steel turning steel: a bright ringing CLANG with a fast shimmer tail — unmistakably "you did it" | one-shot ≤ 0.5 s, sharp transient, plays through a 140 ms hit-stop |
| `parry_ready` | the counter window is open: a tiny high glint | one-shot ≤ 0.15 s, quiet, never masks the clash |
| `parry_counter` | the X-cut landing: two crossed slashes in one heavy beat, a low 74–110 Hz thump under it | one-shot ≤ 0.35 s |

Owner reviews every cue before it is cut; wire into `js/audio.js`'s SFX map and
swap the borrowed names in `js/parry.js`.

## A-GRAPPLE. The grappling claw's voice ✱ QUEUED 2026-10-11 (code session, from docs/handoff/GRAPPLE_AND_IMPROVEMENTS.md Part 1)

Today the claw borrows `dash` (throw), `hit` (wall bite), `bosshit` (enemy bite)
and `djump` (vault); rumble is already wired through `padRumble`. Five one-shots
and one loop, all short, all must survive a hit-stop and duck under dialogue:

| cue | function | contract |
|---|---|---|
| `grap_throw` | a whip-fast metallic whirr: "it's out, and it's quick" | one-shot ≤ 0.25 s, bright, no low end |
| `grap_wall` | the bite into stone/steel: a solid clank with grit | one-shot ≤ 0.2 s, strong transient |
| `grap_bite` | the bite into a machine: a hooked tearing clang, crueler than the wall | one-shot ≤ 0.25 s |
| `grap_reel` | the winch-whine of the reel pulling her in | seamless LOOP 0.3–0.5 s, rising pitch feel, stops on cut |
| `grap_vault` | the release-and-fling off the anchor | one-shot ≤ 0.25 s, airy, upward |

Owner reviews every cue before it is cut; wire into `js/audio.js`'s SFX map and
swap the borrowed names in `js/grapple.js`.
