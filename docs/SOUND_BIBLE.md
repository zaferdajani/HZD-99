# THE SOUND BIBLE

**For the owner to read and approve.** Every cue in the game: what makes it,
what it means, and the number that proves it is not the cue next to it.

Written 2026-08-24, after the owner's note: *"the audio effect is not connected
ideally with the moves it's doing. It needs better and more audios to make more
sense. And the long ya is appearing all the time even though without charging,
which was created for the charged hit."*

Numbers are measured from the shipped build, not described. **Bright** is
zero-crossings per second: low is heavy, high is sharp.

---

## 0. WHAT WAS WRONG, IN NUMBERS

Four cues carried **seventy-three call sites** between them.

| cue | played for | sites |
|---|---|---|
| `cast` | her claw arming, an EMP, a floor wave, a plume, a frost ring, a snare, ground spikes, six boss wind-ups, ice columns, a lash, a prison, Mother's Song, a beam warning | 26 |
| `shoot` | a turret bolt, a cinder, a plucked note, a quill volley, an ice shard, an orb, a lance, an eruption — and **twice for spawning a flier**, which is not a shot at all | 17 |
| `boom` | her burst paying off, three sizes of death, a pop, a shockwave, a landing, a **launch**, the ceiling shedding, a core cracking, a beam arriving | 17 |
| `tell` | every wind-up in the game, from a bat to a guardian | 13 |

`shoot` was one line: `tone(980, 0.1, 'square', 0.04, 340)`.

**And the long "ya" was `hzd_charge` — 1.60 seconds, the longest take she has,
twice the length of an ordinary attack bark.** It fired at 140 ms of hold,
which is earlier than the charge's own visible tell (the tick ladder and the
particles both start at 250 ms) and shorter than an ordinary tap. So a normal
attack started a 1.6-second held vowel for a burst that never happened — and it
never stopped when the button did, so it bled over the next two hits of the
string. That is why it seemed to be there all the time.

---

## 1. THE LAW

**A cue's job is to say WHAT JUST HAPPENED.** One sound for many events says
only "something", which is the one thing the player already knew.

Three rules follow. `tests/cuefamily.cjs` enforces all three:

1. **Renaming is not fixing.** Every cue is rendered offline and reduced to a
   fingerprint — duration, attack time, brightness, energy — and **all 496
   pairs must differ on a real axis**. A family of names that all sound alike
   passes a grep and fails here. It has already rejected five pairs that were
   one sound wearing two names.
2. **Build it from what the thing physically IS**, not from what would be
   striking. A lob has no crack in it because nothing cracks when you heave.
3. **The exception proves the rule.** The warnings are deliberately ONE sound
   at three sizes — §5.

---

## 2. HER — HZD-99

She is the only one making sounds on purpose. Hers must never be confusable
with something happening *to* her.

| cue | who / when | what it says | how it is built | length | bright |
|---|---|---|---|---|---|
| `atk` | HZD-99 | a claw swing — the blow is out | air, then servo, then three claw passes; a fourth when she puts both paws in | 0.15s | 4494 |
| `whiff` | HZD-99 | it hit nothing | the air without the shear — the absence IS the information | 0.1s | 6331 |
| `hit` | HZD-99 | that connected | a short bite with a bright edge on top | 0.07s | 1522 |
| `burstout` | HZD-99 | **you** did that | opens bright and RINGS rather than thudding: the payoff of a held note | 1.3s | 1097 |
| `chargedHit` | HZD-99 | and it landed | the burst with weight added under it | 0.4s | 11642 |
| `jump` | HZD-99 | she leaves the ground | a spring with her voice riding on it, not replacing it | 0.2s | 3687 |
| `djump` | HZD-99 | hardware, not muscle | the back thruster: shorter, harder, more machine | 0.25s | 5229 |
| `dash` | HZD-99 | committed | a push with almost no attack | 0.24s | 3122 |
| `land` | HZD-99 | grounded | soft, low, over in a moment | 0.22s | 2448 |
| `pogo` | HZD-99 | you may go again | a bounce, pitched up from the landing | 0.12s | 1325 |
| `hurt` | HZD-99 | that cost you | falling, with her voice under it | 0.34s | 1877 |
| `heal` | HZD-99 | you spent something for that | a rising figure that resolves | 0.55s | 1789 |
| `pick` | HZD-99 | yours now | two notes up, and nothing else | 0.27s | 4904 |
| `crystalSwirl` | HZD-99 | the blade is two now | a shimmer opening outward | 1.24s | 2352 |
| `crystalJoin` | HZD-99 | one weapon again | the same shimmer closing, with a strike at the end | 1.29s | 2385 |
| `chargeReady` | HZD-99 | it is ready when you are | a bright confirm above the ladder | 0.29s | 2507 |
| `no` | HZD-99 | not that, not now | deliberately dull — a refusal that sounds exciting is a promise | 0.15s | 193 |

### Her voice, and the take that was wrong

Her barks are **recordings, not synthesis** — from the daughter's voice
reference. The takes are yours to approve and the art session's to fire. What
is mine is *when* they play.

| take | length | fires when |
|---|---|---|
| `hzd_atk1` / `hzd_atk2` | 0.29s / 0.80s | ordinary hits, alternating; the third beat repeats the first a shade louder |
| `hzd_atk3` | 0.80s | **out of the normal rotation** — the big open throat belongs to the burst alone |
| `hzd_charge` | **1.60s** | the held note. It is a STATE: it starts at 300 ms of hold and **stops when you let go** |
| `hzd_release` | 1.00s | the shout the charge is spent on; the held note gives way to it rather than fighting it |
| `hzd_jump` / `hzd_dash` / `hzd_land` | 0.60 / 0.77 / 0.80s | riding on the synth, never replacing it |
| `hzd_hurt` / `hzd_hurtbad` | 0.80 / 0.39s | the second one when she is on her last core |
| `hzd_die` / `hzd_win` / `hzd_purr` | 1.40 / 1.24 / 1.17s | the moments the player is looking straight at her |

**The fix you asked for:** the charge note starts at 300 ms — after the visual
tell, far beyond any tap — and ends on release, fading rather than cutting,
because a voice stopped dead is a click. An **abandoned** charge ends its note
too, which is the common case, because that is every ordinary attack.

---

## 3. THINGS THAT ARE FIRED

Ten cues where there was one blip.

| cue | who / when | what it says | how it is built | length | bright |
|---|---|---|---|---|---|
| `shoot` | turrets, aimed fans | a bolt, aimed at you | a transient BEFORE a pitch — the difference between a shot and a beep | 0.11s | 1601 |
| `lob` | the Choir, mortars | it is going over you | heaved: sweeping up, dark, no crack anywhere in it | 0.47s | 613 |
| `cinder` | the Choir | a handful of fire | six crackles at uneven offsets — not one object | 0.23s | 7247 |
| `quill` | TALONHOST | a volley, fanning out | five staggered shears, so it reads as several things | 0.15s | 4888 |
| `shard` | GLACIERE | ice, and it is brittle | glassy, and it RINGS: a crystal is a tuned object | 0.58s | 6407 |
| `orbshot` | the orbiters | something alive let go | no attack at all — it does not leave, it departs | 0.37s | 868 |
| `ringshot` | the Choir, dormant bursts | going out in every direction | partials struck together, so the ear hears a circle | 0.33s | 1925 |
| `lance` | PRISM, GLACIERE | a spear, not five taps | the pitch climbs along the shaft as it extends | 0.14s | 7068 |
| `erupt` | MOTHER-V | it came out of the FLOOR | rupture first, then debris; the low end is the room, not a muzzle | 0.33s | 3309 |
| `summon` | TALONHOST brood call | a creature ARRIVED | wingbeats over a rising breath, and a call — **this used to fire the rifle** | 0.47s | 2132 |

---

## 4. THINGS THAT ARE GATHERED

A wind-up is the most information-dense sound in a fight: it is the only cue
that means *"it is about to"*, and **which** it is about to decides what you
do. Split by ELEMENT, because element is what the answer depends on.

| cue | who / when | what it says | how it is built | length | bright |
|---|---|---|---|---|---|
| `castfire` | the Foundry, the kiln | heat is coming | draws air IN before it lets go; no pitch at the top, because heat has no note | 0.58s | 2161 |
| `castice` | GLACIERE, the rime | frost is growing | up and thinning, tuned, and its loudest moment is LATE — it grows | 0.73s | 8739 |
| `castnull` | NULLFANG, MOTHER-V | something is being removed | a detuned pair beating 7 Hz apart, sliding DOWN | 0.69s | 440 |
| `castarc` | her gear, the arc spin | a machine is charging | a heavy low buzz with the ticks closing up | 0.53s | 1090 |
| `snarecast` | the snare | a line is going taut | all tension, and one hard stop when the slack runs out | 0.36s | 1263 |
| `plume` | the kiln | heat from BELOW | a body of air moving, low the whole way — not a jet | 0.61s | 210 |
| `spikeup` | the saw, the Choir | the ground is opening ahead of you | three arrivals walking outward | 0.29s | 2263 |
| `icecolumn` | GLACIERE | ice out of the floor | brittle, tuned, still ringing after it stops moving | 0.36s | 5234 |
| `lash` | MOTHER-V | a whip | all tip and nothing underneath | 0.21s | 4397 |
| `prison` | GLACIERE | you are being enclosed | four bars in sequence, then a lid — the sequence makes it enclosure | 1.47s | 334 |
| `msong` | MOTHER-V | she is SINGING | the only chord in the game: she is not making an effect | 1.13s | 741 |
| `beamwarn` | MOTHER-V | a line already points at you | a tone that does not move; the stillness is the threat | 0.73s | 4732 |

The four elements measure **fire 2167 · ice 8747 · null 382 · arc 1018** — a
twenty-fold spread, where the first pass had them crowded together and the
harness rejected them.

---

## 5. THINGS THAT LAND

Impacts are where a fight is legible or is not. The player has to know from the
sound alone whether that was their hit landing, something dying, or a ton of
machine arriving next to them.

| cue | who / when | what it says | how it is built | length | bright |
|---|---|---|---|---|---|
| `wreck` | any machine | it is dead | not an explosion, a FAILURE: casing goes, parts fall unevenly, something spins down | 0.45s | 4055 |
| `wreckbig` | mini-bosses, guardians | something big is dead | the same failure with more of it; debris keeps arriving | 0.77s | 3251 |
| `blast` | volatile enemies, molten waves | it popped, and it left something | sharp and wet; the tail is what is now on the floor | 0.34s | 12619 |
| `shockring` | sages, the Null Wave | it is expanding past you | falls in pitch as it widens — how a flat screen says "away from centre" | 0.58s | 777 |
| `slam` | guardians landing | a ton of machine is next to you | sub first, then the rattle of everything not bolted down | 0.38s | 895 |
| `quake` | phase changes, the ceiling | the ROOM | no attack worth the name: a quake is a condition, not an event | 1.01s | 2367 |
| `crack` | the Choir core | something structural failed | one report, then the fracture RUNNING through the material | 0.38s | 974 |
| `beamfire` | MOTHER-V | the line is live NOW | hard onset into tones that HOLD — the holding says it is still there | 0.61s | 5369 |
| `launch` | pounces | it is coming, fast | a shove against the ground: low end UP, grit thrown backwards. Never an impact. | 0.22s | 1381 |

**Her burst reads at 1095 against a guardian's death at 3163** — three times
apart, so the thing you did and the thing that happened to you cannot be
confused.

---

## 6. THE WARNING — ONE GESTURE, SEVEN VOICES

> **You ruled on this (2026-08-24): §10 should.** Each guardian now has its own
> tell. What follows is the original argument, kept because it was right about
> the part it was right about, and then what changed.

**This family was deliberately NOT split, and it was the decision in this
document I most wanted you to push back on.**

The other three were scattered because one cue for many events told you
nothing. This one is the opposite case. `tell` is the only cue in the game that
means *"it is about to"*, and its whole value is that it is **learned**: hear it
once, understand it forever, act on it without looking. Thirteen different
tells would have destroyed exactly the thing that makes it worth having, and
doing it for consistency with the other three would have been the wrong kind of
thorough.

So all three keep the **identical gesture** — a short RISING pair, rising
because that encodes *time remaining* rather than merely "something is
happening", pitched above the music bed so it survives a boss theme. What
changes is the **weight underneath**.

| cue | who | length | rises | weight |
|---|---|---|---|---|
| `tell` | crawlers, bats, fliers, turrets, hoppers, the kiln, the rime, the snare | 0.22s | x1.42 | 0.20 |
| `tellmid` | THE SAGES — hero-scale, her size | 0.29s | x1.42 | 0.37 |
| `tellbig` | every guardian | 0.40s | x1.50 | **4.37** |

A guardian arrives with **twenty times** the body of a machine's twitch, while
speaking the same sentence. Its sub arrives *before* the pair, so you feel one
decide before you hear it.

### 6b. AND THEN EACH GUARDIAN GOT ITS OWN — your ruling

The argument above holds for the *gesture* and I have not touched it. What
makes a tell worth having is that it is learned once, and the learned part is
the **rising pair** — rising because a rise encodes *time remaining*, pitched
above the music bed. Every cue below keeps that exactly.

What the three weights could not do is tell you **which** thing is about to
move. In a game where each guardian is fought on its own terms, that is the more
useful fact, and it is free: the sentence stays the same, the **instrument**
becomes the creature's. A player who has never heard one still knows what it
means; a player who has knows *who*, without looking away from his own body.

| cue | guardian | length | rises | weight | bright |
|---|---|---|---|---|---|
| `tell_glitch` | NULLFANG — a virus wearing a lion; detuned against itself, so the rise **beats** rather than sings | 0.28s | x1.50 | 1.15 | 1462 |
| `tell_brood` | TALONHOST — thin, high, edged, the swarm fluttering under it instead of a body | 0.23s | x1.42 | 0.19 | 5888 |
| `tell_atlas` | FURNACE CHOIR — struck metal being bent upward under heat | 0.37s | x3.03 | 0.78 | 1311 |
| `tell_zero` | GLACIERE — frost first, then something crystalline *growing* | 0.36s | x3.82 | 0.58 | 3947 |
| `tell_prism` | PRISM PROWLER — the fastest rise in the set. Glass deciding, and very little time | 0.19s | x1.79 | 0.13 | 3547 |
| `tell_mother` | MOTHER-V — the only tell with voices in it; the sub arrives before the rise | 0.45s | x1.90 | **5.14** | 667 |
| `tell_alpha` | THE ALPHA — a growl tipping into a bark. The rise is an animal's, not a machine's | 0.26s | x2.13 | 0.73 | 1917 |

The three sized cues in §6 have not gone anywhere: they still carry every
machine, every sage, and any guardian that has no voice of its own yet — a new
one is never silent while it waits for one.

**Two things this cost, both worth writing down.** The rise law was only ever
checked on the three generics, so the foundry bell shipped a first draft at
rise **x1.00** — a bell that rang and never climbed — while the harness printed
"all three climb". It checks all ten now. And the family sweep was partly
measuring dice: `wreck` scatters its debris with `Math.random`, so
`icecolumn/wreck` came back separate on three runs in four and identical on the
fourth. The dice are pinned to a seeded sequence — the same spread every run,
rather than a constant, which would have stacked all five of wreck's hits on one
instant and measured a cue you will never hear.

---

## 7. THE WORLD

| cue | when | length | bright |
|---|---|---|---|
| `gate` | the city gate opens (see below) | — | — |
| `bench` | a save point | 0.58s | 1683 |
| `ui` | a menu row | 0.08s | 1075 |
| `win` | a fight is over | 1.07s | 1937 |
| `phase` | a guardian changes | 0.45s | 2226 |
| `roar` | a guardian roars | 0.82s | 1672 |
| `step` | a footfall | 0.06s | 1551 |
| `grind` | a wall slide | 0.13s | 5218 |
| `break` | breakable rock | 0.16s | 17232 |
| `glass` | something shatters | — | 0 |
| `powerUp` | a skill is granted | — | 0 |

### THE GATE — the first built thing the player ever finds

It played `sfx('ui')`. The same three-frame tick a menu row makes, for a city
wall three tiles thick and the monument the whole opening walks toward.

Five layers, and they are the structure rather than an effect laid over it:

| layer | what it is |
|---|---|
| the sub | what something that heavy does to the floor — first, and under everything, because weight is heard before it is identified |
| the stone | a noise sweep opening UPWARD as the seam parts, grit ticking off the faces |
| the mechanism | two servo tones a beat apart: locks releasing in sequence, because the city is a machine |
| the toll | one bell, struck once. **This is the line between "a door opened" and "you have arrived somewhere"** |
| the air | the room beyond breathing out past her — the tail that makes the far side sound bigger than the side she is standing on |

The **first** opening of the city gate is a bigger take: a fifth lower, longer
tail, the bell answered an octave up, the camera and the pad answering with it.
Arriving somewhere for the first time is not the same event as going through a
door you already know.

Measured: **1650x the energy of the blip it replaced**, a 1.96 s tail against
0.08 s, real sub-60 Hz weight where the tick had none at all, the toll landing
on D3 at 222 against neighbours at 7 and 6, and a peak of 0.289 — nowhere near
clipping.

---

## 8. WHAT IS NOT MINE

**Her voice and the guardians' roars are recordings.** Music is Higgsfield's.
Everything in this document that is *synthesised* is code, and mine to change;
the takes are yours to approve and the art session's to fire.

If a cue here is wrong, the fix is a line in `js/audio.js` and a re-measure. If
a **take** is wrong, it is a re-fire, and it goes on THE FIRING LIST in
`docs/ART_QUEUE.md`.

---

## 9. HOW TO CHECK THIS WITHOUT TAKING MY WORD

```bash
npx http-server -p 8220 -s &      # the harnesses drive the real build
node tests/cuefamily.cjs          # all 496 pairs differ; the four elements
                                  # separate; her burst is not a death; every
                                  # warning rises and they differ only in weight
node tests/gatecue.cjs            # the gate is not the blip, and does not clip
node tests/hzdvox.cjs             # her takes, and the held note: a tap starts
                                  # nothing, a real charge starts one and ends it
```

---

## 10. WHAT I WOULD CHANGE NEXT, IF YOU AGREE

Nothing in this document is waiting on a decision from you to be *correct* —
it is all shipped and measured. These are the places where taste, not
measurement, decides:

1. ~~**The warnings.**~~ **RULED, 2026-08-24: each guardian has its own.** See
   §6b — seven voices, one gesture, all measured separate.
2. **`msong` is the only chord in the game.** That is deliberate — Mother is
   singing, not making an effect — but it means she has a musical identity
   nothing else has. If that should be a whole motif rather than one chord, it
   is a composer brief, not a code change.
3. **Footsteps.** `step` exists and is thin. A real footfall set — per surface,
   rock against metal against grass — is the largest remaining gap in the
   vocabulary, and it is the sound the player hears more than any other.
