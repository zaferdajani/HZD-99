# How the game reaches a device

The package is 132 MB. Nobody waits for 132 MB. This is the document for what
actually happens instead, why each piece is the way it is, and what the numbers
were when the decision was made.

Everything here is measured. Re-measure rather than remember:

```bash
node tools/lowres.cjs --check     # the low tier, sheet by sheet
node tests/run.cjs boot lowres preload
```

---

## 0. The shape of the problem decides everything

Measured 2026-08-15:

```
total package              132 MB
  music + video            100 MB   STREAMED. Never a loading cost.
  art (all images)          32.4 MB
    full-size sheets        31.9 MB   111 files
    quarter-scale tier       0.55 MB   68 files
  boot set                  11.6 MB   shared by every room
  heaviest single room       3.6 MB   (A10)
  rooms adding nothing        24 of 43
```

Three quarters of the package is **streamed and must never be preloaded**.
Music goes through `<audio>` and is never decoded — `decodeAudioData` turned a
2 MB ogg into ~60 MB of resident PCM, which was the single most expensive thing
this game ever did on a phone. Video plays straight off disk.

So the whole delivery problem is **32 MB of art**, which is small enough that on
a decent connection the correct end state is simply *all of it*.

---

## 1. The four techniques, and which ones this game uses

These are layered, not alternatives. The industry names are given because they
are what to search for when changing any of this.

| # | Technique | Elsewhere | Here |
|---|---|---|---|
| 1 | **On-demand chunks** — split the package, fetch a chunk on first entry | Play Asset Delivery, iOS On-Demand Resources, Unity Addressables, Unreal chunked paks | the service worker (`sw.js`) is the web's version of an install pack |
| 2 | **Predictive prefetch** along the traversal graph | streaming open-world cell loading | `js/preload.js`, breadth-first over `ROOMS[id].exits` |
| 3 | **Media streaming** — never download in full | HLS / DASH segments, range requests | `<audio>` + `<video>`, always |
| 4 | **Progressive resolution** — small first, sharpen later | mipmap streaming, progressive JPEG, LQIP | `tools/lowres.cjs` + the `MEDIA_LOW` tier |

Granularity is worth a note. The obvious unit is the **kingdom** — "download the
zone I'm in". This game uses a finer and more accurate one: **distance in
doors**. `ROOMS[id].exits` is an adjacency list, so a breadth-first walk gives
exactly the rooms reachable in one door, two doors, three. That predicts what a
player will need far better than which zone they are standing in, and it needs
no heuristic to tune because it is not an estimate.

---

## 2. What a cold open actually spends

Counted request by request by `tests/boot.cjs`, which fails if any of this
regresses.

| | Returning player (Continue) | First-time player |
|---|---|---|
| Page, gzipped | 0.47 MB | 0.47 MB |
| Eagerly-fetched sheets | 3.58 MB (4 shared atlases) | same |
| Sound, first wave | ~0.4 MB, 20 requests | same |
| Opening film | **none** | **one shot** (0.93 MB webm / 1.65 MB mp4) |
| Everything else | behind the game, prioritised | behind the game, prioritised |

Before the work in this document, both columns also paid **4.4 MB of webm — or
13.1 MB of mp4, which is what iOS Safari takes** — for all eight opening shots,
on every boot, including the boots where nobody watches the film.

---

## 3. The rules, one at a time

### 3.1 A reel is a queue, not a download

Each opening shot runs about fifteen seconds, so shot *n+1* has a quarter of a
minute to arrive while shot *n* is on screen. `filmAhead()` keeps **two** ahead
of the one playing. Boot fetches **one**, and only for somebody with no save —
a returning player's next press is Continue, and the opening is the one thing
on that menu they have already seen.

If a returning player does start a new game, the film waits a beat in the dark.
`updateCut`'s `hold` phase was already built for exactly that and will sit there
patiently for up to fourteen seconds.

### 3.2 Prefetch everywhere except where the network belongs to something else

`preloadIdle()` used to be `G.state === 'PLAY'` and nothing else, which had it
backwards: the title screen, the map, a shop, a dialogue and the entire
two-minute opening fetched nothing at all. The moments when *nothing is moving*
were the only ones the prefetcher sat out.

It now runs everywhere except:

- **a room transition** — the one moment latency is visible
- **a boss fight** — the bandwidth and the main thread belong to the fight
- **a film that is not playing cleanly** — a clip with a moving frame clock is
  two minutes of free bandwidth and is used at half rate; the instant its frame
  clock hesitates (`stall > 0`) or it is still trying to start, the prefetcher
  gets out of the way

That last one is a deal, not a permission: a stalling film is the failure this
codebase has fought hardest, so the prefetcher backs off on the same counter
`updateCut` uses to give up.

### 3.3 The title screen needs something to fetch

`preloadRoom()` is called from `loadRoom`, so before this the queue was empty
for the whole time the menu was up. `preloadBoot()` seeds it at boot from the
room the save's bench is in — where Continue actually lands — or `W1` for a
first-time player. Guessing wrong costs nothing: the wrong neighbourhood is
still art the game will want eventually.

### 3.4 Sound goes out in two waves

Thirty-six audio requests used to open on the same frame as the first tap —
1.18 MB, six of them guaranteed 404s (the NPC hum override slots are empty by
design). Bytes were never the problem; **simultaneity** was. A phone on a slow
link opening three dozen sockets finishes all of them later than it would
finish the six that matter.

Her voice and the impacts go immediately (`AUDIO_CORE`); the guardian roars, the
ending takes and the empty slots drain four at a time behind them. Nothing is
ever permanently absent — `playBuf()` pulls anything asked for early to the
front, missing once, and a miss already falls through to the synthesised version
of the same sound, which is what the whole audio engine is built on.

### 3.5 Two resolutions, and whichever arrives first is drawn

This is the biggest single change and the one worth understanding.

A sheet that has not landed used to mean the **procedural fallback** was drawn —
a *different picture*, not a rougher one — and the swap when the real art
arrived read as the room changing its mind. `tools/lowres.cjs` bakes a
quarter-scale webp copy of every sheet that is safe to have one:

```
68 sheets:  24.2 MB -> 0.55 MB  (2.3%)
```

**The whole game's art, at low resolution, is half a megabyte** — less than one
of today's heavy rooms. So the prefetcher front-loads *all* of it at priority
−1, ahead of the nearest full-size sheet, and only then starts on full sizes,
nearest door first. Within a second or two of the title screen appearing, every
room in the game can be drawn correctly; the sharpening happens behind the
player for the rest of the session.

`MEDIA_LOW[k]` tracks the life cycle: `1` in flight, `2` standing in, `3`
replaced by the full sheet. When a stand-in is replaced, every cached derivative
of it is thrown away (`SOFT_ART`, `ATLAS_PROC`, the baked tile layer) or the
room would keep the soft version forever.

The small copies are webp because it is the only format here that carries
**alpha** and still compresses like a photo — half these sheets are keyed
cut-outs, and a jpeg stand-in would put a black box where the transparency was.
A browser with no webp decoder simply fails that one request and waits for the
full sheet, exactly as before.

### 3.6 The one rule that can break silently

**Six sheets must never have a small copy.** The guardian parts atlases —
`beast_parts`, `eagle_parts`, `glaciere_parts`, `dragon_parts`, `prism_parts`,
`mother_parts` — are addressed with **absolute pixel rectangles** baked against
the full-size sheet (`c.drawImage(im, s[0], s[1], s[2], s[3], …)` in
`js/beast.js` and its five siblings). Hand one of those a quarter-scale image
and the boss is assembled out of the wrong quarter of itself: no error, no
missing file, just a guardian made of fragments.

Everything else in the game slices **proportionally** (`im.width / cols`,
`im.width / HERO_CELLS`) or draws the whole image, and proportional slicing does
not care how big the sheet is.

`tests/lowres.cjs` does not trust the skip list. It re-derives the rule from the
source: any guardian file containing a nine-argument `drawImage` has every
`MEDIA_IMG` key it mentions checked against the manifest. A seventh atlas with a
rect table would otherwise be a silent corruption six months from now.

---

## 4. Connection policy

`preloadPolicy()` in `js/preload.js`. The player's data plan is their money.

| Connection | Doors ahead | Rest of the game, full size | Whole low tier | Concurrent |
|---|---|---|---|---|
| Packaged (Capacitor / desktop) | 99 | yes | **no** — local files, no race to win | 4 |
| Unknown (assume desktop) | 3 | yes | yes | 2 |
| 4g | 3 | yes | yes | 2 |
| 3g | 2 | no | **yes** | 2 |
| 2g / slow-2g | 1 | no | **yes** | 1 |
| Save-Data | 1 | no | **no** — they asked | 1 |

The low tier stays on where `far` is switched off, and that is the point: on a
2g connection, "all of it, roughly" beats "a third of it, sharply". Save-Data is
the one exception, because there the player has asked, and 550 unrequested
kilobytes is still 550 unrequested kilobytes.

---

## 5. Caching

`sw.js` counts art and streams in **separate buckets** with separate ceilings.
One shared ceiling put them in competition and the streams won every time — a
handful of 4 MB tracks would evict the entire art set, so the next open
re-downloaded sheets the prefetcher had already paid for. On mobile data that is
the same bytes bought twice.

`CACHE_MAX_ART` is 220 against the 179 art files that exist, so the whole art
set — including the low tier — survives. `CACHE_MAX_STREAM` is 6, about 24 MB of
the most recently heard.

---

## 6. Changelog

| Change | Before | After | Why |
|---|---|---|---|
| Opening reel at boot | all 8 shots, unconditionally | **1 shot, only with no save** | 4.4–13.1 MB spent on a film most boots never show |
| Reel during playback | — | **2 shots ahead** (`FILM_AHEAD`) | a shot has 15 s to arrive; two ahead is the whole cushion needed |
| `preloadIdle()` | `state === 'PLAY'` | **everything except transition / boss / stalling film** | menus and the title screen are the quietest windows in the session and were the only ones sat out |
| Prefetch tick site | inside the PLAY branch of `update()` | **the main loop, every state** | follows from the rule above |
| Queue seeding | on first `loadRoom` | **`preloadBoot()` at page load, from the save's room** | the title screen had nothing queued to fetch |
| Prefetch rate during a film | n/a | **1 concurrent, and only while the clip's frame clock moves** | the film is still what the bandwidth belongs to |
| Audio at first tap | all 36 at once | **20 core, then 4 every 320 ms** | simultaneity, not bytes; six of the deferred ones are known 404s |
| `playBuf` on a miss | silent false | **pulls the buffer forward, then false** | a deferred sound must never be permanently absent |
| Art resolution | one tier | **two — quarter-scale webp stands in** | a missing sheet drew the *wrong picture*, not a soft one |
| Low tier priority | n/a | **−1, ahead of the nearest full sheet** | 0.55 MB buys every room in the game being drawable |
| `CACHE_MAX_ART` | 130 | **220** | 68 new files; 130 would have started evicting art again |
| Films | one weight (mp4 33 MB / webm 13.4 MB) | **plus a light mp4 tier, 33 → 13.6 MB** | webm browsers already had a cheap option; iOS takes mp4 and had none |
| `tests/platform.cjs` coverage | 138 assets | **275** | the low tier and the films in all three forms were never checked |

---

## 7. The films

960×540 already — exactly the game's internal resolution — so there is nothing
to gain by making them smaller in *pixels* and something to lose. What they were
was **over-encoded**: `intro1` shipped at 2615 kb/s for a picture that is
visually identical at less than half that, checked frame against frame.

`tools/lightvid.cjs` derives a second copy at CRF 26 (**33.0 MB → 13.6 MB, 41%**)
and leaves the masters alone, per RULE ZERO. It is **mp4 only** on purpose:
browsers that take webm already have a cheap option, and it is iOS Safari —
which takes mp4 and nothing else — that was paying full price for every film.

`videoLight()` decides who gets it, on the same terms as the art policy: never
in a packaged app (the file is already on the device, so a smaller copy buys
nothing and costs picture), and on the web only for Save-Data, 2g or 3g. The
light copy is added as the **first** `<source>` rather than swapped in, so a
device that cannot decode it simply walks on to the next one.

`-movflags +faststart` is not optional here: without the index at the front of
the file, a streamed mp4 must arrive completely before it can start, which would
undo the whole point.
