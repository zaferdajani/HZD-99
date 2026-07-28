# CLAWBYTE

A dual-world metroidvania. At "Who are you?" you choose your game:

- **A robo-cat ninja** — NYA-9, a maintenance unit who slept through the fall of
  the Machine Depths, hunting the virus that repurposed every machine it touched.
- **A hero of the Odyssey** — the long way home to Ithaca, through the Halls of
  the Dead and the Forge of the Cyclopes.

Same levels and mechanics, two completely different worlds: art, music, names,
enemies, bosses, gear and signature powers.

Playable in a browser, installable to a phone home screen, and packaged for
Android with Capacitor.

## Play it

Open `index.html` — that is the whole game in a single self-contained file
(all art and audio embedded, no server or install needed). If GitHub Pages is
enabled on this repo, it is also live at the Pages URL.

**On a phone:** open the page in the browser, then *Share → Add to Home Screen*.
Launched from the icon it runs full-screen with on-screen controls.

## Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | Arrows / A D | Stick or D-pad |
| Jump | Z / Space | Cross |
| Attack | X / J | Square |
| Dash (FireDash) | C / Shift | R1 / R2 |
| EMP / Zeus's Spark | V / K | L1 / L2 |
| Heal | hold F / H | Triangle |
| **Signature power** | **Q / R** | **L3 / R3** |
| Interact | E or Up | Circle |
| Map / Pause | Tab / M / Esc | Select / Start |

**Signature powers.** The cat's **Feral Claws** turn her blade into purple energy
talons with a halo of light; her combo finisher becomes a pouncing paw punch.
The hero's **Wrath of Olympus** wreathes him in divine gold; his strikes land as
thunderbolts and his finisher calls a bolt down from the sky.

**Hidden rooms** below the floor only open to a **down-attack** — jump, hold
down, and hit.

## Repo layout

```
index.html   the built game - one self-contained file (this is what you play)
dev.html     multi-file entry for development (loads js/ and assets/)
js/          source: engine, entities, world, themes, audio, touch, trials
assets/      CC0 art and audio  -  see assets/CREDITS.md
build.cjs    rebuilds index.html from js/ + assets/   (node build.cjs)
native/      Capacitor config for the Android build
STORY.md     the Machine Depths backstory the art is built from
RUSTSONG.md  the constructed language used on the lore terminals
```

### Working on it

Edit files in `js/`, open `dev.html` to test, then run `node build.cjs` to
regenerate `index.html`. Bump `GAME_VERSION` in `js/game.js` when you ship —
the game checks its own source and prompts players to update.

## Licensing

The code, characters, world, story and music composition are original.

Third-party art and audio are **CC0 / public domain**, with every author and
source recorded in **`assets/CREDITS.md`** before use. Share-alike (CC-BY-SA)
assets are deliberately **not** used anywhere, because that licence would force
the whole project to become share-alike — the rejected pack is documented in
CREDITS.md so nobody adds it later.
