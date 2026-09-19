# THE MANHUA — the ledger

The coloured manhua of CLAWBYTE, drawn through Higgsfield from
`docs/STORY_SCRIPT.md` to the letter, one kingdom per chapter, every page reviewed
by the owner before it is committed. Protocol: `docs/MANHUA_SESSION.md`. Reader:
`manhua/index.html`. Live: https://zaferdajani.github.io/HZD-99/manhua/

**How a page moves through this ledger.** FIRED = a Higgsfield job exists for it
(job id recorded; never refire a page whose row shows a job unless the owner
refused it or the script changed). REVIEWED = the owner has seen it and said yes.
KEYED = crushed to `assets/manhua/ch<N>/p<NN>.webp` with `tools/img-crush.cjs`,
master archived in `assets/source/manhua/ch<N>/`. COMMITTED = on the ONE branch
and mirrored. A page the owner refuses goes back to FIRED with the refusal noted
and a new job.

**When the script changes**, the affected page rows are marked STALE here and
refired; the manhua never drifts from the game.

## The anchors — every character is an element, never a description

Per the `art-bible` (§2) and `art-prompts` skills, nobody in these pages is drawn
from words. Each recurring subject is bound to a Higgsfield reference element made
from the game's own plate in `assets/source/`, and every prompt embeds the element
id. The elements made for the manhua on 2026-09-19 were created from these plates:

| Element | id | Made from |
|---|---|---|
| `hzd99-canon` | `467c8e08-8161-483f-a4cf-439875ff04e2` | `source/ref/hzd99_canon.jpg` (the owner's canon, ART_BIBLE §2) |
| `ratchet-canon` | `795a5cd6-b404-4623-bcc9-2b32351d71ab` | `source/ratchet/ratchetResting_asfired.jpg` + `ratchet_ref_npc6yaw.png` |
| `ratchet-den` | `44ecbf7f-0326-418f-9cc9-122391cad46f` | `source/booth/den_interior_asfired.png` |
| `ratchet-booth` | `2f790258-47df-4a35-acfa-f63415c45486` | `source/booth/booth_front_artsession_asfired.jpg` |
| `crawler-canon` | `c7adb432-7f01-47d6-9dcc-221fdc5ed13d` | `source/roster/style_d/crawler_0.jpg` |
| `city-gate` | `da11ff82-f67a-481a-b038-dde9c65f4291` | `assets/backgrounds/gate_city.jpg` |
| `service-cradle` | `8a305cd0-2f5e-490e-bfe9-9e8a006ea0a4` | `source/open/cradle.jpg` |
| `NULLFANG` | `1922c573-cee1-48fb-aa59-d5f97d14783f` | the art session's guardian element (`source/guardians/nullfang_*.jpg`) |
| `MOTHER-V` | `f541aa62-fd48-49e1-a938-f17ca6c8b810` | the art session's element (`source/mother/`) |
| `purifier-crystal` | `d0a03e79-2887-4bcd-a209-11732c6754ef` | the art session's element (`source/crystal/`) |

Old Servo, the Alpha, the wolves, the guard, Chime and the Meadow Sage have no
locked plate that reads as a whole body (Servo's `cast/drawnA/npc__servo.png` is a
head), so they are described from the script's cast table (§0) in words, in every
prompt, the same words each time.

**The model.** `nano_banana_pro`, aspect `2:3`, resolution `2k` — the one image
model in the catalog that both accepts reference elements and renders lettering
reliably, at 2 credits a page. The page is tall because the reader is a phone.
(Observed on the first firing: the job record reports the model as `nano_banana_2`
although `nano_banana_pro` was requested — the catalog routes the pro id to that
engine. Recorded, not argued with: the pages came back on model and lettered.)

**The prompt archive.** `assets/source/manhua/ch1/prompts.json` holds the exact
strings fired, page by page: a SHAPE paragraph (the panels, top to bottom, what
each shows), the TEXT list (the script's lines, verbatim — they are the game's own
strings), a CAST block (the elements, and the rule that she carries no sword before
§2.10 and the PURIFIER after it) and the shared STYLE block (manhua, full colour,
palette named in words, negatives stated). The readable panel script below is
generated from that file, so the two cannot disagree.

**The reader's transcript.** Under every page in `manhua/index.html` the script's
text for that page is printed verbatim. That is the check: the drawn lettering is
compared to it in review, and a page whose lettering drifted is refired.

## CHAPTER 1 — THE SCRAP MEADOWS (script §1–2) — 27 pages

| Page | Scene | Fired (job) | Reviewed | Keyed | Committed |
|---|---|---|---|---|---|
| p01 | Cover | `3d9a6a42-d2a4-4aa5-a703-eeb55f0c6a92` 2026-09-19 | session-checked, awaiting owner | — | — |
| p02 | §1 Prologue, shots 1–4 | `2267281d-16d1-4d53-9634-b677d49b0124` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p03 | §1 Prologue, shots 5–8 | `f31c40ec-4033-4665-a58e-79b25ce55f93` 2026-09-19 | session-checked, awaiting owner | — | — |
| p04 | §2.1 The cradle — W1 | `0bdc0526-6949-4621-8f85-69a6d307354e` 2026-09-19 | session-checked, awaiting owner | — | — |
| p05 | §2.2 The road and the gates — W2 | `b9e7251e-34be-47dd-b968-4babd50f2d33` 2026-09-19 | session-checked, awaiting owner | — | — |
| p06 | §2.3 The waking floor — A0 | `667bdb9e-f455-4de0-8e7b-76f9a3d10017` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p07 | §2.4 Ratchet's den — the note and the cell | `ebd6267f-1905-4573-ace7-4b7f040a45d7` 2026-09-19 | session-checked, awaiting owner | — | — |
| p08 | §2.4 Ratchet's den — the kit, the cradle, the pack | `aef1b1d1-7e18-4390-ac6b-1f6772442097` 2026-09-19 (take 5 of 6) | session-checked, awaiting owner — the Repair Kit line is drawn twice on this take | — | — |
| p09 | §2.4 Ratchet's den — the errand | `d7495a82-3017-44e0-93bd-f29d8c6829b9` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p10 | §2.5 The volt pack — the shop and the two verbs | `dafdc179-e6ca-4197-83f1-da7e2303f468` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p11 | §2.5 tail, §2.6 The meadow — arrival | `80955cf7-a76f-4491-83d3-95340b57939f` 2026-09-19 (take 3) | session-checked, awaiting owner | — | — |
| p12 | §2.6 The meadow — Old Servo, the first fight | `b78a5ba9-a3cd-4709-9fe2-accfce11abbc` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p13 | §2.7 The hub — NULLFANG: fall, land, wind | `1f5e3e13-4f26-4ef2-9cac-725e8f2b4de3` 2026-09-19 | session-checked, awaiting owner | — | — |
| p14 | §2.7 The hub — the swipe, the watch, the leaving | `b67f496a-6726-4cb8-997a-40f0124c754b` 2026-09-19 | session-checked, awaiting owner | — | — |
| p15 | §2.8 Under the meadow — the buried mouth | `c2e8f6c1-99b5-4995-93c3-9c7f4ecfd9bc` 2026-09-19 | session-checked, awaiting owner | — | — |
| p16 | §2.9 The crystal cave — the beacon and the log | `8954c102-3002-4351-aed8-81fcb2636235` 2026-09-19 (take 3) | session-checked, awaiting owner | — | — |
| p17 | §2.9 The crystal cave — the pillar and the shard | `1b9e2680-0728-405a-8b5d-1a77c50b077e` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p18 | §2.10 The forging | `05e7438a-2d20-46bf-9936-7a665fc42e86` 2026-09-19 (take 4) | session-checked, awaiting owner | — | — |
| p19 | §2.11 The wings of the meadow | `dd54796f-18f0-4139-a64c-c6a2d612a31e` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p20 | §2.12 The Chime | `dc932f54-1284-40c6-8907-79309f4e256d` 2026-09-19 | session-checked, awaiting owner | — | — |
| p21 | §2.13 The Alpha's den | `c0dfa310-4477-452d-95b9-7a1d2ccb1256` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p22 | §2.14 The camp | `a87757dc-ef8d-4d5b-b77c-be292c3b5ca4` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p23 | §2.15 NULLFANG — the fight | `d0cba4f8-0b83-4b14-bdc7-17ccfab41d9c` 2026-09-19 | session-checked, awaiting owner | — | — |
| p24 | §2.15 NULLFANG — the fork, both branches | `dd91d640-29a3-46df-a4e6-ecdd9f50cde4` 2026-09-19 | session-checked, awaiting owner | — | — |
| p25 | §2.16 The grotto, the tunnel, the sage kneeling | `f6b2a00c-7271-4007-b3b9-afe8dcc6aa2e` 2026-09-19 (take 4) | session-checked, awaiting owner | — | — |
| p26 | §2.16 The first sage, purified | `ad555638-6158-4414-8d61-279237790f7f` 2026-09-19 (take 2) | session-checked, awaiting owner | — | — |
| p27 | §2.17 End of the free chapter | `cf63541d-d526-495e-811c-36951e9ca8d1` 2026-09-19 | session-checked, awaiting owner | — | — |

**How the takes went (2026-09-19).** All 27 pages fired the same day; 15 needed a second take, four a third or fourth, and page 8 six (the fifth stands). The failures were always the same three kinds, and the archive's `refired` field names each one: lettering drift (an invented caption, a dropped or doubled word, a split balloon), Ratchet losing his round body whenever he stood or gestured, and HZD-99 turning into a tall humanoid on pages where she carries the sword. The fixes that held: naming the count of text boxes per panel, describing Ratchet's body in words beside his element, and the `cast_sword_v2` block that calls her a small round cat with a head as big as her body. The `Fired` column shows the take now standing for review; every earlier take's job id and fault is in the archive.

**Owner rulings the pages wait on** (script §8) — none of these blocks chapter 1
as drawn: p24 draws BOTH branches of the fork as the script instructs; p12 keeps
Servo's *"since the Null Core began broadcasting"* because that is the game's
line today (§8.3); the evil robot is a featureless shadow on p02 because he is
never seen (§8.1). If any of these are ruled on, the affected page is marked
STALE and refired.

**A note for the code session.** `tools/pack-www.cjs` walks all of `assets/`
except `source/`, so `assets/manhua/` will ride into the native package. The
pages are the owner's reference, not the game; if that weight is unwanted in the
app, `manhua` belongs in that packer's skip set. This session does not touch
tools.

## CHAPTER 2 — THE DATA CONDUITS and THE CRYSTAL CACHE (script §3)
Not begun. Chapter 1 must be complete and seen by the owner first.

## CHAPTER 3 — THE FOUNDRY (§4) · CHAPTER 4 — THE FROZEN ARCHIVES (§5) · CHAPTER 5 — THE VIRUS NEST and THE ENDING (§6–7)
Not begun.

<!-- PANEL SCRIPT: generated from assets/source/manhua/ch1/prompts.json — do not edit below by hand -->

## CHAPTER 1 — THE PANEL SCRIPT

Every text box below is the script's line, verbatim. The SHAPE paragraph is what was fired; the STYLE and CAST blocks are in the prompt archive and are identical on every page.

### p01 — Cover

**Shape.** COVER of chapter one — one full-page image, no panel gutters. HZD-99 stands small in the lower third on cracked flagstones, seen from behind at three-quarters, looking up; her red scarf-cape lifts in a wind. Filling the upper two thirds: the enormous city gates <<<da11ff82-f67a-481a-b038-dde9c65f4291>>>, rust-orange doors between teal towers, standing ajar, a shaft of warm light spilling through the gap toward her and the silent machine city silhouetted beyond. Cold dusk sky. She is the only warm shape in the picture. Title lettering at the top in bold white display capitals with a thin cyan outline; the subtitle beneath it in smaller white letters; the chapter line in a cream caption box at the very bottom.

**Text boxes.**
> CLAWBYTE
>
> A robo-cat metroidvania in the Machine Depths.
>
> CHAPTER ONE — THE SCRAP MEADOWS

*Cast block:* `cast_no_sword`

### p02 — §1 Prologue, film shots 1–4

**Shape.** FOUR panels stacked top to bottom, each with one cream caption box along its bottom edge. Panel 1, wide: KERNEL DEPTHS seen from above — a city of machines, towers and hanging cables, a thousand small cyan lights, and one tall broadcast tower at the centre sending out gentle rings of cyan light. Panel 2: MOTHER-V, <<<f541aa62-fd48-49e1-a938-f17ca6c8b810>>>, the broadcast heart — a radial machine of violet-grey plates around one golden core, no face, singing in soft cyan rings, while below her small machines go about their work content and cyan-lit. Panel 3: the tower from below as its light turns from cyan to red; behind it looms a huge featureless black silhouette with no face, no eyes and no detail of any kind — a shadow only, the evil robot is never seen. Panel 4: a street of machines mid-task, a thin red thread of signal running from one to the next, their eye-lights turning red one after another. There is NO cat anywhere on this page — HZD-99 does not appear in the first four shots of the prologue. Each panel carries exactly ONE caption box, four caption boxes on the whole page, and nothing else is written.

**Text boxes.**
> KERNEL DEPTHS. A city of machines, run on one broadcast — the Mother's Song.
>
> MOTHER-V, the broadcast heart. While she sang, the Depths were kind.
>
> Until an evil robot hijacked her Song.
>
> Hidden in the melody, a virus spread from machine to machine.

*Cast block:* `cast_no_sword`

### p03 — §1 Prologue, film shots 5–8

**Shape.** FOUR panels stacked top to bottom, each with one cream caption box along its bottom edge. Panel 1: a crowd of machines in a plaza, every one of them turned the same way toward the distant tower, stopped mid-gesture, every eye red. Panel 2: the protectors of the kingdoms kneeling in a row under the red light — an armoured robot lion <<<1922c573-cee1-48fb-aa59-d5f97d14783f>>> in front, and behind it a great iron eagle, a bronze pipe-built dragon and a frosted white unicorn — red light behind all their eyes, heads bowed. Panel 3: a dark service bay, one shaft of light; the service cradle <<<8a305cd0-2f5e-490e-bfe9-9e8a006ea0a4>>> with a small white robot cat asleep in it, far too small for the chair, cables plugged into her back, her eye-lights dark. Panel 4, the last: an extreme close-up of her charcoal visor filling the panel as two cyan eye-lights come on — the page ends on her eyes opening.

**Text boxes.**
> The Song became a command: OBEY.
>
> Even the protectors of the kingdoms fell under its command.
>
> Forgotten in a service cradle, a small maintenance cat slept through the broadcast.
>
> HZD-99 woke to a silent city — and went to give the Song back.

*Cast block:* `cast_no_sword`

### p04 — §2.1 The cradle — W1

**Shape.** FIVE panels. Panel 1, wide: the dark service bay, the service cradle <<<8a305cd0-2f5e-490e-bfe9-9e8a006ea0a4>>> at the left, one shaft of light from the right side of the room, HZD-99 sitting up in the cradle with cables still plugged into her back, the machine's tool arms letting go of her. Panel 2, small: close on the last umbilical plug coming off her back with a jolt, a spark. Panel 3: she stands up in the cradle that is far too big for her, ears up, looking at the light. Panel 4: she walks right toward the light across the empty floor, small in a big dark room; a tutorial chip in the top corner. Panel 5, wide: the door at the end of the bay standing open, dust in the light pouring in, her silhouette small in the doorway; a tutorial chip. Nothing else is in this room. No enemies, no other machines.

**Text boxes.**
> Move — Walk right toward the light.
>
> Leave — the door has been open a long time.

*Cast block:* `cast_no_sword`

### p05 — §2.2 The road and the gates — W2

**Shape.** FOUR panels. Panel 1, wide: outside under a cold sky, a long cracked road running away from us with the city gates <<<da11ff82-f67a-481a-b038-dde9c65f4291>>> small at the far end, HZD-99 tiny on the road. Panel 2: a fallen rusted beam across the road with a gap beyond it; she is mid-jump over it, scarf streaming, motion lines along her path; tutorial chip. Panel 3, tall: the gates HUGE above her, rust-orange doors and teal towers filling the frame, the row of lamps along the lintel, she a small white shape beneath them looking up; tutorial chip. Panel 4, wide: seen from inside the city, the two great doors closing on the empty road behind her, the last light narrowing to a line; she stands with her back to us. Nobody else anywhere.

**Text boxes.**
> Jump — Press once to jump over the obstacle.
>
> The gates — stand beneath them and press UP.

*Cast block:* `cast_no_sword`

### p06 — §2.3 The waking floor — A0

**Shape.** SIX panels in three rows of two. Panel 1: a cramped first street inside the gates; one crawler <<<c7adb432-7f01-47d6-9dcc-221fdc5ed13d>>>, a squat four-legged drill machine, standing calm with RED eye-lights; behind it, set into the street wall, the trader's booth <<<2f790258-47df-4a35-acfa-f63415c45486>>> with its torn awning; tutorial chip. Panel 2: she rakes the crawler with her claws — it does not fight back, it only rocks. Panel 3: the crawler breaking apart into a wreck, plates falling; tutorial chip. Panel 4: scrap — small bright bits of metal — scattered on the floor and her walking over them, the bits lifting toward her; tutorial chip. Panel 5: an item card — a cream box with the scrap text — over a drawing of a handful of scrap. Panel 6: the booth door in the street wall swinging open with warm amber light inside; tutorial chip.

**Text boxes.**
> Scratch — Strike the marked machine.
>
> Finish it — keep going — it breaks.
>
> Take the scrap — walk over it — scrap is what you pay with.
>
> Scrap — What a broken machine leaves behind, and the only money down here. The trader takes it for repairs, parts and upgrades — so a machine you break is a machine you spend.
>
> Read Ratchet's note — Interact with the sleeping robot.

*Cast block:* `cast_no_sword`

### p07 — §2.4 Ratchet's den — the note and the cell

**Shape.** FIVE panels. Panel 1, wide: inside Ratchet's den <<<44ecbf7f-0326-418f-9cc9-122391cad46f>>> — the timber workshop under one hanging lamp; Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> the big round copper-brass robot sits DARK and slumped at the bench, eye-lights off; a sleeping pod built into the wall at the corner; a chest at the foot of the bench; HZD-99 small in the doorway. Panel 2: close on a paper tag hanging from his chest plate, its handwriting shown as two lines of text in a cream box beside it. Panel 3: HZD-99 holding up her one glowing Power Cell — a small cylinder with cyan light — with a caption. Panel 4: her paws pushing the cell into an open port in his chest. Panel 5: close on his domed helmet as two eye-lights come up BLUE; caption.

**Text boxes.**
> A tag hangs from his chest plate, written in a steady hand:
>
> 'The broadcast takes every machine that listens. I will not listen — and I will not wait around to change my mind. I have taken out my own cell and hidden it where the rats forget to look.'
>
> 'If you are reading this, the city fell. When it is safe out there — truly safe — put the cell back in. I will do the rest. — R.'
>
> One Power Cell would bring it back. You are carrying one.
>
> Ratchet is awake.

*Cast block:* `cast_no_sword`

### p08 — §2.4 Ratchet's den — the kit, the cradle, the pack

**Shape.** FIVE panels. Panel 1: Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>>, awake now with blue eye-lights, hands HZD-99 a small repair kit case; a cream item card beside it. Panel 2: he gestures with an open hand at the sleeping pod built into the den wall <<<44ecbf7f-0326-418f-9cc9-122391cad46f>>>; his speech balloon. Panel 3: he taps his counter, a shelf behind him with a small charger pack on it; his speech balloon. Panel 4: close on HZD-99 listening, ears forward, a faint empty ring of light drawn above her head; his speech balloon. Panel 5, small and silent: only his hand, reaching sideways for a tool that is not on the bench — the tic — no text in this panel. Ratchet is the SAME body in every panel he appears in: a big ROUND copper-brass robot with a swollen barrel belly, a domed helmet head with a narrow visor slit, worn tan-and-copper plating, a rack of canisters on his back and the small crystal on a cord at his chest, exactly as the reference — NEVER a slim humanoid robot, never a knight. Panel 5 has NO letters at all — no sound word, no 'tic', nothing written. Panel 4's text is Ratchet's SPEECH BALLOON with a tail to him, not a chip and not a box with a heading — there is no 'Tutorial chip' label anywhere. Every balloon is complete and unbroken, no word repeated. Write each listed line ONCE, straight through from its first word to its last, with no phrase repeated inside it; the fourth line begins 'Hits you land charge the ring.' and is one balloon. The Repair Kit line is written ONCE, as the cream item card only — Ratchet has no balloon in panel 1.

**Text boxes.**
> Repair Kit — Patches two cores. Use it from here.
>
> See that cradle in the corner? Built it into the wall myself. Step in and it remembers you — everything you are, kept safe — and it patches your plating while you stand there. Use it. That is what it is for.
>
> And when you have scrap, come to my counter. I keep a volt pack — my own charger, cut down to your size. It wires that ring at the top of you to something useful.
>
> Hits you land charge the ring. With the pack in you, you can SPEND it: hold HEAL to mend a core, or hold ATTACK and let go for a burst from your claws. The ring is empty now — go earn some.

*Cast block:* `cast_no_sword`

### p09 — §2.4 Ratchet's den — the errand

**Shape.** FIVE panels, one speech balloon each, Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> speaking to HZD-99 in his den <<<44ecbf7f-0326-418f-9cc9-122391cad46f>>>. Panel 1: close on the small crystal glowing white on its cord at his chest, his hand touching it. Panel 2, tinted red like a memory: Ratchet alone in the dark den, frightened, pulling his own cell out of his chest, the red song-light at the window. Panel 3: he points off-panel; inset, a rock opening in a hillside of scrap under sky — an irregular cave mouth, never a door. Panel 4: inset drawing of a white crystal pillar in the dark with a small cat beside it, claws crackling. Panel 5: he lays a hand on his bench and looks at her, blue eyes steady. Ratchet is the SAME body in every panel he appears in: a big ROUND copper-brass robot with a swollen barrel belly, a domed helmet head with a narrow visor slit, worn tan-and-copper plating, a rack of canisters on his back and the small crystal on a cord at his chest, exactly as the reference — NEVER a slim humanoid robot, never a knight. EXACTLY five balloons on the page, one per panel, in the order listed; no balloon repeats and no other balloon exists.

**Text boxes.**
> You restored my battery. Thank you. The stone in my necklace protected me when the infection reached me.
>
> An evil robot hid a virus in Mother's song. I was afraid and alone, so I disconnected my battery and waited for help.
>
> There is more of this stone in the Scrap Meadows cave. Find the rock opening and press UP beside it. Follow the caves to the crystal pillar.
>
> Beside the pillar, hold ATTACK to charge your claws, then release. Collect the shard that falls.
>
> Bring that shard back to my workshop. I will forge a cleansing sword. Take it to the first sage to free them from the virus.

*Cast block:* `cast_no_sword`

### p10 — §2.5 The volt pack — the shop and the two verbs

**Shape.** SIX panels in three rows of two. Panel 1: Ratchet's counter in the den with a hanging sign and a price list; the sign text and the first list line are the text boxes. Panel 2: a cream item card for the Volt Pack over a drawing of the small charger pack clicking into a port in HZD-99's back, Ratchet's hands fitting it. Panel 3: she stands still with cyan light knitting a cracked plate on her body closed; tutorial chip. Panel 4: THE FIRST SURGE — she braces, jagged cyan-white arcs of current running her chassis from foot to ear, the air around her hazed, sparks thrown off the frame — NO rings, no circles; tutorial chip. Panel 5: the release — her claws sweep out in a full circle of white-cyan light, an impact frame, high contrast. Panel 6, small: above her head, the ring of charge — empty, then a sliver filling. Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> watches from behind the counter. Ratchet is the SAME body in every panel he appears in: a big ROUND copper-brass robot with a swollen barrel belly, a domed helmet head with a narrow visor slit, worn tan-and-copper plating, a rack of canisters on his back and the small crystal on a cord at his chest, exactly as the reference — NEVER a slim humanoid robot, never a knight. No sound words anywhere — no 'click'.

**Text boxes.**
> Ratchet's Emporium
>
> Volt Cell — 12 scrap — Refills your volts. The first one wires the Repair Protocol and the Volt Burst into you.
>
> Volt Pack — Ratchet's charger, wired into you. The shards you knock out of machines are VOLTS now — hold HEAL to spend them mending a core, hold ATTACK to spend them on a Volt Burst.
>
> Repair — hold it — volts become a core.
>
> Volt Burst — hold ATTACK until she crackles, then let go.

*Cast block:* `cast_no_sword`

### p11 — §2.5 tail, §2.6 The meadow — arrival

**Shape.** FIVE panels. Panel 1: back on the waking street, a tall dark obelisk-like Mind Node with a glowing cyan sigil, HZD-99 touching it; this panel's one chip reads exactly: Solve the puzzle — Use the marked node and solve its puzzle. Panel 2: a small glowing tree of cyan nodes floating in front of her, one node lit; this panel's one chip reads exactly: Buy a skill — Open Skills and buy your first skill. Panel 3: the street's exit to the right, her walking toward it; this panel's one chip reads exactly: Go on — the way out is right. Panel 4, wide, NO text: THE SCRAP MEADOWS — fields of rusted machine scrap under a cold open sky, gantries hanging on cables high above, and a winding house: a teal A-frame with a torn canvas roof and a huge cable drum. Panel 5, NO text: OLD SERVO — an old boxy square-bodied robot, tan and copper, a domed head with an antenna and two dark rectangular eyes, his lower half rusted into the winding drum behind him — sitting DARK; HZD-99 in front of him holding her spare Power Cell, undecided. Three chips on the whole page and not one more; the words 'Buy a skill' appear on the page exactly once.

**Text boxes.**
> Solve the puzzle — Use the marked node and solve its puzzle.
>
> Buy a skill — Open Skills and buy your first skill.
>
> Go on — the way out is right.

*Cast block:* `cast_no_sword`

### p12 — §2.6 The meadow — Old Servo, the first fight

**Shape.** SIX panels. Panels 1 to 5 are Old Servo speaking — an old boxy square-bodied robot, tan and copper plating, a domed head with a thin antenna and two rectangular AMBER eyes now lit, his lower half rusted into the great cable drum of the winding house behind him — one speech balloon per panel, HZD-99 listening small in front of him. Panel 1: his eyes lighting amber as her cell goes in. Panel 2: he mimes with an old hand. Panel 3: he taps her chest plate. Panel 4: he looks past her at the scrap fields. Panel 5, wide: he looks back over his shoulder at the gantries strung high above the meadow and the drum he is part of. Panel 6, wide, the first real fight: a red-eyed crawler <<<c7adb432-7f01-47d6-9dcc-221fdc5ed13d>>> coming at her, and beyond a rise of scrap a taller armoured sentry machine — a guard — rising over the crest with red eyes; she crouches with claws out. No text in panel 6. EXACTLY five balloons on the page, one per panel in panels 1 to 5, in the order listed, each balloon complete and unbroken; no balloon is split in two, no word is repeated. Panel 6 has no text.

**Text boxes.**
> Mrrow… a working unit! I haven't seen one since the Null Core began broadcasting.
>
> Move with the arrows, leap with Z, and swipe those claws with X.
>
> Claw the corrupted to harvest volts. Then stand still, hold F — the ✚ pad on a phone — and your frame will mend a core.
>
> The virus corrupts every machine it touches. Purge it, little paw — or rust with the rest of us.
>
> See the winding house behind me? I raised every gantry over this meadow off that drum, cable by cable. The drum still turns. My climbing days are what rusted.

*Cast block:* `cast_no_sword`

### p13 — §2.7 The hub — NULLFANG's first meeting: fall, land, wind

**Shape.** FIVE panels, NO TEXT AT ALL on this page — not one word is spoken. Panel 1, wide: the widest room of the kingdom, HZD-99 on a crest of scrap, and to the east (the right) a vista of the silent machine city under a cold sky. Panel 2, tall: NULLFANG <<<1922c573-cee1-48fb-aa59-d5f97d14783f>>>, the enormous armoured robot lion, dropping out of the sky to the right of her, motion lines straight down, red light behind its eyes. Panel 3, wide and EMPTY of motion: it has landed; dust settling; she frozen small at the left, the lion at the right, nothing moving — a silent beat. Panel 4: it walks up to her; her head is level with its paw; she does not move. Panel 5, tall and narrow: its great paw raised over her and HELD, claws out, an amber glint along the edge — the wind-up held a hair too long. She stays screen-left, the lion screen-right, in every panel.

**Text boxes.** none — the page is silent.

*Cast block:* `cast_no_sword`

### p14 — §2.7 The hub — the swipe, the watch, the leaving

**Shape.** Panel 1, a thin strip across the top: THE IMPACT FRAME — the swipe — almost pure white, high contrast, the shapes of the paw and the cat abstracted to slashes, no detail. Panel 2, THE SPLASH, most of the page: NULLFANG <<<1922c573-cee1-48fb-aa59-d5f97d14783f>>>, red-eyed, standing over the small white cat lying on her side where she landed in the scrap, looking down at her; focus lines radiate from the lion's head; she is tiny under it, one ear bent, eyes narrowed but lit. Panel 3, small inset lower left: the lion turning away, bored, coiling. Panel 4, small inset lower right: it bounding away east, already far, dust behind it. Panel 5, a strip at the bottom: a small round portrait of Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> beside a speech balloon with his line.

**Text boxes.**
> It threw you once. The corridor still has the dent. Go and put one in it.

*Cast block:* `cast_no_sword`

### p15 — §2.8 Under the meadow — the buried mouth

**Shape.** FIVE panels. Panel 1, tall: HZD-99 falling through a brittle floor that has just given way under the hub, dust and plates falling with her, into a dark chamber below. Panel 2: a glowing terminal screen in the dark with its log in a cream box. Panel 3: a pile of fallen rock in the chamber wall, and she stands before it with an ear turned to it; caption. Panel 4: she strikes the pile with her claws, rocks shifting; caption. Panel 5, wide: the rock gives way and an irregular CAVE MOUTH opens — a ragged hole in the rock, never a door, cold mist breathing out of it, a faint glow deep inside; caption.

**Text boxes.**
> MAINTENANCE LOG 0x2F: sub-hatch sealed after an anomalous signal. If found — do not answer it.
>
> Something is calling from behind the fallen rock. STRIKE it.
>
> The pile shifts. The sound behind it comes closer.
>
> The rock gives way — the tunnel is open, and it is breathing.

*Cast block:* `cast_no_sword`

### p16 — §2.9 The crystal cave — the beacon and the Deaf System's log

**Shape.** FIVE panels; the lower half of the page is text. Panel 1: a carved rock cavity with daylight from the cave mouth behind her, HZD-99 walking in. Panel 2, small: a side tunnel behind rubble with a simple metal bench in it. Panel 3, wide and dark: the long middle of the cave, she tiny, only her eye-lights and scarf catching light. Panel 4: THE BEACON — an old squat signal machine set into the rock, one slow amber lamp, cables into the stone, calling; caption. Panel 5, large: the beacon's log as a terminal screen — a dark box with the heading line and three paragraphs in clear cream text, big enough to read. The log panel carries every word of the log exactly as listed, in three paragraphs under its heading — no word dropped, none added. Panels 1, 2 and 3 carry NO text. Panel 4's caption box holds only the first listed line, the one beginning 'THE SOUND HAD A SOURCE'. The terminal in panel 5 has the heading 'LOG // THE DEAF SYSTEM' written ONCE at its top and the three paragraphs below it. No description of the beacon or of anything else is ever written on the page — the drawing is the beacon, the words are only the listed lines.

**Text boxes.**
> THE SOUND HAD A SOURCE. It has been calling into the rock for a long time, and nothing was ever listening.
>
> LOG // THE DEAF SYSTEM
>
> When the song came, the broken were the lucky ones. Cracked receivers, stripped antennae, factory rejects — every unit whose ears were dead heard NOTHING. And nothing is what saved them.
>
> They went under. Into the rock, where the signal dies. They rebuilt down here — a system of the deaf, wired by touch and light. No radio. No song.
>
> The caves do not connect to each other. That is not a flaw. A tunnel the song cannot walk is a tunnel worth keeping short.

*Cast block:* `cast_no_sword`

### p17 — §2.9 The crystal cave — the pillar and the shard

**Shape.** SIX panels. Panel 1: at the end of the dark, two red-eyed crawlers <<<c7adb432-7f01-47d6-9dcc-221fdc5ed13d>>> and HZD-99 fighting them with her claws. Panel 2, tall: THE PILLAR — a white crystal pillar growing from black rock, three spires, glowing softly from within, taller than she is; she stands beside it. Panel 3: her claws glancing off the crystal with a spark; caption. Panel 4: the storm on her chassis — jagged cyan-white arcs foot to ear, hazed air, sparks, no rings. Panel 5: the burst shatters the pillar; a bright shard falling toward her paws; a cream item card. Panel 6, dark: her AURA coming on — she glows white in the black cave, and at the edges two crawler shapes read as PURPLE outlines.

**Text boxes.**
> Claws glance off the pure crystal. Hold ATTACK to supercharge, then release beside it.
>
> Pure Crystal Shard — Quarried from the pillar with the supercharged claw. Ratchet can forge this into something the song will fear.

*Cast block:* `cast_no_sword`

### p18 — §2.10 The forging

**Shape.** FIVE panels. Panel 1: back in Ratchet's den <<<44ecbf7f-0326-418f-9cc9-122391cad46f>>>, HZD-99 holds up the glowing white shard; Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> leans over the bench, blue eyes wide; his speech balloon. Panel 2, wide: THE FORGING — sparks flying, his hands at an anvil shaping white crystal in a blaze of light, her watching with ears back. Panel 3: a cream item card over a drawing of THE PURIFIER <<<d0a03e79-2887-4bcd-a209-11732c6754ef>>>, the white crystal sword with a gold connector ring at the pommel. Panel 4, small: a floating tree of cyan nodes with one NEW branch growing and lighting. Panel 5: she — the SAME small round cat as in panels 1 and 2, no taller than Ratchet's knee — stands with the white blade strapped across her small round back; Ratchet's speech balloon. NO label on the forging panel, NO tutorial chip anywhere on this page — the only writing is the two balloons and the one item card listed. Ratchet is the SAME body in every panel he appears in: a big ROUND copper-brass robot with a swollen barrel belly, a domed helmet head with a narrow visor slit, worn tan-and-copper plating, a rack of canisters on his back and the small crystal on a cord at his chest, exactly as the reference — NEVER a slim humanoid robot, never a knight. She is the same small round cat in every panel; never tall, never humanoid, never a warrior girl. HZD-99 never speaks and has NO balloon anywhere on the page; panel 5's only text is Ratchet's one balloon, written once as one balloon.

**Text boxes.**
> The pillar shard! Hold still — sparks now — and let the song learn what fear is. The PURIFIER is yours.
>
> THE PURIFIER — A white crystal shaped like a sword. It hums against the Eye's static — and its handle was made to CONNECT to something.
>
> That blade on your back is the best work these hands ever did. Something under this kingdom is still singing — go and let it meet my crystal.

*Cast block:* `cast_sword_v2`

### p19 — §2.11 The wings of the meadow (optional errands)

**Shape.** THREE horizontal strips, each strip two panels. Strip 1, THE GANTRIES: gantries on cables high over the meadow with a loose coil of cable hanging; Old Servo (old boxy tan-and-copper robot, amber rectangular eyes, rusted into his cable drum) with a speech balloon; then HZD-99 handing him the coil and his second balloon. Strip 2, THE DEAF SYSTEM'S POCKET, no text: she breaks through a brittle rock plug into a small pocket with an old terminal and a single coin of salvage, nothing alive in it. Strip 3, THE SHAFT: a shaft straight down into the dark, she standing in it at the bottom looking up at a far pinpoint of light; then Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> with two speech balloons, one before and one after. Ratchet is the SAME body in every panel he appears in: a big ROUND copper-brass robot with a swollen barrel belly, a domed helmet head with a narrow visor slit, worn tan-and-copper plating, a rack of canisters on his back and the small crystal on a cord at his chest, exactly as the reference — NEVER a slim humanoid robot, never a knight. Old Servo is a boxy square-bodied old robot with a domed head, thin antenna and rectangular amber eyes, rusted into his cable drum. She is a small round cat in every panel, never tall.

**Text boxes.**
> A coil shook loose in the gantries above us. I cannot climb any more.
>
> That is the one. Take this — I have no use for it and you will.
>
> There is a shaft under the meadow nobody has stood in since the fall. See it for me.
>
> You stood in it. Nobody has, in a long time. Here.

*Cast block:* `cast_sword_v2`

### p20 — §2.12 The Chime — the Eye's first construct

**Shape.** FIVE panels. Panel 1, tall: HZD-99 climbing a stack of scrap and girders above the hub. Panel 2, wide: an arena at the top under sky; hovering in it, CHIME — not an animal but an INSTRUMENT: a bell-shaped construct of dark steel, a single Power Cell glowing in its heart, rings of sound coming off it; caption. Panel 3: it rings and drops toward her; she leaps and cuts it with the white blade. Panel 4: it lies broken on the arena floor, dark and empty; caption. Panel 5: the Power Cell it was built around lying in the wreck, and behind a broken wall, a single coin and a heap of scrap.

**Text boxes.**
> CHIME — it is singing at you.
>
> Destroyed. There was nobody in it.

*Cast block:* `cast_sword`

### p21 — §2.13 The Alpha's den

**Shape.** FIVE panels. Panel 1, wide: a den on the road — a clean floor with heaps of dead machine hulks at both ends; a pack of lean grey wolf-frame robots with red eyes; caption. Panel 2, tall: THE ALPHA — a great grey wolf-frame robot, much bigger than the pack, leaping at her, jaws open; she rolls under it. Panel 3: the fight — her white blade against its claws, sparks, motion lines. Panel 4: the Alpha lowering its head to her, yielding; its eyes going from red to cyan; a cream card. Panel 5, wide: the pack sitting around her, calm, cyan-eyed, and an irregular cave mouth opening in the den wall behind them. The Alpha and the wolves carry NOTHING — no weapons, no swords; they fight with jaws and claws only. The only blade on the page is hers.

**Text boxes.**
> THE ALPHA — the pack answers to this.
>
> THE PACK IS YOURS — It yielded. Every wolf in the machine world knows it now — they will not raise a tooth to you again.

*Cast block:* `cast_sword_v2`

### p22 — §2.14 The camp

**Shape.** SIX panels. Panel 1, wide: the camp — a metal bench, a small fire in a drum, and Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> at a second counter under a torn awning in the meadow; caption. Panels 2, 3 and 4: Ratchet at his counter, one speech balloon each, HZD-99 in front of him with the white blade on her back; his posture changes — arms folded, then leaning in, then open-handed. Panel 5: a vault of iron spikes under the camp, reached through a broken cellar floor, a star-shaped fragment glowing at its far end. Panel 6: her empty white husk standing in the meadow and Ratchet passing it; his speech balloon. Ratchet is the SAME body in every panel he appears in: a big ROUND copper-brass robot with a swollen barrel belly, a domed helmet head with a narrow visor slit, worn tan-and-copper plating, a rack of canisters on his back and the small crystal on a cord at his chest, exactly as the reference — NEVER a slim humanoid robot, never a knight. EXACTLY five balloons and one caption, each complete and unbroken — panel 4's balloon begins with the words 'Take what you need.'

**Text boxes.**
> The trader is open for business.
>
> Cat-frame. Cute. Don't touch the stock with those claws.
>
> Heard the Meadows went quiet. Heard it was you. Prices stand, mind.
>
> Take what you need. I salvage from the dead, and you keep making fewer of them.
>
> You came back. Your husk was still warm when I passed it.

*Cast block:* `cast_sword_v2`

### p23 — §2.15 NULLFANG — the fight

**Shape.** SIX panels. Panel 1, wide: the lair at the end of the kingdom — a wide scrap arena under a dark sky; caption. Panel 2: NULLFANG <<<1922c573-cee1-48fb-aa59-d5f97d14783f>>> facing her, red-eyed, head low; caption. Panel 3: the fight — it leaps, she slides under with the white blade up, sparks off its plating. Panel 4: faster now — it stalks low, crouches short, chains two leaps in one panel with motion lines. Panel 5: it staggers, dazed, head shaking; caption; she runs in striking. Panel 6, wide: it kneels, plating cracked, red light dimming, still looking at her; she stands small before it with the blade lowered; caption.

**Text boxes.**
> NULLFANG, THE VIRUS BEAST.
>
> It remembers the corridor.
>
> ⚡ NULLFANG is reeling — hit it NOW.
>
> NULLFANG is down. It is still looking at you.

*Cast block:* `cast_sword`

### p24 — §2.15 NULLFANG — the fork, both branches

**Shape.** The page splits into TWO COLUMNS below a top strip. Top strip: NULLFANG <<<1922c573-cee1-48fb-aa59-d5f97d14783f>>> kneeling and two choice boxes side by side, the left one and the right one. LEFT COLUMN, TAME, two panels: the white blade laid against the lion and white light pouring through its plating, the red draining out of its eyes to CYAN, with its caption; then the freed lion, cyan-eyed, standing beside her, with a cream card. RIGHT COLUMN, FINISH, two panels: she closes the distance and lands the blow, an abstract impact frame; then her alone with the lion's fang held in her paw, with a cream card. Bottom strip across both columns: the ground of the lair splitting and an irregular cave mouth opening; caption.

**Text boxes.**
> ◀ TAME — Cut the virus out. It lives, and it owes you.
>
> ▶ FINISH — End it. Take its strength for your own.
>
> The virus is destroyed — NULLFANG is free. He seems to like you.
>
> NULLFANG'S OATH — Once each room, the blow that would break you is answered instead — it comes out of the dark and roars them off you.
>
> RESOLVE — You took what it had. Every strike you land from here hits 18% harder, forever.
>
> The ground shifted — a CAVE MOUTH has opened in the lair.

*Cast block:* `cast_sword`

### p25 — §2.16 The grotto, the tunnel, and the sage kneeling

**Shape.** SIX panels. Panel 1, small: a grotto of rock behind the lair with a metal bench, and beside it a tunnel with a small bat-machine hanging from the roof. Panel 2, LARGE, the top half of the page: the tunnel's terminal as a dark screen filling the panel, with the three paragraphs of its log in clear cream text big enough to read — the first three listed lines, one paragraph each, every word. Panel 3, wide: the deep chamber, a kneeling sage: a tall thin robot on its knees, head bowed, wrapped in a BLACK halo with an ember-red rim; HZD-99 small before it; caption with the fourth listed line. Panel 4: her claws passing through the halo doing nothing; caption with the fifth listed line, complete in this one box. Panel 5, small: she draws the white blade from her back. Panel 6, small: the blade's white light against the black halo, the first cut. No label names the chamber; no text anywhere except the five listed lines, each written once. The chamber has no name written anywhere. Nothing narrates her actions — no caption says what she reaches for or does; panels 5 and 6 have no text at all. She is a small round cat in every panel, never tall.

**Text boxes.**
> One of the wise ones counted our dead from the meadow above. We carried it under when the counting stopped making sense — but its ears were too good, and the song found it even in the rock.
>
> We could not silence it and we would not end it. We sealed it in the deep chamber. It kneels there still, counting the other way.
>
> If you carry clean light, go in to it. It kept one cell charged through everything. It always said somebody would come.
>
> The sage kneels — the song holds its body together. Broken, but not CLEAN.
>
> Claws cannot cleanse the song. The PURIFIER can.

*Cast block:* `cast_sword_v2`

### p26 — §2.16 The first sage, purified

**Shape.** FIVE panels. Panel 1, a strip of four small frames: four cuts of the white blade, and the halo around the kneeling sage going from black to BLUE cut by cut. Panel 2, THE SPLASH, large: the sage rising from its knees inside a clean BLUE halo, and HZD-99 small before it with the white blade lowered, light everywhere; a cream card. Panel 3: the sage holding out one glowing Power Cell to her; a cream card. Panel 4: back at the camp, Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> at his counter with his speech balloon. Panel 5, small and silent: the kingdom's map of rooms with every room lit cyan. The sage is a TALL, THIN kneeling robot — narrow body, long limbs, a hood of dead cables over its head — clearly a different body from Ratchet's round barrel one. Ratchet is the SAME body in every panel he appears in: a big ROUND copper-brass robot with a swollen barrel belly, a domed helmet head with a narrow visor slit, worn tan-and-copper plating, a rack of canisters on his back and the small crystal on a cord at his chest, exactly as the reference — NEVER a slim humanoid robot, never a knight.

**Text boxes.**
> A SAGE, PURIFIED — The song lets go. The sage remembers everything — and gives what it kept for whoever would come with clean light.
>
> THE MEADOW SAGE — It counted every machine that fell in the scrap fields — and kept one power cell safe for whoever came with clean light.
>
> Word crawls up even from the deaf places: a sage knelt down there and STOOD UP clean. My forge did that. You did that. Prices still stand, mind.

*Cast block:* `cast_sword_v2`

### p27 — §2.17 End of the free chapter

**Shape.** ONE full-page image with one cream caption box at the bottom. HZD-99 walks away from the camp, seen from behind, the white blade on her back, the Scrap Meadows behind her lit warm, and ahead of her the way down into the Data Conduits — a dark tunnel mouth threaded with cables and cold blue light. Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> small in the distance at his counter watching her go.

**Text boxes.**
> END OF THE FREE CHAPTER — The Scrap Meadows are behind her. The Data Conduits are not. — Five kingdoms, five more guardians and the Null Core are waiting in the full game.

*Cast block:* `cast_sword`
