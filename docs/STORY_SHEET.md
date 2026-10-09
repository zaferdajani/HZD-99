# CLAWBYTE — THE STORY SHEET

One row per story beat, in canon order (`docs/STORY_CANON.md` rules; this sheet
is what the game enforces). The machine-readable copy is
`tests/story-sheet.json`, and `tests/story-order.cjs` walks the real build
against it on every suite run:

- every beat has a room, a speaker, what the speaker knows and **who points the
  player there** — that column is never empty;
- the room graph is walked through the production gates only
  (`checkTransitions`, `gateEnter`, each beat's own predicate), twice — greedily,
  and on the route the Meadow Sage gives — and a beat that becomes possible
  before its **required flags** fails the suite;
- every line is evaluated at the moment it is said and may only name what the
  player has already met, or what that line itself introduces.

Change a beat in the game → change its row in `tests/story-sheet.json` → copy
it here → re-sync `docs/STORY_SCRIPT.md`, in that order.

Flags are `G.save.flags` keys. `@sageReveal` and `@ratchetStanding` are lines
chosen at runtime by `sageRevealLines` / `ratchetStandingKey`
(`js/story-opening.js`) from the flags at that moment.

| # | Beat | Room | Required flags | Sets | Speaker | What they know | Who points you there | Lines |
|---|---|---|---|---|---|---|---|---|
| 1 | wake | W1 | — | `woke` | none (tutorial chip) | Nothing. She wakes alone in a service cradle; sleep is why she missed the broadcast. | Tutorial chip: Move — walk right toward the light (tut_move) | — |
| 2 | gates | W2 | `woke` | — | none (tutorial chip) | The city is standing and silent. | Tutorial chip at the road's end: the gates — stand beneath them and press UP | — |
| 3 | ratchet_note | A0B | `woke` | — | Ratchet (his letter) | Mother's song is infected; his marble slowed the virus; he removed his own battery; it is in the drawer. | Tutorial chips past the gates: Ratchet's booth — the lit door ahead (op_booth); inside, Read the letter (op_note) | `op_letter1`, `op_letter2`, `op_letter3` |
| 4 | ratchet_wake | A0B | `woke` | `on_A0B\|ratchet`, `ratchetRepaired`, `ratchetSpareGiven` | Ratchet | Mother's song was infected; his marble slowed it and could not stop it; he pulled his own battery; she was asleep in a recharge cradle, not immune; a big raw marble deposit lies under the meadow and he can forge a white sword that cuts the virus out; the spare cell is for Old Servo; the pod saves and recharges; the way down is the loose floor at the hub's west end (said when she asks again). | His letter: the battery is in the drawer beside this chair (op_letter3); tutorial chips: Open the drawer, Restore his battery (op_drawer, op_repair) | `op_r1`, `op_r2`, `op_r3`, `op_r4`, `op_r5`, `op_spared`, `op_r_pod`, `q_where_ratchet_forge` |
| 5 | volt_pack | A0B | `on_A0B\|ratchet` (+ `ratchetAwake`) | `heal` | Ratchet | The ring of charge cannot be spent yet; the Volt Pack wires healing and the Volt Burst, permanently; the burst is what cracks raw marble; it costs 12 scrap, which he pays her for the repair; scrap is what broken machines leave behind. | After the pod: tutorial chip The Volt Pack — press E at Ratchet (op_pack); the counter opens on 'Volt Pack · permanent', marked BUY THIS FIRST | `op_p1`, `op_p2`, `op_p3`, `op_p4`, `op_scrapd`, `i_packd` |
| 6 | servo | A1 | `ratchetSpareGiven` (+ `spareCell`) | `on_A1\|servo` | Old Servo | He is Old Servo, keeper of the winding house; Ratchet's marble is under them, through the hub's loose floor; his gantry coil shook loose in the gantries above (60 scrap and 10 IQ to bring it back). | Ratchet: 'this spare Power Cell is not for you. It's for Old Servo, out in the meadow' (op_r5); the card Spare Power Cell (op_spared); over him: 'Switched off · needs a Power Cell' | `op_sv1`, `op_sv2`, `op_sv3` |
| 7 | meeting | A2 | — | `nfMeet` | NULLFANG (never speaks) | — | The road itself: the hub is the only way east, and the guardian drops onto its crest unasked | — |
| 8 | dent_before_forge | A0B *(optional)* | `nfMeet`, `on_A0B\|ratchet` (+ `ratchetSays`) | — | Ratchet | The lion threw her; claws will not answer it; the marble comes first. | Returning to the workshop after the corridor | `@ratchetStanding` → `sl_ratchet_dent` |
| 9 | way_down | A5 | — | — | the terminal under the hub | A sub-hatch was sealed after an anomalous signal. | Ratchet: the loose floor at the hub's west end, strike straight down (q_where_ratchet_forge); the break_down hint over the loose rock | `q_where_ratchet_forge` |
| 10 | beacon | CV2 | — | `beacon` | the Deaf System's log | The deaf survived the song underground and quarried this seam. | The sound through the rock since the meadow, and the rubble that answers a strike | — |
| 11 | quarry | CV3 | `heal` (+ `burst`) | `pl_cshard` | none (pl_hint) | Claws glance off raw marble; the charged burst frees it. | Ratchet: raw marble in the caves beneath the meadow (q_ask_ratchet_forge); pl_hint at the stone | `pl_hint` |
| 12 | forge | A0B | `pl_cshard`, `on_A0B\|ratchet` (+ `forgeReady`) | `crystal`, `ratchetCamp` | Ratchet | He shapes the marble into the PURIFIER, then moves his tools to the camp by the lion's enclosure. | Ratchet's own errand: bring a piece back to my workshop (q_ask_ratchet_forge) | `q_thanks_ratchet_forge`, `sl_ratchet_moving`, `i_crystald` |
| 13 | forged_line | A3 | `crystal`, `ratchetCamp` (+ `ratchetSays`) | — | Ratchet (at the camp) | The first Sage is behind the maintenance passage beside the quarry; clear their binding before the guardian. | Ratchet himself, at the forge: 'Find me there' (sl_ratchet_moving) | `@ratchetStanding` → `sl_ratchet_forged` |
| 14 | alpha | A10 | `crystal` | `alpha`, `bossAlpha` | THE ALPHA (no words) | Optional: the pack follows its guardian; the white blade releases it. | Ratchet's optional errand at the forge (q_ask_alpha_pack); the den's marked entrance in the hub (alpha_den) | — |
| 15 | first_sage | GA1D | `crystal` | `sageTame_GA1D`, `chimeRevealed` | The Meadow Sage | Its calling betrayed hidden survivors; NULLFANG resists; CHIME rewrites the order — or, in whatever order she arrives, that the bell is already silent or the lion already free. | Ratchet: 'The maintenance passage beside the marble quarry leads to the first Sage' (sl_ratchet_forged); gh_sage at the lair door | `@sageReveal` |
| 16 | sage_line | A3 *(optional)* | `sageTame_GA1D`, `ratchetCamp` (+ `ratchetSays`) | — | Ratchet (at the camp) | Word that the sage stood up clean. | The camp is on the road back from the quarry to the lair | `@ratchetStanding` → `sl_ratchet_sage` |
| 17 | chime | A9 | `sageTame_GA1D` | `bossChime` | CHIME (no words) | It is an instrument with nobody in it; while it rings, NULLFANG's binding is rewritten. | The Meadow Sage: 'Take the climb above the meadow. Silence that bell' (sg_rev4); gh_chime at the lair door; the climb itself is warded shut until the Sage is free (gate_chime_ward, ward_chime_fall) | — |
| 18 | break | A2 / A3 *(optional)* | `sageTame_GA1D`, `nfMeet` (+ `breakWindow`) | `nfBreak` | NULLFANG (never speaks) | He resists; the bell writes the order back. | The Meadow Sage's route: the climb rises out of the hub's west end, where he comes out; the camp's east end for a player who walks on | `nf_break1`, `nf_break2` |
| 19 | rematch_line | A3 | `sageTame_GA1D`, `bossChime`, `nfMeet`, `ratchetCamp` (+ `ratchetSays`) | — | Ratchet (at the camp) | The lion is winnable now: go and put a dent in it. | The camp is the last room before the lair | `@ratchetStanding` → `sl_ratchet_rematch` |
| 20 | nullfang | A4 | `crystal`, `sageTame_GA1D`, `bossChime`, `nfMeet` | `bossGlitch` | NULLFANG (never speaks) | — | The Meadow Sage: 'return to his enclosure' (sg_rev4 / sg_rev_go); Ratchet at the camp (sl_ratchet_rematch) | `b_glitch`, `pure_beast` |
| 21 | conduits_line | A3 | `bossGlitch`, `ratchetCamp` (+ `ratchetSays`) | — | Ratchet (at the camp) | The hatch above the camp unjammed when the lion was freed; the climb leads to the Data Conduits. | conduits_open, said the moment NULLFANG is free | `@ratchetStanding`, `conduits_open` → `sl_ratchet_conduits` |
| 22 | conduits | B1 | `bossGlitch`, `crystal` | — | none | The second kingdom. | Ratchet: 'That climb goes up into the Data Conduits' (sl_ratchet_conduits); conduits_open; gate_conduits whenever the hatch refuses | `gate_conduits` |
| 23 | mono | B3B | `bossGlitch` | `on_B3B\|mono` | Mono | The order comes up from beneath the Archives in Mother's voice — her voice, not her command. | The Oracle's parlour door, the only door on the conduit corridor (B3) | `d_mono` |
| 24 | talonhost | B4 | `bossGlitch` | `bossBrood` | TALONHOST (no words) | — | The conduit corridor runs east from the Oracle straight into her hall | `b_brood` |
| 25 | prowler | X1 | `bossGlitch`, `bossBrood`, `crystal` | `bossPrism`, `relic sigil1` | the Prism Prowler (no words) | It was never infected; it guards the seam's second blade and stands down. | Mono: 'Cracked walls hide old maintenance shafts. Strike them' — B5's breakable ceiling | `pure_prism` |
| 26 | sigil_foundry | C1 | `bossGlitch`, `crystal` | `relic sigil3` | none (a hidden seal) | The last seal of the old vault lies on a ledge in the Foundry tower. | Patch-7 in the pour gallery: 'The walls hum near the old vault...'; the sealed vault itself, refused without it: 'The third seal was carried down into the Foundry tower.' (vault_where3) | `rl_sigil3d` |
| 27 | mind_nodes | E1 | `bossZero`, `bossPrism` (+ `allNodeRooms`) | `relic sigil2` | none (the last Mind Node) | Out-thinking every Mind Node earns the second seal. | Every node is marked where it stands (rd_hint); Vault Sigil II says what it was for (rl_sigil2d) | — |
| 28 | vault | B5 | `bossPrism` (+ `vault`) | `vaultOpen` | none (the sealed vault) | Three sigils turn the vault; its side passage opens with it. | Vault Sigil I: 'One of three seals of an old vault in the Conduits' (rl_sigil1d); vault_locked counts what is missing; gate_vault_side at the east side | `vault_open`, `gate_vault_side`, `vault_where3` |
| 29 | kerf | V1B | `vaultOpen` | — | Kerf | Her harvesters' marble is the stone Ratchet wears; she shaped the second edge; the Prowler keeps it, clean. | Vault Sigil I: 'One of three seals of an old vault in the Conduits' (rl_sigil1d); the vault counts its sigils (vault_locked) | `d_kerf` |
| 30 | furnace | C3 | `bossGlitch` | `bossAtlas` | FURNACE CHOIR (no words) | — | The Conduits' floor drops into the Foundry tower (B3 → C1) | `b_atlas` |
| 31 | archives_sage | D1B | `bossGlitch` | — | The Nine-Lives Sage | GLACIERE sleeps beyond the ice and guards the Kernel Key. | The Foundry's floor opens onto the Archives (C2 → D1); the carrel is the only warm door | `d_sage` |
| 32 | glaciere | D3 | `bossGlitch` | `bossZero` | GLACIERE (no words) | — | The Nine-Lives Sage: 'Beyond the ice sleeps GLACIERE' (d_sage) | `b_zero` |
| 33 | mother | E3 | `bossZero` | `bossMother` | MOTHER-V (her song) | She is the hijacked singer; the command burns out and she lives; the Eye that stole her voice remains, exposed. | Mono: the order comes up beneath the Archives in Mother's voice (d_mono); GLACIERE's floor gives way to the Nest (D3 → E1) | `b_mother`, `pure_mother`, `win2`, `win2b` |

## Names and when they are met

A line may name these only once one of the listed flags is set, or when the
line itself is the introduction (the beat's `introduces`).

| Name | Met once any of |
|---|---|
| Mother | always (the prologue / the waking floor) |
| Ratchet | always (the prologue / the waking floor) |
| Servo | `ratchetSpareGiven`, `on_A1\|servo` |
| NULLFANG | `nfMeet`, `chimeRevealed` |
| CHIME | `chimeRevealed`, `bossChime` |
| the Sage | `crystal`, `sageTame_GA1D` |
| the Data Conduits | `bossGlitch` |
| the Eye | `bossLens` |
| Mono | `on_B3B\|mono` |
| Kerf | `vaultOpen` |
| the Prowler | `bossPrism` |
| GLACIERE | `bossZero` |
| TALONHOST | `bossBrood` |

## Gates that enforce the order

| Where | Gate | Refusal line |
|---|---|---|
| A3 ↑ B1 (the only way out of the Meadows) | `bossGlitch` + forged blade (`blade`), robot story only; once walked it stays open | `gate_conduits` |
| A3 → A4 (the lair) | blade → Meadow Sage → CHIME (`openingGateHint`); a song ward at the seam pushes her back, one sheet per missing milestone (js/progress.js) | `gh_marble` / `gh_sage` / `gh_chime` |
| GA1 depth door → A4 | `bossGlitch` (the door is not built before; owner, 2026-10-09) | — |
| A8 ↑ A9 (the bell) | `sageTame_GA1D`, robot story only; ward drawn over the hole (owner, 2026-10-09: Sage before CHIME) | `gate_chime_ward` |
| a saved bench in A4 / A9 / A11 | the same milestones (`progressBenchGuard`): Continue and respawn wake at the camp bench | — |
| GA1T → GA1D (the first sage) | forged blade | `sage_need_forge` |
| A2 depth door → A10 (the Alpha) | forged blade | `story_need_blade` |
| B5 → V1 (the vault's side) | `vaultOpen` (three sigils) | `gate_vault_side` |
| D3 ↓ E1 | `bossZero` | — |
| any guardian or the Alpha at zero health | forged blade (`brNeedsBlade`, js/braid.js) | `sg_hint` |

