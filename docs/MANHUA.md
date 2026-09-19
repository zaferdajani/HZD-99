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
| `nullfang-drawn` | `c4817fa5-2b9d-4977-893d-f362bdb21906` | `source/guardians/drawnA/beast_full.png` — the redrawn ivory lion the game draws (ed.2) |
| `sage-drawn` | `2f1cd043-8ac3-47e4-92b1-2da265ee809b` | `source/cast/drawnA/sage__stand.png` + `sage__pure.png` (ed.2) |
| `wolf-drawn` | `7aed7bd4-8738-4765-b953-d623eea6a359` | `source/cast/drawnA/wolf__wolf.png` (ed.2) |
| `alpha-drawn` | `789ff708-5f77-4196-8bfd-5e180e1584d9` | `source/cast/drawnA/alpha__alpha.png` (ed.2) |
| `chime-drawn` | `57f0d0bf-3b2e-476a-9ac5-2a6afebb0e1d` | `source/cast/drawnA/eye__chime.png` (ed.2) |
| `servo-drawn` | `5549ba09-f898-4022-ab66-5686999059e0` | `source/cast/drawnA/npc__servo.png` + the tracked body from `assets/characters/npc_6yaw.webp` row 1 (ed.2) |
| `guard-drawn` | `cd1f0741-e47a-468f-89ea-3dbf76707b86` | the shield guard, `assets/characters/npc_6yaw.webp` row 7 (ed.2) |
| `NULLFANG` (ed.1 only, retired) | `1922c573-cee1-48fb-aa59-d5f97d14783f` | the art session's older violet-grey element — not what the game draws now |
| `MOTHER-V` | `f541aa62-fd48-49e1-a938-f17ca6c8b810` | the art session's element (`source/mother/`) |
| `purifier-crystal` | `d0a03e79-2887-4bcd-a209-11732c6754ef` | the art session's element (`source/crystal/`) |

Nobody is described from words alone any more (ed.2): every recurring body on a page is an element made from a plate the game ships.

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

**SECOND EDITION (2026-09-19).** The owner refused the first edition on the live page on two counts: *"you are typing the prompts that I receive when I play, such as attack, jump, which is not a conversation written in manhwa"* and *"you are using old enemy characters"*. Both were right. The `manga-writing` skill (`.claude/skills/manga-writing/`) was written first and every page's text rewritten to it — no tutorial chip, item card, price, HUD warning or choice menu on any page; spoken lines, logs, signs and the narrator's cards verbatim; the rest in the narrator's voice or her thoughts. The anchors were rebuilt from the plates the game draws TODAY (the 2026-09-15 redrawn cast): NULLFANG is the ivory lion with violet seams, the wolves and the Alpha are the quilled white-skulled pack, the sage is the hooded violet robe, Chime is the hanging tube-chime, Servo is the tracked dome, and the meadow's guard is the shield door from the machine-folk sheet. Ratchet, the crawler, the gate, the cradle and HZD-99 were already the game's own. All 27 pages refired; the first edition's takes stay in the archive as `*_ed1_asfired.jpg`.

| Page | Scene | Fired (job) | Reviewed | Keyed | Committed |
|---|---|---|---|---|---|
| p01 | Cover | ed.2 `99faa5ee` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p01.webp` | ed.2 |
| p02 | §1 Prologue, shots 1–4 | ed.2 `2acb7565` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p02.webp` | ed.2 |
| p03 | §1 Prologue, shots 5–8 | ed.2 `c7e046df` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p03.webp` | ed.2 |
| p04 | §2.1 The cradle — W1 | ed.2 `5a1963ac` (take 2) | box by box against the text list — passes | `assets/manhua/ch1/p04.webp` | ed.2 |
| p05 | §2.2 The road and the gates — W2 | ed.2 `81aabbe7` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p05.webp` | ed.2 |
| p06 | §2.3 The waking floor — A0 | ed.2 `6782877d` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p06.webp` | ed.2 |
| p07 | §2.4 Ratchet's den — the note and the cell | ed.2 `60b26e80` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p07.webp` | ed.2 |
| p08 | §2.4 Ratchet's den — the kit, the cradle, the pack | ed.2 `c036193f` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p08.webp` | ed.2 |
| p09 | §2.4 Ratchet's den — the errand | ed.2 `e185947b` (take 2) | box by box against the text list — passes | `assets/manhua/ch1/p09.webp` | ed.2 |
| p10 | §2.5 The volt pack — the shop and the two verbs | ed.2 `562d68e9` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p10.webp` | ed.2 |
| p11 | §2.5 tail, §2.6 The meadow — arrival | ed.2 `a54afad8` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p11.webp` | ed.2 |
| p12 | §2.6 The meadow — Old Servo, the first fight | ed.2 `7dfe0f5e` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p12.webp` | ed.2 |
| p13 | §2.7 The hub — NULLFANG: fall, land, wind | ed.2 `15731d2a` (take 2) | box by box against the text list — passes | `assets/manhua/ch1/p13.webp` | ed.2 |
| p14 | §2.7 The hub — the swipe, the watch, the leaving | ed.2 `22276969` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p14.webp` | ed.2 |
| p15 | §2.8 Under the meadow — the buried mouth | ed.2 `77e20036` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p15.webp` | ed.2 |
| p16 | §2.9 The crystal cave — the beacon and the Deaf System's log | ed.2 `242d7cd0` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p16.webp` | ed.2 |
| p17 | §2.9 The crystal cave — the pillar and the shard | ed.2 `f8968ad0` (take 4; text exact; her visor drifted to bare cyan eyes, flagged for the owner) | box by box against the text list — passes | `assets/manhua/ch1/p17.webp` | ed.2 |
| p18 | §2.10 The forging | ed.2 `050c6ac8` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p18.webp` | ed.2 |
| p19 | §2.11 The wings of the meadow | ed.2 `8409c84f` (take 3) | box by box against the text list — passes | `assets/manhua/ch1/p19.webp` | ed.2 |
| p20 | §2.12 The Chime — the Eye's first construct | ed.2 `31a0addd` (take 2) | box by box against the text list — passes | `assets/manhua/ch1/p20.webp` | ed.2 |
| p21 | §2.13 The Alpha's den | ed.2 `c26d3f01` (take 2) | box by box against the text list — passes | `assets/manhua/ch1/p21.webp` | ed.2 |
| p22 | §2.14 The camp | ed.2 `dcc6db60` (take 3) | box by box against the text list — passes | `assets/manhua/ch1/p22.webp` | ed.2 |
| p23 | §2.15 NULLFANG — the fight | ed.2 `545a132e` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p23.webp` | ed.2 |
| p24 | §2.15 NULLFANG — the fork, both branches | ed.2 `00e5af4d` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p24.webp` | ed.2 |
| p25 | §2.16 The grotto, the tunnel, and the sage kneeling | ed.2 `3cbe0143` (take 1) | box by box against the text list — passes | `assets/manhua/ch1/p25.webp` | ed.2 |
| p26 | §2.16 The first sage, purified | ed.2 `8555295e` (take 4) | box by box against the text list — passes | `assets/manhua/ch1/p26.webp` | ed.2 |
| p27 | §2.17 End of the free chapter | ed.2 `e698aefd` (take 2) | box by box against the text list — passes | `assets/manhua/ch1/p27.webp` | ed.2 |

**Keyed 2026-09-19 (second edition).** The first edition was keyed the same morning when the owner found the live reader empty; he refused it on the live page and the second edition replaced every page that afternoon. Review still happens on the live page: a page he refuses goes back to FIRED here and is refired; nothing else changes.

**How the second edition went (2026-09-19).** All 27 pages fired in one batch; 18 stood on the first take, 10 needed more, and two (p17, p26) took four. Every take and its fault is in the archive's `takes` list. The faults were the same three kinds as the first edition — lettering drift (a split caption, a doubled or dropped balloon, a strip name drawn as a label, one sound-effect word), the wrong body (Ratchet standing where Servo should, HZD-99 drawn tall or with a plush face) and, twice, a sword on her back before the forging — and each was answered by naming the exact box and the exact body in the SHAPE paragraph rather than the CAST block. p17's standing take has her visor drifted to bare cyan eyes; its text is exact, so it is keyed and flagged for the owner's refusal rather than fired a fifth time. p21's first take was correct but came back at 848 px, so it was resubmitted unchanged for resolution.

**The PDF (2026-09-19).** `manhua/clawbyte-chapter-one.pdf` is chapter one as one file — 27 pages at 6×9 in, one standing take per page, built from the same masters the reader shows and linked from the reader's header. It is regenerated whenever a page is refired and rekeyed; it is not the review surface (the live reader is), only the copy to send or print.

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

## CHAPTER 1 — THE PANEL SCRIPT (second edition, 2026-09-19)

Rewritten to the `manga-writing` skill after the owner's review: no game UI on any page. Spoken lines, logs, signs and the narrator's cards are the script's words verbatim; every former tutorial chip, item card, price, warning and choice menu is now the narrator's voice or a thought of hers. The SHAPE paragraph is what was fired; the STYLE and CAST blocks are in the prompt archive and identical on every page.

### p01 — Cover

**Shape.** COVER of chapter one — one full-page image, no panel gutters. HZD-99 stands small in the lower third on cracked flagstones, seen from behind at three-quarters, looking up; her red scarf-cape lifts in a wind. Filling the upper two thirds: the enormous city gates <<<da11ff82-f67a-481a-b038-dde9c65f4291>>>, rust-orange doors between teal towers, standing ajar, a shaft of warm light spilling through the gap toward her and the silent machine city silhouetted beyond. Cold dusk sky. She is the only warm shape in the picture. Title lettering at the top in bold white display capitals with a thin cyan outline; the subtitle beneath it in smaller white letters; the chapter line in a cream caption at the very bottom. Three pieces of writing on the page and nothing else.

**Text boxes.**
> CLAWBYTE
>
> A robo-cat metroidvania in the Machine Depths.
>
> CHAPTER ONE — THE SCRAP MEADOWS

*Cast block:* `cast_no_sword`

### p02 — §1 Prologue, film shots 1–4

**Shape.** FOUR panels stacked top to bottom, each with ONE narrator caption along its bottom edge — four captions on the page and nothing else written. Panel 1, wide: KERNEL DEPTHS seen from above — a city of machines, towers and hanging cables, a thousand small cyan lights, and one tall broadcast tower at the centre sending out gentle rings of cyan light. Panel 2: MOTHER-V, <<<f541aa62-fd48-49e1-a938-f17ca6c8b810>>>, the broadcast heart — a radial machine of violet-grey plates around one golden core, no face, singing in soft cyan rings, while below her small machines go about their work content and cyan-lit. Panel 3: the tower from below as its light turns from cyan to red; behind it looms a huge featureless black silhouette with no face, no eyes and no detail of any kind — a shadow only, the evil robot is never seen. Panel 4: a street of machines mid-task, a thin red thread of signal running from one to the next, their eye-lights turning red one after another. There is NO cat anywhere on this page.

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

**Shape.** FOUR panels stacked top to bottom, each with ONE narrator caption along its bottom edge — four captions on the page and nothing else written. Panel 1: a crowd of machines in a plaza, every one of them turned the same way toward the distant tower, stopped mid-gesture, every eye red. Panel 2: the protectors of the kingdoms kneeling in a row under the red light — the ivory robot lion <<<c4817fa5-2b9d-4977-893d-f362bdb21906>>> in front, and behind it a great iron eagle, a bronze pipe-built dragon and a frosted white unicorn — red light behind all their eyes, heads bowed. Panel 3: a dark service bay, one shaft of light; the service cradle <<<8a305cd0-2f5e-490e-bfe9-9e8a006ea0a4>>> with a small white robot cat asleep in it, far too small for the chair, cables plugged into her back, her eye-lights dark. Panel 4, the last: an extreme close-up of her charcoal visor filling the panel as two cyan eye-lights come on — the page ends on her eyes opening.

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

**Shape.** FIVE panels. Panel 1, wide: the dark service bay, the service cradle <<<8a305cd0-2f5e-490e-bfe9-9e8a006ea0a4>>> at the left, one shaft of light from the right side of the room, HZD-99 sitting up in the cradle with cables still plugged into her back, the machine's tool arms letting go of her; no text. Panel 2, small: close on the last umbilical plug coming off her back with a jolt and a spark; no text. Panel 3: she stands up in the cradle that is far too big for her, ears up, looking at the light; one small thought cloud at her head with the first listed line. Panel 4: she walks right toward the light across the empty floor, small in a big dark room; no text. Panel 5, wide: the door at the end of the bay standing open, dust in the light pouring in, her silhouette small in the doorway; one narrator caption with the second listed line. Two boxes on the whole page. Nothing else is in this room — no enemies, no other machines. Her back is BARE: nothing strapped to it, no blade, no hilt, no glowing shape — if a reference shows a weapon, leave it out; she has only her white paws. She is drawn SMALL and ROUND in every panel — stubby legs, head as big as her body, a toy-sized robot cat, never tall, never slim, never long-limbed.

**Text boxes.**
> ...quiet.
>
> The door had been open a long time.

*Cast block:* `cast_no_sword`

### p05 — §2.2 The road and the gates — W2

**Shape.** FOUR panels. Panel 1, wide: outside under a cold sky, a long cracked road running away from us with the city gates <<<da11ff82-f67a-481a-b038-dde9c65f4291>>> small at the far end, HZD-99 tiny on the road; one narrator caption with the first listed line. Panel 2: a fallen rusted beam across the road with a gap beyond it; she is mid-jump over it, scarf streaming, motion lines along her path; no text. Panel 3, tall: the gates HUGE above her, rust-orange doors and teal towers filling the frame, the row of lamps along the lintel, she a small white shape beneath them looking up; one narrator caption with the second listed line. Panel 4, wide: seen from inside the city, the two great doors closing on the empty road behind her, the last light narrowing to a line; she stands with her back to us; one narrator caption with the third listed line. Three captions on the page and nothing else written. Nobody else anywhere.

**Text boxes.**
> The city was standing. It was silent.
>
> The gates were the only monument in the kingdom, and nobody had walked through them in a long time.
>
> They closed behind her. Waking up is one-way too.

*Cast block:* `cast_no_sword`

### p06 — §2.3 The waking floor — A0

**Shape.** SIX panels in three rows of two. Panel 1: a cramped first street inside the gates; one crawler <<<c7adb432-7f01-47d6-9dcc-221fdc5ed13d>>>, a squat four-legged drill machine, standing calm with RED eye-lights; behind it, set into the street wall, the trader's booth <<<2f790258-47df-4a35-acfa-f63415c45486>>> with its torn awning; one narrator caption with the first listed line. Panel 2: she rakes the crawler with her claws — it does not fight back, it only rocks; no text. Panel 3: the crawler breaking apart into a wreck, plates falling; no text. Panel 4: scrap — small bright bits of metal — scattered on the floor and her walking over them, the bits lifting toward her; one narrator caption with the second listed line. Panel 5: close on her paw holding a few bits of scrap, her eyes on them; one narrator caption with the third listed line. Panel 6: the booth door in the street wall swinging open with warm amber light inside, she looking in; one narrator caption with the fourth listed line. Four captions on the page and nothing else written.

**Text boxes.**
> The first machine she ever broke was calm. It did not fight back.
>
> What a broken machine leaves behind is the only money down here.
>
> The trader takes it for repairs, parts and upgrades — so a machine you break is a machine you spend.
>
> A door opened in the wall. Somebody was asleep inside.

*Cast block:* `cast_no_sword`

### p07 — §2.4 Ratchet's den — the note and the cell

**Shape.** FIVE panels. Panel 1, wide: inside Ratchet's den <<<44ecbf7f-0326-418f-9cc9-122391cad46f>>> — the timber workshop under one hanging lamp; Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> the big round copper-brass robot sits DARK and slumped at the bench, eye-lights off; a sleeping pod built into the wall at the corner; a chest at the foot of the bench; HZD-99 small in the doorway; one narrator caption with the first listed line. Panel 2, large: close on a paper tag hanging from his chest plate; the tag itself is drawn big enough to read and its handwriting IS the second and third listed lines, written on the paper in a steady hand, nothing else on it. Panel 3: HZD-99 holding up her one glowing Power Cell — a small cylinder with cyan light — and looking from it to him; one narrator caption with the fourth listed line. Panel 4: her paws pushing the cell into an open port in his chest; no text. Panel 5: close on his domed helmet as two eye-lights come up BLUE; one narrator caption with the fifth listed line. Five pieces of writing on the page and nothing else.

**Text boxes.**
> A tag hung from his chest plate, written in a steady hand.
>
> The broadcast takes every machine that listens. I will not listen — and I will not wait around to change my mind. I have taken out my own cell and hidden it where the rats forget to look.
>
> If you are reading this, the city fell. When it is safe out there — truly safe — put the cell back in. I will do the rest. — R.
>
> One Power Cell would bring him back. She was carrying one.
>
> Ratchet was awake.

*Cast block:* `cast_no_sword`

### p08 — §2.4 Ratchet's den — the kit, the cradle, the pack

**Shape.** FIVE panels. Panel 1: Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>>, awake now with blue eye-lights, hands HZD-99 a small repair kit case across the bench; one narrator caption with the first listed line. Panel 2: he gestures with an open hand at the sleeping pod built into the den wall <<<44ecbf7f-0326-418f-9cc9-122391cad46f>>>; his speech balloon with the second listed line. Panel 3: he taps his counter, a shelf behind him with a small charger pack on it; his speech balloon with the third listed line. Panel 4: close on HZD-99 listening, ears forward, a faint empty ring of light drawn above her head; his speech balloon, tail leading out of frame to him, with the fourth listed line. Panel 5, small and silent: only his hand, reaching sideways for a tool that is not on the bench — the tic — no text in this panel. One caption and three balloons on the page and nothing else written; each balloon holds its whole line once, unbroken, no phrase repeated.

**Text boxes.**
> He gave her a repair kit. It would patch two cores.
>
> See that cradle in the corner? Built it into the wall myself. Step in and it remembers you — everything you are, kept safe — and it patches your plating while you stand there. Use it. That is what it is for.
>
> And when you have scrap, come to my counter. I keep a volt pack — my own charger, cut down to your size. It wires that ring at the top of you to something useful.
>
> Hits you land charge the ring. With the pack in you, you can SPEND it: hold HEAL to mend a core, or hold ATTACK and let go for a burst from your claws. The ring is empty now — go earn some.

*Cast block:* `cast_no_sword`

### p09 — §2.4 Ratchet's den — the errand

**Shape.** FIVE panels, one speech balloon each, Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> speaking to HZD-99 in his den <<<44ecbf7f-0326-418f-9cc9-122391cad46f>>>. Panel 1: close on the small crystal glowing white on its cord at his chest, his hand touching it. Panel 2, tinted red like a memory: Ratchet alone in the dark den, frightened, pulling his own cell out of his chest, the red song-light at the window. Panel 3: he points off-panel; inset, a rock opening in a hillside of scrap under sky — an irregular cave mouth, never a door. Panel 4: inset drawing of a white crystal pillar in the dark with a small cat beside it, claws crackling. Panel 5: he lays a hand on his bench and looks at her, blue eyes steady. EXACTLY five balloons on the page, one per panel, in the order listed; each complete and unbroken; nothing else written. Her back is BARE: nothing strapped to it, no blade, no hilt, no glowing shape — if a reference shows a weapon, leave it out; she has only her white paws. She is drawn SMALL and ROUND in every panel — stubby legs, head as big as her body, a toy-sized robot cat, never tall, never slim, never long-limbed. In the panel 4 inset she charges her BARE claws beside the pillar — no sword, no blade.

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

**Shape.** SIX panels in three rows of two. Panel 1: Ratchet's counter in the den with a hanging wooden sign; the sign's own painted letters read the first listed line and nothing more; Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> behind it; HZD-99 tipping her handful of scrap onto the counter. Panel 2: the small charger pack clicking into a port in HZD-99's back, Ratchet's hands fitting it; one narrator caption with the second listed line. Panel 3: she stands still with cyan light knitting a cracked plate on her body closed; one narrator caption with the third listed line. Panel 4: THE FIRST SURGE — she braces, jagged cyan-white arcs of current running her chassis from foot to ear, the air around her hazed, sparks thrown off the frame — no rings, no circles; one narrator caption with the fourth listed line. Panel 5: the release — her claws sweep out in a full circle of white-cyan light, an impact frame, high contrast; no text. Panel 6, small: above her head, the ring of charge — empty, then a sliver filling — Ratchet watching from behind the counter; one narrator caption with the fifth listed line. One sign and four captions on the page and nothing else written.

**Text boxes.**
> Ratchet's Emporium
>
> Everything she had bought one thing: Ratchet's charger, wired into her.
>
> Now the sparks she knocked out of machines were hers to spend. Held still, they mended a core.
>
> Held in the claw, they built.
>
> From this day she could mend herself, and she could burst. The ring was empty again. She would go and earn some.

*Cast block:* `cast_no_sword`

### p11 — §2.5 tail, §2.6 The meadow — arrival

**Shape.** FIVE panels. Panel 1: back on the waking street, a tall dark obelisk-like Mind Node with a glowing cyan sigil, HZD-99 touching it; one narrator caption with the first listed line. Panel 2: a small glowing tree of cyan nodes floating in front of her, one node lit; one narrator caption with the second listed line. Panel 3: the street's exit to the right, her walking toward it; no text. Panel 4, wide, no text: THE SCRAP MEADOWS — fields of rusted machine scrap under a cold open sky, gantries hanging on cables high above, and a winding house: a teal A-frame with a torn canvas roof and a huge cable drum. Panel 5: OLD SERVO <<<5549ba09-f898-4022-ab66-5686999059e0>>>, the squat domed old robot, sitting DARK with his lower half sunk into the winding drum; HZD-99 in front of him holding her one spare Power Cell, undecided; one thought cloud at her head with the third listed line. Two captions and one thought on the page and nothing else written.

**Text boxes.**
> A node in the street asked her a riddle, and she answered it. It was the first thing down here that had wanted her to think.
>
> Something in her grew a branch.
>
> One cell. Him, or later?

*Cast block:* `cast_no_sword`

### p12 — §2.6 The meadow — Old Servo, the first fight

**Shape.** SIX panels. Panels 1 to 5 are Old Servo <<<5549ba09-f898-4022-ab66-5686999059e0>>> speaking — the squat domed old robot with a thin antenna and two rectangular AMBER eyes now lit, his lower half sunk into the great cable drum of the winding house behind him — one speech balloon per panel, HZD-99 listening small in front of him. Panel 1: his eyes lighting amber as her cell goes in. Panel 2: he mimes with his one claw arm. Panel 3: he taps her chest plate. Panel 4: he looks past her at the scrap fields. Panel 5, wide: he looks back over his shoulder at the gantries strung high above the meadow and the drum he is part of. Panel 6, wide, the first real fight, no text: a red-eyed crawler <<<c7adb432-7f01-47d6-9dcc-221fdc5ed13d>>> coming at her, and beyond a rise of scrap the shield guard <<<cd1f0741-e47a-468f-89ea-3dbf76707b86>>> — a squat unit behind a tall riveted steel door with a red slot-light and hazard stripes — rising over the crest; she crouches with claws out. EXACTLY five balloons on the page, one per panel in panels 1 to 5, each complete and unbroken, no word repeated; nothing else written.

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

**Shape.** FIVE panels, NO TEXT AT ALL on this page — not one word, not one letter. Panel 1, wide: the widest room of the kingdom, HZD-99 on a crest of scrap, and to the east (the right) a vista of the silent machine city under a cold sky. Panel 2, tall: NULLFANG <<<c4817fa5-2b9d-4977-893d-f362bdb21906>>>, the ivory armoured robot lion with violet seams, dropping out of the sky to the right of her, motion lines straight down, red light behind its eyes. Panel 3, wide and EMPTY of motion: it has landed; dust settling; she frozen small at the left, the lion at the right, nothing moving — a silent beat. Panel 4: it walks up to her; her head is level with its paw; she does not move. Panel 5, tall and narrow: its great paw raised over her and HELD, claws out, an amber glint along the edge — the wind-up held a hair too long. She stays screen-left, the lion screen-right, in every panel. She is drawn SMALL and ROUND in every panel — stubby legs, head as big as her body, a toy-sized robot cat, never tall, never slim, never long-limbed. Her back is BARE: nothing strapped to it, no blade, no hilt, no glowing shape — if a reference shows a weapon, leave it out; she has only her white paws.

**Text boxes.** none — the page is silent.

*Cast block:* `cast_no_sword`

### p14 — §2.7 The hub — the swipe, the watch, the leaving

**Shape.** Panel 1, a thin strip across the top: THE IMPACT FRAME — the swipe — almost pure white, high contrast, the shapes of the paw and the cat abstracted to slashes, no detail, no text. Panel 2, THE SPLASH, most of the page: NULLFANG <<<c4817fa5-2b9d-4977-893d-f362bdb21906>>>, the ivory lion, red-eyed, standing over the small white cat lying on her side where she landed in the scrap, looking down at her; focus lines radiate from the lion's head; she is tiny under it, one ear bent, eyes narrowed but lit; one narrator caption in the lower corner with the first listed line. Panel 3, small inset lower left: the lion turning away, bored, coiling; no text. Panel 4, small inset lower right: it bounding away east, already far, dust behind it; one narrator caption with the second listed line. Panel 5, a strip at the bottom: a small round portrait of Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> beside his speech balloon with the third listed line. Two captions and one balloon on the page and nothing else written.

**Text boxes.**
> It took one core. Never her last.
>
> She was nothing to it. It got bored of her.
>
> It threw you once. The corridor still has the dent. Go and put one in it.

*Cast block:* `cast_no_sword`

### p15 — §2.8 Under the meadow — the buried mouth

**Shape.** FIVE panels. Panel 1, tall: HZD-99 falling through a brittle floor that has just given way under the hub, dust and plates falling with her, into a dark chamber below; no text. Panel 2: a glowing terminal screen in the dark; the screen's own green lettering reads the first listed line and nothing more. Panel 3: a pile of fallen rock in the chamber wall, and she stands before it with an ear turned to it; one narrator caption with the second listed line. Panel 4: she strikes the pile with her claws, rocks shifting; one narrator caption with the third listed line. Panel 5, wide: the rock gives way and an irregular CAVE MOUTH opens — a ragged hole in the rock, never a door, cold mist breathing out of it, a faint glow deep inside; one narrator caption with the fourth listed line. One screen and three captions on the page and nothing else written.

**Text boxes.**
> MAINTENANCE LOG 0x2F: sub-hatch sealed after an anomalous signal. If found — do not answer it.
>
> Something was calling from behind the fallen rock.
>
> The pile shifted. The sound behind it came closer.
>
> The rock gave way. The tunnel was open, and it was breathing.

*Cast block:* `cast_no_sword`

### p16 — §2.9 The crystal cave — the beacon and the Deaf System's log

**Shape.** FIVE panels; the lower half of the page is the log. Panel 1: a carved rock cavity with daylight from the cave mouth behind her, HZD-99 walking in; no text. Panel 2, small: a side tunnel behind rubble with a simple metal bench in it; no text. Panel 3, wide and dark: the long middle of the cave, she tiny, only her eye-lights and scarf catching light; no text. Panel 4: THE BEACON — an old squat signal machine set into the rock, one slow amber lamp, cables into the stone; one narrator caption with the first listed line. Panel 5, large: the beacon's log as a terminal screen — a dark box with the heading line written ONCE at its top and the three paragraphs below it in clear cream monospace, big enough to read, every word. One caption and one screen on the page; nothing else written; no description of anything is ever written on the page.

**Text boxes.**
> THE SOUND HAD A SOURCE. It had been calling into the rock for a long time, and nothing was ever listening.
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

**Shape.** SIX panels. Panel 1: at the end of the dark, two red-eyed crawlers <<<c7adb432-7f01-47d6-9dcc-221fdc5ed13d>>> and HZD-99 fighting them with her claws; no text. Panel 2, tall: THE PILLAR — a white crystal pillar growing from black rock, three spires, glowing softly from within, taller than she is; she stands beside it; one narrator caption with the first listed line. Panel 3: her claws glancing off the crystal with a spark; one narrator caption with the second listed line. Panel 4: the storm on her chassis — jagged cyan-white arcs foot to ear, hazed air, sparks, no rings; no text. Panel 5: the burst shatters the pillar; a bright shard falling toward her paws; one narrator caption with the third listed line. Panel 6, dark: her AURA coming on — she glows white in the black cave, and at the edges two crawler shapes read as PURPLE outlines; one narrator caption with the fourth listed line. Four captions on the page and nothing else written. Her face is always the charcoal visor with two cyan eye-lights and no mouth, exactly as the reference — never a plush cat face. She is drawn SMALL and ROUND in every panel — stubby legs, head as big as her body, a toy-sized robot cat, never tall, never slim, never long-limbed. Her back is BARE: nothing strapped to it, no blade, no hilt, no glowing shape — if a reference shows a weapon, leave it out; she has only her white paws. The second listed line is ONE caption box in panel 3, written once and complete — never two boxes, never split at its full stop. Four cream boxes on the whole page, no more. NO sound-effect words anywhere — no CHING, no CRACK, no lettering drawn in the art; the spark in panel 3 is drawn, not written.

**Text boxes.**
> The stone Ratchet wore had come from here.
>
> Her claws glanced off the pure crystal. Only the burst the pack had given her could crack it.
>
> A shard fell. Ratchet could forge this into something the song would fear.
>
> Carrying it, she could see what things were. Hostiles read purple. She read white.

*Cast block:* `cast_no_sword`

### p18 — §2.10 The forging

**Shape.** FIVE panels. Panel 1: back in Ratchet's den <<<44ecbf7f-0326-418f-9cc9-122391cad46f>>>, HZD-99 holds up the glowing white shard; Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> leans over the bench, blue eyes wide; his speech balloon with the first listed line. Panel 2, wide: the forging — sparks flying, his hands at an anvil shaping white crystal in a blaze of light, her watching with ears back; no text, no label. Panel 3: THE PURIFIER <<<d0a03e79-2887-4bcd-a209-11732c6754ef>>>, the white crystal sword with a gold connector ring at the pommel, lying finished on the bench under the lamp; one narrator caption with the second listed line. Panel 4, small: a floating tree of cyan nodes with one NEW branch growing and lighting; no text. Panel 5: she — the SAME small round cat as in panels 1 and 2, no taller than Ratchet's knee — stands with the white blade strapped across her small round back; Ratchet's speech balloon with the third listed line. Two balloons and one caption on the page and nothing else written; she has no balloon anywhere.

**Text boxes.**
> The pillar shard! Hold still — sparks now — and let the song learn what fear is. The PURIFIER is yours.
>
> A white crystal shaped like a sword. It hummed against the Eye's static — and its handle had been made to CONNECT to something.
>
> That blade on your back is the best work these hands ever did. Something under this kingdom is still singing — go and let it meet my crystal.

*Cast block:* `cast_sword`

### p19 — §2.11 The wings of the meadow (optional errands)

**Shape.** THREE horizontal strips, each strip two panels. Strip 1, THE GANTRIES: gantries on cables high over the meadow with a loose coil of cable hanging; Old Servo <<<5549ba09-f898-4022-ab66-5686999059e0>>> sunk in his cable drum with a speech balloon (first line); then HZD-99 handing him the coil and his second balloon (second line). Strip 2, THE DEAF SYSTEM'S POCKET, no text: she breaks through a brittle rock plug into a small pocket with an old terminal and a single coin of salvage, nothing alive in it. Strip 3, THE SHAFT: a shaft straight down into the dark, she standing in it at the bottom looking up at a far pinpoint of light, with Ratchet's <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> balloon (third line) tailing in from off-panel; then Ratchet at his bench handing her a small thing, his balloon (fourth line). Four balloons on the page and nothing else written. She is a small round cat in every panel, never tall. The strips carry NO titles and NO labels — the words THE GANTRIES, THE DEAF SYSTEM’S POCKET and THE SHAFT are stage directions for the artist and must NOT be written on the page; the only writing on the page is the four balloons. OLD SERVO is a squat GREY-STEEL DOMED robot with a thin antenna and two rectangular AMBER eyes, his lower half sunk into a great wooden cable drum, exactly as his reference — he is NOT Ratchet and is not copper; Ratchet appears ONLY in the last strip. The first and second listed lines are SERVO’S: white SPEECH balloons with tails to Servo’s dome, never thought clouds, never hers.

**Text boxes.**
> A coil shook loose in the gantries above us. I cannot climb any more.
>
> That is the one. Take this — I have no use for it and you will.
>
> There is a shaft under the meadow nobody has stood in since the fall. See it for me.
>
> You stood in it. Nobody has, in a long time. Here.

*Cast block:* `cast_sword`

### p20 — §2.12 The Chime — the Eye's first construct

**Shape.** FIVE panels. Panel 1, tall: HZD-99 climbing a stack of scrap and girders above the hub; no text. Panel 2, wide: an arena at the top under sky; hovering in it, CHIME <<<57f0d0bf-3b2e-476a-9ac5-2a6afebb0e1d>>> — not an animal but an INSTRUMENT: a riveted steel bracket on a chain with five glass tubes of pale green light hanging beneath it, ringing, rings of sound coming off it; one narrator caption with the first listed line. Panel 3: it rings and drops toward her; she leaps and cuts it with the white blade; no text. Panel 4: it lies broken on the arena floor, dark and empty, its tubes shattered; one narrator caption with the second listed line. Panel 5: the small Power Cell it was built around lying in the wreck, her paw reaching for it; one narrator caption with the third listed line. Three captions on the page and nothing else written. Her chassis is plain IVORY in every panel — no red stripes, no red markings on the body; only the red scarf-cape is red. Her face is the charcoal visor with two cyan eye-lights. She is drawn SMALL and ROUND in every panel — stubby legs, head as big as her body, a toy-sized robot cat, never tall, never slim, never long-limbed.

**Text boxes.**
> It was singing at her.
>
> Destroyed. There was nobody in it.
>
> A guardian is a machine that was infected. This was not. It had been MADE by the source of the Song, and there was nothing under the virus to give back.

*Cast block:* `cast_sword`

### p21 — §2.13 The Alpha's den

**Shape.** FIVE panels. Panel 1, wide: a den on the road — a clean floor with heaps of dead machine hulks at both ends; a pack of robot wolves <<<7aed7bd4-8738-4765-b953-d623eea6a359>>> with white skull heads, steel quills and red-glowing ribs; one narrator caption with the first listed line. Panel 2, tall: THE ALPHA <<<789ff708-5f77-4196-8bfd-5e180e1584d9>>> — the horned white-skulled wolf far bigger than the pack, spiked spine, mace-ball tail — leaping at her, jaws open; she rolls under it; no text. Panel 3: the fight — her white blade against its claws, sparks, motion lines; no text. Panel 4: the Alpha lowering its horned head to her, yielding; its eyes and ribs going from red to cyan; one narrator caption with the second listed line. Panel 5, wide: the pack sitting around her, calm, cyan-eyed, and an irregular cave mouth opening in the den wall behind them; one narrator caption with the third listed line. The Alpha and the wolves carry nothing — no weapons; they fight with jaws and claws only. Three captions on the page and nothing else written.

**Text boxes.**
> The pack answered to this.
>
> It yielded. Every wolf in the machine world knew it now — they would not raise a tooth to her again.
>
> The first thing she won was not a kill. The pack had never been the Song's; it was a pack, and it answered to whoever stood.

*Cast block:* `cast_sword`

### p22 — §2.14 The camp

**Shape.** SIX panels. Panel 1, wide: the camp — a metal bench, a small fire in a drum, and Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> at a second counter under a torn awning in the meadow; one narrator caption with the first listed line. Panels 2, 3 and 4: Ratchet at his counter, one speech balloon each (second, third and fourth lines), HZD-99 in front of him with the white blade on her back; his posture changes — arms folded, then leaning in, then open-handed. Panel 5, no text: a vault of iron spikes under the camp, reached through a broken cellar floor, a star-shaped fragment glowing at its far end. Panel 6: her empty white husk standing in the meadow and Ratchet passing it; his speech balloon with the fifth line. One caption and four balloons on the page, each complete and unbroken — panel 4's balloon begins with the words 'Take what you need.' Nothing else written. Panel 6’s fifth line is RATCHET SPEAKING: a white speech balloon with its tail to Ratchet’s helmet, never a thought cloud, never hers; Ratchet is copper in panel 6 as in every panel. Her chassis is plain ivory. She is drawn SMALL and ROUND in every panel — stubby legs, head as big as her body, a toy-sized robot cat, never tall, never slim, never long-limbed. Five text boxes on the page and none skipped: panel 1 the caption, panel 2 the balloon beginning ‘Cat-frame’, panel 3 the balloon beginning ‘Heard the Meadows’, panel 4 the balloon beginning ‘Take what you need’, panel 6 the balloon beginning ‘You came back’.

**Text boxes.**
> The trader was open for business.
>
> Cat-frame. Cute. Don't touch the stock with those claws.
>
> Heard the Meadows went quiet. Heard it was you. Prices stand, mind.
>
> Take what you need. I salvage from the dead, and you keep making fewer of them.
>
> You came back. Your husk was still warm when I passed it.

*Cast block:* `cast_sword`

### p23 — §2.15 NULLFANG — the fight

**Shape.** SIX panels. Panel 1, wide: the lair at the end of the kingdom — a wide scrap arena under a dark sky; one narrator caption with the first listed line. Panel 2: NULLFANG <<<c4817fa5-2b9d-4977-893d-f362bdb21906>>>, the ivory lion with violet seams, facing her, red-eyed, head low; one narrator caption with the second listed line. Panel 3: the fight — it leaps, she slides under with the white blade up, sparks off its plating; no text. Panel 4: faster now — it stalks low, crouches short, chains two leaps in one panel with motion lines; no text. Panel 5: it staggers, dazed, head shaking; she runs in striking; one narrator caption with the third listed line. Panel 6, wide: it kneels, plating cracked, red light dimming, still looking at her; she stands small before it with the blade lowered; one narrator caption with the fourth listed line. Four captions on the page and nothing else written.

**Text boxes.**
> NULLFANG, THE VIRUS BEAST.
>
> It remembered the corridor.
>
> It reeled. This was the moment.
>
> NULLFANG was down. It was still looking at her.

*Cast block:* `cast_sword`

### p24 — §2.15 NULLFANG — the fork, both branches

**Shape.** The page splits into TWO COLUMNS below a top strip. Top strip, wide: NULLFANG <<<c4817fa5-2b9d-4977-893d-f362bdb21906>>> kneeling, red light dimming, and HZD-99 before it with the blade half raised — the held beat; one narrator caption with the first listed line. LEFT COLUMN, two panels: the white blade laid against the lion and white light pouring through its plating, the red draining out of its eyes to CYAN, with a narrator caption (second line); then the freed lion, cyan-eyed, standing beside her, with a narrator caption (third line). RIGHT COLUMN, two panels: she closes the distance and lands the blow, an abstract impact frame, with a narrator caption (fourth line); then her alone with the lion's fang held in her paw, with a narrator caption (fifth line). Bottom strip across both columns: the ground of the lair splitting and an irregular cave mouth opening; one narrator caption with the sixth line. Six captions on the page, no arrows, no boxes with headings, nothing else written.

**Text boxes.**
> Every guardian kneels before it dies. What she did first would echo loudest.
>
> If she cut the virus out, it would live, and it would owe her.
>
> The virus was destroyed. NULLFANG was free. He seemed to like her, and once in every room the blow that would have broken her came out of the dark and roared them off her instead.
>
> If she ended it, she would take its strength for her own.
>
> She took what it had. Every strike she landed from here would hit harder, forever.
>
> The ground shifted. A cave mouth had opened in the lair.

*Cast block:* `cast_sword`

### p25 — §2.16 The grotto, the tunnel, and the sage kneeling

**Shape.** SIX panels. Panel 1, small: a grotto of rock behind the lair with a metal bench, and beside it a tunnel with a small bat-machine hanging from the roof; no text. Panel 2, LARGE, the top half of the page: the tunnel's terminal as a dark screen filling the panel, its own cream monospace lettering carrying the first three listed lines as three paragraphs, every word. Panel 3, wide: the deep chamber — the sage <<<2f1cd043-8ac3-47e4-92b1-2da265ee809b>>>, the tall thin robot in the ragged violet hooded robe, on its knees, head bowed, wrapped in a BLACK halo with an ember-red rim; HZD-99 small before it; one narrator caption with the fourth listed line. Panel 4: her claws passing through the halo doing nothing; one narrator caption with the fifth listed line. Panel 5, small: she draws the white blade from her back; no text. Panel 6, small: the blade's white light against the black halo, the first cut; no text. One screen and two captions on the page; no label names the chamber; nothing narrates her drawing the sword; nothing else written. She is a small round cat in every panel, never tall.

**Text boxes.**
> One of the wise ones counted our dead from the meadow above. We carried it under when the counting stopped making sense — but its ears were too good, and the song found it even in the rock.
>
> We could not silence it and we would not end it. We sealed it in the deep chamber. It kneels there still, counting the other way.
>
> If you carry clean light, go in to it. It kept one cell charged through everything. It always said somebody would come.
>
> The sage knelt. The song held its body together. Broken, but not CLEAN.
>
> Claws could not cleanse the song. The PURIFIER could.

*Cast block:* `cast_sword`

### p26 — §2.16 The first sage, purified

**Shape.** FIVE panels. Panel 1, a strip of four small frames: four cuts of the white blade, and the halo around the kneeling sage <<<2f1cd043-8ac3-47e4-92b1-2da265ee809b>>> going from black to BLUE cut by cut; no text. Panel 2, THE SPLASH, large: the sage rising from its knees inside a clean BLUE halo, hood falling back from its slit steel face, and HZD-99 small before it with the white blade lowered, light everywhere; one narrator caption with the first listed line. Panel 3: the sage holding out one glowing Power Cell to her in its thin black hand; one narrator caption with the second listed line. Panel 4: back at the camp, Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> at his counter with one speech balloon holding the whole third listed line, unbroken. Panel 5, small and silent: the kingdom's map of rooms with every room lit cyan; no text. Two captions and one balloon on the page and nothing else written. She is drawn SMALL and ROUND in every panel — stubby legs, head as big as her body, a toy-sized robot cat, never tall, never slim, never long-limbed. In the splash she is a small round cat at the sage’s knee, not a tall figure. The second listed line is ONE caption box in panel 3, written once and complete — never two boxes, never a shortened version. Exactly three text boxes on the page: two captions and one balloon. Ratchet’s third listed line is ONE balloon in panel 4, from ‘Word crawls up’ to ‘mind.’ with no break — never two balloons.

**Text boxes.**
> The song let go. The sage remembered everything — and gave what it had kept for whoever would come with clean light.
>
> It had counted every machine that fell in the scrap fields — and kept one power cell safe for whoever came with clean light.
>
> Word crawls up even from the deaf places: a sage knelt down there and STOOD UP clean. My forge did that. You did that. Prices still stand, mind.

*Cast block:* `cast_sword`

### p27 — §2.17 End of the free chapter

**Shape.** ONE full-page image with one narrator caption at the bottom. HZD-99 walks away from the camp, seen from behind, the white blade on her back, the Scrap Meadows behind her lit warm, and ahead of her the way down into the Data Conduits — a dark tunnel mouth threaded with cables and cold blue light. Ratchet <<<795a5cd6-b404-4623-bcc9-2b32351d71ab>>> small in the distance at his counter watching her go. One caption and nothing else written. She is drawn SMALL and ROUND in every panel — stubby legs, head as big as her body, a toy-sized robot cat, never tall, never slim, never long-limbed. Seen from behind she is a small round cat with short legs and a big head, the blade nearly as long as she is tall.

**Text boxes.**
> END OF THE FREE CHAPTER — The Scrap Meadows are behind her. The Data Conduits are not. — Five kingdoms, five more guardians and the Null Core are waiting in the full game.

*Cast block:* `cast_sword`
