# The free chapter

The plan, and the one line that turns it on.

---

## The plan

The free web build is the **shop window**. It opens on any phone from any maker
with no download, no store and no account — including Huawei handsets that
cannot reach Google's store at all. That reach is the one distribution
advantage this game has that an app store cannot match, and it is worth more
than the handful of sales a paid web page would make.

What the web cannot do is take money. So the free version ends, and the paid
version is where a player is asked for it:

1. **Free, in a browser** — the first kingdom. Advertising that costs nothing to
   distribute.
2. **Steam** — the full game. Easiest place for one person to actually sell, and
   the audience arrives expecting to pay.
3. **Google Play** — later. The Android build already exists; this is mostly
   paperwork.
4. **App Store** — after that. **Huawei's store: probably never** — the free web
   version already reaches those players.

All of these are **the same build** (RULE ONE). Adding a platform is not a new
game.

---

## Where the chapter ends

**Room A3, the door going up into B1.** That is the only route out of zone A,
and the boundary is *derived* from that fact rather than written down — any exit
from a `DEMO_ZONE` room to a room in another zone is the wall. A hard-coded room
id would be a second copy of the map that somebody has to remember to update;
`tests/demo.cjs` confirms the derivation closes exactly one door and leaves all
22 routes inside the chapter open.

What the player gets before it:

- waking in the cradle, and the walk to the city gates
- the first machine folk, and the purifier they hand over
- the Scrap Meadows entire — ten rooms, the shop, the first Mind Nodes
- **the Alpha and its pack** (A10)
- **NULLFANG, the first guardian** (A4)

Two boss fights and an ending. That is what makes it a chapter rather than a
wall: a demo that stops mid-corridor reads as the game breaking, and a demo that
ends on a boss reads as *finishing something*.

---

## Making it sell the rest

A first area is, by nature, a game's humblest: it has to teach, so it is gentle,
and it is usually the plainest-looking part of the whole thing. That is exactly
backwards for something whose job is to advertise. The free chapter has to be
the tutorial **and** the trailer, and those pull against each other.

### The frontier — done

The ending screen asks the player to want five more kingdoms. Until now it
offered no evidence there were any: every room in the game shares its kingdom's
horizon, so somebody reaching that door had seen exactly one kind of place and
was being asked to imagine the rest. **A promise is weaker than a glimpse.**

A3's build already cuts an opening in its ceiling — the hole she climbs through
to reach B1 — and the Data Conduits are lit in a cold blue that nothing in the
warm scrap-yellow Meadows uses. So the hole is blown out in that colour and a
shaft of it falls the full height of the room, landing on the floor she walks
across on her way to NULLFANG. It says *there is somewhere else up there, and it
is not like here* without contradicting one thing about where she is standing.

Two things it deliberately is **not**: the next kingdom's backdrop swapped in
behind this one (which reads as the room getting the wrong art), and a painting
pasted in as a prop — a lesson this codebase has already learned twice, see
`ROOM_VISTA` on the city gates.

The colour is read from the destination zone's own palette rather than typed in,
so a kingdom re-themed later re-lights its own frontier for free.

**The alphas are measured, not chosen.** The first pass used the numbers a
subtle background effect would use, and probing the live frame showed it adding
about 14 to a channel — technically present, and on a phone in daylight
completely invisible. `tests/demo.cjs` now measures it in the rendered frame:
it must add real brightness inside the beam (48 today), be measurably *bluer*
than the kingdom it is falling into (+59 on blue over red), and add nothing
beside the beam (0), so it can never quietly fade back to decoration.

### Still open

- **One moment that feels expensive.** The flashiest thing she can do — the
  two-blade swirl — needs both halves of the purifier, which is deep in the
  game. Nobody in the free chapter will ever see it. Something of that weight
  needs to land inside kingdom A.
- **End on a question.** After NULLFANG she has freed one guardian. Something
  should tell her there are five more and that this was the smallest.
- **Spend the art budget unevenly.** Most people who ever open this game will
  only see kingdom A. It should be the most polished area in it, which is the
  opposite of how games usually get made.

## Turning it on

One line, in `js/game.js`:

```js
const DEMO_OFFER = false;      //  <-  true, when there is a store page
const DEMO_URL = '';           //  <-  the Steam page, when it exists
```

`DEMO_OFFER` is **false by default and must stay that way until there is
somewhere to send people.** The game is already live; a default that truncated
it would be the worst kind of quiet bug. `tests/demo.cjs` fails if it is ever
switched on without somebody meaning it.

`DEMO_URL` empty is a supported state: the ending screen then says *"The full
game is coming"* and offers no link, rather than pointing at a page that 404s.
Fill it in and the same button becomes *"Where to get the full game"*.

---

## Who is never the demo

`demoOn()` says no to all of these:

| | Why |
|---|---|
| The Capacitor app, the desktop shell, anything run from a file | A packaged copy **is** the bought copy. There is no such thing as a demo you installed from Steam. |
| A save carrying `G.save.full` | The purchase flag. |

**`G.save.full` is the hook the Steam connection will hang on.** Whatever
eventually proves a purchase — a sign-in, a key, a licence check — sets that one
flag and the same page becomes the whole game. Nothing in the boundary needs to
change when that arrives, which is the point of putting it there now.

Worth being straight about the missing piece: **Steam does not do that part for
you.** Steam knows who bought the game on Steam; it has no idea who is playing
in a browser. Connecting the two needs a small service that remembers "this
person owns it". It is not exotic and not expensive, but it has to exist before
that promise can be made to a player, and it should be built *after* the Steam
version is selling, not before.

---

## The saves carry over

A demo save is an ordinary save — same shape, same slot, same file. Somebody who
plays the free chapter and later buys the game keeps their run, their scrap,
their crests and their time. Nothing needs converting.

---

## The screen itself

`G.state = 'MORE'`. The room stays behind it, dimmed, because she is standing at
a door she cannot go through yet and the screen should read as her looking at
it. It shows her time and guardians freed — a chapter's worth of what she did,
not a nag — and two buttons.

Three things it does deliberately:

- **Back always just returns her to the room.** A player who wants to keep
  playing the part they already have must never have to go through the sales
  pitch to get there, and cancel is where they will look first.
- **She is put back inside the room before the screen opens.** She triggers it
  standing in the doorway, which is *outside* the room bounds — without that,
  closing the screen re-opens it forever and the demo ends by trapping the
  player in its own ending. `tests/demo.cjs` runs twenty real frames afterwards
  to prove it does not.
- **Every button has a touch box derived from the same function that draws it**
  (`moreLayout()`), because it is a phone screen before it is anything else.

Text lives in `js/i18n.js` in all five languages. Nothing on this screen is
hard-coded English.
