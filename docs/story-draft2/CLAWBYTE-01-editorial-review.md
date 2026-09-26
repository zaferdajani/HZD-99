# CLAWBYTE: editorial review and rebuild decisions

Prepared 19 September 2026. The page-specific findings concern the original supplied PDF. Revised direction: read CLAWBYTE-00-story-foundation.md first; the owner’s subsequent clarification governs the peaceful robot planet, older sleeping hero, inherited marble and Ratchet’s own hidden battery. These drafts do not claim the published game or comic has been changed.

## Verdict

The premise is worth keeping: a small repair cat wakes after a beloved song has become an instrument of control, and must learn to free machines that are trying to kill her. It offers tenderness, frightening action, a memorable visual contrast, and a natural relationship between combat and music.

The present chapter does not develop that premise into enough drama. It mainly records a sequence of game events. The heroine travels, receives instructions, collects upgrades, and wins fights whose decisive discoveries often happen between panels. The problem is not simply insufficient action. It is insufficient causality, character agency, and payoff within the action.

The artwork has individual strengths: the scale of the gate, warm workshop interiors, the small cat against industrial ruins, and the first looming lion encounter. Those strengths cannot compensate for identities changing between shots. A reader must recognize a character before interpreting an expression or a threat.

## Evidence and limits

- Visually reviewed all 27 pages of the supplied `clawbyte-chapter-one.pdf`. Page references below count the cover as page 1.
- Connected through the GitHub plugin to `zaferdajani/HZD-99`, branch `claude/clawbyte-repo-migration-byhyl8`.
- Pinned the substantive source inspection to commit `7356d362af556307a6f18ee1378703ef6dadbcf6`; files were also fetched locally for targeted source review. This is a source snapshot, not a live gameplay test.
- Read the canon, story script, sword progression, manhua ledger and production notes; inspected `js/weapons.js`, `js/quests.js`, relevant `js/game.js` sections, and the guardian-choice code in `js/braid.js`.
- Inspected the hero's canonical reference image, its runtime state strip, and Ratchet's runtime portrait. The very wide hero strip is useful for broad identity comparison, not a frame-by-frame animation audit.
- The PDF and repo PDF have the same reported byte length; no byte-for-byte comparison was performed. Conclusions about the supplied PDF do not depend on assuming they are identical.
- At the time refs were inspected, `odyssey` matched the inspected integration commit; `main` pointed to `c274dd53610e813d78b82296311400017ebcf4f2`. Their ancestry and content equivalence were not established. No branches were changed or synchronized.

Current user direction explicitly allows restructuring. Older production notes requiring a literal transcription of game dialogue are background to the failure, not a constraint on this rewrite. Proposed additions are labeled as such throughout the companion documents.

## Page-by-page diagnosis

| PDF pages | What is visible | Why it weakens the chapter | Replacement decision |
|---|---|---|---|
| 1 | A gate, a small cat, and a genre subtitle | It sells the product category before a dramatic question | Keep the scale contrast; use a story title and an image of a difficult rescue |
| 2–3 | The narrator explains the world, villain, infection and hero's mission before she acts | Gives away the situation without first making the reader want an answer; the villain is a generic silhouette | Following the owner’s clarification, first show the peaceful morning through the approved cast; then show the song corrupting those same actions, with deeper motives revealed later |
| 4–5 | Waking, walking, jumping, approaching the gate | Attractive atmosphere, but little personal intent or change across two pages | Give her a tiny repair task, then let that habit lead her toward someone who needs help |
| 6 | She destroys a calm, nonresisting machine for spending money | Establishes predation as her first meaningful act in a rescue story, with no emotional reckoning | Teach attack through a threatening mechanism or active attacker; obtain first purchase money from recoverable industrial scrap |
| 7 | She spends a cell to wake Ratchet | This is the opening's strongest usable character choice | Make finding Ratchet’s own hidden battery a readable workshop task, then let the hero choose to wake him |
| 8–10 | Ratchet explains the cradle, ring, heal, attack, cave, crystal and purchase | Too many systems in one conversation. “Hold HEAL,” “hold ATTACK,” and “press UP” belong in a game interface | Retain the purchase and its two abilities, but demonstrate them through mistakes, a physical gauge and concise dialogue |
| 8, 10 | A floating ring appears above the cat | A HUD metaphor becomes apparent anatomy, adding another identity variable | Keep charge visualization in an approved physical indicator and VFX; do not invent a halo for the hero |
| 11 | A caption says she solved a riddle, but the riddle is absent | The reader is told she is clever without participating in the discovery | Show a readable environmental problem and evidence before its answer |
| 11–12 | Servo's head, face and body presentation change; dialogue gives keyboard and phone instructions | Breaks both visual identity and immersion | Lock Servo's approved model; make his expertise useful to an obstacle |
| 13–14 | NULLFANG intimidates, strikes and leaves | Good scale and anticipation, but “boredom” explains away a survival that could be meaningful | His unfinished protective behavior causes the cat's escape; a damaged restraint becomes a later clue |
| 13–14 | Lion changes from flowing pale mane to angular plated mane; tail and armor treatment also shift | A single encounter appears to switch designs | One current lion model, including mane shape and tail construction, for every panel |
| 15–17 | Cave traversal, a long terminal log, crystal collection and aura unlock | Discovery is delivered as a lecture; the useful rule is not tested dramatically | Show the quiet refuge working; put the cat between one charge for healing and one charge for quarrying |
| 17 | Hero loses her black visor and gains a feline face with luminous eyes and a mouth | An unmistakable model break in a major power moment | Reject the affected panels; illumination must not remodel the face |
| 18 | Finished sword appears before the forging panel; connector foreshadowing is stated in a caption | The causal reading order is muddy, and the text supplies the mystery | Forge first; show the empty socket without explaining its future solution |
| 19 | Several optional errands occupy one montage page | Adds locations and rewards without changing the main problem | Keep side stories playable; retain an errand in the comic only when it changes a relationship or the climax |
| 20 | CHIME is introduced, struck and destroyed in a single page | No failed approach, counterattack, discovery, or earned reversal | Use CHIME as the active relay in a multi-stage rescue fight |
| 21 | Alpha attacks, clashes, yields; a caption explains pack allegiance | Important relationship is awarded almost instantly; red-to-cyan imagery contradicts the claim that this pack was never infected | Give the pack a separate optional story about cooperation; distinguish aggression from infection visually |
| 22 | Multiple later shop lines and a death-husk reference appear in one montage | Time passage and the implied death are not dramatized | Use one workshop return with a changed relationship; explain death mechanics in play, not an unexplained comic aside |
| 23 | NULLFANG's main fight occupies one page | Many poses, little tactical cause and effect; spatial relationships are difficult to follow | Establish the arena, repeat a readable tell, make the first plan fail, and use a learned fact to create the opening |
| 23 | Hero again appears with a feline face rather than the black visor | The climax loses the protagonist's identity | Same identity gate as page 17 |
| 24 | Spare and kill are both shown; next image continues with the lion alive | The heroine never visibly commits to one narrative; the payoff reads as a comparison screen | Book takes one rescue outcome; alternative game routes belong outside the linear chapter |
| 25–26 | Sage is purified through four repeated cuts and gives a cell | A kingdom protector functions mainly as a reward dispenser | Sage supplies knowledge, takes responsibility and performs an action that changes the kingdom |
| 26–27 | Ratchet's face changes again; ending advertises more content | Weak continuity followed by a purchase boundary instead of a dramatic turn | Close with local restoration and a new message from the actual antagonist; place a discreet game invitation after the story |

## What the source inspection adds

### The story script is already out of sync with code

`docs/STORY_SCRIPT.md` presents a guardian spare/kill fork. In the inspected `js/braid.js`, `const TAME_ONLY = true` causes `brOffer` to create an automatic mercy answer and call `brAnswer('L')`. The alternate machinery remains, but that does not make it an active player choice. The PDF's two outcomes misrepresent this snapshot.

The script's own section 8 records unresolved issues: the evil robot is never confronted, the provenance of Kerf's divided purifier needs clarification, Mother's identity is conflated with the Null Core, and ordinary infected machines are not actually rescued by the same system used for sages. These are structural gaps, not details that better drawings can fix.

`js/weapons.js` does explicitly distinguish ownership of single, dual and joined weapons. Joined requires both swords and a connector; the rewrite preserves that separation. `js/quests.js` contains the crystal-fetch/forge quest. The revised story keeps its causal foundation rather than introducing a weapon before it is earned.

### The production process is testing the wrong things

The manhua ledger describes the second edition as removing tutorial language. Pages 8, 9 and 12 of the supplied PDF visibly retain it. The ledger also has review entries described as “box by box against the text list — passes.” That verifies a narrow property, not character continuity, narrative quality, or owner acceptance.

References were already supplied to generation. Therefore “add reference images” is an incomplete remedy. The missing step is rejection of outputs that fail the references, followed by consistent panel repair and a review of the entire sequence.

Do not assume every bad panel came from an obsolete asset. Some are unmistakably inconsistent renderings of an intended current character. The ledger identifies the first-edition NULLFANG element as retired, but establishing which reference produced every defective panel requires prompt/job provenance. The visible defects alone do not prove the exact source of the drift.

## The new dramatic foundation

**Story question:** Can a machine built to fix things learn that saving someone is different from deciding what they should be?

**Immediate desire:** HZD-99 wants an answer from another living machine. She starts by repairing whatever is in front of her because that is the only useful response she knows.

**Flaw:** She treats every malfunction as something she personally must fix, even when she lacks knowledge or the other person wants something else.

**Change:** She learns to ask, trust, and share the work. Her size matters because she can reach places others cannot; it does not make her magically immune or secretly destined.

**Series engine:** Each kingdom reveals a different useful purpose that the command has distorted. Each rescue gives a person agency and a community a new action, not just an inventory reward.

**Antagonist:** Develop the existing “Eye” into the robot behind the hijack. This is a proposal, not established canon. He tries to eliminate uncertainty by turning mutual coordination into obedience. His tactics must threaten particular people and answer the heroine's successes.

**Emotional relationship:** Ratchet is frightened, funny, practical, and ashamed of surviving by switching himself off. He wants her to come back. She repeatedly interprets that as a repair problem until she begins to understand it as affection.

**Tone:** Tense adventure with warmth and dry humor. Mechanical injury has weight, but this is not relentless misery. A crooked repaired sign, Ratchet's absurdly small invoice, and a lion trying not to knock over his rescuer give the audience reasons to love the cast.

## Art continuity contract

1. **Use one versioned reference package per character.** Record exact repository path, commit, file hash, approval status, turnaround, face details, palette and relative scale. A filename containing “canon” is evidence to examine, not proof that every later variant is approved.
2. **HZD-99:** preserve the compact ivory body, charcoal visor, two cyan eye-lights, triangular ears, whisker rods, gold shoulder fittings, three belly vents and red scarf-cape visible in the inspected canonical image. No muzzle or expressive mouth replacing the visor. Resolve any disputed feature, including tail treatment, from the current approved turnaround before drawing it; do not average inconsistent images together.
3. **Ratchet:** use the chosen current full-body reference and portrait together. Lock eye construction, helmet, respirator/face assembly, belly shape, necklace, back canisters and hands. His emotion comes through posture, lens expression and timing rather than a newly generated face.
4. **NULLFANG:** the ledger identifies the current second-edition reference as `assets/source/guardians/drawnA/beast_full.png`. Use that whole-body identity, not an older parts sheet merely because it shares the name. Lock mane contour, plate map, joints, paws and tail. Purification changes signal effects and behavior; it does not silently replace his body.
5. **Equipment is tracked by scene.** No sword before the forge. One sword throughout the chapter after forging. Volt pack appears only after purchase. Damage, temporary splints and recovered objects carry forward until visibly repaired.
6. **Effects do not redefine anatomy.** Burst remains the existing charge/build/release family. Healing remains the existing repair effect. Neither produces new armor, a halo, a mouth, or extra limbs. Adapt an effect to the panel's lighting without changing its identity.
7. **Use signal grammar as well as color.** Hostile command: broken repeated waveform and imposed motion. Clean responses: separate, varied marks. Warning: distinct buildup and readable pose. This resolves the present confusion between red paint, red lighting, infection, and aggression, and remains understandable in grayscale.
8. **Letter separately from artwork.** Editable balloons, captions and SFX permit dialogue fixes without regenerating character faces. Read at phone width. Aim for 1–2 short balloons per action panel; exposition has to earn its space.
9. **Review in sequence.** Check page thumbnails for repeated faces and proportions; inspect full-size hands, weapons and transitions. Check left/right placement, injury continuity, eyelines and equipment before accepting a page.
10. **Retire assets explicitly.** A production allowlist should point only to approved references and outputs. Remove deprecated assets from manifests, prompts and published page lists after checking references. Preserve archival originals until deletion is specifically decided; deletion alone cannot prevent model drift.

## What to rebuild first

Start with the narrative package, then a small proof sequence: waking/rescue, Ratchet conversation, and three consecutive fight pages. Those test the same hero under quiet acting, dialogue and extreme movement. Once they hold together, extend the chapter using the locked references and panel continuity ledger.

The companion chapter is a complete replacement script, not a prompt to regenerate the old 27 pages with nicer rendering. Its longer fights and clearer emotional turns require different page allocation.

## Source links

- [Inspected integration snapshot](https://github.com/zaferdajani/HZD-99/tree/7356d362af556307a6f18ee1378703ef6dadbcf6)
- [Story canon](https://github.com/zaferdajani/HZD-99/blob/7356d362af556307a6f18ee1378703ef6dadbcf6/docs/STORY_CANON.md)
- [Existing story script](https://github.com/zaferdajani/HZD-99/blob/7356d362af556307a6f18ee1378703ef6dadbcf6/docs/STORY_SCRIPT.md)
- [Manhua ledger and references](https://github.com/zaferdajani/HZD-99/blob/7356d362af556307a6f18ee1378703ef6dadbcf6/docs/MANHUA.md)
- [Guardian choice implementation](https://github.com/zaferdajani/HZD-99/blob/7356d362af556307a6f18ee1378703ef6dadbcf6/js/braid.js)
- [Weapon ownership implementation](https://github.com/zaferdajani/HZD-99/blob/7356d362af556307a6f18ee1378703ef6dadbcf6/js/weapons.js)

