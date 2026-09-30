# Comic page 29 — "a brief break in control", staged

Captures of the scene the parity audit asked for, taken from the shipped build
in room A3 with `flags.crystal` + `flags.sageTame_GA1D` and `bossChime` unset —
the exact window the route leaves open between the Meadow Sage and the bell.

| file | phase | what it shows |
|---|---|---|
| `break_still.webp` | `still` | He has walked out of the enclosure and stopped well outside his own reach. The authored virus veins are running clean; nothing is driving him. |
| `break_bell.webp` | `bell` | The bell answers from above the meadow. The order is written back — the veins are virus purple again — and he turns for home. |

Measured, not eyeballed: `tests/guardian-break.cjs` renders the same frame with
`purified` on and off and diffs the canvas. 35,087 changed pixels move teal-ward
against 1,237 purple-ward, so "he lets go" is a visible fact and not a caption.

Scene: `breakCheck` / `breakStep` in `js/story-opening.js`. Script: §2.15 of
`docs/STORY_SCRIPT.md`. Ruling it belongs to: `docs/COMIC_PARITY_AUDIT.md`.
