# CLAWBYTE — Intro Production Bible
**Handoff v4 · animated comic intro · 16 × 8s wordless story shots**

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

HZD-99 is a maintenance frame. She was never important enough to be wired into the Song,
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
> "HZD-99 woke to a silent city — and went to give the Song back."

Intimate scale. A maintenance bay, hanging cables, one cyan worklight. She is on standby
in a cradle. The command sweeps the room and passes through her. Her visor boots — a
single cyan band lighting left to right. She stands.

### V · Title
Black. Drifting starfield. The logotype resolves with a one-frame chromatic tear (violet
ghost offset ~2px) every couple of seconds — the virus is still in the signal.

---

## 3. The cast

### HZD-99 — protagonist, maintenance frame
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

1. **The colour law.** Cyan belongs to HZD-99 and clean machines. Red belongs to the
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

## 6. The prompt sheet — 16 shots × 8 seconds

This is an **origin story, not an action sequence**, and it is told with **no words on
screen at all** — the pictures carry it.

The film shows how it all started: the city alive on the Song, the corrupting signal
arriving from outside, the heart being taken, the virus racing out through the cables,
and then the moment that matters most — *innocent machines in the middle of playing being
turned into hostile ones*, eyes going from warm cyan to burning red and violet. Then the
guardians. Then the one small unit who slept through it all and woke up.

Sixteen independent eight-second clips, generated one at a time and cut together in order.
Every character description is repeated in full in every prompt, because the generator has
no memory between clips.

> **Two rules that are why a first attempt can come back as a generic fight scene:** every
> prompt opens with *"Story panel, no combat, no text anywhere"*, and the negative prompt
> bans both fighting and lettering. If a clip comes back with the cat battling something,
> it is wrong — regenerate it.

### House style — already inside every prompt below

```
2D animated motion comic, bold black ink outlines, flat cel shading, visible halftone dot texture, gritty industrial comic-book art, desaturated palette with a single glowing accent colour, smooth cartoon animation, slow deliberate camera, no camera shake
```

### Negative prompt — paste into every generation

```
text, letters, words, captions, subtitles, watermark, logo, signage, fighting, combat, battle, action scene, boss fight, weapons clashing, punching, explosions, chase, photorealistic, 3D render, live action, CGI, UI, HUD, game footage, human face on the cat, eyes on the cat, mouth on the cat, realistic fur, anime girl, gore, blood, jump cuts, fast cutting, flickering, morphing, distorted anatomy, extra limbs
```

### The infection look — the visual that tells the whole story

Every machine that falls goes through the same four visible changes. This phrasing is
already built into the shots that need it; keep it identical everywhere so the audience
learns to read it instantly.

```
glowing magenta-purple cracks spread across their metal casings like veins under skin, their friendly cyan eye-lights flicker, die, and reignite as burning red glowing eyes rimmed in violet, their soft rounded posture goes rigid and hunched, and their movements turn stiff, jerky and predatory
```

**Read as:** purple veins spread → the friendly cyan eye dies → it relights burning red
rimmed in violet → the soft round body goes rigid, hunched and predatory. Innocent to
evil, in one continuous move, without a single word.

### Character anchors — reuse this exact wording every time

| Character | Anchor text |
|---|---|
| HZD-99 | HZD-99, a small chubby cartoon robot cat with a glossy white ceramic shell, an oversized round head, two tall pointed antenna ears, and NO eyes and NO mouth — instead a single glowing cyan horizontal LED visor band across her face — with a long crimson red scarf |
| MOTHER-V | MOTHER-V, a colossal suspended machine core: a huge glowing sphere ringed by eight thick metal plates that open and close like a heartbeat, a floating halo ring above it, long cables hanging below |
| The machine folk | three friendly cartoon robots — a small round robot on tank treads with a single warm cyan eye-light, a stocky robot trader hung with salvage, and a tall thin robot with an old CRT monitor for a face |
| NULLFANG | NULLFANG, a massive mechanical lion built from dark scratched steel plates with a heavy mane of angular metal shards |
| FURNACE CHOIR | FURNACE CHOIR, an enormous mechanical dragon of blackened iron with molten orange glowing seams between its armour plates and tattered metal wings |

> The cat has **no eyes and no mouth**, and she is the **only machine in the film that
> never turns red**. Her cyan stays clean from the first frame to the last. That is how
> the audience knows she is the one.

---

### Shot 01 · A city alive — 8s

```
Story panel, no combat, no text anywhere. Wide establishing shot of a vast vertical city of machines in a dark industrial canyon — rusted towers, catwalks, hanging chains, thousands of tiny windows glowing warm cyan. A luminous cyan sound wave ripples slowly across the sky above the whole city and every light pulses gently in time with it. Slow push in. Cool teal and soot-grey with cyan as the only bright colour. Peaceful, vast, alive.
```

### Shot 02 · Innocent, and having fun — 8s

```
Story panel, no combat, no text anywhere. Warm workshop bay full of light. three friendly cartoon robots — a small round robot on tank treads with a single warm cyan eye-light, a stocky robot trader hung with salvage, and a tall thin robot with an old CRT monitor for a face. They are playing, not working: the small round robot spins in a happy circle on its treads, the stocky trader tosses a scrap bolt up and catches it, the tall thin robot's CRT screen shows a bouncing smiling wave. Their cyan eye-lights are soft and warm and they bob gently in rhythm together. Gentle slow drift. Warm amber and soot with soft cyan. Innocent, playful, cosy.
```

### Shot 03 · The heart that sang — 8s

```
Story panel, no combat, no text anywhere. Low angle shot of MOTHER-V, a colossal suspended machine core: a huge glowing sphere ringed by eight thick metal plates that open and close like a heartbeat, a floating halo ring above it, long cables hanging below, suspended alone in a cathedral-sized dark chamber, serene and radiant. Her plates breathe slowly open and closed and wide rings of soft cyan light expand outward from her core and drift up out of frame. Glowing motes rise around her. Very slow upward tilt. Deep blue-black with cyan light. Reverent, maternal, beautiful.
```

### Shot 04 · Something reaches in — 8s

```
Story panel, no combat, no characters, no text anywhere. Looking straight up from deep inside the machine city toward a small opening far above. A thin sickly violet-red beam of corrupted signal descends slowly out of the blackness from outside the city, threading down between the towers like a needle going into a body. Every cyan light it passes flickers and dims behind it. Slow tilt following the beam down. Near-black with one violet-red intruding line. Ominous, invasive, wrong.
```

### Shot 05 · It goes inside her — 8s

```
Story panel, no combat, no text anywhere. MOTHER-V, a colossal suspended machine core: a huge glowing sphere ringed by eight thick metal plates that open and close like a heartbeat, a floating halo ring above it, long cables hanging below, still serene in her dark chamber, as the thin violet-red beam arrives from above and sinks into her glowing core. Where it touches, her calm cyan light curdles to violet, and glowing purple veins begin crawling outward across her metal plates like infection spreading under skin. She has not moved yet. Slow push in on the point of contact. Cyan being overtaken by violet. Dreadful, intimate, violating.
```

### Shot 06 · The song turns — 8s

```
Story panel, no combat, no text anywhere. Close on MOTHER-V, a colossal suspended machine core: a huge glowing sphere ringed by eight thick metal plates that open and close like a heartbeat, a floating halo ring above it, long cables hanging below, now fully corrupted: her eight plates snap open out of rhythm, violet-red light burns through every seam, purple veins cover her whole surface, her halo ring tilts and flickers red, and she convulses once. A hard red shockwave ring bursts out of her core and races away in every direction. Horizontal glitch bars tear across the image. Locked-off camera. Violet and blood red where cyan used to be. Grief, horror, force.
```

### Shot 07 · It runs through everything — 8s

```
Story panel, no combat, no characters, no text anywhere. Close tracking shot travelling fast along thick industrial cables and pipes through a dark machine corridor. A surge of corrupted red-violet light races along the cables from behind the camera and overtakes it, splitting at every junction and branching off down side conduits, spreading like a virus through veins. Every cyan light it reaches snaps to red behind it. Fast smooth forward tracking. Black metal with a red-violet surge. Relentless, spreading, unstoppable.
```

### Shot 08 · Innocence taken — 8s

```
Story panel, no combat, no text anywhere. The same warm workshop bay and the same three friendly cartoon robots — a small round robot on tank treads with a single warm cyan eye-light, a stocky robot trader hung with salvage, and a tall thin robot with an old CRT monitor for a face, still mid-play — the round robot spinning, the trader's bolt in the air. The red-violet corrupted light floods in and washes over all three. As it hits them, glowing magenta-purple cracks spread across their metal casings like veins under skin, their friendly cyan eye-lights flicker, die, and reignite as burning red glowing eyes rimmed in violet, their soft rounded posture goes rigid and hunched, and their movements turn stiff, jerky and predatory. The tossed bolt clatters to the floor, forgotten. Slow push in. Warm amber draining to cold red and purple. Heartbreaking, eerie, wrong.
```

### Shot 09 · The eye — 8s

```
Story panel, no combat, no text anywhere. Extreme close-up on the single round eye-light of the small cartoon robot on tank treads, still glowing warm and friendly cyan. Corruption arrives: the light stutters, flickers, drains to black for a beat — then reignites as a burning red glowing eye ringed with violet, its pupil narrowing to a hard hostile point. Glowing magenta-purple cracks creep across the white metal of its face around the eye. Locked-off macro shot, no camera move. Cyan to black to red and violet. Chilling, intimate, final.
```

### Shot 10 · The lion — 8s

```
Story panel, no combat, no text anywhere. NULLFANG, a massive mechanical lion built from dark scratched steel plates with a heavy mane of angular metal shards, standing calm in a junkyard of dead machines under a sick green-teal sky. The red-violet corrupted light washes over him. Glowing violet veins ignite and spread through every seam of his body, his eyes flare burning red rimmed with purple, his head drops and he sinks heavily to his knees — then rises again slowly with his head low, shoulders hunched and mane bristling, changed and hostile. He does not attack anything. Slow low-angle push in on his face. Teal and soot with violet and red glow. Tragic, then frightening.
```

### Shot 11 · The dragon — 8s

```
Story panel, no combat, no text anywhere. FURNACE CHOIR, an enormous mechanical dragon of blackened iron with molten orange glowing seams between its armour plates and tattered metal wings, curled peacefully in an enormous foundry hall with rivers of molten metal pouring in the background. The red-violet corrupted light reaches him. The warm orange seams across his armour flare and shift to angry red shot through with violet, glowing purple veins crawl up his neck, his eyes ignite burning red, and his wings snap open rigid as his head lowers into a hostile posture. He does not attack anything. Slow lateral track across his body. Ember orange turning red-violet. Enormous, sorrowful, then menacing.
```

### Shot 12 · A city of red eyes — 8s

```
Story panel, no combat, no text anywhere. Very wide shot of the whole machine city at night from far away. Every window and machine eye that was warm cyan is now a burning red point rimmed in violet, thousands of them staring outward. Every chain, wheel and conveyor has stopped moving. Nothing moves except drifting dust. Very slow pull back. Black silhouettes with red and violet points of light. Cold, hostile, dead.
```

### Shot 13 · The one it missed — 8s

```
Story panel, no combat, no text anywhere. Quiet dark maintenance bay far below the city — hanging cables, dripping pipes, one narrow cyan work-light from above. HZD-99, a small chubby cartoon robot cat with a glossy white ceramic shell, an oversized round head, two tall pointed antenna ears, and NO eyes and NO mouth — instead a single glowing cyan horizontal LED visor band across her face — with a long crimson red scarf lies curled up asleep and switched off in a cradle basket, her visor dark, her scarf hanging still. Dust drifts through the light beam. The red-violet corrupted wave sweeps through the room and passes straight through her without touching her, leaving her white shell completely clean and uninfected. Slow push in on the sleeping cat. Near-black with one cyan shaft. Tender, hushed, safe.
```

### Shot 14 · She wakes — 8s

```
Story panel, no combat, no text anywhere. Extreme close-up on the face of HZD-99, a small chubby cartoon robot cat with a glossy white ceramic shell, an oversized round head, two tall pointed antenna ears, and NO eyes and NO mouth — instead a single glowing cyan horizontal LED visor band across her face — with a long crimson red scarf, asleep with her visor band dark. The visor flickers, then a single line of cyan light ignites and spreads left to right across it until the whole band glows steadily and warm. Her two antenna ears twitch and lift alert. Cyan light spills down onto her crimson scarf. Locked-off close-up, no camera move. Near-black with one growing cyan light. Hopeful, quiet, the first warm moment since the fall.
```

### Shot 15 · She goes — 8s

```
Story panel, no combat, no text anywhere. HZD-99, a small chubby cartoon robot cat with a glossy white ceramic shell, an oversized round head, two tall pointed antenna ears, and NO eyes and NO mouth — instead a single glowing cyan horizontal LED visor band across her face — with a long crimson red scarf stands very small in the foreground, back to camera, on a ledge looking out over the vast dead city below where thousands of red and violet eyes stare back. Her scarf lifts and ripples in the draught. She takes one step forward. Slow pull back to reveal how enormous the city is compared to her tiny figure. Black silhouette against deep red, her cyan visor glow the only clean colour left in the world. Resolute, tiny, brave.
```

### Shot 16 · Title plate — 8s

```
Story panel, no text anywhere. Slow drift through black empty space with faint drifting dust motes and a distant dark city skyline barely visible below. A single cyan sound wave pulses across the frame once and fades. Completely empty centre composition with generous clear space. Locked-off, very slow drift. Pure black with cyan. Still, expectant.
```

---

### Assembly

| Run | Shots | Length | What the pictures say |
|---|---|---|---|
| The world before | 01 – 03 | 0:00 – 0:24 | A city alive and playful, running on one song |
| The infection | 04 – 07 | 0:24 – 0:56 | A signal comes in from outside, takes the heart, and spreads |
| Innocence taken | 08 – 09 | 0:56 – 1:12 | The same happy robots turned hostile, and one eye in close-up |
| The great ones | 10 – 12 | 1:12 – 1:36 | The guardians turn, and the whole city goes red |
| The one who slept | 13 – 15 | 1:36 – 2:00 | She is missed, she wakes, she goes |
| Title | 16 | 2:00 – 2:08 | Logotype composited on in post |

Runs about **2:08**. To shorten, cut shot 11 and shot 12 first. **Never cut 02, 08 or 09**
— the before, the turn and the eye are the whole point. Without them there is no story,
only atmosphere.

### Working method

- Generate **02 and 08 back to back** — same bay, same three robots, before and after.
  This pair is the film.
- Generate 03, 05 and 06 back to back so MOTHER-V matches herself.
- Attach the matching character plate from `docs/reference/` to every generation.
- Generate 3–4 takes per shot; these models vary a lot per seed.
- Grade the finished cut once at the end so sixteen clips become one film.

### Reject a take if

- Anyone is fighting, chasing or attacking. There is no combat in this film.
- Any lettering appears anywhere in frame.
- The infected eyes are not **red rimmed in violet**, or the veins are not purple.
- The cat appears before shot 13, is awake before shot 14, or ever turns red.
- The cat has eyes, a mouth, or a visible face.

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
| Clip length | 8 seconds each, 16 clips — generated independently |
| Aspect | 16:9 — the game renders 960 × 540 and scales up |
| Generation res | Highest the model offers; upscale to 1920 × 1080 in post |
| Frame rate | Whatever the model outputs; conform the edit to 24 fps |
| Final deliverable | 1920 × 1080 H.264 ≤ 8 Mbps + 1280 × 720 fallback |
| Safe area | Title and text inside 90% — the game letterboxes on phones |
| Audio | Added in post, not generated. 48 kHz stereo + stems |
| Also needed | The 16 raw clips unedited, and one still frame per beat for store art |
| Skippable | Must survive being cut at any second — no shot may depend on the one after it |

**Reference material available:** the full character sheets used in the build (lion,
eagle, dragon, unicorn, crystal cat), platform and environment paintings, and a playable
link to the current build.

Playable build: https://zaferdajani.github.io/odyssey/
