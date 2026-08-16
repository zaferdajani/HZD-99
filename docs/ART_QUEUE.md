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

**AUTO-APPROVAL (owner, 2026-08-16): the art session fires this list and
keys, archives, commits and pushes WITHOUT waiting for per-plate review.**
The owner's words: "you have my auto approval." Discipline replaces the
wait: every plate is self-reviewed against its brief and the bible before
keying (identity lines honoured, negatives absent, silhouette/palette
right — the measurable parts are enforced by tests/artbible.cjs on the
integrator side), and the owner may refuse any plate AFTER the fact, which
sends it back here as a re-fire with his correction. Generation still
belongs to the art session alone; the code session wires and verifies.

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
  4. §1d    THE FORGING CINEMATIC ×1     ✅ FIRED 2026-08-16 — sword_forge.mp4/.webm, needs the hook repointed
  5. §1e    RUN PAIR RE-FIRE ×2          ✅ FIRED 2026-08-16 — cells in, code revert pending
  6. §2e    sage plates ×6               ✅ FIRED 2026-08-16 — assets/characters/sage/, needs wiring
  7. §2d    robot bat plates ×5          ✅ FIRED 2026-08-16 — assets/characters/bat/, needs wiring
  8. §2c    caveMouth + caveExit + pillar ×3  ✅ FIRED 2026-08-16 — cave tile deck still to fire
  9. §2f    GATE SHAPES ×6 + CAVE MOUTHS ×5   ✅ FIRED 2026-08-16 — 5 gates + 5 mouths; city monument left alone
 10. §2g    THE TRADER'S BOOTH + DEN ×3       ✅ CLOSED 2026-08-16 — all three plates fired, approved and wired
 11. §3m    BOSS MOTION PLATES (task #93)     (walk pair + attack-anticipation per guardian)
 12. §1     unarmed side action set + apex/burst/heal/Song/slump/wallcling
 13. §2     zone terrain briefs (edge_/fore_ per zone — task #76)
 14. §2h    THE ORACLE'S SHRINE + PARLOR ×2   (oracleBooth / oracleInterior)
 15. §2i    THE BREAKER ×3                    (rest / fins-flared tell / vented — new zone-B enemy)
 16. §2j    SERVO'S WINDING HOUSE ×1          (kingdom 1 session, 2026-08-16 — see brief below)

### 3m. BOSS MOTION PLATES (task #93 — owner: "bosses graphics and
movements need a lot of improvements")

The code half shipped 2026-08-16: every guardian now leans into its own
acceleration, bobs with its stride and compresses on landing (the weight
pass in Boss.update/Boss.draw). What code cannot do is move the LIMBS —
that is these plates. Per guardian (NULLFANG, TALONHOST, FURNACE CHOIR,
GLACIERE, PRISM PROWLER — MOTHER-V is stationary and exempt):

- **walk_a / walk_b** — two stride poses of its existing body (same sheet
  identity, same fixed key light), legs genuinely committed per §3.3
  (silhouette IoU ≤ 0.86 against each other and against idle).
- **attack anticipation** — one plate per signature attack: the drawn-back
  frame the wind-up holds (coil deeper, wings higher, lance further back
  than any existing pose). The amber wash is code; the POSE is the plate.

Wire notes: the parts-rig guardians (beast/eagle) take these as new atlas
rows for their existing draw files; the sheet guardians swap cells. Every
fire uses the guardian's own current sheet as reference media so identity
holds. tests/artbible.cjs silhouette + tell measurements bind them all.

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

### 1d. THE FORGING CINEMATIC ✅ FIRED AND SHIPPED 2026-08-16 (art session)

**Done.** Opening frame 8742e113 (Seedream 4.5), animated by 52 credits of
Seedance 2.5 omni_reference, job b83d3226. Eight seconds, one continuous
shot, and it hits every beat the owner asked for: Ratchet at his anvil with
the raw shard, the strikes and the spark showers, his CHEST CRYSTAL pulsing
brighter with each blow, the shard elongating and faceting into the blade
with the dark hilt and gold pommel ring resolving last, the offer across both
palms, her paws closing on it, and the white flare that fills frame and ends
the film. Both characters hold identity the whole way through.

Shipped as `assets/video/sword_forge.mp4` + `.webm`, light tier derived.
Opening frame archived at `assets/source/forge/forge_openframe.jpg`.

**NEEDS THE HOOK REPOINTED (code session).** `js/game.js` line ~2630 still
has `gift: 'assets/video/sword_gift.mp4'` for `forgeCrystal()`. That file is
the SUPERSEDED HANDOVER — a tight close-up of hands passing the finished
sword, no forging, no Ratchet, no chest crystal. It is deliberately NOT
overwritten: it is good work, it still ends on the same white flare, and the
two could even run in sequence (forge, then the handover as its coda). The
one-line decision is the code session's: repoint `gift` to `sword_forge`, or
add a second entry and play both.

Two production notes for the next film:
- **Seedance returns HEVC.** The raw job mp4 is `hevc`, which browsers will
  not reliably decode. Every film has to be re-encoded to h264 (and to VP9
  webm) before it goes in `assets/video/` — the house format is h264
  1920x1080. The repo still ships nothing from npm; a static ffmpeg outside
  the tree does the work, and `FFMPEG=/path/to/ffmpeg node tools/lightvid.cjs`
  then derives the light tier.
- **Audio off.** Generated with `generate_audio: false` on purpose — the game
  scores its own cinematics through audio.js, and a baked soundtrack would
  play over the top of it.

### 2e. THE SAGE ✅ FIRED AND SHIPPED 2026-08-16 (art session)

Six plates in `assets/characters/sage/` — `stand`, `coil`, `lunge`,
`gather`, `lock`, `pure` — sources in `assets/source/sage/`, contact sheet
at `assets/source/_sheets/sage_contact.png`. The robed machine monk of
docs/combat/SAGE.md and `drawSage`: pointed hood over a faceplate with two
ember eye-lights, tapered plum-and-charcoal robe with a torn hem that never
makes a straight line, gunmetal segmented hands.

The set was built to be MEASURABLE against the bible, not just to look
right:
- **§3.5, the hue law.** Amber appears on exactly the three telegraph
  states — `coil` (seams bleeding amber), `gather` (ember pooling in both
  open sleeves, motes drawn INWARD because he is storing it) and `lock`
  (amber pouring out of the split faceplate). `stand` and `lunge` carry
  none: the warning has to mean something, so it cannot be decoration.
- **§3.3, the silhouette law.** Five genuinely different shapes — narrow
  upright, compressed and wound, long horizontal at full extension, widest
  spread, low kneel. Nothing here is one drawing rescaled.
- **`pure`** is the same body with its light changed: ember gone, crystal
  blue-white in the eyes and seams, cloth lifted from dusty plum to clean
  slate-blue, faceplate closed, hands loose. The robe is washed, not
  replaced — the hem is still torn.

**NEEDS WIRING (code session).** These replace `drawSage` in js/entities.js
at the same anchor, indexed by state name. Six media.js entries and the
state→plate mapping are the wiring; `tests/sage.cjs` and
`tests/artbible.cjs` both stay green as they read state, not pixels.

Three things this batch cost a round each, worth knowing before the next set:
1. **Naming a state in the prompt prints the name.** `coil` and `gather`
   came back with "THE COIL" and two "The Gather" callout labels rendered
   into the frame, because the prompt used those words as headings. Describe
   the pose; never title it.
2. **"Whole body in frame" needs "zoom out" next to it.** The first `pure`
   framed her hood off the top edge. Asking for margin is not enough — say
   the figure is SMALL in the frame.
3. **Ambient effects survive matting.** The first `lock` was rendered
   sitting in a dust cloud, and the matte kept it as a grey smear stuck to
   the robe. Negatives for dust, smoke, mist and haze belong on every
   subject-only plate.

### 2d. THE ROBOT BAT ✅ FIRED AND SHIPPED 2026-08-16 (art session)

Five plates in `assets/characters/bat/` — `hang`, `shiver`, `dive`,
`flap_up`, `flap_dn` — sources in `assets/source/bat/`, contact sheet at
`assets/source/_sheets/bat_contact.png`. A small machine the size of a cat:
riveted gunmetal barrel body, blunt snout with two pointed metal ears, ONE
round amber optic, thin segmented wings on jointed steel ribs, little hooked
steel claws. All five matted.

The five silhouettes are five shapes, which is the whole point of a minion
you have to read at speed: compact folded teardrop hanging head-down, the
same teardrop rattling with amber leaking out of its seams, a narrow
swept-back arrowhead diving, wings high and wide at the top of the beat,
wings driven low beneath the body at the bottom of it. `hang` is the only one
with its optic DARK — that is the difference the player reads before it
drops on them.

**NEEDS WIRING (code session).** These replace `drawBat` in js/entities.js at
the same anchor: `hang`/`shiver` for the perched states, `flap_up`/`flap_dn`
alternating on the stride counter for flight, `dive` for the attack run.

**THE LESSON, AND IT COST FIVE PLATES.** The first batch was fired from prose
alone — one careful paragraph of description, five times. It came back as
FIVE DIFFERENT BATS: different bodies, different wings, different scales, one
with a cat's face, one on a riveted metal wall the negatives had forbidden,
and one that was a zeppelin with a small animal hanging underneath it. This
is exactly the failure THE IDENTITY LOCK records for the hero, arriving again
at the other end of the roster, and the fix is the same one §2 of the
art-prompts skill already prescribes: **generate ONE plate, pick the best,
and make it the reference for every other plate in the set.** The four
re-fires against `flap_up` are all recognisably the same machine. Do this
first next time rather than second — it would have halved the spend.

Second, smaller: "infinite empty black void" alone did not stop backdrops
appearing. What stopped them was naming the offence — no wall, no backdrop,
no metal panels, no rivets in the background, no gradient, no vignette — as
explicit negatives. Generic void language describes a mood; a negative names
a thing.

### 2c. THE CRYSTAL CAVE ✅ THREE PLATES FIRED 2026-08-16 (art session)

- `assets/backgrounds/cave_mouth.jpg` (job 35528818) — room A5's rock face
  with the opening she walks into.
- `assets/backgrounds/cave_exit.jpg` (job c76e8ac5) — room CV1, the view
  back out: near-black interior rock, one hole full of daylight, roots
  silhouetted against the glare, light dying across the floor. Fired against
  the mouth as reference so both sides are the same rock.
- `assets/characters/gear/pillar.png` (job ea28f95e, matted) — three white
  crystal spears out of an irregular broken rock clump, lit from inside.
  Replaces the procedural light version in `drawStatics`.

Sources in `assets/source/cave/`.

**THE DOOR ANCHORS DO NOT MATCH THE BRIEF, AND THE PLATES ARE RIGHT.** The
brief specified gx 0.50 / gy 0.86 for both. What the plates actually have,
measured off the images rather than guessed:

- **cave_exit**: opening centre **gx 0.516 / gy 0.563**, its base at gy 0.79.
  Measured cleanly — the daylight hole is the only bright thing in the frame.
- **cave_mouth**: opening centre **gx 0.68 / gy 0.62** by inspection, base
  around gy 0.85. Read off the image, not measured: a darkest-pixel centroid
  is contaminated here by the dusk sky and the wall shadow, so treat this one
  as approximate and check it against the running room.

Set the anchors to the plates. Aiming the walk at 0.50/0.86 on cave_mouth
would send her into solid rock a fifth of a screen left of the hole. The
scratch tool that measured this is in the session scratchpad; it finds the
extreme 6% of pixels by luminance and averages their positions.

Two things the first round got wrong, both about composition rather than
material:
1. **A rock face wants "flat and straight on" said explicitly.** The first
   cave_mouth came back in perspective, the wall receding to the left, with
   the opening halfway up it — unreachable for a character standing on the
   ground. Naming the ground ("a stony floor across the bottom eighth of the
   frame") and putting the opening ON it fixed both faults at once.
2. **"No square base" is not enough for a socle.** The first pillar grew a
   neat cut plinth with flat faces and a level bottom — a right angle in a
   game whose standing order forbids them. What worked was describing the
   base as a thing rather than negating a shape: "a jagged, lumpy, eroded
   mass of fractured stone, torn out of the ground, not a carved pedestal".

Still to fire in this section: the cave tile deck.

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

### 2f. GATE SHAPES + CAVE MOUTHS ✅ TEN PLATES FIRED 2026-08-16 (art session)

The owner's order was *"ask Higgsfield to produce different shapes of gates,
and caves should look like a cave opening, not a door"*. Both halves are
done, and no two of these are the same shape.

**Gates ×5**, in `assets/backgrounds/`:
- `gate_foundry.jpg` — a horseshoe furnace arch whose rim is poured metal,
  frozen mid-run in lobed drips, orange still alive in the cracks; two cast
  slabs meeting in a ragged seam that reads as sliding apart.
- `gate_archives.jpg` — a wall of stacked shelves and drawers PARTED down
  the middle into a stepped cleft, shelf-ends interlocking, frost on every
  lip and loose index cards caught in the gap.
- `gate_conduits.jpg` — a lopsided cable iris: dozens of bundles drawn in
  from the rim to a knotted centre, fibre-optic light bleeding from the
  broken ends.
- `gate_nest.jpg` — two enormous horn talons leaning together over a wide
  teardrop opening, packed around with woven branch, wire, bone and feather.
- `gate_deep.jpg` — a ringed organic iris of dull flesh in wet mineral,
  violet light only in the tendrils.

**THE CITY GATE IS DELIBERATELY NOT RE-FIRED.** `gate_city.jpg` already
exists and is the one gate the standing order singles out as the huge epic
multilayer monument. Re-rolling it would have been duplication, which the
ledger forbids, so the sixth slot is spent and closed rather than filled.

**Cave mouths ×5**, in `assets/backgrounds/` as `cave_mouth_a` … `_e`, one
per grotto network: scrap plate and wire-grass (A), cable bundles with
fibre-optic strands hanging out of the breaks (B), scorched slag with frozen
metal drips and orange in the cracks (C), frost-shot stone with ice growing
down the lip like teeth (D), dark mineral crusted with pale fleshy growth
and violet tendrils (E). All five were fired against `cave_mouth.jpg` as
reference, so the whole family shares one composition and one grammar of
opening while the material changes per kingdom — the anchor-first rule from
§2d, applied on purpose this time instead of after a failed batch.

Sources in `assets/source/gates/`; contact sheets at
`assets/source/_sheets/gates_contact.png` and `cave_mouths_contact.png`.

**NEEDS WIRING (code session).** Ten media.js entries and the per-zone
depth-door mapping. Every plate uses the same composition contract as §2c:
flat-on, ground across the bottom eighth, opening standing ON that ground in
the horizontal centre — so one anchor rule covers the whole family instead of
eleven measured exceptions. Verify against the running rooms and adjust per
plate if any opening sits off centre.

The composition contract is the reusable part of this section. Every one of
these plates says the same four things before it says anything about
material: flat and straight on with no perspective, the ground across the
bottom eighth, the opening standing ON that ground in the horizontal centre,
and no right angles anywhere. Fired that way, ten independent generations
came back as one coherent set. The one plate that broke rank was the first
nest gate, which read its brief's "tall pointed opening" as a narrow vertical
slot with straight parallel sides; naming the shape wanted — "wide,
asymmetric, lopsided, like a leaf or a teardrop" — and forbidding the slot
outright fixed it in one.

### 2g. THE TRADER'S BOOTH + DEN — PARTIALLY FIRED 2026-08-16, READ BEFORE FIRING

**STATUS (2026-08-16, code session — do not double-fire):**
- **boothFront — REPLACED BY THE ART SESSION 2026-08-16** (job b983ed7a).
  The code session's plate (d469ad29) keyed cleanly but the art session's
  re-fire beats it on material, canopy and interior read, so it took over
  `assets/backgrounds/booth_front.png` — same path, zero re-plumbing, as
  the owner's quality ruling allows. Fired-as-is archived at
  `assets/source/booth/booth_front_artsession_asfired.jpg`.
- **denInterior — THE CODE SESSION'S PLATE STANDS** (job 3bd98cc3). The
  art session fired a competing interior and judged it WORSE for the room
  and did not ship it: its foreground bench fills the lower right, which
  is exactly where the player walks, while the wired plate keeps open
  floor across the middle. A prettier picture that eats the play plane is
  not an upgrade. Not re-fired again.
- **ratchetResting — RE-FIRED AND SHIPPED 2026-08-16** (job 6b2a7128).
  Fired against Ratchet's own atlas row as reference media, so the
  resting figure is recognisably the same vendor unit: pot belly, bone
  plating, the strapped canister rig, eye-lights dark, chest crystal the
  only light. Keyed to `assets/characters/npc/ratchet_resting.png`,
  sources + the reference strip in `assets/source/ratchet/`.
  **WIRED 2026-08-16 by the code session** (commit fd2d93e): media.js
  knows `ratchetResting`, and the A0B npc anchor draws the plate at 1.5×
  npc height whenever he is a dark unit — skipping the grayscale-and-dim
  treatment, because the plate IS the powered-down read and the filter
  would kill the chest-crystal glow the image is about. The moment a cell
  wakes him the standing atlas takes over exactly as before. Lowres tier
  + roomassets regenerated. §2g is CLOSED end to end.

**KEYING NOTE, learned on both plates (2026-08-16).** `tools/blackkey.cjs`
failed on both and for the same reason twice: it decides by luminance, and
these plates have dark subject against dark field. Ratchet's shadowed far
leg keyed as background and came back full of holes; the booth's render
carried a soft glow in one corner that survived every threshold that did
not also eat the teal panels. Raising the threshold ate the subject,
lowering it kept the field — there is no threshold that works, so stop
sweeping for one. **What worked was Higgsfield's own matting pass
(`remove_background` on the generation job id), which reads the subject
rather than the exposure.** Both shipped plates are matted, not keyed. Use
it first on any plate whose subject has genuinely dark regions; blackkey
stays right for bright subjects on clean black.

The code session fired the first three before this ledger entry existed —
that mistake is why this block leads the section now. Generation belongs
to the art session; the code session wires and verifies.

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

Estimated 3 fires. After keying: archive sources, wire (ROOM_VISTA.A0B is
already pointed at `denInterior`; add the three media.js entries in the
same commit as the files), photograph, then
node tests/run.cjs tutor battery crystal deadend platform.

**The prompts, verbatim — fire as-is:**

> (boothFront) A small scrap-market vendor kiosk seen straight on, built
> from salvaged machine parts: two leaning tapered metal poles, a sagging
> canvas canopy with a scalloped worn hem thrown over the top, patched
> cloth flaps hanging over a doorway glowing warm amber from inside, a
> small metal sign hanging crooked from one pole bearing a lightning-bolt
> glyph. Weathered teal-and-gunmetal palette with warm amber light in the
> doorway only. Nothing plumb, nothing square — every edge leans, sags or
> curves. Clean high-detail 3D render, soft specular metal, dark moody
> dusk lighting. NEGATIVE: no text, no watermark, no characters, no
> straight rectangular frame, no cast shadow, no ground plane. Dark
> unlit room behind the subject, subject only.

> (denInterior, 16:9 backdrop) The inside of a one-room machine-tinker's
> workshop, wide interior view: a heavy workbench along the right wall
> covered in coils and small tools, tools hanging from hooks, shelf
> clutter of jars and scrap parts, cable bundles drooping from a low
> ceiling, wooden crates, one warm hanging lamp pooling amber light over
> the bench, the rest falling into cosy teal darkness. Lived-in, low,
> warm. Weathered teal-gunmetal-amber palette. No right angles
> presenting: shelves sag, the bench leans, the lamp hangs crooked.
> Clean high-detail 3D render. NEGATIVE: no characters, no text, no
> watermark, no doors, no windows with daylight.

> (ratchetResting) A boxy vendor robot slumped POWERED DOWN in a worn
> chair beside a workbench, seen from the side: head bowed, arms hanging,
> body dark and unlit except a SINGLE SMALL CRYSTAL embedded in its chest
> giving a faint dying white-blue glow. Weathered gunmetal body with
> brass fittings. The pose reads instantly as switched off, not dead —
> intact, waiting. Clean high-detail 3D render, soft specular metal.
> NEGATIVE: no cast shadow, no ground plane, no second character, no
> text, no watermark. Dark unlit room, subject only.

### 2h. THE ORACLE'S SHRINE + PARLOR ✱ NEW (2026-08-16, kingdom 2 pass)

Mono — the Oracle — has her own place now: a depth door at mid-B3 (the
A0/A0B booth pattern, GATE_ROOM style `oracle`) into the parlor room B3B.
Two plates replace the procedural stand-ins at the same anchors, both built
from the CONDUITS backdrop's own furniture (the mimic rule) and nothing
plumb or square (NO RIGHT ANGLES):

1. **oracleBooth** — the shrine standing in the corridor: two leaning
   conduit-pipe posts with junction-box hips, a heavy sagging swag of dead
   cable bundles thrown over them as a canopy, loose fibre-optic strands
   hanging like roots with faintly lit tips, parted cable curtains over a
   doorway glowing CRT blue (NOT amber — amber is Ratchet's lamp; blue is
   the Oracle's screen), and a small cracked monitor hung crooked from one
   post with a single sine wave still alive on it. `drawOracleBooth` in
   js/game.js is the placement reference; same bottom anchor and ~236 px
   height as boothFront.
2. **oracleInterior** — a 16:9 backdrop for B3B: a one-room data-den —
   stacks of dead monitors along one wall, one alive with drifting glyphs,
   cable drapery drooping from a low ceiling, a leaning rack shelf, junction
   clutter, the whole room pooled in cold CRT blue-on-dark with one deep
   pink accent (zone B's acc2). Cosy the way a server closet is cosy.
   The depth door back out sits at gx 0.12. `ROOM_VISTA.B3B` is already
   pointed at `oracleInterior`; add the media.js entries in the same commit
   as the files.

**The prompts, verbatim — fire as-is:**

> (oracleBooth) A small roadside shrine built from salvaged data-conduit
> parts, seen straight on: two leaning bundles of vertical pipes as posts
> with boxy junction housings, a heavy sagging swag of dead cable bundles
> thrown over the top as a canopy, loose fibre-optic strands hanging down
> like roots with faint blue-lit tips, parted hanging-cable curtains over a
> doorway glowing cold cathode blue from inside, and a small cracked
> monitor hanging crooked from one post showing a single faint sine wave.
> Deep navy and gunmetal palette with cold blue light in the doorway only,
> one small magenta indicator. Nothing plumb, nothing square — every edge
> leans, sags or curves. Clean high-detail 3D render, soft specular metal,
> dark moody lighting. NEGATIVE: no text, no watermark, no characters, no
> straight rectangular frame, no cast shadow, no ground plane. Photographed
> in a pitch-dark room, no backdrop, no floor, spotlights pick out the
> shrine and nothing else receives any light.

> (oracleInterior, 16:9 backdrop) The inside of a one-room data-den, wide
> interior view: a wall of stacked dead monitors with one screen still
> alive showing drifting glyphs, heavy cable bundles drooping from a low
> ceiling like vines, a leaning equipment rack shelf, junction boxes and
> coiled fibre clutter on the floor, cold cathode blue light pooling from
> the live screen over everything, the rest falling into deep navy
> darkness, one small magenta status lamp. Lived-in, low, humming. No
> right angles presenting: racks lean, shelves sag, cables curve. Clean
> high-detail 3D render. NEGATIVE: no characters, no text, no watermark,
> no doors, no windows with daylight.

### 2i. THE BREAKER (surge — new zone-B enemy, 2026-08-16) ✱ NEW

The Data Conduits' own machine (js/entities.js, kind `surge`): a squat
breaker drum bolted to the conduit rail that vents its overload as a charge
wave crawling the floor BOTH ways — the kingdom's lesson in being airborne
on a beat, taught before TALONHOST asks "where are you standing?" for
keeps. Atlas-creature plates in the minion family style (small machine,
reads smaller than HZD-99); the engine-drawn fallback (`case 'surge'` in
Enemy.draw, js/entities.js) is the placement reference:

- **rest** — the drum low and latched on its bolted saddle, three ceramic
  insulator fins folded flat along its back, bronze end caps, cable stubs
  arcing into the ground on both sides, one dull violet charge-window.
- **tell** — fins FLARED upright and spread, body lifted off the saddle,
  charge-window hot (the amber wash is code; the POSE is the plate —
  silhouette must differ from rest per ART_BIBLE §3.3).
- **vented** — side vents fallen open showing hot amber slots, fins
  drooped, body sagging: visibly spent, the punish window made readable.

NEGATIVE for all: no legs, no barrel or gun (it must never read as the
turret), no second character, no text, no watermark; dark-room phrasing
per the §1 warnings, subject only.

### 2j. SERVO'S WINDING HOUSE ✱ FIRE ON REBIND (kingdom 1 session, 2026-08-16)

The kingdom protocol asks that every NPC have a PLACE or a reason; Old Servo
now has both. His coil errand already says he cannot climb any more, and his
standing line says he built half the district — so the structure behind him
in A1 is the winch he raised the gantries with: drum, A-frame, sagging
canvas, the cable still made off toward the climb. `drawWinchHouse` in
js/game.js (drawn via ROOM_PROPS) is the procedural stand-in and the
placement reference — one plate replaces it at the same ground anchor
(tile 3, ground line, roughly 110×100 px on screen). Mimic-the-background
rule: it is built from the same scrap furniture the Scrap Meadows backdrop
paints. NO RIGHT ANGLES: every edge leans, sags or curves.

> (winchHouse) A small salvaged cable-winch station on a scrap meadow, seen
> straight on: a big round cable drum with worn spokes hung slightly askew
> in a leaning A-frame of two tapered scrap-metal poles, a patched canvas
> sheet with a sagging scalloped hem thrown over the top, a heavy cable
> running off the drum up toward the upper right and out of frame, a coil
> of spare cable and a crooked one-legged stool at the base, one small
> work lamp hanging from the frame giving a tired warm amber glow.
> Weathered teal-and-gunmetal palette, verdigris staining, warm amber only
> at the lamp. Nothing plumb, nothing square — every edge leans, sags or
> curves. Clean high-detail 3D render, soft specular metal, dark moody
> dusk lighting. NEGATIVE: no text, no watermark, no characters, no
> straight rectangular frame, no cast shadow, no ground plane.
> Photographed in a pitch-dark room, no backdrop, no floor, spotlights
> pick out the structure and nothing else receives any light.

After keying: archive the source, wire as a media.js entry drawn at the
ROOM_PROPS A1 anchor with `drawWinchHouse` kept as the loading fallback,
photograph, then node tests/run.cjs boot deadend platform.

### 1e. THE RUN PAIR RE-FIRE ✅ FIRED AND SHIPPED 2026-08-16 (art session)

**Done.** Jobs e53d354e (run_a) and f997ec67 (run_b). She hurries upright now —
torso vertical, head level, one leg reaching and one pushing off, cape
trailing — instead of lunging along the floor like a cat, which is what the
owner rejected. Both cells are in `assets/characters/hero/states.png` at cells
3 and 4, sources archived to `assets/source/hero/run_a.jpg` / `run_b.jpg`,
eye anchors re-measured and updated, `tests/run.cjs hero artbible` green.

**STILL PARKED IN CODE.** `heroState()` in js/entities.js is still substituting
the walk pair at 13 fps for the run — the two-line revert is the code session's
and the new cells do not reach the screen until it lands.

Three things this fire taught, all of them about COMPOSITION rather than pose:

1. **A strip reference makes a strip.** The first pair was fired with three
   cells of her own sheet attached as reference, to pin camera and scale. It
   pinned those perfectly and then also copied the LAYOUT: both results came
   back as three-panel strips with the figure cut by the panel borders. The
   fix is to say the composition out loud and first — "ONE SINGLE FIGURE,
   alone, centred, entire body inside the frame, not a sheet, not a strip, not
   split into panels" — before any word about the character.
2. **Even then it may hand you two.** The second run_b came back as two
   figures side by side. That is recoverable and worth recovering: they share
   one camera, one light and one scale, so splitting them yields a genuinely
   matched pair. `tools/herocell.cjs` and the split are in this commit's
   scratch work; the two shipped cells are one from each fire.
3. **The strides must actually differ.** The two figures in a single plate
   looked like a pair and were nearly the same stride — §3.3 would have called
   that one drawing twice. The shipped pair is one figure from each fire, with
   opposite legs forward.

Wiring, for whoever does it: `node tools/herocell.cjs <sheet> <out>
run_a=<a>,ground run_b=<b>,air` replaces cells in place without rebuilding the
sheet — which matters, because `herostates.cjs` re-derives the global scale
from whatever directory it is given and would move the other twenty cells.

---

### 1e (original brief, kept for the record) — the owner rejected v1

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
