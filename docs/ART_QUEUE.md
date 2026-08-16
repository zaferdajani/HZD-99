# THE GENERATION QUEUE

Briefs that are **written and ready to fire** but whose plates do not exist yet.

This file exists because of a specific waste: when the art connector is not
bound to a session, the work does not have to stop — the expensive part of
generating a plate is deciding exactly what it must be, and that can be done
without a connection. Everything below is finished thinking. Firing it is one
tool call per entry, with the reference named in the entry attached.

**Rules that apply to every entry here** (ART_BIBLE.md §3.2): pure black
background, subject only, no ground plane, no cast shadow, palette named in
words, negatives stated. After it comes back: key it with
`tools/blackkey.cjs`, crush it with `tools/img-crush.cjs`, archive the source
in `assets/source/`, wire it, photograph it, and run `node tests/run.cjs`.

---

## 1. HZD-99, REGENERATED — the full character, all angles, all moves ✱ FIRST

**The ruling (owner, 2026-08-14):** the procedural body is visibly below the
rest of the cast — "not as good as the bosses and wolves" — and has no back
view. *"Use it as a template and let Higgsfield do a clean new one with all
needed angles."* ART_BIBLE.md §2 records the exception as revoked.

**The template is mandatory on every plate:** `assets/source/ref/hzd99_body.png`
— three facings of her live in-engine body. Generated FROM her, or not
generated. (`roster_8yaw.png` row 0 is a turnaround of a DIFFERENT robot cat;
it reached the screen once. Never again.)

**Step 0 when the connector is back:** call
`get_workflow_instructions({ workflow: "character-sheet" })` and follow it —
the server's own turnaround workflow outranks a hand-rolled batch.

**The identity line, verbatim in every prompt:**

> The same small robot cat as the reference image, kept EXACTLY: rounded
> off-white ceramic head, dark visor band with two bright cyan eye-lights, two
> upright ears with mint-green inner surfaces, short whiskers, BRUSHED-STEEL
> chest plate with a dark vent grille on the belly (canonical — see below),
> gold shoulder discs, a red scarf at the neck. Each arm is ONE smooth tapered
> piece from shoulder to paw — no elbow hardware, no rings, no segments, no
> exposed joints. Two arms, always.
>
> WEAPON RULE (supersedes every older line naming a mint-green blade): she is
> UNARMED by default — the weapon arrives mid-game as the PURIFIER WHITE
> CRYSTAL sword (§1b). Armed plates carry the white crystal, never a green
> blade. Any plate generated with a green blade after 2026-08-14 is off-model.

**The standing negatives, verbatim in every prompt:**

> NEGATIVE: no segmented arms, no elbow joints, no visible hinges, no staff,
> no tan or brown palette, no second character, no text, no watermark, no flat
> 2D drawing, no cartoon outline, no cast shadow, no ground plane. Pure black
> background, subject only.

**Style line:** clean high-detail 3D render, soft specular ceramic, brushed
steel, cyan/mint emissive accents, key light fixed to the WORLD upper-left in
every plate (the turnaround rule — a turn must read as a volume rotating).

### THE IDENTITY LOCK (owner, 2026-08-14, session B) — read before firing anything
The owner stopped the queue to say the obvious thing: **every sheet was a
different cat.** He was right, and it was not one bad plate — it was structural.
The two committed 8-yaw sheets each contain TWO cats, because `herosheet.cjs`
stitches a front half-turn and a back half-turn that were generated
INDEPENDENTLY: ear shape, head size and cape length all change across the seam.
The action plates drifted the same way against each other.

**The cause:** prose plus a loose reference image does not pin geometry. Every
plate was an independent roll.

**The fix, now mandatory:** the owner named `assets/source/ref/hzd99_canon.jpg`
as canon. It is registered as the generator's reference element `hzd99-canon`
= `467c8e08-8161-483f-a4cf-439875ff04e2`, and **every future plate, sheet and
VIDEO of her must embed `<<<467c8e08-8161-483f-a4cf-439875ff04e2>>>` in its
prompt.** The weapon has the same treatment: `purifier-crystal` =
`d0a03e79-2887-4bcd-a209-11732c6754ef`, `purifier-double` =
`bf160a06-9e42-46d0-a9f1-bc7c5dd1fcb5`.

Two consequences of the canon plate, both settled:
- **CHEST, INVERTED.** The canon plate has a WHITE/IVORY belly with the dark
  vent grille. The earlier ruling that the brushed-STEEL chest plate was
  canonical is **reversed** — the owner picked the white belly, and every brief
  must now name that.
- **The canon plate carries the old GREEN blade. It does not license green.**
  The lock covers body, face, materials and proportions ONLY; the weapon is the
  white crystal or nothing.
- **Retire the stale element.** The workspace still holds a hero element named
  `NYA-9` describing a *different* cat ("scuffed white and grey plating"). Never
  use it.

### STATUS LEDGER (2026-08-14, session B)
DONE and locked to canon, in `assets/source/`: the unarmed SIDE action set in
TRUE profile (idle/walk_a/walk_b/run_a/run_b) · the six missing states (apex,
burst, heal, song, slump, wall_cling) · the full former-green action set
regenerated unarmed (rise, fall, land, dash, skid, claw_1, claw_2, finisher,
charge, hurt) · §1b-i slash light-sheets ×4 · §1b-ii regrips ×2 + thrown rescale
(all three fixed: the paws now close ON the hilt, the thrown crystal fills its
frame) · §1c back-jet gear ×2 + her jet double-jump plate · `canon_front.jpg`,
the neutral standing plate. The 12 green-blade plates and `sword_full.jpg` are
DELETED, not superseded-in-place.

### CLOSING THE LOCK (2026-08-14, session B, second pass) — §1 IS FIRED
The wired art is now locked too, and this is the part that actually changed
what is on screen:
- **Both 8-yaw turnarounds rebuilt** from matched half-turn strips —
  `hzd_8yaw.png` (crystal on her back) and `hzd_8yaw_bare.png`. The two-cats
  defect is gone; so is the black ground line the old bare sheet carried under
  columns 4–7.
- **The back-walk pairs and the ground sword re-fired and re-keyed** — these are
  what the gate walk and the pickup actually draw.
- **The green `sword_full.png` deleted**: orphan art, referenced by nothing.
- **Films:** `intro7` (she sits offline, never wired to the Song) and `intro8`
  (she wakes and goes) re-shot against the canon element — the old `intro8` was
  a visibly DIFFERENT cat with square green eyes and green body markings. Plus
  `sword_gift.mp4`, the §1d handover, ready for task #79.

**Three warnings for whoever fires the next batch:**
1. **"Pure black background" is not enough.** Two strips came back on WHITE
   despite the negative. What worked on the third try was describing the
   LIGHTING SITUATION instead: *"photographed in a pitch-dark room, no backdrop,
   no floor, four spotlights pick out the figures and nothing else receives any
   light."* A background colour reads as a style token; a dark room reads as a
   scene.
2. **Do NOT white-key her.** `blackkey.cjs --white` on a white-field plate of
   her eats the ear tips and DELETES the white crystal blade outright — a white
   subject cannot be keyed off a white field. Re-fire instead.
3. **Say "bright and even exposure" on BOTH halves of a turnaround.** The first
   armed pair came back with a bright front and a dark back, and the seam lands
   exactly where `herosheet.cjs` joins them — which undoes the world-fixed key
   light that makes a turn read as a volume.

STILL TO FIRE: the armed-with-crystal variants of the action set, when sword
mode needs them on screen · `intro7.webm` / `intro8.webm` (see below).

**Both gaps are closed.** A static ffmpeg from npm (kept out of `package.json`
— the game still ships nothing from npm) re-encoded `intro7.webm` /
`intro8.webm` and decoded all three films for review. `sword_gift` was re-shot:
the first take flared the crystal while it was still in the trader's hands, and
the handover IS the beat.

### ✅ SHE IS WIRED. One thing is still provisional — read it.
`Player.draw()` now draws her from `assets/characters/hero/states.png` through
`drawRoboPlate()`, with the procedural body as the loading fallback exactly as
§2 asks. `tests/hero.cjs` measures it and the silhouette numbers IMPROVED
against the procedural rig it replaced — run 0.198 (was 0.569), air 0.613 (was
0.858), charge 0.259 (was 0.441). Lower IoU is the §3.3 law being obeyed harder:
these are genuinely different drawings per state, not one drawing re-posed.

**RESOLVED: the sheet on disk is now the FRONT-ON set**, which is the
presentation the game has always used — both eye-lights, both ears, the visor
read. The profile set it replaced is gone from `hero/`. Swapping took no code
change at all, which is the point of the split: `node tools/herostates.cjs <dir>
<out>`, re-crush to `assets/characters/hero/states.png`, done.

**Model note.** The front-on set is **Seedream 4.5**, not Nano Banana Pro. Every
Nano Banana job — a fresh single-image test included — sat in `waiting` for over
half an hour while Seedream ran in seconds, so the jam was the provider's and
model-specific. The canon element pins identity across models, which is exactly
what it is for; the swap cost nothing in likeness. If Nano Banana is healthy
when you next fire, either is fine — keep a whole SET on one model rather than
mixing within a sheet.

### THE PRESENTATION DECISION BEHIND THAT — READ BEFORE #79/#80/#81

`tools/herostates.cjs` and `assets/source/_sheets/hero_state_sheet.jpg` exist:
22 keyed, foot-aligned, uniformly-scaled cells, one per state. The renderer was
NOT switched over, for a reason worth stating plainly:

**The game draws her ALMOST FRONT-ON.** `js/entities.js` says so at the body
shell — *"SHE IS DRAWN ALMOST FRONT-ON — one visor, two eyes, both ears"* — and
`assets/source/ref/hzd99_states.png`, the checklist this whole section was built
from, shows every single state that way. **The action plates in `hero/` are TRUE
SIDE PROFILE**, because session B forced profile on the reasoning that "a
side-scroller needs profile". That is a real convention in other games and it is
NOT this game's convention.

So wiring the sheet as it stands would not merely make her body authored — it
would silently change her presentation from front-on to profile, which is a much
larger visual change than the one that was asked for, and it would throw away
what the procedural body is carefully doing (both ears, both eyes, the visor
read, the committed upper-left key, the core shadow, the head's cast shadow).

Two ways forward, and it is the owner's call, not the pipeline's:
- **Keep front-on** (matches everything shipped): regenerate the grounded states
  — idle, walk ×2, run ×2, land, skid, claw ×2, finisher, charge, burst, heal,
  song, slump, hurt — as three-quarter FRONT views, then wire. The profile set
  stays archived and is still right for `wall_cling` and `dash`.
- **Move to profile** (a deliberate restyle): wire what exists, and accept that
  she now reads side-on, losing the two-eye visor read that the front-on
  presentation was built around.

Whichever is chosen, the renderer work is the same shape: a sprite short-circuit
in the ROBO-CAT branch of `Player.draw()` — NOT `drawHeroSprite`/`drawHeroRig`,
which belong to NOSTOS's human hero behind `isHero()`.

**And that hero is the precedent to copy, not a cautionary tale.** He is ALREADY
sprite-first: `drawHeroSprite` picks a frame out of `heroIdle`/`heroRun`/
`heroJump`/`heroAtk` (the `gothic-hero-*.png` sheets, which are on disk and in
`MEDIA_SRC`), returns true, and `drawHeroRig` — the procedural body — only runs
when those images have not loaded. That is exactly the arrangement §2 asks for
on HZD-99: authored art first, procedural body as the loading fallback. The
shape is proven in this codebase; it just has never been pointed at her.

For her, the split is: `js/entities.js` **1481–2232 is the body** (scarf, rear
arm, shell, head, ears, visor, legs) and is what a plate replaces; **2233–2269
is the jet plume** and stays. Scarf, jets, charge aura and claw arcs stay
procedural overlays — except the scarf/cape, which is BAKED INTO the plates, so
drawing the procedural scarf on top would double it.

==== THE FIRING LIST (2026-08-15, consolidated — run top to bottom) =========
Whoever holds the Higgsfield binding (session B, or this session once it
rebinds) fires these in order. Reference for her body: media_id
4bca85e7-7e54-4d0b-b80a-4b947f12545a (assets/source/ref/hzd99_body.png).
Every item's full brief is in its section below; this is the checklist.

**ONE BRANCH (owner's order — see CLAUDE.md top):** all work, art firing
included, happens ON `claude/clawbyte-repo-migration-byhyl8` — pull --rebase
before starting, push after every commit, mirror to main/odyssey. No new
branches, ever. §1 is DONE and merged; the list below is what remains.

  1. §1b-i  slash light-sheets ×4        (slash_h / slash_d / slash_u / slash_dn)
  2. §1b-ii regrips ×2 + thrown blade ×1 (thrown = BODY LENGTH — owner ruling)
  3. §1c    back-jet gear ×3             (idle / mid-boost / full burn)
  4. §1d    THE FORGING CINEMATIC ×1     (cartoonish; Ratchet's chest crystal visible)
  5. §1e    RUN PAIR RE-FIRE ×2          (run_a / run_b — see brief below; owner rejected v1)
  6. §2e    sage plates ×6               (stand/coil/lunge/gather/kneel-lock/purified)
  7. §2d    robot bat plates ×5          (hang/shiver/dive/flap-up/flap-down)
  8. §2c    caveMouth + caveExit + pillar ×3, then the cave tile deck
  9. §2f    GATE SHAPES ×6 + CAVE MOUTHS ×5   (owner 2026-08-15 — see brief below)
 10. §2g    THE TRADER'S BOOTH + DEN ×3       (boothFront / denInterior / ratchetResting)
 11. §1     unarmed side action set + apex/burst/heal/Song/slump/wallcling
 12. §2     zone terrain briefs (edge_/fore_ per zone — task #76)

Estimated spend: ~45-55 credits of session B's balance. After each block:
git pull, run the pipeline (blackkey -> img-crush -> archive -> wire), and
node tests/run.cjs artbible hero sage combat platform.
=============================================================================

WIRING NOTE (2026-08-15): the crystal arc is LIVE in code and every asset
above has a hook waiting for it — nothing blocks on art, and nothing needs
re-plumbing when it lands:
- §1b-i slash sheets → replace `drawCrystalArc` in js/entities.js (the
  procedural white crescent is the declared fallback; the function is the
  single place the swap happens).
- §1b-ii thrown plate → replace the polygon blades in `drawBoomer`
  (js/entities.js). Scale law: the thrown blade is BODY LENGTH — the owner
  already rejected a thrown sprite smaller than the held one.
- §1d is now THE FORGING CINEMATIC (owner's rewrite 2026-08-15, supersedes
  the handover video): a short CARTOONISH film — Ratchet at his bench, the
  pillar shard going in, sparks, the white crystal sword taking shape, her
  paws receiving it. It plays from `forgeCrystal()` in js/game.js (the
  ratchet_forge quest's payoff — the hook is live, the grant never waits).
  Brief notes: Ratchet has a SMALL CRYSTAL ON HIS CHEST (his backstory — it
  once burned the corrupted song out of him); make it visible and glowing in
  the film, and queue a chest-crystal touch-up of his NPC plate to match.
- §2e THE SAGE (docs/combat/SAGE.md): atlas-creature plates for the robed
  machine monk — standing (hooded, ember eyes), coil (drawn back, sleeves
  tight), lunge, gather (ember pooling in both sleeves), the KNEELING
  song-lock chant, and the purified variant re-lit blue. Hero-scale
  (duelist class). `drawSage` in js/entities.js is the placement reference.
- §2d THE ROBOT BAT (new enemy, owner 2026-08-15): atlas-creature plates —
  hanging (wings folded around the body, head down, one dull optic),
  shiver (same pose, wings rustling, optic hot), dive (wings swept back,
  optic hot), flight ×2 (wing up / wing down for the flap). Small machine
  in the minion family style; the engine-drawn fallback in js/entities.js
  drawBat is the placement reference.
- §2c THE CRYSTAL CAVE (new, quest 1): two backdrop paintings —
  `caveMouth` (A5: the kingdom's rock face with a dark cave opening she can
  walk INTO; the depth door aims at gx 0.50 / gy 0.86 of the plate) and
  `caveExit` (CV1: the view back out — bright mouth in dark rock, same
  anchor). Plus a `pillar` plate: a tall pure-crystal pillar, three white
  spears from a rock socle, to replace the procedural light version drawn in
  js/game.js drawStatics.
- The buried half sits in world.js X1 (`['secret', 29, 15, 'crystal2']`);
  a bespoke ground plate for it can replace the generic glimmer.
- tests/crystal.cjs measures the arc end-to-end (14 checks) and stays green
  through any art swap — it reads state, not pixels.

### 2f. GATE SHAPES + CAVE MOUTHS ✱ FIRE ON REBIND (owner, 2026-08-15)

The owner's order, verbatim intent: **"Ask Higgsfield to produce different
shapes of gates! And caves should look like a cave opening, not a door!"**
Every depth door currently draws the same rectangular multilayer city-gate
structure. Two families replace it:

**Gates ×6 — one per built zone, DIFFERENT SHAPES.** Each is a backdrop
plate of a monumental doorway matching its kingdom, and none of them is a
plain rectangle (the NO RIGHT ANGLES rule binds art too): the city gets its
towering leaves, the Foundry a furnace-arch with a poured-metal rim, the
Archives a split shelf-stack, the Conduits a cable-parted iris, the Nest a
woven talon arch, the Eye an organic sphincter-iris. Closed + open variant
each (or a parted pair the engine can slide). Dark-room phrasing, subject
only, per the standing §3.2 rules.

**Terrain rule that binds EVERY plate in this section (owner, 2026-08-15):
elevations, steps and obstacles MIMIC OBJECTS FROM THE ROOM'S BACKGROUND** —
a city ledge is a vent housing, a crate stack, a fallen sign; a Foundry step
is a slag mound or machine housing; a cave step is rock. The platform deck
plates (§2a-2l) and every future step/obstacle plate are generated as the
backdrop's own furniture, matched to that zone's painted vista, so terrain
feels like part of the room rather than blocks placed on it. And per the NO
RIGHT ANGLES law: no plate presents a square silhouette.

**Cave mouths ×5 — irregular ROCK OPENINGS, never doors.** For the cave
networks (A/B/C/D/E grottoes + the crystal cave): a jagged-edged dark
opening in living rock — asymmetric, weather-worn, roots/moss per zone,
absolutely no straight jambs, no lintel, no symmetry. The engine's
procedural fallback (drawCaveMouth in game.js) is the placement reference;
the plate replaces it at the same anchor.

### 2g. THE TRADER'S BOOTH + DEN ✱ FIRE ON REBIND (owner's design, 2026-08-16)

Ratchet's booth is LIVE in code as a procedural stand-in (drawBooth in
js/game.js; the den is room A0B in js/world.js) — the owner asked whether
Higgsfield built it, and the answer is not yet: this session does not hold
the binding. Three plates replace the stand-in at the same anchors:

1. **boothFront** — a scrap-market kiosk standing on the meadow: leaning
   tapered posts, a sagging scallop-hemmed canopy, cloth flaps over a warm
   doorway, a small hung sign with a bolt glyph. Built from the SAME
   furniture the Scrap Meadows backdrop paints (mimic-the-background rule),
   nothing plumb or square (NO RIGHT ANGLES). Closed + flaps-parted variant.
2. **denInterior** — a backdrop painting for A0B: a one-room workshop —
   crafting bench, hanging tools, coil bundles, shelf clutter, one warm
   lamp — cosy, low, lived-in. The depth door back out sits at gx 0.12.
3. **ratchetResting** — a pose plate of Ratchet POWERED DOWN in his chair
   by the bench, slumped, dark, the small chest crystal barely glowing
   (his backstory made visible). drawSage-style placement at the A0B npc
   anchor; the standing plate takes over after the waking.

Estimated 3 fires. After keying: archive sources, wire, photograph,
node tests/run.cjs tutor battery crystal deadend.

### 1e. THE RUN PAIR RE-FIRE ✱ FIRE ON REBIND — the owner rejected v1

The fired `run_a`/`run_b` cells came back as a LOW FELINE LUNGE — body
horizontal, paws forward like a sprinting cat. The owner's exact words
(2026-08-15): *"Hero is moving like a cat instead of running like a cute
robot."* Those two cells are PARKED — `heroState()` in js/entities.js
substitutes the walk pair at 13 fps with a mechanical lean+bounce
(drawRoboPlate) until the re-fire lands. Wiring is a two-line revert in
`heroState()` once the new cells pass review.

The brief, per cell (canon element `<<<467c8e08-8161-483f-a4cf-439875ff04e2>>>`
in the prompt, identity line + standing negatives as always):

- **run_a**: UPRIGHT hurrying jog, torso vertical with a slight forward
  lean, front leg reaching, back leg pushing off — a wind-up-toy hurry, not
  an animal sprint. Side view facing right.
- **run_b**: the opposite stride — other leg forward, arms swapped — same
  upright carriage, same lean. Side view facing right.

Hard requirements learned from v1: NO ground streaks, NO motion-blur smears,
NO baked cast shadow or floor patch under her (v1 shipped with gray slab
remnants in 8 cells — `tools/cleanstates.cjs` had to scrub them; the
generation warnings in the STATUS LEDGER apply: dark-room phrasing beats
"pure black background", never white-key her, bright and even exposure).
After keying: paste into `assets/characters/hero/states.png` cells 3 and 4
(HERO_CELL run_a/run_b), archive the fired originals in
`assets/source/hero/`, re-run `tools/heroeyes.cjs` for the two cells' eye
rects, then `node tools/lowres.cjs && node build.cjs` and
`node tests/run.cjs hero artbible`.

### 1a. The turnaround — 8 yaw angles, one prompt each  ✅ DONE (both variants)
`hzd_yaw0 … hzd_yaw7`: 0° (facing screen-right), 45°, 90° (facing camera),
135°, 180° (facing screen-left), 225°, **270° (directly away — the back the
gate walk needs)**, 315°. Standing neutral, feet on the bottom ground line,
blade on her back, scarf hanging. Assemble with `tools/turnsheet.cjs` exactly
as the NPC sheet was.

### 1b. The action plates — one per statesheet cell that needs a body
From `assets/source/ref/hzd99_states.png` (the checklist): run contact + run
passing · rise · apex · fall · double-jump tuck (mid-rotation) · land squash ·
dash lunge · skid lean-back · wall cling (side-on against a vertical) · claw
swing 1 / 2 / cross-finisher (arm thrown, ONE-PIECE limb) · charge crouch
(braced, glowing) · burst release · hurt recoil · heal kneel · the Song (head
up, visor bright, mouth open) · low-health slump · back-walk contact +
back-walk passing (for the gates).

**Wiring when they land:** her body switches to the plates behind the same
yaw/cross-fade renderer the bosses use (`drawAtlas` grammar, new sheet — NOT
roster row 0, which is retired); scarf, blade glow, jets, charge aura and claw
arcs stay procedural overlays. The gate walk uses yaw 270° + the two back-walk
plates on the wolves' stride counter. `tests/hero.cjs` gains: every named
state's plate exists, and no state silhouette matches idle above the §3.3 IoU
line. Keep the procedural body as the loading fallback only.

---

## 1b. THE SWORD ARC (owner's design, 2026-08-14) — briefs pending

The weapon is a PURIFIER WHITE CRYSTAL shaped like a sword (owner's final
form): translucent faceted white crystal blade, dark-steel hilt, gold pommel
ring that is a visible CONNECTOR. It is the instrument that DISINFECTS the
sages when fought — the purification fork and the weapon are the same object,
which is the story doing its own mechanics.

The first NPC GIVES it to her (a short Higgsfield VIDEO of the handover
plays). The OTHER HALF is buried somewhere secret late-game; the two pommel
connectors LOCK into the double-ended purifier crystal, which opens a NEW
SKILL TREE ending in the boomerang throw (attack = throw the spinning crystal,
it returns). With the sword: three authored slash light-sheets (horizontal,
diagonal, directional up / air-down) and Lost Crown-style combos.

Full crystal art set fired 2026-08-14: single alone, reunited alone, held
(guard + horizontal slash), double held (staff guard + spin), thrown (weapon
spinning boomerang + her follow-through). The earlier green-blade sword_full
plate is superseded by the crystal set.
Tasks #79/#80/#81 carry the wiring; the video brief and slash-sheet briefs go
here when written.

### 1b-i. THE SLASH LIGHT-SHEETS ✱ FIRE ON REBIND — the single crystal's patterns
Four plates, 1:1, additive-light style (painted as pure light on black, drawn
with 'lighter' like the RAKE sheet — brightness IS the alpha). Each is the ARC
the crystal leaves, alone, no character: a ribbon of pure white light with a
crystalline faceted edge and a white-hot leading rim, motes shedding off the
trailing edge.
  slash_h   a wide flat HORIZONTAL crescent, swept left, thickest mid-stroke
  slash_d   a DIAGONAL crescent rising left-to-right at ~40°
  slash_u   a vertical crescent bursting UPWARD, widest overhead
  slash_dn  a downward-driving crescent with impact splash at its foot (the
            air-down pogo slash)
NEGATIVE for all: no character, no sword visible, no green, no text, no
watermark, no cartoon outline. These become the sword-mode replacements for
the RAKE arcs; combos re-tint the same four (task #81).

### 1b-ii. REGRIPS + RESCALE ✱ FIRE ON REBIND
  held_guard, double_guard  regenerate with: "her paw WRAPPED AROUND the hilt,
    fingers closed over it, the hilt visibly INSIDE the grip" — the first pass
    overlapped paw and hilt without gripping.
  thrown  regenerate with: "the weapon LARGE in frame, the same apparent size
    as when held — a two-ended crystal the length of her whole body, spinning"
    — the owner caught the thrown plate reading smaller than the held one.
    (In-engine the scale is set by the renderer, so gameplay never inherits
    the plate's size; the archive still must not lie about it.)

### 1b-iii. THE TWO-HAND TECHNIQUE  ✅ DONE (2026-08-15, canon + crystal elements)
Four plates, fired against the canon element so the dancing cat is the same cat
as everywhere else. Archived to `assets/source/crystal/`, contact sheet at
`assets/source/_sheets/crystal_twin.jpg`.
  twin_guard   both halves up, one high one low, the ready stance of the
               six-second twin window
  swirl_wind   up onto one toe, the turn beginning, scarf already carrying it
  swirl_peak   mid-dance, both blades out, the ring half-drawn
  swirl_fx     the arc ALONE, no character: a five-petal crystalline flower of
               white light — additive, black ground, brightness IS the alpha
The in-game ring is procedural and drawn from `swirl_fx`'s shape (a five-petal
rose curve, squashed to the ground plane); the three character plates are the
reference the pose was animated against, not sheets the engine loads. The move
itself — every number and why — is `docs/combat/HERO_SWIRL.md`, measured by
`tests/twin.cjs`.

### 1c. THE BACK JET ✱ FIRE ON REBIND — the double jump is hardware now
The double jump is a BACK JET THRUST (owner's call; the pirouette is retired —
wired procedurally already, the plume is additive light per §0.0). Two gear
plates, same treatment as the thrust boots:
  jetpack        the pack alone as equipment: a compact dark-steel back unit
                 with twin ribbed pressure bottles, one down-angled nozzle,
                 cyan light seams, worn edges — bolted-on, not born-with
  jetpack_fire   the same pack at FULL BURN, a hard cyan-white plume with
                 shock diamonds blasting down-behind
...and one character plate: her mid double-jump from the side, body stretched
along the thrust, tipped back, the pack firing. Reference mandatory.

### 1d. THE HANDOVER FILM ✱ FIRE ON REBIND (generate_video)
Short clip for task #79: the first machine-folk trader holds out the single
purifier crystal sword in both hands; the small robot cat takes it; the
crystal flares white as her paw closes on it. Style matched to the intro
films; her identity from the reference plate; end on the white flare (cuts to
gameplay). ~6-8s.

**CANONICAL CHEST, settled:** the owner spotted two chest treatments across the
sheets — brushed-STEEL plate with the dark vent grille vs an all-white belly.
The STEEL PLATE + GRILLE (the reference's own chest) is canonical; the unarmed
front half-turn was regenerated to match, and every future brief must name it.

## 2. TERRAIN DEPTH — the front layer (task #76)

**Why:** the play plane is flat next to the backdrop. The brief came with a
Silksong reference: the ledge tops carry a crust, the SIDES and undersides carry
real material, roots and teeth hang off every lip, and foreground growth rises
from the bottom of the screen past the platform line — so the layer the player
is standing on has depth of its own, not just the sky behind it.

The procedural half is done (the bite, the lip, the hang — see `drawTiles`).
These are the authored materials that replace the flat rock on the vertical
faces.

**Model:** `nano_banana_pro` · **aspect:** `16:9` · no reference needed

### 2a-2f. `edge_<zone>` — one per kingdom, horizontally tileable

Substitute the kingdom line into the template:

| key | kingdom | material line |
|---|---|---|
| `edgeA` | Scrap Meadows | rusted scrap plate and packed grey dirt, wire-grass roots trailing out of it, verdigris staining |
| `edgeB` | Data Conduits | dark polymer and cable bundles, loose fibre-optic strands hanging like roots, faint blue light inside the breaks |
| `edgeC` | Foundry | scorched slag and cracked firebrick, cooled drip-formations hanging, orange heat still in the deepest cracks |
| `edgeD` | Archives | frost-shot pale stone with ice growing along the underside in ragged columns |
| `edgeE` | the Deep | dark mineral crusted with fleshy growth, thin violet-lit tendrils hanging |
| `edgeX` | Prism | fractured rose crystal, broken shards hanging point-down, dispersion along every edge |

> A HORIZONTAL STRIP OF BROKEN GROUND, seen straight on from the side, filling
> the full width of the frame. The TOP THIRD is the walking surface, cut off
> flat. Below it the strip is a torn cross-section of <MATERIAL LINE>, and the
> BOTTOM EDGE IS RAGGED — an irregular fringe of hanging roots, teeth and broken
> pieces of differing lengths dropping off the underside, some long, some short,
> never a straight line.
>
> The LEFT AND RIGHT EDGES of the strip must be identical so the strip tiles
> seamlessly when repeated horizontally.
>
> STYLE: high-detail three-dimensional render with real volume and depth, lit
> from the upper left so the top lip catches light and the underside falls into
> shadow.
>
> Pure black background above and below the strip, no scenery, no characters.
>
> NEGATIVE: no straight bottom edge, no floating pieces, no text, no watermark,
> no flat 2D drawing, no cartoon outline, no grass lawn, no tiling seam.

### 2g-2l. `fore_<zone>` — the foreground occluders

> A SINGLE TALL FOREGROUND ELEMENT for a side-scrolling game, rising from the
> BOTTOM of the frame to the TOP, seen straight on and very close to camera:
> <FOREGROUND SUBJECT>. It is a silhouette-first shape — read as a dark mass
> with only its edges catching light, because it will be drawn in front of the
> play area and must never compete with what is behind it.
>
> Foreground subjects: **A** a leaning tower of stacked scrap chassis with cable
> ivy · **B** a bundle of vertical conduit pipes with junction boxes · **C** a
> soot-black chimney stack with iron banding · **D** a column of layered ice over
> a frozen ladder · **E** a fleshy stalk crusted with pods · **X** a cluster of
> crystal columns.
>
> STYLE: high-detail three-dimensional render, very dark, rim light only.
> Pure black background, subject only, no ground plane, no cast shadow.
>
> NEGATIVE: no bright interior detail, no text, no watermark, no characters,
> no flat 2D drawing.

**Wiring when they land:** `edge_<zone>` replaces the flat rock sample on the
vertical faces in `drawTiles`; `fore_<zone>` becomes a parallax layer drawn
AFTER the player at ~1.15 travel, two or three per room, placed off the room's
own hash so they never land on a doorway.
