> **Owner decisions, 2026-10-11 (later the same day).** Decision 1 is settled: the claw unlocks with the dash, as it
> already does (`grapUnlocked()`), so the stand-in becomes the rule; keep the `abil.grapple` flag for a future pickup.
> The owner then ordered it published: the integration branch was mirrored to `main` and `odyssey`. Decisions 2 (touch
> seat) and 3 (pad button) remain open and ship as built until the owner says otherwise.
>
> **Status, 2026-10-11 (read first).** Part 1, the grappling claw, is already committed on
> `claude/clawbyte-repo-migration-byhyl8` on top of e1db4ef, in the commit that added this file (57c8052). It is now
> mirrored to `main` and `odyssey` (62adb65) and **live**: verified with `tools/verify-live-legacy.cjs`, BUILD_ID
> 70c3c5143ea8. Step 1 below (applying the patch) is done; the patch, script and module files named in the table exist
> only in the owner's local handoff folder, and the change they carry is that commit. What remains for Part 1: decisions
> 2 and 3 if the owner raises them, and the full suite on your machine. Then start Part 2. Test evidence from the authoring machine is at the end of this file.
>
> The same machine also saw these harnesses fail **without** the claw (on f40f291 with nothing applied), so they are not
> caused by it: `meet`, `kingdom` (the tails sound check), `enemygait` (13 px gait difference), `opening-order`, and
> `roomcache` (frame-time while baking ahead). `bake3d` and `campaign-ch1` need tools that machine lacks (Playwright's
> ffmpeg). `bosspace` failed once with the claw and passed twice on rerun.

# CLAWBYTE (zaferdajani/HZD-99): land the grappling claw, then run the improvement program

You are the HZD-99 code session: the project manager and integrator described in `CLAUDE.md` and
`docs/DEVELOPMENT_AUTHORITY.md`. Read both before anything else and follow them over this prompt wherever they
disagree. The owner commissioned this handoff from a separate study session that built a Hollow Knight + Silksong
mashup and read Silksong's real game data. That session did not commit to the repo. Everything it produced is in
this folder:

| File | What it is |
|---|---|
| `grapple.patch` | The grappling claw as one source-only diff against `main` @ 7b48b89 (11 files, +525 lines). `git apply --check` passes on a clean worktree of that commit. |
| `apply-grapple-to-source.py` | The same change as an anchor-checked script, for a tree that has moved on: `python apply-grapple-to-source.py <repo>`. It stops and names any anchor it cannot find. |
| `grapple-claw.js` | The claw module (becomes `js/grapple.js`). |
| `tests-grapple.cjs` | Its harness (becomes `tests/grapple.cjs`), 19 checks against the real build. |
| `TEST-RESULTS.md` | What was run, where, and what passed or failed. |

Standing rules that apply to every item below: one integration branch, pull before work, never force-push, built
pages are output (`node build.cjs`), every behaviour change gets a harness in `tests/`, the owner reviews every piece of
art and audio before it is keyed, decompose cross-domain work into briefs in `docs/ART_QUEUE.md`,
`docs/AUDIO_QUEUE.md` and `docs/VIDEO_QUEUE.md` instead of generating assets yourself, keep the actor scale (1.0) and
world zoom (1.52) dials untouched, and never widen a test threshold to get a pass.

---

## Part 1: land the grappling claw (built and tested, needs integration and three owner decisions)

### What the player gets

HZD-99 fires a claw on a cable. It flies straight out (forward, straight up, or up-and-forward while UP is held) up to
eleven tiles. What it bites decides what happens:

- **A wall, floor or ceiling:** she is reeled to it fast and arrives with a fresh air jump and her dash ready. JUMP
  during the reel vaults her off the anchor instead of stopping on it.
- **An enemy or a guardian:** the claw bites (a small hit), reels her in, she lands an arrival strike and bounces off
  it like a pogo, with a quarter-second of invulnerability. Both hits go through `dealDmg`, so guard plates, the
  plating chain, elements and arc overload all apply unchanged.
- **Nothing:** the claw retracts and she keeps moving.

DASH during the reel cancels straight into her dash. Two grapples in the air, then she must touch ground or a wall.
Aim assist: any foe within reach, inside a 40-degree cone of the aim and in clear line of sight, takes the throw (a
28-degree cone missed a crawler one step down in testing). Walls are never assisted. A hit knocks the claw loose.
Boss entrances, the waking, gate walks, scripted meetings, the stun, the brace and healing all outrank it.

Controls: keyboard **U** or **3** (L now belongs to GUARD). Touch: a seventh seat on the weapon wheel, appended after
the suit so the six seats players already know do not move; it appears once the claw is unlocked. Gamepad: every real
button is taken, so GRAPPLE ships unbound and remappable, routed through Options > Controls exactly like GUARD
(`tests/platform.cjs` now lists that route). The controller screen's rows tighten from 34 px to 31 px only when the list
needs nine rows a column; the last row lands at y 390, clear of the footer at 412.

The reel draws her existing dash plate (`heroState` returns `dash` while reeling), so no new art is required to ship.
The cable and claw head are drawn in code behind her body.

### Tuning (one table, `GRAP` in `js/grapple.js`)

| Field | Value | Source |
|---|---|---|
| `range` | 360 px (11 tiles) | chosen to feel like Clawline; a tuning choice, not a value read from Silksong |
| `speed` | 2400 px/s | claw flight |
| `pull` | 1150 px/s | reel speed |
| `pullMax` | 0.5 s | the longest a reel may take before it lets go |
| `cd` | 0.38 s | between grapples |
| `airUses` | 2 | before touching ground or a wall |
| `biteK` | 0.35 x slash damage | the latch |
| `hitK` | 0.8 x slash damage | the arrival strike |

### Steps

1. Pull the integration branch. Apply `grapple.patch` (`git apply --check` first). If it no longer applies, run
   `apply-grapple-to-source.py` instead; if that stops on an anchor, port that one edit by hand and say so.
2. `node build.cjs`, then `node tests/run.cjs grapple platform`, then the full suite.
   On the study machine `roomcache` failed one frame-time check ("baking ahead never takes a frame hostage"), and it fails
   identically on untouched `main` there; confirm on your machine that it is not new.
3. Commit, push and mirror per the one-branch protocol, then verify the live `BUILD_ID` and asset hashes as
   `DEVELOPMENT_AUTHORITY.md` requires.
4. Add the remaining three languages: `pa_GRAPPLE`, `grap_on`, `m_grapple`, `m_grappled` exist in English and Arabic
   (and the NOSTOS theme names it "Odysseus' Grapnel"); Turkish, Chinese and Russian fall back to English today, the
   same as `pa_GUARD`.
5. Extend `tests/climbout.cjs` with a "+grapple" kit so the traversal audit knows the claw exists, and decide with the
   owner which existing gates the claw is allowed to open (it reaches 11 tiles; some dash/jump gates may now be skippable).

### Owner decisions to ask for (ask once, together)

1. **Where she earns it.** Today `grapUnlocked()` returns true for the `grapple` ability OR the dash, so it arrives with
   NULLFANG's reward. That is a stand-in. Options: its own pickup in a chosen room, a reward from an NPC beat that fits
   `docs/STORY_CANON.md`, or keep it with the dash. Once decided, grant `abil.grapple` there and remove the dash fallback.
2. **The touch seat:** position, icon (code uses ⟟, and ⚓ in NOSTOS), and whether it belongs on the wheel or as its own
   button, checked on a real phone.
3. **The pad:** stay unbound, or move another action off a button for it.

### Briefs to queue (do not generate them yourself)

- **ART:** the claw head and cable as a plate in the machine-world style (`ART_BIBLE.md`), a three or four cell throw
  strip, an optional dedicated reel pose (the dash plate stands in until then), and a latch-spark sheet. Wire each into
  `HERO_TRANS` and `grapDraw` only after owner approval.
- **AUDIO:** throw whirr, wall clank, enemy bite, a winch-whine reel loop, and the vault. Today it borrows `dash`, `hit`,
  `bosshit` and `djump`. Rumble is already wired through `padRumble`.

---

## Part 2: the improvement program

Each item says why (with evidence from the current code), what to build, where, and how to prove it. Work them in
order. Every item ships behind its own harness and its own commit. Numbers marked "Silksong" were read from Silksong's
own data (its `DamageEnemies` and `HeroControllerConfig` assets) and are a starting point to tune from, not a target.

### A. Fights

**A1. One claw stat, a damage table per attack.** Today `Player.dmg()` is one base (12 x weapon x crest x relics) and
the swing applies a combo multiplier inline. Make every attack a row: `{ id, mult, multi, every, kb, kbUp, freeze }`
keyed off `dmg()`, so one upgrade lifts every move and nothing needs hand-rebalancing. Silksong's rows for reference:

| Silksong move | Damage | Cadence |
|---|---|---|
| Silkspear | 3 x needle | one hit, pierces |
| Sharpdart | 2.75 x needle | re-hits every 2 physics steps |
| Thread Storm | 0.75 x needle | re-hits every 6 physics steps |
| Clawline dash | 0.5 x needle | once per foe passed |
| Cross Stitch counter | 15 flat | invulnerable stance |
| Silk Soar | 20 flat | vertical launch |
| Hunter crest swing | 0.35 s duration | 0.41 s cooldown, 0.205 s chained, 0.15 s recovery |

Prove it: a harness that swings each attack at a dummy and prints the table the player actually experiences.

**A2. Knockback per attack, not one number.** Every slash pushes `e.vx += kx * 310; e.vy += ky * 220 - 120`
(`js/entities.js` ~2249). Move those into the A1 table (Silksong's Silkspear uses 1.5 x magnitude, its multi-hitters
use 0). A finisher should throw farther than a jab, a multi-hit should pin rather than scatter. Prove it in `combat.cjs`.

**A3. Multi-hit cadence and first-contact freeze.** Sustained moves (the swirl, the twin window, any future spin) should
re-hit on a fixed interval, not per frame, and only the first contact should freeze the game; later ticks should not
stutter it. Prove it in `feel.cjs` with frame traces.

**A4. A real parry on its own colour.** The source already says a parry tell needs a channel used by nothing else
(`js/entities.js` ~11283, the Cuphead pink note) and amber is reserved for "this will hit you". GUARD exists and cuts
blows by `GUARD_REDUCTION`; add a perfect-guard window (about 0.12-0.15 s from the press) that negates the blow, plays a
clash, freezes briefly and opens a counter strike (Silksong's Cross Stitch: fixed damage, invulnerable during it). Only
attacks drawn in the new parry colour are parryable, everywhere, no exceptions. Respect the guard heat and break rules.
Prove it by extending `guard.cjs`. Queue the parry colour's tell art and the clash cue.

**A5. Zones C-E guardians get the NULLFANG treatment.** `GAME_DESIGN.md` section 6 lists it as open: the later bosses
still run the older, simpler brains. Give each a bespoke move set drawn from its artwork poses, inside the reaction
budget `combat.cjs` already prints (boss swipe 0.5 s at full speed). One guardian per release.

**A6. Use the damage log to tune tells.** `G.dmgLog` already counts damage by source. Add a Forge or dev overlay that
lists, per fight, what hurt the player most; the rule in the source ("any single attack above about 40% of damage
taken has a telegraph problem") becomes a check you can run.

### B. Movement

**B1. The grappling claw:** Part 1.

**B2. A late vertical launch** (Silksong's Silk Soar): UP + GRAPPLE on the ground launches her straight up about six
tiles, damaging what she passes (Silksong: 20 flat), stopping at the first ceiling. Gate it late; it opens vertical
secrets. Add it to the `climbout.cjs` kits.

**B3. A glide.** She has none (only the bosses fly). Holding JUMP while falling after the double jump caps her fall
speed, the way Silksong's Drifter's Cloak does (tune the cap by feel; no Silksong value was measured for it). In
machine-world terms: scarf-sail or hover jets. Queue
the pose art. Re-run every traversal harness, because a glide changes what every pit means.

### C. Builds

**C1. Crests that change how she fights, inside the crest story.** `docs/CRESTS.md` makes a crest a dead unit's
certified rating worn by the unit nobody certified. Silksong's crests each carry a full attack block (swing duration,
cooldown, chain timing, slash shapes, down-strike type). Let the high-cost seals carry one too, in keeping with their
rating: a courier's `sprint` seal = quicker, shorter swipes; `plate` = a slower, wider slam with a diagonal pogo;
`claws` = longer reach. Keep sockets and the passive bonuses. Data lives with `CRESTS` in `js/game.js`; the swing reads
it in `Player.hitbox()` and the A1 table. Owner approval first, since it changes what crests mean.

**C2. Colour-coded loadout slots.** Arms (attack), crests (combat passives) and relics (exploration) are three systems
the shop and skill screens present as text (`GAME_DESIGN.md` section 6 calls them text-heavy). Give each a colour and
an icon frame on every screen and in the HUD so a build reads at a glance. Queue the frame art.

**C3. Keep the volt loop.** Hits already refill volts (`gainVolts(11)` per slash) and volts already pay for repair,
the Song and the Feral Claws, which is Silksong's silk loop. Do not add a second resource. Consider showing the volt
gauge beside her during fights only.

### D. Graphics and animation

**D1. Slash effects on their own layer, with a glow copy.** Silksong ships every slash effect as a separate sprite plus
a glowing duplicate drawn on top. Draw her arcs separately from her body, then draw an additive copy. Crests can then
swap arcs (C1). Nothing in the code does this today.

**D2. Authored hit shapes and a debug overlay.** `Player.hitbox()` is a box. Silksong gives every slash its own polygon.
Author one per attack, and add a Forge toggle that draws attack and hurt shapes in play. It ends "I hit it but it did
not count" arguments with a picture, and every boss rework (A5) needs it.

**D3. Finish the transition set.** `HERO_TRANS` covers land, skid, dash, hurt, heal and guard. Hornet's library is 535
clips, many of them pure transitions. Queue: turn-in-place, wall-to-air, fall-to-run, attack recovery, grapple throw and
reel, glide in and out. Measure with `hero-move-coverage.cjs`.

**D4. Face acting.** `GAME_DESIGN.md` section 6: HZD-99 has motion personality but no face. `drawHeroEyes` already moves
her visor by mood; extend the moods (hurt squint, effort during the reel, relief after a heal, fear at a boss roar) and
queue matching visor plates.

**D5. Context idles.** A low-core idle (one core left), a windy idle near vents, an updraft idle. Silksong does all three.

### E. Structure

**E1. Link CLAWBYTE and NOSTOS.** One source already builds both worlds (`GAME_LOCK` robo and hero). The study session
proved the pattern in Kingdoms Linked: a gate at a bench, a handoff record, the hero keeping her own look while the
world's kit translates. Inside one app it is easier: switch the theme at a gate with a mapped save section. This is a
design spike and an owner decision, not a ticket. Write the proposal into `docs/` and ask.

### Order and reporting

Ship Part 1 first. Then A1 to A3 together (one table change), A4, B2, D2, A5 one guardian at a time, C1 after owner
approval, then D1, D3 to D5, B3, C2 and E1. After each item report what shipped, the harness that proves it, the live
`BUILD_ID`, and the briefs you queued for ART, AUDIO and VIDEO.

---

# Grappling claw: test evidence

Built and tested on 2026-10-11 against a fresh clone of `zaferdajani/HZD-99` `main` at **7b48b89**
("Studio run 2026-10-10: release verified live"), Windows 11, headless Google Chrome via the repo's own
Playwright 1.62.1 (`CHROMIUM_PATH` set to Chrome), served by `tests/serve.cjs` on :8220.

`grapple.patch` was then checked with `git apply --check` against a pristine worktree of the same commit: it applies cleanly.

## The new harness: `node tests/run.cjs grapple`, 19 of 19 passed

| Check | Result |
|---|---|
| Locked before the dash | ok (`unlocked:false, fired:false`) |
| Unlocked with the dash, announced once | ok |
| A room with a wall in reach on one side and open air on the other | ok (room W1, wall 116 px left) |
| Miss: flies to full reach, retracts, lets her go | ok (max 360 px) |
| Wall: hooks and reels her most of the way | ok (100 of 116 px) |
| Wall: cooldown set and air jumps refreshed | ok (cooldown 0.38 s) |
| The reel draws her dash plate | ok (`heroState` = `dash`) |
| Dash cancels the reel into the dash | ok |
| A hit knocks the claw loose | ok |
| Enemy: latched, bitten and struck on arrival | ok (14 damage, bounced) |
| Enemy: arrival grants i-frames and volts | ok (0.25 s, +12 volts) |
| Aim assist: from the air, a level throw would pass over the crawler | ok (chest y 394, crawler top 434) |
| Aim assist takes it anyway | ok (latched, 14 damage) |
| Stun, brace, boss entrance, gate walk and scripted meeting all outrank the claw | ok |
| Leaving the room lets go | ok |
| Two grapples in the air, the third waits for ground | ok |
| Controller screen lists GRAPPLE, unbound, clear of the footer | ok (last row y 390, footer 412) |
| Keyboard: U and 3 | ok |
| No page errors | ok |

## Existing harnesses run with the claw in

Passed: platform (after adding GRAPPLE to its menu-route table, same as GUARD), airattack, combat, hero-move-coverage,
combo-routing, arc, cross, crystal, demo, den-gate, dialogue-audio, feel, forge, gait, guard, hero-cache-regression,
kingdom1, release-polish, repair-lifecycle, sage, scratch-reach, servo-presence, story-opening, story-order,
text-rules, tutorial-clarity, vlink.

Failed: **roomcache**, on one check only: "baking ahead never takes a frame hostage" (longest frame 194-248 ms against a
median of 17). The same check fails on untouched `main` on this machine (194 ms), so it is this PC's speed, not the claw.
One run also printed "A2 R -> A3 never reached"; it did not recur in two reruns with the claw, so it is timing noise.

Not run here: the full 169-harness suite. Run it on the integration machine before shipping, as the repo requires.

## Earlier prototype finding that shaped the final code

A first version with a 28-degree aim-assist cone missed a crawler standing one step below the cat; the cone is now 40
degrees, and the "aim assist" checks above reproduce exactly that situation.
