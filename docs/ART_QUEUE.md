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

## 1. HZD-99 FROM BEHIND — three plates ✱ HIGHEST PRIORITY

**Why:** the walk into the city gates is supposed to show her turning her back
on the camera and going in. It currently shows her from the side, shrinking,
which reads as a character being scaled down rather than a character leaving.

**What went wrong the first time, and must not happen again:** the back angles
of `roster_8yaw.png` row 0 were used instead. That sheet is a DIFFERENT robot
cat — different build, different palette, a staff she does not carry — and for
two seconds it replaced the protagonist with a stranger. **The reference below
is not optional.** These plates are generated FROM her, or they are not
generated.

**Reference to attach:** `assets/source/ref/hzd99_body.png` — three facings of
her live in-engine body on black, rendered from the game itself, so the model
is matching the character that actually walks around the game rather than a
description of her.

**Model:** `nano_banana_pro` · **aspect:** `1:1` · **role:** `image`

### 1a. `hzd_back_stand`

> Use the reference image as the EXACT character. It shows the same small robot
> cat from three angles. Keep every design feature precisely: the rounded
> off-white ceramic head with the dark visor band across it and two cyan eye
> lights, the two upright cat ears with mint-green inner surfaces, the short
> stubby whiskers, the compact rounded ceramic-and-steel body, the red-and-white
> segmented arms with a gold shoulder joint, the short thick legs with wide
> feet, and the glowing mint-green blade carried on her back.
>
> Redraw that same character SEEN FROM DIRECTLY BEHIND, standing still, feet
> flat on a ground line at the bottom of the frame, head level. NO FACE IS
> VISIBLE — we are looking at the back of her head: the smooth rear curve of the
> ceramic skull, the backs of both ears with the mint inner surface just
> catching light at the edges, and the nape seam where the head meets the body.
> The blade is carried diagonally across her back and is the clearest read in
> the silhouette. Her scarf trails from her neck down her back.
>
> STYLE: the same clean rendered three-dimensional look as the reference —
> off-white ceramic with soft specular highlights, brushed steel joints, cyan
> and mint emissive accents, gentle rim light from the upper left.
>
> Pure black background, subject only, no ground plane, no cast shadow.
>
> NEGATIVE: no face, no eyes, no visor visible, no staff, no different colour
> scheme, no tan or brown body, no additional characters, no text, no watermark,
> no flat 2D drawing, no cartoon outline, no side view, no front view.

### 1b. `hzd_back_walkA` — contact

> Same character, same rules, same reference. SEEN FROM DIRECTLY BEHIND,
> WALKING AWAY — CONTACT FRAME: one leg extended forward with its foot just
> planted, the other trailing back with the heel lifting, hips turned very
> slightly toward the planted leg, shoulders counter-rotated. Both arms swing in
> opposition. The blade on her back tilts with the shoulder rotation. The scarf
> streams behind and to one side.
>
> Same style, same negatives. Pure black background.

### 1c. `hzd_back_walkB` — passing

> Same character, same rules, same reference. SEEN FROM DIRECTLY BEHIND,
> WALKING AWAY — PASSING FRAME: the legs are at their closest, one directly
> under the hips and vertical, the other swinging through past it with the foot
> clear of the ground. The body rides slightly HIGHER than in the standing
> plate. Shoulders level. The scarf lifts.
>
> Same style, same negatives. Pure black background.

**Wiring when they land:** `ROOM_VISTA`/`gateEnter` in `js/game.js` —
`drawGateWalk()` swaps from `player.draw` to these three, cycling walkA/walkB
on the same stride-driven counter the wolves use (`wolfPose` in `js/wolves.js`),
and `tests/opening.cjs` gains a check that the plate drawn during the walk is
one of these and never a roster subject.

---

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
