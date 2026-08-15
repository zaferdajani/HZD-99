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

### ⚠ THE WIRING IS BLOCKED ON A PRESENTATION DECISION — READ BEFORE #79/#80/#81

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
which belong to NOSTOS's human hero behind `isHero()` and are a dead pixel-art
path expecting `heroIdle`/`heroRun`/`heroJump`/`heroAtk` sheets that do not
exist. Scarf, jets, charge aura and claw arcs stay procedural overlays; the
procedural body becomes the loading fallback.

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
