# CLAWBYTE — Intro Production Bible
**Handoff v1 · for the studio producing the animated intro**

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

## 6. The brief

Deliver a **60–90 second** animated intro that plays before the title screen, telling
beats I–V with far more craft than the engine can render in real time. The in-engine
comic stays as the skippable fallback. It should feel like the opening of an animated
feature, not a game trailer: no gameplay footage, no UI, no voice-over unless a single line.

| Beat | Working length | Dominant colour | Emotional job |
|---|---|---|---|
| I · The Song | 0:00–0:22 | Cyan on warm grey | Awe, then affection |
| II · The Fall | 0:22–0:40 | Cyan → violet → red | Violation |
| III · The Guardians | 0:40–0:56 | One per kingdom | Scale and loss |
| IV · The One That Slept | 0:56–1:18 | Dark, one cyan light | Intimacy, then resolve |
| V · Title | 1:18–1:30 | Black + cyan | Arrival |

**Do:** keep her silent and let the visor act · treat the guardians as tragic · use scale
contrast constantly · let the Song be a visible physical thing · hold shots.

**Don't:** give her eyes, a mouth or a voice · show what sent the signal · add colours
outside the law · use gameplay capture or HUD · make it a fast-cut action montage.

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
| Native canvas | 960 × 540 · 16:9 (the game renders at this and scales up) |
| Master | 3840 × 2160 · 16:9 · ProRes 4444 |
| Web deliverable | 1920 × 1080 H.264 + 1280 × 720 fallback, ≤ 8 Mbps |
| Frame rate | 24 fps (preferred) or 30 fps |
| Safe area | Title and text inside 90% — the game letterboxes on phones |
| Audio | 48 kHz stereo master + stems (music / FX / ambience) |
| Also needed | Title card as a still PNG, and 5 key frames (one per beat) for store art |
| Skippable | Must survive being cut at any second — no beat may depend on the one after it |

**Reference material available:** the full character sheets used in the build (lion,
eagle, dragon, unicorn, crystal cat), platform and environment paintings, and a playable
link to the current build.

Playable build: https://zaferdajani.github.io/odyssey/
