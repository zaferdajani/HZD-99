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

### STATUS LEDGER (2026-08-14, session A) — do not regenerate what is done
DONE, committed, in assets/: armed 8-yaw (hzd_8yaw.png) · unarmed 8-yaw with
canonical chest (hzd_8yaw_bare.png) · back-walk pairs armed+unarmed (wired
into the gate walk) · 12 armed action plates archived in assets/source/hero/
(runA/runB/rise/fall/djump/land/dash/skid/claw/finisher/charge/hurt — note
these carry the OLD green blade; regenerate only when the crystal versions are
actually needed on screen) · the full crystal weapon set (assets/source/
crystal/, 8 plates).
STILL TO FIRE: §1b-i slash light-sheets ×4 · §1b-ii regrips ×2 + thrown
rescale ×1 · §1c back-jet gear ×3 (the double jump is ALREADY a jet in code —
the plates are the gear art) · §1d handover video · the unarmed SIDE action
set for the opening (idle/walk/run pairs, unarmed) · apex, burst, heal kneel,
the Song, low-health slump, wall cling.

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
