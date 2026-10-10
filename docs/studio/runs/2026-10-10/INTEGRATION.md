# Integration of the 2026-10-10 studio review — what was done, what is proven, what is open

Integrator: the code session, on `claude/clawbyte-repo-migration-byhyl8`.
Review branch integrated: `codex/studio-review-2026-10-10` @ `5032bf8` (audited
baseline `47fea7b`). Every claim below names its evidence and its kind:
**played** (real input, fresh save), **harness** (automated, real build),
**staged** (a save set up to the moment, then the game's own code), **looked**
(a rendered frame inspected), **not verified**.

*(Release summary: filled in when the release is verified live.)*

## 1. The review branch

Merged by fast-forward (`5032bf8`), then the four pages rebuilt (`8c9229a`) —
the branch carried source only, by design. The six prepared fixes are kept:
the long-word wrap (`js/reveal.js`), the booth prompt suppression
(`js/game.js`), the runner failing on unknown/missing harnesses
(`tests/run.cjs`), the cave test that no longer counts transit doors
(`tests/caves-ch1.cjs`), the corrected quest comments (`js/quests.js`) and the
evidence collector (`tools/studio/audit.py`). The audit's logs, the three
CHROMIUM_PATH retries and the roster timeout log are preserved unchanged in
this run directory.

## 2. Findings — closed / open

| ID | Sev | Finding | Status | Fix | Evidence |
|---|---|---|---|---|---|
| QA-01 | P1 | Runner accepted unknown/missing harnesses | **closed** (review branch) | `5032bf8` | harness: unknown name exits 1 |
| UI-01 | P2 | Long word after ordinary text overflowed | **closed** (review branch); panels now share the same wrap | `5032bf8`, `5fb0efd` | harness: `textreveal`, `text-rules` (URL-long token, ar/zh/ru/tr at 844×390) |
| UI-02 | P2 | "Back outside" shown inside the booth | **closed** (review branch) | `5032bf8` | harness: `tutorial-clarity` |
| QA-02 | P2 | Transit doors counted as cave rewards | **closed** (review branch) | `5032bf8` | harness: `caves-ch1` |
| DOC-01 | P3 | Stale quest comments | **closed** | `5032bf8` | source |
| QA-04 | P2 | Runner accepted any page on :8220 | **closed** | `ce92f2d`: `tests/served-identity.cjs`; the runner snapshots the served build before the first browser harness, re-checks before every later one and at the end, and refuses a mismatch (exit 2) | harness proofs: impostor directory refused; a served file changed mid-run fails the run (logs in the worker's scratch) |
| VFX-T | P1 | `infection-roster` timed out at 360 s | **closed, cause fixed** | `ce92f2d`: `mediaFetch` never cleared `MEDIA_PEND`, so every "wait for the art" waited out its cap (wolf: 15.2 s × 9 states); the sweep also re-aimed the background prefetcher at the whole game. Game fix: `delete MEDIA_PEND[k]` on load. | 557–670 s → 58–99 s with every assertion kept; suite timeout 240 s, justified by the measurement |
| MIS-01 | P2 | A7 survey errand completed by entering the room | **closed** | `8c30791`: `ratchet_deep` is `kind:'read'`, completed by reading terminal 20; early reads remembered; old paid saves stay paid; active-but-unread saves stay active | harness: `survey-a7` (real E key through `doInteract`), `story-order`, `errands`, `caves-ch1` |
| ART-01 | P1 | Alpha a different animal from its pack | **closed** | `50d1a06`: boss plate drawn from the pack's approved design; ten filmed strips (rest, prowl, roar, howl, coil+landing/recovery, airborne, claw, bite, clinch/shake, yield) cut at one scale and one floor; constant draw scale; freed Alpha recoloured teal | harness: `wolves` (one size 2.10/2.05, feet within 3 px, silhouettes ≠ rest, 122 px vs a wolf's 49 px), `artbible`, `infection-poses`; looked: `images/alpha-before-after.jpg`, `alpha-after-states.jpg` (both facings, 16 states in A10), `alpha-after-infected/freed.jpg` |
| CIN-01 | P1 | Eight missing manhwa scene groups | **closed for chapter one; chapter two is a teaser only** | `8fad5d1`: 17 single panels + wiring + captions in 5 languages; `d529fa0`/`4630531` (campaign) order fixes | harness: `panels` (each new sequence at its event, once; old saves not handed recaps); played: the campaign opened all 12 route sequences in story order; looked: `images/panels-after-desktop.jpg`, `panels-after-phone.jpg` |
| UX-03 | P2 | Baked English lettering could not reveal or translate | **closed** | `8fad5d1`: every cropped page now comes from an unlettered copy; the game letters all captions; a captioned crop from a lettered page fails the harness. Two crops had been showing superseded balloons under the game's captions (p09 "crystal pillar", p18 "pillar shard") | looked: `images/panels-p09-lettered-vs-clean.jpg`, `panels-p18-lettered-vs-clean.jpg` |
| VFX-01 | P2 | Mother's optics uncertain; two-eye cap | **closed** | `0883ef7`, `4be2139`: her eyes are the eight plate lenses (the core is her light and weak point); per-body allowance up to 8, global caps unchanged; a shipped bug hid her under the loading silhouette every frame (`drawMother` returned undefined); four guardians re-anchored onto real eyes; duplicate eye reports dropped | harness: `infection-eyes` (8 lenses, purple, phone budget), `infection-poses` (8 guardians, 95 poses × both facings, eye on opaque art ≤ 1 px, newest wisp at an eye 0.00 px), `infection-roster`; looked: `assets/source/_sheets/mother_eyes_before/after.jpg` |
| QA-03 | P1 | No uninterrupted normal-input chapter one | **closed** | `tests/campaign-ch1.cjs` + eight game fixes (`fcbdd6e`, `80480a0`, `0a3ffb7`, `0b928cb`, `62a9426`, `d529fa0`, `4630531`, `85badd9`) | played: one run, cleared browser → title → film → difficulty → teaser, keyboard only, 14:43, 4 deaths, "Kitten" chosen in the game's menu (disclosed); `docs/CHAPTER_ONE_CAMPAIGN.md` (27-step table: why/where/what/how-known/what-changes) |
| B-Servo | P2 | Hero and Servo overlapped at interaction range; he was sunk into the meadow | **closed** | `5fb0efd`: stand-off from his drawn width (prompt before contact, talking steps her beside him); NPCs lifted onto the real ground height at load | harness: `servo-presence` (desktop and phone touch, whole arc); looked: `images/servo-*-after.jpg` |
| F-Read | P2 | A fast double tap revealed AND turned a panel; toasts drew over dialogue | **closed** | `5fb0efd` | harness: `text-rules` (combat pauses under cards; one input never does two things; numbers immediate; five languages at phone width) |
| C-Order | — | Story order and the den gate | **verified, no gap found** | — | harness: `den-gate`, `story-order`, `chapter-one`, `story-progression`, `kingdom1`, `sage`, `first-sage-route`; wording audit of 868 keys × 5 languages (no rescue words on CHIME, no kill words on a Sage/guardian) |
| CAMP-1 | P3 | "Still bound" toast in nearly every room | **closed** | `21bacb7` | source + campaign log |
| CAMP-2 | P3 | "Climb above the meadow" read as Servo's climb | **closed** | `21bacb7` (objective names the hub's west end, 5 languages) | source |
| CAMP-3 | P3 | "Cleansed, not killed" missing on the lion's film path | **closed** | `207d8a7` | source |
| BOOT-1 | P3 | `forEach(mediaFetch)` fetched three boot sheets urgent + cache-busted | **closed** | `f8c56ed` | source |

### Open, carried forward

| ID | Sev | Finding | Owner |
|---|---|---|---|
| TER-1 | P2 | The bell climb in A2 sits directly over the quarry's broken floor; a missed jump drops her two rooms back (four times in the campaign run) | TERRAIN |
| CIN-2 | P2 | Room-bound panels open only for a standing, unthreatened player (no machine within 300 px); a brisk player can leave the break pages owed until the bell makes them past | Cinematic Designer |
| BOSS-1 | P3 | Damage carried over a death differs: the Sage keeps it, CHIME and NULLFANG reset | Boss Designer |
| UI-3 | P3 | Suit badge overlaps the "T — Neural Tree" pill | Lead UI |
| UI-4 | P3 | The dialogue box covers both characters' legs in every NPC talk (camera pinned to the room floor) | Lead UI (layout decision for the owner) |
| CIN-3 | P2 | Chapter two has a three-panel teaser, not a drawn chapter | Cinematic Director / STORY |
| ART-2 | P3 | A freed Alpha's collar seam keeps a faint violet (`pureArt` threshold) | Character Artist |
| VFX-2 | P3 | On the `low` tier a moving MOTHER-V alone fills the 90-wisp pool (bounded; trails shorten) | VFX |
| HERO-1 | P3 | NOSTOS (odyssey.html) shows the raw key "t20" on the A7 survey terminal — pre-existing; the errand now depends on reading it there | Mission Engineer |

## 3. Cave census (current)

Unchanged from the audit's table except **A7**: its errand now pays for reading
the survey (terminal 20), not for entering, with early reads remembered and old
paid saves kept. Every chapter-one cave still has its own outcome (`caves-ch1`);
transit doors no longer count.

## 4. Manhwa parity matrix

`docs/MANHWA_EVENT_MAP.md` — written from `PANEL_SEQ` by `tools/manhwamap.cjs`:
13 sequences, each with its source asset, crop, caption key, English caption,
trigger and completion flag. The eight groups are mapped there to their
sequences. Generated panels and unlettered pages are distinct from the lettered
manhwa reader pages; provenance in `assets/source/manhua/ch1/{game,clean}/prompts.json`.

## 5. Animation / VFX matrix

| Body | States verified | How |
|---|---|---|
| Alpha | rest, prowl, roarwarn/roar, broodcall/howl, coil, leap (air), recoil/turn, clawwarn/claw, bitewarn/bite, clinch/shake, free; both facings | `wolves`, `infection-poses`, looked at all 32 in-room frames |
| Pack wolf | rest, prowl, gallop, coil, bite, crouch, leap, landing, recoil, winded | `infection-roster` (9 distinct eye points) |
| 8 guardians | 95 drawn states × both facings | `infection-poses` |
| Every placed hostile kind | an eye, its colour, on the body, facing, smoke at the eye | `infection-roster` (26 kinds, 13 guardians purple) |

Smoke lifetime is 1.5 s ±25% per wisp (1.125–1.875 s); quality caps 90/170/260/320;
reduced motion suppresses smoke; idle, purified, friendly, dead and removed bodies
stop emitting; teleport, room change and load clear trails (`infection-eyes`).

## 6. Fifteen role verdicts

| Role | Verdict | Evidence |
|---|---|---|
| Senior Cinematic Designer | **Pass with issue** | 13 sequences at their events, once, skippable, replayable; campaign opened 12/12 in order. Open: CIN-2 |
| Senior Game Designer — Player Systems | **Pass** | Opening chain played with real input (desktop + touch); pod line exact; Volt Pack explained before purchase, paid with Ratchet's scrap; `tutor`, `opening-order`, campaign |
| Senior Mission Designer — Quest Craft | **Pass** | A7 now completes on evidence; caves each pay their own way; errands reachable (`errands`) |
| Principal Encounter Designer | **Pass with caveat** | Every fight on the route won by ordinary bot play on the easiest row; deaths were bot skill (hoppers, wolves, flier). Not certified: difficulty feel on the default row |
| Senior Boss Designer | **Pass with issue** | Alpha keeps its moves, tells and timings on the new art; Sage, CHIME, NULLFANG beaten by input in the campaign. Open: BOSS-1. Not certified: fight feel |
| Senior Mission Designer — Campaign | **Pass** | One uninterrupted keyboard run wake → teaser; marble before lion; Alpha bypassed; rescues not kills |
| Senior Mission Producer | **Conditional pass** | All workstreams integrated on one branch; full suite on a frozen build (§7); release verified live (§8). Physical devices not certified |
| Senior Character Artist | **Pass with issue** | Alpha in the pack's breed, distinct boss scale, all strips; Servo's art untouched and now readable. Open: ART-2 |
| Senior Cinematic Director | **Pass with issue** | Eight groups drawn in the chapter's style, identities bound to elements, unlettered pages. Open: CIN-3 (chapter two), owner review of the new panels |
| Senior VFX Artist | **Pass** | Mother's real optics, every guardian pose, purification stops emission; open: VFX-2 (bounded) |
| Senior Technical Director — World Systems | **Pass with issue** | Served-build identity enforced; roomassets regenerated; open: TER-1 |
| Senior Gameplay Engineer — Combat | **Pass** | Cards pause combat (`text-rules`); Alpha AI unchanged under new art. Not certified: haptics, audio mix |
| Senior Gameplay Engineer — Mission | **Pass** | A7 read semantics with migration; teaser hook fixed (`0b928cb`); panels past-migration |
| Senior Gameplay Engineer — NPC | **Pass** | Servo stand-off and grounding; Ratchet's stranger greeting removed |
| Lead UI Engineer | **Pass with issue** | Reveal/advance rule everywhere incl. panels and touch; five languages at phone width. Open: UI-3, UI-4 |

## 7. Exact test results

*(Pending: the full registered suite is running on a frozen build of 207d8a7; first half 82/82 passed.)*

## 8. Deployment

*(Pending: not yet published.)*

## 9. What is not verified, said plainly

- **Physical devices.** Phone results are Chromium emulation (844×390, DPR 2,
  touch events). No physical phone, tablet, desktop shell or Android package
  was played.
- **Audio and haptics.** Not heard or felt; harnesses check that cues exist and
  fire, not that they sound right.
- **Human play.** The campaign is an autopilot on the easiest difficulty row,
  at 10–20 fps headless with the game clock at 0.95–1.0× wall time. It proves the
  route is completable by input alone and that each step communicates; it does
  not prove the fights are enjoyable or the default difficulty fair.
- **Art quality.** Tests prove scale, grounding, silhouettes, eyes and wiring.
  The new Alpha takes and the seventeen panels have not been reviewed by the
  owner; they are generated assets, integrated, not owner-approved.
