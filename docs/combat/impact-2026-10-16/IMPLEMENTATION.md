# Combat impact and character reference — 2026-10-16

Owner request: implement white hit flashes, separate swing/contact sounds, metallic debris, knockback, small hero recoil, camera shake and hit-stop; amplify charged attacks; define and document character health, power, cadence and defense.

## Implemented behavior

- Successful damage flashes the actual enemy silhouette white: 45 ms normal, 65 ms finisher, 85 ms charged. Uses the existing alpha stencil, not a white rectangular sprite. Real-time expiry prevents the flash sticking during hit-stop.
- Normal, finishing and charged hits emit respectively 5, 9 and 14 tiny cosmetic screws/shards. Hardware rotates, falls, bounces once and expires after 0.32–0.65 simulation seconds. At most 80 hardware particles coexist, within the existing overall quality budget. These are effects, not inventory pickups or dismembered robots.
- Existing authored swing/contact audio, normal recoil, normal/finisher knockback, haptics and weighted impact pauses remain. Charged first contact adds 120 ms hit-stop, shake 7, recoil 90 and heavy impact sound/haptic. Multi-hit attacks do not repeatedly add this first-contact recoil/pause.
- Charged release on a miss remains visible but does not trigger the new confirmed-hit pause. Protected, blocked and zero-damage contacts cannot earn successful-hit knockback, volts or metal debris. Shield chip retains its own metallic block response.
- Rescued sages, tame wolves, allies and NPCs remain protected. The calm tutorial winch is deliberately still strikeable: its lesson requires it. No story gates are removed.
- Reduced-motion mode suppresses the new silhouette flash and charged camera pause and lowers new debris to two particles. Existing game-wide accessibility behavior remains; this is not a claim that all pre-existing effects are disabled.
- The Gear screen shows live health, attack strength, attack cadence and the correct equipped special. Dual/joined specials are explicitly per pass. Export combat log, or L in Gear, downloads the latest 200 resolved damage records, including build, room, weapon, raw power, armor, HP lost and result. A local copy is retained on export/page exit.

## Balance and units

`js/combat-stats.js` is the new runtime balance record. Health still comes from the existing EKIND/BSTAT constructors and their difficulty/kingdom/progression scaling. Weapon values still use the canonical attack table. This avoids a separate documentation-only balance system.

| Normal-difficulty hero form | Normal raw HP | Special raw HP |
|---|---:|---|
| Claws | 12 | 38 burst (3.2x base, rounded) |
| Single sword | 20 | 51 burst |
| Dual swords | 24 | 18 per hurricane pass |
| Joined sword | 33 | 26 per outward/returning pass |

These are baseline values, before armor, elements, crits, traits or upgrades. The distinct sword moves remain intact rather than being replaced by identical charge attacks.

Armor applies `max(1, round(raw * (1 - DEF/100)))`, followed by existing elemental/encounter rules. Chassis armor varies per enemy; kingdoms add A=0, B=2, C=4, D=6, E=8, X=8 percentage points, with the constructor total capped at 35%. The runtime damage helper caps arbitrary defense inputs at 75%. Protected NPCs use an explicit immunity guard rather than that damage formula.

The hero uses **cores**, enemies use **HP**. Enemy attack power is expressed in cores/contact and preserves the authored difficulty base and move-specific multipliers. Hero cadence is theoretical combo swings/second before pauses; enemy/boss cadence is the actual authored AI multiplier, **not** a misleading hits/second figure. Range, telegraphs, cooldowns and phases determine observed frequency. Noncombat NPCs have 100 protected integrity, zero attack and zero cadence.

## Reference artifacts

- `output/pdf/CLAWBYTE-Character-Cards.pdf`: 12-page illustrated reference, 37 cards, existing game artwork.
- `stats.json`: actual assembled-game export with build ID and runtime roster values.
- `portraits/`: renders from the game's current character renderers and NPC bust assets. No new replacement artwork was generated or silently approved. The reference faithfully exposes current art, including any existing shared/fallback creature appearance.
- `tools/combat-field-guide.cjs` and `tools/combat-cards.py`: reproducible capture and PDF generation.
- `tests/combat-impact-contract.cjs` and `tests/combat-impact-browser.cjs`: production damage rules and rendered effect/export regression checks.

## Verification and release

See `VALIDATION.md` for exact tested builds, results and limitations. Focused staged combat tests are not an uninterrupted chapter-one playthrough. Do not interpret a passing subset or this PDF as a production deployment or complete balance certification.
