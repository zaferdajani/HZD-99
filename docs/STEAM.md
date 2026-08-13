# Shipping CLAWBYTE on Steam

Written from the state of the repo, not from a template. Where something is
already done it says so; where something is a real obstacle it says that too.

---

## 1. The gate is low. The visibility is the hard part.

Steam is not curated for quality. **Steam Direct** is a **$100 recoupable fee
per app**, and Valve's review checks that the build *functions*, matches its
store page, and is not illegal or malicious. Almost everything that runs gets
on.

What is actually required:

| | |
|---|---|
| Steamworks account | company or individual |
| Tax and banking | US tax forms even as a non-US developer; a bank that takes USD |
| $100 per app | recouped once the app earns $1,000 |
| **30-day wait** | after paying the fee, before you may release. Plan around it. |
| A Windows build | Steam does not accept a URL |

**Getting on is nearly automatic. Getting seen is the entire problem.**
Visibility is driven by wishlists accumulated *before* launch and by traffic you
bring yourself, not by Valve choosing you. A store page opened three months
early and pointed at from everywhere is worth more than anything in this
document.

---

## 2. Where this project already stands

### Assets — the thing that usually kills small projects, and it is handled

`assets/CREDITS.md` records every third-party file, its author, its source URL
and its licence, verified on the source page at download time. Everything is
**CC0** or the Gothicvania pack's own public-domain licence. Both permit
commercial use.

It also records a *rejection*: rgsdev's Animated Knight pack was refused because
it is **CC-BY-SA 4.0**, a share-alike licence that would have forced the whole
game to become share-alike. That is exactly the discipline Steam's rights
attestation asks for, and it is already written down.

### AI content — permitted, but must be declared

Steam has required disclosure of AI-generated content since 2024. It appears on
the store page. This game uses generated art (the ceilings, the NPC turnaround
sheet, boss restyles), generated music and a generated opening film, so the
**Pre-Generated** box gets ticked and the description says what was generated
and how. Declaring it is not optional and is not a mark against the game;
failing to declare it is a store-page violation.

There is no Live-Generated content — nothing calls a model at runtime.

### The build

`tools/pack-desktop.cjs` produces `build/dist/CLAWBYTE-win32-x64/CLAWBYTE.exe`,
verified running: the packaged binary was driven over CDP, reached the menu,
started a game, resolved zone music, and rendered at the `ultra` quality tier.
See `DESKTOP.md`.

---

## 3. What still has to happen

### a. Which game ships

The repo builds two: **CLAWBYTE** (`index.html`) and **NOSTOS** (`odyssey.html`).

**CLAWBYTE is the Steam candidate.** Its world is code-drawn and generated art
commissioned for it. NOSTOS leans on the Gothicvania sprite pack for its hero
and enemies — correctly licensed, but a widely-used free pack, which reviewers
recognise. Ship one game well.

Practically: `build.cjs` already hard-locks each page to one world via
`window.GAME_LOCK`, so shipping CLAWBYTE alone is a packaging decision, not a
code change. The desktop `www/` should carry `index.html` only.

### b. Code signing

Currently unsigned, so Windows SmartScreen warns on first launch. For a test
build that is fine. For a store release it is not: an OV or EV certificate
(~$200–400/year) plus the download reputation that accumulates behind it. EV
clears SmartScreen immediately; OV takes time to build reputation.

### c. Size

~340 MB installed, and **~230 MB of that is Chromium**, not the game. Two ways
down if it matters:

- **Tauri instead of Electron** — uses the WebView2 runtime Windows already has
  rather than bundling a browser. Roughly 10 MB of shell instead of 230, so the
  whole thing lands near 90 MB. Cross-compiling it from Linux is awkward (it
  wants MSVC); building on a Windows machine is straightforward.
- **Drop the duplicate video codec.** The opening ships every clip twice, VP9
  and H.264, because browsers disagree. A desktop shell is one known browser and
  needs one — about 18 MB back for a one-line change to the packer.

### d. Steamworks integration

Optional to ship, expected by players:

- **Achievements** — the game already tracks the shape of them: `G.save.flags`
  carries every boss defeated, `relics`, `skills`, the Mind Nodes, the errands.
  Roughly a day's work to map them onto the Steam API.
- **Cloud saves** — `G.save` is a single JSON blob written by `persist()` to
  localStorage. Steam Cloud wants a file path, so this needs a small shim that
  mirrors the blob to disk. Straightforward, and worth it.
- **Controller** — already supported, with remapping. Declare the input types on
  the store page.

### e. The store page

Capsule art, five or more screenshots, a trailer, a short and long description,
tags, and an age rating. The opening film is most of a trailer already.

---

## 4. A realistic order

1. Decide: CLAWBYTE only. Cut the second world from the desktop package.
2. Open the Steamworks account, pay the $100, **start the 30-day clock now** —
   it runs in parallel with everything else.
3. Build the store page and start collecting wishlists. This is the step that
   decides how the launch goes, and it is the one most often left last.
4. Achievements and cloud saves.
5. Code signing certificate.
6. Consider Tauri for the size, if it matters to you.
7. Ship a demo. A demo on Steam has its own page, its own wishlist funnel, and
   costs nothing extra.

---

## 5. What is genuinely good about this project's position

- The licensing is clean and *documented*, which is unusual and is the thing
  that most often stops a release dead.
- It is verified by 20 harnesses that drive the real build in a real browser,
  so "does it run" is not a question anyone has to guess at.
- It already adapts to the machine it is on (`js/perf.js`), which on desktop
  means it uses the headroom rather than ignoring it.
- The combat is documented to a standard most small studios never reach
  (`docs/combat/`), which matters less for Valve and a great deal for anyone
  who joins later.
