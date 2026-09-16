# Prompts for GPT — HZD-99 animation sheets

Everything here is written to be pasted into ChatGPT. **Send §1 once**, with the
reference images it names. Then send one block from §4 per animation. Keeping the
character set up once and asking for animations against it holds her consistent
far better than eighteen cold starts.

The technical rules in §2 are not style preferences — they are what
`tools/sheetslice.cjs` needs in order to find the frames and what
`tools/stripcheck.cjs` measures before anything is wired. A sheet that breaks one
of them gets rejected by a command, not by an opinion.

---

## 1. The setup message — paste this ONCE, first

Attach: `assets/source/hero/delivered/b5_interact.png` and
`assets/source/hero/delivered/c1_walkramp.png`.

> These two images are the character I am animating. Study them — they are the
> exact design, rendering and proportions to match in everything that follows.
> Every sheet I ask for from now on must show this same character, drawn the same
> way, at the same scale.
>
> **Who she is:** HZD-99, a small robot cat. Chibi proportions — her head is
> about as large as her torso. She is **bipedal**: she stands and moves upright
> on two legs like a small armoured person, her forelimbs are **arms** with
> shoulders and elbows, and her hands never touch the ground. She is never on all
> fours, never prowling, never crawling.
>
> **Her parts:** smooth bone-white ceramic armour plates · tall pointed ears with
> pale ice-blue inner surfaces · a wide near-black visor band across her face
> carrying two bright cyan rounded-rectangle eye-lights · a small round cyan light
> at each temple · four thin whiskers · a deep crimson cape from her shoulders
> with a red collar · one brass-gold shoulder disc · three short dark vertical
> vent slots on her belly · small cyan lights at her shoulder, hip and knee joints
> · ball-jointed segmented arms and legs with visible joint rings · white mitten
> hands · short rounded boots with darker soles. No mouth. No tail.
>
> **Her colours:** ceramic lit `#faead7`, ceramic mid `#ead7c7`, ceramic shadow
> `#d7b9a7`, visor `#040304`, eye-lights `#8cfafd`, cape lit `#c42b32`, cape
> shadow `#8c1c2d`, gold `#eca433`.
>
> **Never:** no sword, no blade, no weapon of any kind, nothing on her back, no
> jet flames, no rocket exhaust under her feet.
>
> **Her rendering:** painted 2D game-sprite illustration, smooth cel shading with
> a soft painterly finish, a thin dark outline around the forms, warm key light
> from the upper left. Not pixel art, not a 3D render, not flat vector.
>
> Confirm you have her, and I will start asking for animations.

---

## 2. The format rules — paste this SECOND, once

> Every animation sheet you make for me must follow these rules exactly. They are
> technical requirements of the game engine that ingests them, not preferences.
>
> 1. **One PNG per animation.** Frames laid out left to right in play order.
>    Nothing else in the image: no panel, no border, no grid line, no frame
>    numbers, no title, no label, no watermark.
> 2. **Transparent background** (PNG with a real alpha channel). No black fill,
>    no white fill, no ground, no floor line, no cast shadow.
> 3. **She is the same size in every frame of every animation.** About 330 pixels
>    from the top of her ears to the soles of her feet, in every single frame.
>    Never draw her receding, shrinking, or further away — unless I explicitly ask
>    for a walk-away, and even then keep her one size.
> 4. **Her feet sit on the same invisible baseline in every frame**, except where
>    she is genuinely airborne.
> 5. **Leave a clear transparent gap of at least 20 pixels between frames, and
>    nothing may cross it.** Effects especially — a slash arc that reaches into
>    the next frame welds two frames together and the sheet becomes unusable.
> 6. **Effects go on their own separate sheet**, not on her body. When I ask for
>    an attack, give me two PNGs: one with just her body, and one with just the
>    glows, arcs, impacts and dust, frame for frame aligned with the body sheet
>    and on the same transparent background. The game composites them itself.
> 7. **Facing:** she faces the RIGHT side of the frame in every animation, in
>    side or three-quarter view — except the idle and the walk-away, which I will
>    call out when I ask for them.
>
> Confirm you understand, and I will send the first animation.

---

## 3. What she is doing in the sheet you already made

Your 23-section sheet is the reference for the *actions*; §4 below re-orders it by
what the game needs first and adds the ones it was missing.

---

## 4. One block per animation

Paste any of these after §1 and §2. They are short on purpose — the character and
the format are already established.

### Priority one — locomotion, on screen constantly

> **RUN — 8 frames.** A full run cycle, side view facing right. Contact, down,
> passing, up, then the same on the other leg. Her cape streams back. Real
> airborne moments between strides — a run has both feet off the ground twice per
> cycle. Same size every frame.

> **JUMP START — 4 frames.** Side view facing right. She compresses into a crouch,
> then drives upward: frame 1 standing, frame 2 knees deeply bent and arms back,
> frame 3 legs extending hard, frame 4 fully extended and just leaving the ground.

> **AIR RISE — 4 frames.** Side view facing right, airborne, moving upward. Legs
> tucked then reaching, arms out for balance, cape pulled down and back by the
> climb. No ground anywhere in the frame.

> **AIR FALL — 4 frames.** Side view facing right, airborne, falling. Body angling
> forward, legs reaching down for the landing, arms out, cape pulled up by the
> fall. No ground in the frame.

> **LAND — 4 frames.** Side view facing right. Frame 1 feet just touching, frame 2
> deep absorbing crouch with knees bent hard, frames 3–4 rising back to standing.
> Her cape settles down around her.

> **SKID — 4 frames.** She is running right and stops hard. Side view. Her body
> leans BACK against her own momentum, front foot braced and sliding forward, rear
> leg trailing, arms thrown out for balance, cape snapping forward past her. This
> is a turn-and-stop, not a walk.

> **DASH — 6 frames.** Side view facing right. A fast horizontal burst: she drops
> low, drives forward almost horizontally with both arms swept back, then recovers
> to standing. Keep her one size — no receding. Body sheet only; put the speed
> streaks on a separate effects sheet.

> **WALL SLIDE — 4 frames.** Side view. She is pressed against a wall on her RIGHT,
> sliding down it. One hand and one foot braced against the wall, body angled, head
> turned to look down, cape hanging against the wall. Do not draw the wall itself.

### Priority two — combat

> **SUPERCHARGED SCRATCH — 12 frames. THIS IS A RE-RENDER — the previous one
> came back at half the size of every other sheet and with its frames welded
> together by the energy, so two things matter more than the poses: draw her the
> SAME SIZE as she is in the walk and idle sheets (about 330px tall, ear-tips to
> soles, in every frame), and put NO energy on this sheet at all — the blue
> charge and the slash go on a separate effects sheet, frame for frame.** The charged claw attack, side view facing
> right. She stays low, braced and bipedal throughout — she never leaps and never
> drops to all fours. Frames 1–2 standing ready. Frames 3–4 sinking into a deep
> wide fighting stance, both arms drawn back behind her hips, steel claws extended.
> Frames 5–7 holding the charge, wound tighter, straining, claws spread wide.
> Frames 8–10 the release: hips driving forward, the striking arm sweeping across
> and forward with claws leading, reaching full extension. Frames 11–12 the
> follow-through, arm sweeping past and settling. Body sheet only — the energy goes
> on the separate effects sheet.

> **CLAW JAB — 5 frames.** Side view facing right. A quick straight claw strike:
> guard, wind, full extension with claws out, recoil, back to guard. Body sheet
> only; the slash arc on a separate effects sheet.

> **DOUBLE SLASH — 6 frames.** Side view facing right. Two fast claw strikes, one
> with each hand — the first sweeping down-to-up, the second across. Guard, strike
> one, strike two, recover. Body sheet only; the two arcs on a separate effects
> sheet.

> **UPPERCUT — 6 frames.** Side view facing right. A rising claw strike: she drops
> slightly, then drives up with one arm sweeping from low to high overhead, body
> extending upward onto her toes, then settles. Body sheet only; the rising arc on
> a separate effects sheet.

> **AIR ATTACK — 6 frames.** Side view facing right, airborne throughout. A
> horizontal claw swipe while in the air: wind-up, strike across, recover, still
> falling. No ground in the frame. Body sheet only; arc separate.

> **DOWN ATTACK — 6 frames.** Side view facing right. She flips downward and
> drives both claws straight down beneath her — the plunge. Frames 1–2 airborne
> turning over, 3–4 driving down, 5–6 landing in a braced crouch. Body sheet only;
> the downward spike and the ground impact separate.

### Priority three — reactions

> **HURT — 4 frames.** Side view facing right. She is struck from the right: head
> snaps back, body recoils and twists, one arm flying up, then she recovers her
> footing. Her eye-lights flicker down in the middle frames.

> **DEATH — 6 frames.** Side view. She is hit, staggers, drops to her knees, falls
> forward onto the ground, and goes still. Her eye-lights dim to nothing by the
> last frame.

> **HEAL — 5 frames.** Side view facing right. She stands, brings both hands
> together at her chest over her cyan core light, head bowed, then straightens as
> the light brightens. Calm and deliberate. Body sheet only; the glow separate.

> **FIDGET — 8 frames.** Front-on, facing the camera, like the idle. She has been
> standing too long and is impatient: she shifts her weight, looks off to one side,
> taps a foot, flicks an ear, looks back. Small and restless, feet stay planted.

> **ARMED WALK-AWAY — 8 frames.** Exactly like the walk-away you already made —
> she starts front-on, turns over frames 1–4 until her back is fully to the camera,
> then walks away over frames 5–8 — but this time **with a sword sheathed across
> her back**, a plain straight blade in a dark scabbard. Keep her one size in every
> frame; do not draw her receding or shrinking.

### The effects sheets

> **EFFECTS for <attack name> — same frame count as the body sheet.** Only the
> glows: the claw arcs, impact flashes, sparks and dust, on a transparent
> background, positioned exactly where they sit relative to her in the body sheet,
> frame for frame. No character in this image at all. Bright cyan-white energy,
> matching the arcs in the sheet you already made.

**The heal FX sheet is the one that came back right, and it is worth knowing why:**
five separate glows, wide clear gaps between them, real alpha, each one a
complete self-contained bloom. It went into the game unaltered. The supercharge
FX sheet is the one that did not, and rule 5 above is exactly what it broke.

### Supercharge effects — RE-FIRE

The sheet delivered for this cannot be cut into frames. Measured rather than
judged: the engine's slicer finds **13 runs of energy where it needs 12 frames**,
and they are the wrong 13 — the first four are single dots a handful of pixels
across, and then a single run **726 pixels wide** holds four or five separate
slash arcs welded together with no gap between them. Loosening the slicer to
find those arcs individually gives 28 pieces, two of which are empty. There is no
setting that reads 12 frames out of it, because 12 frames are not what is in it.
Nothing is wrong with the drawing — the arcs are good. The layout is what failed.

> **EFFECTS for the SUPERCHARGE — exactly 12 frames, to match the 12-frame body
> sheet.** Only the energy: no character anywhere in the image. Transparent
> background, real alpha, frames left to right in play order.
>
> The critical part, and the reason I am asking again: **each of the 12 frames
> must be one separate island of energy with at least 40 transparent pixels of
> clear space on both sides of it, and nothing may cross that gap.** The last
> sheet drew the big arcs overlapping into each other in a continuous band, and
> the game cannot tell where one frame ends and the next begins — it reads the
> whole band as a single frame 726 pixels wide.
>
> **Give every frame the same width and the same spacing**, as if the image were
> ruled into 12 equal columns and each frame were drawn inside its own column
> without ever touching the column's edge. A frame with only a small spark in it
> still gets its own full column.
>
> The 12 beats, in order: a single spark at her claw; the spark doubling; three
> sparks orbiting; a thin arc forming; the arc brightening; energy gathering back
> along her forearm; the charge at full hold, crackling; the wind-up flare; the
> first slash arc thrown; the second slash crossing it; the pair blowing out at
> peak brightness; the energy tearing apart into fading embers.
>
> Bright cyan-white, the same energy as the arcs in the sheet you already made.

---

## 5. When a sheet comes back

Send me the PNG. It goes through:

```bash
node tools/sheetslice.cjs <sheet.png>              # finds frames, measures drift
node tools/movestrip.cjs  <cut> <strip.png> 320    # one scale, foot-aligned
node tools/stripcheck.cjs <strip.png> <cells>      # body mass, claws, facing
```

An EFFECTS sheet takes the other route, because none of the body measurements
mean anything on a glow and two of them actively damage it:

```bash
node tools/sheetslice.cjs <sheet.png> --fx --nosplit --cut <dir>
node tools/fxstrip.cjs    <dir> <strip.png> 256
node tools/towebp.cjs     <strip.png> assets/characters/hero/<name>.webp 0.9
```

`--fx` drops the frame-finding threshold to the noise floor: a body's edge is its
plating, but a glow fades out through alpha 1, 2, 3, 5, 8, and cutting at the
body threshold slices that falloff off both sides, so every frame ships with a
straight vertical edge where the light was still fading. `--nosplit` turns off
the bridged-frame splitter, whose "far wider than the median" test fires on the
PEAK of an effect and cuts the best frame in half. And `fxstrip` — rather than
`movestrip` — anchors on the light's centroid instead of her feet, and keeps each
plate's real size, because on an effect the growth IS the animation.

If a frame is flagged, only that frame needs redoing — ask GPT for that one frame
again rather than the whole sheet.
