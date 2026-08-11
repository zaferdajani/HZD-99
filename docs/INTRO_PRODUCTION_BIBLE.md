# CLAWBYTE — Intro Production Bible
**Handoff v2 · animated comic intro · 12 × 8s generated shots**

A city of machines runs on a single broadcast — the Mother's Song. Something outside
answers it, and the Song becomes a command: **OBEY**. Every machine hears. One
maintenance unit, never wired to the Song, wakes to a silent city.

---

## 1. The idea

CLAWBYTE is a hand-drawn 2D metroidvania about a small robot cat repairing a broken
world. It is not a game about killing things.

The premise is a broadcast. The Machine Depths — a vertical industrial kingdom — were
kept alive by one signal, sung by the machine at its heart. When that signal is
corrupted, every unit that was listening kneels. The great guardians hear it loudest
and fall hardest.

NYA-9 is a maintenance frame. She was never important enough to be wired into the Song,
which is exactly why the command finds nothing in her to hold. She wakes into a city
that has stopped, and she goes to give the Song back.

> **The central reversal, and the thing the intro must set up:** you never destroy a
> guardian — you destroy the virus inside it. Every boss you defeat is freed, purified,
> and becomes a friendly companion that lives on in its old arena. This is a rescue
> story wearing a boss-fight costume.

**Tone:** melancholy industrial awe with a warm centre. The world is vast, cold and
broken; she is small, round and stubbornly bright.

---

## 2. The story — five beats

Captions below are the shipped in-game text. Treat them as the locked narration script.

### I · The Song
> "KERNEL DEPTHS. A city of machines, run on one broadcast — the Mother's Song."
> "Every unit woke to it, worked to it, slept to it."
> "MOTHER-V, the broadcast heart. While she sang, the Depths were kind."

Establish scale and kindness. The city working in rhythm. The Song as a visible cyan
wave moving through the sky. Machine folk at their shift, lit warm. MOTHER-V serene.

### II · The Fall
> "Until something outside answered her Song."
> "Frequency by frequency, the signal turned."
> "The Song became a command: OBEY."

The corruption arrives from outside and enters her. **Never show what sent it.** The
waveform discolours ring by ring — cyan → violet → red. The city's windows open as red
eyes, one by one.

### III · The Guardians Kneel
> "The great guardians heard it loudest. They knelt first."

Four hard cuts, one per guardian, each in its kingdom and colour. Play it as tragedy,
not menace. They are being taken, not turning evil.

### IV · The One That Slept
> "Deep under the broadcast floor, one frame was never wired to the Song. A maintenance unit. A cat."
> "The command found nothing to hold. Her frequency was her own."
> "NYA-9 woke to a silent city — and went to give the Song back."

Intimate scale. A maintenance bay, hanging cables, one cyan worklight. She is on standby
in a cradle. The command sweeps the room and passes through her. Her visor boots — a
single cyan band lighting left to right. She stands.

### V · Title
Black. Drifting starfield. The logotype resolves with a one-frame chromatic tear (violet
ghost offset ~2px) every couple of seconds — the virus is still in the signal.

---

## 3. The cast

### NYA-9 — protagonist, maintenance frame
Small, round, ceramic-shelled robot cat. Built for repair, not war. Always the warmest,
most saturated thing on screen.

| | |
|---|---|
| Palette | shell `#FFFFFF` · visor `#37FFD0` · scarf `#E63946` · shadow `#9DAABD` |
| Silhouette | Chubby, low centre of gravity, oversized head, two tall antenna ears. Readable at 24px tall. |
| Face | **No eyes, no mouth.** A single horizontal LED visor band does all the acting — narrows, tilts, scans, flickers on damage. Never draw a face on her. |
| Motion | Ears trail on a spring; 4-segment crimson scarf and 3-segment tail whip with inertia. Landings squash → overshoot → settle. Jumps have a 1-frame anticipation coil. |
| Kit | Volt-blade, thrown shuriken, retractable claws — and the Rustsong Keytar, which plays the Song. The keytar is the story's real weapon. |
| Voice | No dialogue, ever. Visor, ears and posture only. |

### MOTHER-V — the Null Core, the broadcast heart
Not a villain — a victim, and the final act. A vast suspended core ringed with eight
plates that open and close like a heartbeat, a halo above, tendrils below. Serene and
luminous while she sings; torn, arrhythmic and violet-red once the signal turns.
Everything about her is a heartbeat — lub-dub ~0.9 Hz calm, racing toward 1.8 Hz failing.
Palette: whole `#37FFD0` · null `#B48CFF` · command `#E63946`.

### The Four Guardians — victims, not monsters
Each rules one kingdom, sleeps in it, and is woken by her arrival. Real animal forms in
industrial machinery, with the virus visible as glowing veins through the plating. When
freed those veins turn clean teal and the animal becomes a pet.

- **NULLFANG, the Virus Beast** — mechanical lion, violet virus veins, heavy mane of
  plates. Sleeps belly-down, head on his forepaws. Wakes head-first: the eye finds you
  before the body moves.
- **TALONHOST, the Iron Eagle** — hangs from a ceiling cable mount on a damped pendulum,
  metal feathers as projectiles, red chest core.
- **FURNACE CHOIR, the Atlas** — corrupted mecha dragon who sleeps curled in a nest of
  slag and bent girders on a high roost, wings folded over his back. Roars a foundry
  horn and comes down on the wing to the arena floor.
- **GLACIERE, the Frozen Purifier** — corrupted unicorn that floats rather than walks;
  void-purple mane tendrils, crystal tail fan, spiral horn that charges her void lance.
  Sleeps standing over a pool of ground frost.
- **The Prism Prowler** (secret fifth) — faceted crystal cat on a rotating turntable
  disc. Before it fights, it grooms and sits like an ordinary house cat.

### The Machine Folk — survivors
Six named units who did not fall; each a distinct volumetric silhouette with exactly one
emissive accent. They give the world its warmth in beat I.

- **Old Servo** — the mentor; worn sphere on treads, dented by thirty years of service.
- **Ratchet** — the trader; a scrap-heap Hermes whose silhouette *is* his shop.
- **Mono** — the oracle; a CRT face on a shroud of dead cables.
- **The Nine-Lives Sage** — a porcelain orb inside slowly turning rings, on its ninth life.
- **Patch-7** — the tinker; copper dome, mismatched goggles, a torch for an arm.
- **Lumen** — the lost one; a small light wrapped in leaves, glows harder when frightened.

---

## 4. The world — six kingdoms

Locked palettes, taken from the shipped build.

| Kingdom | Guardian | Key colour | Character |
|---|---|---|---|
| Scrap Meadows | NULLFANG | `#37FFD0` | Yards where the dead machines were laid out in rows |
| Data Conduits | TALONHOST | `#4DB8FF` | Cable canyons and hanging mounts |
| The Foundry | FURNACE CHOIR | `#FF9430` | Ladles tipping in the dark; molten iron falling continuously |
| Frozen Archives | GLACIERE | `#9FE8FF` | Racks of frozen memory under ice falls |
| The Virus Nest | MOTHER-V | `#D94AFF` | Where the signal comes from; violet flesh over machinery |
| Crystal Cache | Prism Prowler | `#FF5EC8` | A hidden seam of crystal at the far end of the Conduits |

---

## 5. Visual law — non-negotiable

1. **The colour law.** Cyan belongs to NYA-9 and clean machines. Red belongs to the
   infection. Violet belongs to the null signal. Gold is brief power. Nothing else glows.
2. **The turn law.** Nothing flips like a paper doll. A creature turning passes through
   real intermediate views, flexing thin at the crossing frame, crouching into its feet
   and kicking dust.
3. **The tell law.** Every attack has wind-up → commit → active. The audience must always
   see a blow coming.
4. **Visual hurtboxes.** The body you see is the body you can hit. Silhouette is truth.
5. **Authored art is ground truth.** Where a painted sheet exists, its pixels are used
   verbatim and rigged — never redrawn.

---

## 6. The prompt sheet — 12 shots × 8 seconds

This intro is **not** a continuous cinematic. It is **twelve independent eight-second
clips**, generated one at a time in Higgsfield and cut together in order — an animated
comic, not a film.

Each prompt below is complete and paste-ready. They are self-contained because the
generator has no memory between clips: **every character description is repeated in full
in every shot that character appears in.** Do not shorten to "the cat" or "the lion" —
that is what makes a character drift between shots.

### House style — already inside every prompt below

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake
```

### Negative prompt — paste into every generation

```
photorealistic, 3D render, live action, CGI, text, letters, captions, subtitles, watermark, logo, UI, HUD, game footage, human face on the cat, eyes on the cat, mouth on the cat, realistic fur, anime girl, gore, blood, jump cuts, flickering, morphing, distorted anatomy, extra limbs
```

### Character anchors — reuse this exact wording every time

| Character | Anchor text |
|---|---|
| NYA-9 | NYA-9, a small chubby cartoon robot cat with a glossy white ceramic shell, an oversized round head, two tall pointed antenna ears, and NO eyes and NO mouth — instead a single glowing cyan horizontal LED visor band across her face — with a long crimson red scarf trailing behind her |
| MOTHER-V | MOTHER-V, a colossal suspended machine core: a huge glowing sphere ringed by eight thick metal plates that open and close like a heartbeat, a floating halo ring above it, long cables hanging below |
| NULLFANG | NULLFANG, a massive mechanical lion built from dark scratched steel plates with a heavy mane of angular metal shards and glowing violet veins threaded through its body |
| TALONHOST | TALONHOST, a giant mechanical eagle of riveted iron with bladed metal feathers and a glowing red core in its chest, hanging from a heavy industrial cable |
| FURNACE CHOIR | FURNACE CHOIR, an enormous mechanical dragon of blackened iron with molten orange glowing seams between its armour plates and tattered metal wings |
| GLACIERE | GLACIERE, a mechanical unicorn of pale blue-white armour plates with a long spiral horn, a flowing mane of dark violet tendrils and a fan of ice crystals for a tail, floating above the ground |

> The cat has **no eyes and no mouth**. Every generator will try to give her a face —
> which is why it is stated twice in her anchor and again in the negative prompt. Check
> every clip and regenerate if a face appears.

---

### Shot 01 · Beat I · The city that runs on a song — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. Wide establishing shot of a vast vertical city of machines in a dark industrial canyon — rusted towers, catwalks, hanging chains, tiny lit windows. A luminous cyan sound wave ripples slowly across the sky above the city, with faint glowing musical notes riding along it. Warm amber work-lights glow in the depths. Slow push in toward the city. Cool teal and soot-grey palette with cyan light as the only bright colour. Awed, melancholy, peaceful.
```

*Why this shot:* Opens on scale and on the Song. The wave must read as a physical object in the air, not a filter.

### Shot 02 · Beat I · The machine folk keep time — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. Medium shot inside a warm workshop bay: three friendly cartoon robots working in rhythm — a worn round robot on tank treads, a stocky robot trader surrounded by hanging salvage, and a tall thin robot with an old CRT monitor for a face. Conveyor belts and pistons move in time with a pulse. Cyan light pulses gently across all of them in unison, like a heartbeat they share. Gentle handheld drift, no cuts. Warm amber and soot with cyan pulses. Cosy, alive, ordinary.
```

*Why this shot:* Buys affection for the world before it breaks. Everything moves on the same beat.

### Shot 03 · Beat I · The heart, singing — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. Low angle hero shot of MOTHER-V, a colossal suspended machine core: a huge glowing sphere ringed by eight thick metal plates that open and close like a heartbeat, a floating halo ring above it, long cables hanging below, suspended in a cathedral-sized dark chamber. She is serene and radiant; her plates breathe open and closed slowly like a calm heartbeat, and rings of soft cyan light expand outward from her core and drift up out of frame. Glowing motes rise around her. Very slow upward tilt. Deep blue-black chamber, cyan light. Reverent, maternal, beautiful.
```

*Why this shot:* She must be beautiful here. The audience has to lose something in the next shot.

### Shot 04 · Beat II · Something answers — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. Abstract shot of a glowing cyan sound wave travelling through darkness. A second wave arrives from off-screen and cuts across it. Where they touch, the cyan curdles into violet and then into hard red, spreading along the wave like ink in water. The clean sine shape breaks into a jagged, spiking, glitching signal. Static and torn horizontal scan-lines flicker across frame. Locked-off camera, no movement. Black background, cyan turning violet turning red. Wrong, invasive, dreadful.
```

*Why this shot:* The inciting incident with no characters at all. Never show the source of the second wave.

### Shot 05 · Beat II · The heart is taken — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. Same colossal machine core as before, MOTHER-V, a colossal suspended machine core: a huge glowing sphere ringed by eight thick metal plates that open and close like a heartbeat, a floating halo ring above it, long cables hanging below, but now violently corrupted: her eight plates snap open out of rhythm, violet-red light burns through the seams, dark tendrils of corruption crawl up her cables, and her calm halo ring flickers and tilts. She convulses once, hard. Glitch bars tear horizontally across the image. Slow push in on her core. Violet and blood red replacing cyan. Violation, grief, horror.
```

*Why this shot:* The most important shot in the film. Something happening TO her, not something she becomes.

### Shot 06 · Beat II · OBEY — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. Wide shot of the machine city at night, seen from a distance. One by one, in a slow spreading constellation, thousands of tiny windows and machine eyes flick from soft cyan to burning red across the whole city, until the entire skyline is red. Chains sway to a stop. Everything that was moving stops moving. Very slow pull back. Black silhouettes and red points of light. Cold, total, obedient.
```

*Why this shot:* The takeover at city scale. The stopping matters as much as the colour change.

### Shot 07 · Beat III · The lion kneels — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. NULLFANG, a massive mechanical lion built from dark scratched steel plates with a heavy mane of angular metal shards and glowing violet veins threaded through its body, standing in a junkyard of dead machines under a sick green-teal sky. The red command signal washes over him; he shudders, his head drops, and he sinks heavily to his knees as the violet veins in his body flare bright. His eye ignites red. Slow low-angle push in on his face. Teal and soot with violet and red glow. Tragic, not menacing — like watching a great animal be broken.
```

*Why this shot:* Sets the rule for the guardian beats: taken, not turned evil.

### Shot 08 · Beat III · The dragon kneels — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. FURNACE CHOIR, an enormous mechanical dragon of blackened iron with molten orange glowing seams between its armour plates and tattered metal wings, curled in an enormous foundry hall with rivers of molten metal pouring in the background. The red signal reaches him; his wings snap open, he throws his head back and roars, and then his head sinks as the molten seams across his body flare from orange to angry red. Embers rise. Slow lateral track across his body. Ember orange and soot black turning red. Enormous, sorrowful, final.
```

*Why this shot:* The biggest silhouette in the film. Let his scale land before he falls.

### Shot 09 · Beat IV · The one they forgot — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. Quiet dark maintenance bay far below the city — hanging cables, dripping pipes, one narrow cyan work-light from above. NYA-9, a small chubby cartoon robot cat with a glossy white ceramic shell, an oversized round head, two tall pointed antenna ears, and NO eyes and NO mouth — instead a single glowing cyan horizontal LED visor band across her face — with a long crimson red scarf trailing behind her lies curled and switched off in a cradle basket, her visor dark, her scarf hanging still. Dust drifts through the light beam. The red command signal sweeps through the room like a wave and passes straight through her without touching her. Slow push in on the sleeping cat. Near-black with one cyan shaft. Intimate, tender, hushed.
```

*Why this shot:* Smallest scale in the film. She is the only thing the command cannot hold.

### Shot 10 · Beat IV · The visor lights — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. Extreme close-up on the face of NYA-9, a small chubby cartoon robot cat with a glossy white ceramic shell, an oversized round head, two tall pointed antenna ears, and NO eyes and NO mouth — instead a single glowing cyan horizontal LED visor band across her face — with a long crimson red scarf trailing behind her. Her dark visor band flickers, then a single line of cyan light ignites and spreads left to right across it until the whole band glows. Her two antenna ears twitch and lift alert. The cyan light spills down onto her crimson scarf below. Locked-off close-up, no camera move. Near-black with one growing cyan light. Hopeful, quiet, the first warm moment since shot 3.
```

*Why this shot:* The turn of the whole film, told with one light and two ears.

### Shot 11 · Beat IV · She goes — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. NYA-9, a small chubby cartoon robot cat with a glossy white ceramic shell, an oversized round head, two tall pointed antenna ears, and NO eyes and NO mouth — instead a single glowing cyan horizontal LED visor band across her face — with a long crimson red scarf trailing behind her stands small in the foreground silhouette, back to camera, looking out through a broken grate at the vast red-lit machine city below. Her scarf lifts and ripples in the draught. She steps forward off the ledge into the light. Slow pull back to reveal how enormous the city is compared to her. Black silhouette against deep red, with her cyan visor glow as the only cool colour. Resolute, tiny against the world, brave.
```

*Why this shot:* The scale contrast that defines the game: very small, going anyway.

### Shot 12 · Beat V · Title — 8s

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, cinematic composition, smooth cartoon animation, no camera shake. Slow drift through black empty space with faint drifting dust motes and a distant dark city skyline barely visible below. A single cyan sound wave pulses across the frame once and fades. Empty centre composition with generous space for a title to be added later. Locked-off, very slow drift. Pure black with cyan. Still, expectant, the held breath before the game begins.
```

*Why this shot:* Deliberately empty in the middle — the logotype is composited on afterwards.

---

### Assembly

| Run | Shots | Length | Cut on |
|---|---|---|---|
| Beat I | 01 – 03 | 0:00 – 0:24 | Hold each full 8s. Let the world breathe. |
| Beat II | 04 – 06 | 0:24 – 0:48 | Trim 04 and 05 to ~6s each for a harder turn. |
| Beat III | 07 – 08 | 0:48 – 1:04 | Straight cuts, no dissolves. |
| Beat IV | 09 – 11 | 1:04 – 1:28 | Shot 10 is the one to hold longest. |
| Beat V | 12 | 1:28 – 1:36 | Logotype composited on in post. |

Runs about **1:36** uncut, trims comfortably to **1:15**. If it must be shorter, drop
shot 02 and shot 08 — the story still holds.

### Working method

- Generate 3–4 takes of every shot and pick; these models vary a lot per seed.
- Keep the same seed family across a beat for consistent grain and palette.
- Generate shots 03 and 05 back to back so MOTHER-V matches herself.
- Add all text, captions and the logotype in post, never in the prompt.
- Grade the finished cut once, at the end, so twelve clips become one film.

### Reject a take if

- The cat has eyes, a mouth, or a visible face.
- Her scarf is any colour but crimson red, or her visor any colour but cyan.
- A guardian looks aggressive or villainous rather than overwhelmed.
- The camera whips, shakes, or cuts inside the clip.
- Any colour appears outside the law in section 5.

> **Hard constraint: the intro must not spoil the purification.** The audience should
> believe she is going to war. That the guardians can be saved is the discovery the game
> gives them later.

---

## 7. Sound

The Song is the score. Build the whole piece from one melodic idea — a simple, warm,
almost lullaby phrase — then **corrupt that same phrase** rather than replacing it.

- **I** — the phrase, clean, on something with breath in it. Machinery in rhythm
  underneath: presses, conveyors, servos as percussion.
- **II** — the phrase detunes and stutters. A low sub arrives. The rhythm falls out of
  time, then locks into something mechanical and wrong.
- **III** — four short stabs, one per guardian: sub-growl, metal screech, foundry horn,
  crystalline shriek.
- **IV** — near silence. Room tone, a dripping pipe, one servo. The phrase returns as a
  single music-box note when her visor lights.
- **V** — the phrase, whole again, arranged with weight.

The game's own SFX vocabulary is synthesized and dry: square-wave jumps, filtered noise
whooshes, sub-heavy impacts. Score richer if you like, but keep impacts dry and close.

---

## 8. Delivery

| Item | Spec |
|---|---|
| Clip length | 8 seconds each, 12 clips — generated independently |
| Aspect | 16:9 — the game renders 960 × 540 and scales up |
| Generation res | Highest the model offers; upscale to 1920 × 1080 in post |
| Frame rate | Whatever the model outputs; conform the edit to 24 fps |
| Final deliverable | 1920 × 1080 H.264 ≤ 8 Mbps + 1280 × 720 fallback |
| Safe area | Title and text inside 90% — the game letterboxes on phones |
| Audio | Added in post, not generated. 48 kHz stereo + stems |
| Also needed | The 12 raw clips unedited, and one still frame per beat for store art |
| Skippable | Must survive being cut at any second — no shot may depend on the one after it |

**Reference material available:** the full character sheets used in the build (lion,
eagle, dragon, unicorn, crystal cat), platform and environment paintings, and a playable
link to the current build.

Playable build: https://zaferdajani.github.io/odyssey/
