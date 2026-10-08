# MOBILE-PLATFORM — the touch recognizer and the lifecycle pause

`js/mobile-platform.js` is a generated file. Its master is TypeScript in
`tools/mobile-platform/src/`, and `sh tools/mobile-platform/derive.sh`
re-derives it. Do not edit the generated file; the next derivation overwrites it.

Provenance: a drop supplied by the owner on 2026-10-08, ported from the iOS
touch layer of the GeneralsX / Generals-Mac-iOS-iPad port
(`SDL3GameEngine.cpp`), rewritten for Pointer Events with the RTS mouse
synthesis removed.

## Why it is generated rather than hand-written

RULE ZERO: author at full quality, derive everything cheaper. The master is
TypeScript because a state machine with ten gesture shapes and five phases is
exactly the thing a type checker is good at, and the strictest setting
(`strict` + `isolatedModules` + `verbatimModuleSyntax` +
`noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` +
`noFallthroughCasesInSwitch`) is clean.

The toolchain is **not** in `package.json`. Nothing a player loads and nothing
in `tests/` needs TypeScript or esbuild — only `derive.sh` does, and it installs
them into a throwaway directory when a human runs it. The shipped artefact is
plain ES2020 that the existing build concatenates like any other file, so a game
that ships vanilla ES6 keeps a dependency tree with no compiler in it.

It is an **IIFE assigning one global**, `MobilePlatform`, because `build.cjs`
concatenates `js/*.js` into a single `<script>` in one shared scope. A module is
the one shape that cannot join that; a closure is the one shape that can without
adding thirty names to a scope where a collision is a black page and one console
error. Measured: the file adds exactly one name.

One cosmetic consequence, recorded so nobody rediscovers it: esbuild emits
`"use strict";` above the closure. Concatenated after forty other files it is no
longer a directive prologue, just a string expression, so the closure body runs
sloppy. Nothing inside depends on strict mode — it is classes plus two pure
functions, no implicit globals (the type checker forbids them), no `this` in
loose functions, no octal. It is left exactly as the bundler emitted it, because
hand-editing generated output is how generated output stops matching its master.

## What it is

A pointer-event state machine — `PENDING → DRAGGING / LONGPRESSED / PAN` — that
emits **semantic gestures** rather than synthesising mouse events:

`tap`, `longPress`, `longPressEnd`, `dragStart/Move/End`, `panStart/Move/End`,
`pinchStep`, `cancel`.

Plus `Lifecycle`, which treats backgrounded (`visibilitychange`, `pagehide`) and
inactive (`blur` — app switcher, Control Centre, an incoming call) as two
independent pause states, suspends the `AudioContext`, resets the recognizer so
no finger is stuck down, and clamps the first frame's `dt` on resume.

And `PlatformerBindings`, an example adapter: floating virtual stick on the left
thumb, tap = jump / long-press = charge / horizontal swipe = attack / down swipe
= dash on the right.

## What it is NOT, yet

**Nothing in the game calls it.** `js/touch.js` is still the on-screen
controller and `tests/tap.cjs` still measures that. This ships inert so that
wiring it is a deliberate decision rather than an import, and
`tests/mobile-platform.cjs` measures it inside the built page so it cannot rot
while it waits.

Wiring it would mean giving the game a single input contract — one `PlayerInput`
struct that keyboard, pad and touch all write — which is the genuinely valuable
idea in the drop and a larger change than adding a file. See the agent-guide
section below.

## The three defects fixed before it was committed

Each was found by running it in a browser with real `PointerEvent`s, not by
reading it. All three are held as regressions by `tests/mobile-platform.cjs`.

**1. A long-press was never released.** `finish()` had
`case "LONGPRESSED": break;` — a held finger lifting emitted nothing at all, and
the only line clearing `chargeHeld` lived in the `dragEnd` branch, which a
hold-and-release never reaches. Once the phase is `LONGPRESSED` moves are
swallowed too, so there was no path out: charge latched on for the rest of the
session. A `longPressEnd` gesture now fires on lift and from `reset()`, so
backgrounding mid-hold releases it as well, and the binding clears the charge
there instead of in `dragEnd` — which also stops a left-thumb stick release from
clearing a right-thumb charge.

**2. `Lifecycle` could resume without ever having paused.** The constructor
recorded `wasPaused` from the initial state but never ran `enterPause()`, so a
page born hidden or unfocused — a restored tab, a prerender, a window opened
without focus — never suspended its audio and never fired `onPause`, and the
first `focus` fired `onResume` on its own. With the supplied wiring that is
`music.play()` on a game that has not started.

**3. `setPointerCapture` was called unguarded and can throw.** It raises
`NotFoundError` when there is no active pointer for that id. `?.` guards the
method being absent, not it throwing, and the call sat above the phase
assignment — so the exception aborted the handler and the touch was dropped
silently. Capture is an optimisation (it keeps moves arriving when the finger
leaves the canvas); losing it is survivable and losing the touch is not.

A fourth, caught by the type checker rather than the browser: the bindings
imported `GestureEvent` and `Vec2` as values. Under `isolatedModules` that
import survives transpilation and fails at runtime with "does not provide an
export named 'GestureEvent'". Now `import type`.

## The agent guide that came with it

The drop also carried an `AGENTS.md` and said to put it at the repository root.
It was not installed, and should not be: `AGENTS.md` already exists there and
carries the development authority, the end-to-end ownership instruction of
2026-09-18 and the standing deployment authorization.

Most of it restates rules this repository already has, in different words and
without the harnesses that make ours measurable — `ART_BIBLE.md` and
`tests/artbible.cjs`, `docs/combat/COMBAT_BIBLE.md`, RULE ONE and
`tests/platform.cjs`, THE SESSION FLEET. The rest names a repository that is not
this one: `src/platform/`, `src/game/`, `src/render/`, `content/`,
`CLAWBYTE_ART_BIBLE.md`, `docs/COMBAT_DIRECTIVE.md`, `docs/DEV_BLOG/`,
`docs/lessons/`, and four npm scripts that do not exist. Its layering rule
cannot be enforced here at all: there is no `src/`, and `build.cjs` concatenates
45 flat files into one scope with no module boundary to enforce.

Three ideas in it are genuinely absent here and worth something, in increasing
order of cost:

- **A single `PlayerInput` contract.** Keyboard, pad and touch as adapters
  writing one struct the game reads. RULE ONE already demands parity and
  `tests/tap.cjs` measures it, but the three remain three paths through `keys`,
  `keysP`, `TOUCH` and the pad bindings. This is the change that would make the
  file above droppable instead of graftable.
- **Replay determinism in CI.** A recorded input stream plus a seed, replayed
  headless, failing the build on a state-hash mismatch. The hard half already
  exists and was paid for twice — `tests/drawclock.cjs` and `tests/meadow.cjs`
  exist because draw sampled an unfreezable clock.
- **Headless-runnable game logic.** The precondition for the above, and a
  refactor of the engine's spine: `update()` reads `keys`, `player`, `cam` and
  `G` as globals in one concatenated scope and `draw()` runs from the same loop.
  Worth planning. Not worth starting as a side effect of adding a touch layer.
