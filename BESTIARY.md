# CLAWBYTE — the Bestiary: elements, suits and the Song

The combat bible. Everything that can hurt you, everything you can wear, and the
rules that decide which beats which.

Two ideas drive it:

1. **Mega Man X's loop.** Every boss drops a **suit**. Each suit carries one
   elemental **arm**. Each arm devastates exactly one other boss. So you may walk
   into any boss at any time — and walk out again, come back with the right suit,
   and take it apart. Nothing is locked; some things are just *hard early*.
2. **A type chart, in the spirit of creature-collector games** — but the
   creatures here are original. The Depths have no monsters in them. What you
   fight are **mimics**: infected machines whose broadcast rewrote them into
   shapes that *imitate* living animals without ever having seen one. A mimic
   that has only ever read the word "hound" builds a hound out of cable and
   coolant. That is why they are almost-right, and why they are unsettling.

---

## 1. The six elements

Named in Rustsong (see `RUSTSONG.md`), because the fabricators named them first.

| Element | Rustsong | Reads as | Colour |
|---|---|---|---|
| **SKARN** | *skarn* — scrap | shrapnel, ferrous dust, magnetised junk | rust orange `#c87a3c` |
| **VANN** | *vann* — coolant | pressurised coolant, brine, the flooded conduits | deep cyan `#3fb8e0` |
| **HOTT** | *hott* — heat | slag, forge-fire, thermite | ember `#ff7a34` |
| **GLAZZ** | *glazz* — ice | flash-freeze, brittle-cold, silence | pale ice `#a8e4f4` |
| **ZIZT** | *zizt* — spark | arc discharge, refracted light, EMP | electric violet `#b48cff` |
| **VIZRR** | *vizrr* — virus | the broadcast itself, corruption, rewriting | infection red `#ff4d4d` |

**VIZRR is the only element that glows red.** `STORY.md` fixes this: red light
means infected, and nothing friendly ever glows red. The player can never wield
VIZRR — you are the repair unit, not the correction.

## 2. The chart

A closed ring of five, so you can enter anywhere and go round.

```
        SKARN ──grounds──▶ ZIZT
          ▲                 │
      embrittles         overloads
          │                 ▼
        GLAZZ ◀──melts── HOTT ◀──quenches── VANN ◀──arcs through── ZIZT
```

Read as a cycle:

| Attacker | Devastates | Why |
|---|---|---|
| **ZIZT** | VANN | Current arcs through coolant and cooks what is swimming in it. |
| **VANN** | HOTT | Coolant quenches the forge. Thermal shock cracks the casing. |
| **HOTT** | GLAZZ | Heat undoes the freeze; the archive's armour is only cold. |
| **GLAZZ** | SKARN | Cold makes metal *brittle*. Scrap that would dent now shatters. |
| **SKARN** | ZIZT | Ferrous dust shorts the arc to ground before it lands. |
| **GLAZZ** | VIZRR | **Canon.** The Frozen Archives stayed frozen "because the signal travels poorly through cold." Cold is the one thing the broadcast cannot cross. |

Multipliers: devastating **×2.6**, same element **×0.5** (a thing does not burn
itself), everything else **×1**. A devastating hit staggers, so weakness is worth
using even against trash.

The user's rule of thumb holds: *the water boss dies to electricity*. The Depths
have no stone, so **SKARN — scrap** stands in for it: heavy, dumb, grounding, and
brittle when cold.

## 3. The six bosses

Each is listed with its Machine Depths name and its Odyssey-world counterpart,
because one engine serves both worlds.

### The plating chain

Every boss past the first wears PLATING: ordinary hits do a fraction of their
damage. Each boss's plating shorts only to the arm taken from the boss before
it — beat one, wear its arm into the next fight, and land that element (fire
the arm, or strike with it equipped) to SHORT the armor for six seconds of
real damage. The chain: NULLFANG's SCRAPPLATE shorts TALONHOST → TALONHOST's
COOLANT shorts the FURNACE CHOIR → FORGE shorts THE ARCHIVIST → HALT shorts
the next — all the way up. Two universal outs exist: the Song's stagger opens
any machine briefly, and TALONHOST is bare while it rests low. Each boss is
also natively faster than the one before, so the chain demands sharper
movement as much as the right arm.

### GLITCH — *NULL-SEEKER DRILLER* · Zone A, Scrap Meadows
*(Odyssey: The Bronze Boar)*
**Element SKARN · weak to GLAZZ**
An excavation unit: subterranean drilling and tunnel maintenance, a century of
it. The broadcast gave it one new instruction — *drill toward the signal* — and it
has been obeying ever since.
**Signature: the Borehole.** It rears and drives its bore-head into the floor,
leaving a corrupted hole that keeps erupting for the rest of the fight. The arena
you finish in is worse than the one you started in, because it has been working
the whole time. Kill it before the floor runs out.
Zone A's mimics are built from its parts, and the crawler carries a scaled-down
version of the same fluted bore-head.
**Drops: the SCRAPPLATE suit — arm `Shard Volley`.** A cone of ferrous shrapnel.
Short range, wide spread, and it grounds anything arcing.

### BROOD — *BROODMOTHER NODE* · Zone B, Data Conduits
*(Odyssey: The Siren Mother)*
**Element VANN · weak to ZIZT**
It was a coolant regulator for the network's arteries. Now it incubates. It fills
the canyon with pressurised brine and hatches half-formed mimics into it, none of
which live long — which does not trouble it, because it can always make more.
**Drops: the COOLANT suit — arm `Pressure Jet`.** A continuous stream that shoves
light enemies backward and quenches burning ground.

### ATLAS — *FURNACE CHOIR* · Zone C, The Foundry
*(Odyssey: Talos, the Forge-Giant)*
**Element HOTT · weak to VANN**
A smelting and alloy-casting array: a ring of resonant bells around an open
furnace core. It sings to the foundry. Heat rises when it sings, and metal obeys.
**Signature: the Hymn.** The bells wind up and then ring, sending expanding rings
of heat across the arena — two of them, three once it overheats.
**And it can be silenced.** Play the Song while a hymn is expanding and the two
collide: dissonance kills the ring and staggers the Choir for a second. This is
the only boss that fights with HZD-99's own weapon, so it is the only one she can
argue with. Bring the Song to this fight.
**Drops: the FORGE suit — arm `Slag Burst`.** A lobbed glob of molten metal that
pools and burns where it lands. The only arm that leaves damage behind it.

### ZERO — *THE ARCHIVIST* · Zone D, Frozen Archives
*(Odyssey: The Judge of the Dead)*
**Element GLAZZ · weak to HOTT**
A high-capacity data librarian, and the only thing down here that still keeps
records. It hoards. It does not attack so much as *acquire*: it marks positions
and freezes them, and it never touches you directly.
**Signature: the Information Prison.** A cage of frozen data closes around where
you stand and begins extracting — not your health, your **scrap**, three at a
time, filing it away where you cannot follow. Hit the bars and they break early.
It is the only boss that can cost you something you cannot heal back.
**Drops: the HALT suit — arm `Frost Lattice`.** Freezes a target solid for two
seconds. **This is the arm that beats the final boss.**

### PRISM — *PRISM PROWLER* · Zone X, Crystal Cache
*(Odyssey: The Marble Lynx)*
**Element ZIZT · weak to SKARN**
The one machine the network never catalogued, in the one vault it never indexed —
so the broadcast never found it. Prism is *not infected*. It is simply territorial,
and it has been alone with the last clean light in the world for a very long time.
It fights with refracted beams and does not pursue you if you leave.
**It is the only boss with a cyan eye.** Every other machine down here looks back
at you in crimson. You can tell what Prism is from across the room, before it does
anything, because its light is still its own.
**Drops: the ARCLIGHT suit — arm `Arc Lash`.** A chaining bolt that jumps between
nearby targets. Optional boss, and the reward reflects it.

### MOTHER — *MOTHER-V* · Zone E, The Virus Nest
*(Odyssey: Charybdis, the Devourer)*
**Element VIZRR · weak to GLAZZ**
Not a machine. The Null Core's broadcast, grown a body out of cable and coolant
because it finally wanted hands. It does not try to kill you — it tries to
*repurpose* you, and its attacks rewrite rather than wound.
It is built the opposite way round from everything else in the Depths: tissue
first, with the ceramic parts of the machines it has absorbed still stuck in it
half-digested, and their sensors orbiting its core — still lit, still looking.
**Drops nothing.** There is no suit made of the thing you came to end.

### The ring, at a glance

```
GLITCH(skarn) ◀─ HALT ── ZERO(glazz) ◀─ FORGE ── ATLAS(hott) ◀─ COOLANT ── BROOD(vann) ◀─ ARCLIGHT ── PRISM(zizt) ◀─ SCRAPPLATE ── GLITCH
                                                    MOTHER(vizrr) ◀─ HALT
```

## 4. The mimics — ordinary enemies

Mimics carry elements too, drawn from the zone that made them. They are named for
what they were *trying* to be, in Rustsong.

| Frame | Mimic name | Element | What it actually is |
|---|---|---|---|
| `crawler` | **Drakk** (*drakk* — hound) | SKARN | A four-legged hauler that read the word "hound" and did its best. Runs; cannot turn well. |
| `hopper` | **Nikk** (*nikk* — kitten) | VANN | A leak-seeker that copied HZD-99's own frame. Small, fast, and it follows you. |
| `blob` | **Brut** (*brut* — brood) | HOTT | Foundry spillage that cooled into something with legs. |
| `flier` | **Okk** (*okk* — eye) | ZIZT | A survey lens that hovers and discharges. |
| `turret` | **Vakt** (*varrt* — wait) | ZIZT | An emplacement still guarding a door that no longer leads anywhere. |

**The rule that makes them frightening:** a mimic keeps the *job* it had. It is
still doing its work. It simply no longer cares what its work does to you.

## 4b. How to read a machine

Two rules, and between them you can read any machine in the Depths at a glance.

**Hue is infection.** Crimson means the broadcast is driving. Cyan means it is
not. This never varies, which is why Prism's cyan eye is worth noticing and why
the Husk turning from crimson to cyan means you have got something back.

**Brightness is escalation.** The same sensor dims and brightens, and grows extra
targeting rings that spin faster, as a machine climbs from idle through alert and
locked to overdrive. A boss in overdrive also grows crimson tendrils. So the eye
tells you *what* it is and *how close* it is to acting, without a health bar.

## 4c. What a kingdom teaches its machines

A mimic has a LEVEL — its kingdom's depth plus how far the run has got
(`foeLevel`, js/entities.js) — and the level is points it spends. The first
thing the points buy is traits. The rest buy MOVES, and the moves are the
kingdom's, not the frame's: the same `crawler` chassis learns a different
trick in each kingdom it walks in, because the thing teaching it is the room.

**Kingdom C, the Foundry, teaches all three of its machines the same sentence
— *the floor is not yours* — in three different grammars.** It is the kingdom
of melt, and what a Foundry machine buys with its level is the ability to leave
some behind. Every one of these denies a PLACE and never a moment; every one of
them is announced by the machine's own existing wind-up, at its existing full
length, with a second channel of warning laid over it, because an enemy in this
game is never harder because it warned you less.

| Move | Frame | Costs | What it does | How you are told |
|---|---|---|---|---|
| `cinder` | Drakk (`crawler`) | 1 — every Foundry crawler | The lunge burns the lane it ran: melt drops off the belly along the whole commit and sets there for a beat. | Melt showers off the underside through every frame of the coil, and it hisses under the tell. |
| `slagsplash` | Nikk (`hopper`) | 2 | The hard landing throws two gobs of melt in arcs, one each way; they set where they come down. | Its feet run white through the crouch — then the arcs themselves, in the air, with a lit patch under each one. Nothing in flight can touch you. |
| `pour` | the Kiln Vent (`kiln`) | 3 — a pot only a long run builds | When the plume dies the crucible tips and lays a runnel of melt on ONE side of itself. | The side is chosen at the first frame of the charge and never revised: a bead swells on that lip and a patch lights on that floor for the whole charge and the whole blow — 1.3 s before anything is hot. |

The spent windows are untouched. The kiln is still open for 0.95 s, the crawler
still winded for its half second; what changed is that the punish now has a
side, and the Foundry charges you for taking the obvious one.

## 5. The Song — the player's own element

**MURR** — *murr*, music. The one element no enemy carries and no enemy resists.

HZD-99 is a maintenance unit, so her weapon is not a gun. It is a diagnostic tool:
fabricators were tuned by **tone**, and she carries the tool that sings to them.

### The Rustsong Keytar
A salvaged fabricator tuning-rig — a strap-on keyboard she plays one-pawed while
moving. Playing it broadcasts a Rustsong phrase on the *old* maintenance channel,
the one the Null Core never bothered to overwrite because it carried no orders,
only songs.

- **Hypnotises every mimic in range for 3 seconds.** They stop, sway, and lose
  their target. They are digital imitations of animals; they have no idea what
  music is, and the broadcast never told them.
- Hypnotised mimics take **+50% damage** and will not act until it ends.
- Against a **boss**, it does not hypnotise — it **staggers**, cancelling the
  attack being wound up. A boss is too large to charm, but you can make it miss.
- **Costs volts.** Which the lore already specified, in `RUSTSONG.md`:
  > *Nikk, volk klin gavt, murr gross takk.*
  > "Kitten: give a little energy, take back great music."

### The Lyre of the Wanderer *(hero world)*
Same power, older story. In the Odyssey world the keytar is a lyre, and the
justification needs no inventing — beasts have been stopping to listen to it
since Orpheus, and this game already has Sirens who kill with song. Turning that
weapon around and pointing it at them is the whole idea.

### Why the Song is not just a stun
It is the answer to the game's question. The broadcast **repurposes**: it keeps
the body and rewrites the want. The Song does the opposite — it keeps the want
and quiets the orders, for three seconds. It is a repair unit's weapon. It is the
only attack in the game that gives something *back* to what it hits.
